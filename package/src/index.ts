import { AuthConfig } from "./config/types";

import AuthAPI from "./api";
import AuthKit from "./auth/methods/authkit";
import Standard from "./auth/methods/standard";

export class Auth {
	public authAPI: AuthAPI;
	public config: AuthConfig;

	constructor(config: AuthConfig) {
		this.config = config;
		this.authAPI = new AuthAPI(config.apikey);
	}

	async init() {
		if (!this.config.projectName) throw new Error("Project name is required");

		// Get project
		const projects = await this.authAPI.project().getAll(1, 1, { apiKey: this.config.apikey });
		if (projects.success && projects.data.projects.length === 0) {
			throw new Error("No such Project found. First create a project using the CLI.");
		}

		const project = projects.data.projects[0];

		// Get WorkOS Config
		if (project.workosConfig) {
			const workosConfig = await this.authAPI.workosConfig().get(project.workosConfig);
			if (!workosConfig.success) {
				throw new Error(
					"No WorkOS Config found. First create a WorkOS Config and link it to the project using the CLI."
				);
			}

			const clientId = workosConfig.data.workosConfig.workosClientId[this.config.workos.env];
			const clientSecret =
				workosConfig.data.workosConfig.workosClientSecret[this.config.workos.env];

			this.config = {
				...this.config,
				projectName: project.name,
				workos: {
					...this.config.workos,
					clientId,
					clientSecret,
					rbac: project.authConfig.rbac,
					logoutURL: project.authConfig.logoutURL,
					redirectURL: project.authConfig.redirectURL,
					authkitEnabled: project.authConfig.authkitEnabled,
					signupEnabled: workosConfig.data.workosConfig.signupEnabled,
					useDefaultWorkosConfig: workosConfig.data.workosConfig.isDefault,
					enabledAuthMethods: project.authConfig.custom?.enabledAuthMethods || [],
					allowedSocialProviders: project.authConfig.custom?.allowedSocialProviders || [],
				},
			};
		}

		return this;
	}

	public authkit() {
		if (!this.config.workos?.authkitEnabled) {
			throw new Error("AuthKit is not enabled for this project. Use standard() method.");
		}

		const authkit = new AuthKit(this.config, this.authAPI);

		return authkit;
	}

	public standard() {
		if (this.config.workos?.authkitEnabled) {
			throw new Error("AuthKit is enabled for this project. Use authkit() method instead.");
		}

		const standard = new Standard(this.config, this.authAPI);

		return standard;
	}
}

const createAuth = async (config: AuthConfig) => {
	const auth = new Auth(config);
	await auth.init();
	return auth;
};

export default createAuth;
