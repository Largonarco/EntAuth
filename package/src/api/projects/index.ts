class ProjectAuthAPI {
	private path: string;
	private apikey: string;
	private baseUrl: string;

	constructor(apikey: string) {
		this.apikey = apikey;
		this.path = "/api/projects";
		this.baseUrl = process.env.STACK_API_BASE_URL || "http://localhost:3001";
	}

	public async getProject(projectId: string) {
		const response = await fetch(`${this.baseUrl}${this.path}/${projectId}`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": this.apikey,
			},
		});

		return {
			success: response.ok,
			data: await response.json(),
		};
	}

	public async getProjects(
		page: number = 1,
		limit: number = 10,
		filter: { name?: string; apiKey?: string } = {}
	) {
		const queryParams = new URLSearchParams();
		queryParams.set("page", page.toString());
		queryParams.set("limit", limit.toString());
		if (filter.name) queryParams.set("name", filter.name);
		if (filter.apiKey) queryParams.set("apiKey", filter.apiKey);

		const response = await fetch(`${this.baseUrl}${this.path}?${queryParams.toString()}`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": this.apikey,
			},
		});

		return {
			success: response.ok,
			data: await response.json(),
		};
	}

	public async createProject(project: {
		name: string;
		description?: string;
		workosConfig: string;
		organizationName: string;
		emailConfig?: {
			webhookUrl: string;
			senders: string[];
		};
		configuration?: {
			[key: string]: string;
		};
		authConfig: {
			logoutURL: string[];
			redirectURL: string[];
			organisationId: string;
			authkitEnabled: boolean;
			custom?: {
				enabledAuthMethods: string[];
				allowedSocialProviders?: string[];
			};
			rbac: {
				enabled: boolean;
				roles?: {
					name: string;
					permissions: string[];
				}[];
			};
		};
	}) {
		const response = await fetch(`${this.baseUrl}${this.path}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": this.apikey,
			},
			body: JSON.stringify(project),
		});

		return {
			success: response.ok,
			data: await response.json(),
		};
	}

	public async updateProject(
		projectId: string,
		project: {
			name?: string;
			description?: string;
			workosConfig?: string;
			organizationName?: string;
			emailConfig?: {
				senders?: string[];
				recipients?: string[];
				webhookUrls?: string[];
				notifyOnSlack?: boolean;
				slackNotificationEmails?: string[];
			};
			authConfig?: {
				logoutURL?: string[];
				redirectURL?: string[];
				organisationId?: string;
				authkitEnabled?: boolean;
				custom?: {
					enabledAuthMethods?: string[];
					allowedSocialProviders?: string[];
				};
				rbac?: {
					enabled?: boolean;
					roles?: {
						name: string;
						permissions: string[];
					}[];
				};
			};
		}
	) {
		const response = await fetch(`${this.baseUrl}${this.path}/${projectId}`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": this.apikey,
			},
			body: JSON.stringify(project),
		});

		return {
			success: response.ok,
			data: await response.json(),
		};
	}

	public async deleteProject(projectId: string) {
		const response = await fetch(`${this.baseUrl}${this.path}/${projectId}`, {
			method: "DELETE",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": this.apikey,
			},
		});

		return {
			success: response.ok,
			data: await response.json(),
		};
	}
}

export default ProjectAuthAPI;
