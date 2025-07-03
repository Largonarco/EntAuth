import AuthAPI from "../../../../api";
import { WorkOS } from "@workos-inc/node";
import JWTDelivery from "../../../delivery/jwt";

import { AuthConfig } from "../../../../config/types";
import type { NextFunction, Request, Response } from "express";

class Password {
	private workos: WorkOS;
	private authAPI: AuthAPI;
	private config: AuthConfig;

	constructor(config: AuthConfig, authAPI: AuthAPI, workos: WorkOS) {
		this.config = config;
		this.workos = workos;
		this.authAPI = authAPI;
	}

	public signup() {
		return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			try {
				const { email, password, role, firstName, lastName } = req.body;

				// Validation
				if (!email || !password) {
					next({ status: 400, message: "Email and Password are required" });
					return;
				}
				if (!this.config.workos?.signupEnabled) {
					next({
						status: 403,
						message: "Signup is disabled. Please contact the administrator to get access.",
					});
					return;
				}
				if (this.config.workos?.rbac?.enabled) {
					if (!role) {
						next({ status: 400, message: "Role is required for RBAC" });
						return;
					}
					if (!this.config.workos.rbac.roles!.find((r) => r.name === role)) {
						next({ status: 400, message: "This role is not allowed for RBAC" });
						return;
					}
				}

				// Extract Role Data
				const roleData = this.config.workos?.rbac?.enabled
					? this.config.workos.rbac.roles!.find((r) => r.name === role)
					: { name: "user", permissions: [] };

				// Create user in WorkOS
				const { user, sealedSession } = await this.workos.userManagement.authenticateWithPassword({
					email,
					password,
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

				// Create User
				const newUser = await this.authAPI.user().create({
					email: user.email,
					lastName: firstName || user.lastName || "",
					firstName: lastName || user.firstName || "",
				});

				// Get Project
				const projectData = await this.authAPI.project().getAll(1, 1, {
					name: this.config.projectName,
				});

				// Create UserProjectRelation
				const newUserProjectRelation = await this.authAPI.userProjectRelation().create({
					role: roleData!,
					workosUserId: user.id,
					sessionIds: [sessionId],
					userId: newUser.data.user._id,
					projectId: projectData.data.projects[0]._id,
				});

				const jwt = new JWTDelivery(this.config?.delivery?.jwt!);
				const { token, res: jwtRes } = await jwt.signToken(
					{ up_id: newUserProjectRelation.data.userProjectRelation._id, session_id: sessionId },
					res
				);
				res = jwtRes;
				res.locals.auth = {
					token: token,
					session: sessionId,
				};

				next();
			} catch (error: unknown) {
				if (error instanceof Error) {
					next({ status: 400, message: error.message });
				} else {
					next({ status: 400, message: "An error occurred while signing up" });
				}
			}
		};
	}

	public signin() {
		return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
			try {
				const { email, password } = req.body;

				// Validation
				if (!email || !password) {
					next({ status: 400, message: "Email and Password are required" });
					return;
				}

				// Authenticate with WorkOS
				const { user, sealedSession } = await this.workos.userManagement.authenticateWithPassword({
					email,
					password,
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

				// Get User
				const userData = await this.authAPI.user().getAll(1, 1, {
					email: user.email,
				});
				if (!userData.success || userData.data.users.length === 0) {
					// Delete user from WorkOS
					await this.workos.userManagement.deleteUser(user.id);

					next({ status: 404, message: "User not found" });
					return;
				}

				// Get Project
				const projectData = await this.authAPI.project().getAll(1, 1, {
					name: this.config.projectName,
				});

				// Get UserProjectRelation
				const userProjectRelation = await this.authAPI.userProjectRelation().getAll(1, 1, {
					userId: userData.data.users[0]._id,
					projectId: projectData.data.projects[0]._id,
				});
				if (
					!userProjectRelation.success ||
					userProjectRelation.data.userProjectRelations.length === 0
				) {
					next({ status: 404, message: "User not found in project" });
					return;
				}

				// Update UserProjectRelation
				await this.authAPI
					.userProjectRelation()
					.update(userProjectRelation.data.userProjectRelations[0]._id, {
						sessionIds: [...userProjectRelation.data.userProjectRelations[0].sessionIds, sessionId],
					});

				const jwt = new JWTDelivery(this.config?.delivery?.jwt!);
				const { token, res: jwtRes } = await jwt.signToken(
					{ up_id: userProjectRelation.data.userProjectRelations[0]._id, session_id: sessionId },
					res
				);
				res = jwtRes;
				res.locals.auth = {
					token: token,
					session: sessionId,
					user: userData.data.users[0],
				};

				next();
			} catch (error: unknown) {
				if (error instanceof Error) {
					next({ status: 401, message: error.message });
				} else {
					next({ status: 401, message: "An error occurred while signing in" });
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
					next({ status: 401, message: error.message });
				} else {
					next({ status: 401, message: "An error occurred while validating" });
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
					next({ status: 500, message: "An error occurred while logging out" });
				}
			}
		};
	}
}

export default Password;
