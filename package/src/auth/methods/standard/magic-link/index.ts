import AuthAPI from "../../../../api";
import { WorkOS } from "@workos-inc/node";
import JWTDelivery from "../../../delivery/jwt";

import { AuthConfig } from "../../../../config/types";
import type { NextFunction, Request, Response } from "express";

class MagicLink {
	private workos: WorkOS;
	private authAPI: AuthAPI;
	private config: AuthConfig;

	constructor(config: AuthConfig, authAPI: AuthAPI, workos: WorkOS) {
		this.config = config;
		this.workos = workos;
		this.authAPI = authAPI;
	}

	public generate() {
		return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			try {
				const email = decodeURIComponent(req.query.email as string);

				const magicAuth = await this.workos.userManagement.createMagicAuth({
					email,
				});

				res.locals.magicAuth = magicAuth;

				next();
			} catch (error: unknown) {
				if (error instanceof Error) {
					next({ status: 500, message: error.message });
				} else {
					next({
						status: 500,
						message: "An error occurred while generating a Magic link",
					});
				}
			}
		};
	}

	public verify() {
		return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			try {
				let userProjectRelationData: any;
				const { email, code, role, firstName, lastName } = req.body;

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

				const { user, sealedSession } = await this.workos.userManagement.authenticateWithMagicAuth({
					email,
					code: code as string,
					clientId: this.config.workos?.clientId!,
					session: {
						sealSession: true,
						cookiePassword: this.config.delivery?.jwt?.secret || "secret",
					},
				});

				// Extract Session ID
				const { sessionId } = (await this.workos.userManagement.authenticateWithSessionCookie({
					sessionData: sealedSession!,
					cookiePassword: this.config.delivery?.jwt?.secret || "secret",
				})) as any;

				// Extract Role Data
				const roleData = this.config.workos?.rbac?.enabled
					? role!
						? this.config.workos.rbac.roles?.find((r) => r.name === role)
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
						lastName: firstName || user.lastName || "",
						firstName: lastName || user.firstName || "",
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
						message: "An error occurred while verifying a Magic link",
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
						message: "An error occurred while verifying a Magic link",
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

export default MagicLink;
