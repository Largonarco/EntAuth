import AuthAPI from "../../../../api";
import { WorkOS } from "@workos-inc/node";
import JWTDelivery from "../../../delivery/jwt";

import { AuthConfig } from "../../../../config/types";
import type { Request, Response, NextFunction } from "express";

class OAuth {
	private workos: WorkOS;
	private authAPI: AuthAPI;
	private config: AuthConfig;
	private provider: "AppleOAuth" | "GoogleOAuth" | "MicrosoftOAuth" | "GithubOAuth";

	constructor(
		config: AuthConfig,
		authAPI: AuthAPI,
		workos: WorkOS,
		provider: "AppleOAuth" | "GoogleOAuth" | "MicrosoftOAuth" | "GithubOAuth"
	) {
		this.config = config;
		this.workos = workos;
		this.authAPI = authAPI;
		this.provider = provider;
	}

	public prompt() {
		return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			try {
				const redirectURL = decodeURIComponent(req.query.redirectURL as string);

				// Validation
				if (!redirectURL) {
					next({ status: 400, message: "Redirect URL is required" });
					return;
				}
				if (!this.config.workos?.redirectURL?.includes(redirectURL)) {
					next({ status: 400, message: "Redirect URL is not allowed" });
					return;
				}

				// Retrieve AuthURL
				const authURL = this.workos.userManagement.getAuthorizationUrl({
					provider: this.provider,
					redirectUri: redirectURL,
					clientId: this.config.workos?.clientId!,
				});

				res.locals.authURL = authURL;

				next();
			} catch (error: unknown) {
				if (error instanceof Error) {
					next({ status: 500, message: error.message });
				} else {
					next({
						status: 500,
						message: "An error occurred while generating an OAuth URL",
					});
				}
			}
		};
	}

	public callback() {
		return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			try {
				let userProjectRelationData: any;
				const { code, role } = req.query;

				// Validation
				if (this.config.workos?.rbac?.enabled && this.config.workos.signupEnabled) {
					if (!role) {
						next({ status: 400, message: "Role is required for RBAC" });
						return;
					}
					if (!this.config.workos.rbac.roles!.find((r) => r.name === role)) {
						next({ status: 400, message: "This role is not allowed for RBAC" });
						return;
					}
				}

				const { user, accessToken } = await this.workos.userManagement.authenticateWithCode({
					code: code as string,
					clientId: this.config.workos?.clientId!,
				});

				// Extract Session ID
				const tokenParts = accessToken.split(".");
				const claims = JSON.parse(Buffer.from(tokenParts[1], "base64").toString());
				const sessionId = claims.sid;

				// Extract Role Data
				const roleData = this.config.workos?.rbac?.enabled
					? role!
						? this.config.workos.rbac.roles!.find((r) => r.name === role)
						: { name: "user", permissions: [] }
					: { name: "user", permissions: [] };

				// Fetch User and Project
				let userData = await this.authAPI.user().getAll(1, 1, {
					email: user.email,
				});
				let projectData = await this.authAPI.project().getAll(1, 1, {
					name: this.config.projectName,
				});

				if (!userData.success) {
					// Delete user from WorkOS
					await this.workos.userManagement.deleteUser(user.id);

					next({ status: 500, message: "Failed to fetch user data" });
					return;
				}

				// Signup flow
				if (userData.data.users.length === 0) {
					// Signup disabled, early return
					if (!this.config.workos.signupEnabled) {
						// Delete user from WorkOS
						await this.workos.userManagement.deleteUser(user.id);

						next({
							status: 403,
							message: "Signup is disabled. Please contact the administrator to get access.",
						});
						return;
					}

					// Create new User
					const newUser = await this.authAPI.user().create({
						email: user.email,
						lastName: user.lastName || "",
						firstName: user.firstName || "",
					});

					// Create new UserProjectRelation
					const newUserProjectRelation = await this.authAPI.userProjectRelation().create({
						role: roleData!,
						workosUserId: user.id,
						sessionIds: [sessionId!],
						userId: newUser.data.user._id,
						projectId: projectData.data.projects[0]._id,
					});

					// Set User and UserProjectRelation
					userData = newUser.data.user;
					userProjectRelationData = newUserProjectRelation.data.userProjectRelation;
				} else {
					// Signin + Signup flow

					// UserProjectRelation check
					const userProjectRelation = await this.authAPI.userProjectRelation().getAll(1, 1, {
						userId: userData.data.users[0]._id,
						projectId: projectData.data.projects[0]._id,
					});

					if (!userProjectRelation.success) {
						next({ status: 500, message: "Failed to fetch user project relation" });
						return;
					}

					// Signup flow
					if (userProjectRelation.data.userProjectRelations.length === 0) {
						// Signup disabled, early return
						if (!this.config.workos.signupEnabled) {
							next({
								status: 403,
								message: "Signup is disabled. Please contact the administrator to get access.",
							});
							return;
						}

						// Create UserProjectRelation
						const newUserProjectRelation = await this.authAPI.userProjectRelation().create({
							role: roleData!,
							workosUserId: user.id,
							sessionIds: [sessionId!],
							userId: userData.data.users[0]._id,
							projectId: projectData.data.projects[0]._id,
						});

						userProjectRelationData = newUserProjectRelation.data.userProjectRelation;
					} else {
						// Signin flow
						// Update UserProjectRelation
						const updatedUserProjectRelation = await this.authAPI
							.userProjectRelation()
							.update(userProjectRelation.data.userProjectRelations[0]._id, {
								sessionIds: [
									...userProjectRelation.data.userProjectRelations[0].sessionIds,
									sessionId!,
								],
							});

						userProjectRelationData = updatedUserProjectRelation.data.userProjectRelation;
					}

					// Set User
					userData = userData.data.users[0];
				}

				const jwt = new JWTDelivery(this.config?.delivery?.jwt!);
				const { token, res: jwtRes } = await jwt.signToken(
					{ up_id: userProjectRelationData._id, session_id: sessionId },
					res
				);
				res = jwtRes;
				res.locals.auth = {
					token: token,
					user: userData,
					session: sessionId,
				};

				next();
			} catch (error: unknown) {
				if (error instanceof Error) {
					next({ status: 500, message: error.message });
				} else {
					next({
						status: 500,
						message: "An error occurred while verifying an OAuth session",
					});
				}
			}
		};
	}

	public validate() {
		return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			try {
				const jwt = new JWTDelivery(this.config?.delivery?.jwt!);
				const { isValid, decoded } = (await jwt.verifyToken(req)) as {
					isValid: boolean;
					decoded: { up_id: string; session_id: string } | null;
				};
				if (!isValid) {
					next({ status: 401, message: "Unauthorized" });
					return;
				}

				const userProjectRelation = await this.authAPI.userProjectRelation().get(decoded?.up_id!);
				if (!userProjectRelation.success) {
					next({ status: 401, message: "Unauthorized" });
					return;
				}

				res.locals.auth = {
					session: decoded?.session_id,
					userProjectRelation: decoded?.up_id,
					role: userProjectRelation.data.userProjectRelation.role,
				};

				next();
			} catch (error: unknown) {
				if (error instanceof Error) {
					next({ status: 500, message: error.message });
				} else {
					next({
						status: 500,
						message: "An error occurred while validating an OAuth session",
					});
				}
			}
		};
	}

	public logout() {
		return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			try {
				const { session } = res.locals.auth;
				const logoutRedirectURL = decodeURIComponent(req.query.logoutRedirectURL as string);

				if (!logoutRedirectURL) {
					next({ status: 400, message: "Logout Redirect URL is required" });
					return;
				}
				if (!this.config.workos?.logoutURL?.includes(logoutRedirectURL)) {
					next({ status: 400, message: "Logout Redirect URL is not allowed" });
					return;
				}

				const jwt = new JWTDelivery(this.config?.delivery?.jwt!);
				jwt.revokeToken(res);

				res.locals.logoutURL = await this.workos.userManagement.getLogoutUrl({
					sessionId: session,
					returnTo: logoutRedirectURL,
				});

				next();
			} catch (error: unknown) {
				if (error instanceof Error) {
					next({ status: 500, message: error.message });
				} else {
					next({
						status: 500,
						message: "An error occurred while logging out",
					});
				}
			}
		};
	}
}

export default OAuth;
