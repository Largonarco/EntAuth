class WorkOSConfigAuthAPI {
	private path: string;
	private apikey: string;
	private baseUrl: string;

	constructor(apikey: string) {
		this.apikey = apikey;
		this.path = "/api/workos-configs";
		this.baseUrl = process.env.STACK_API_BASE_URL || "http://localhost:3001";
	}

	public async getWorkOSConfig(workosConfigId: string) {
		const response = await fetch(`${this.baseUrl}${this.path}/${workosConfigId}`, {
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

	public async getWorkOSConfigs(
		page: number = 1,
		limit: number = 10,
		filter: {
			signupEnabled?: boolean;
			authkitEnabled?: boolean;
		} = {}
	) {
		const queryParams = new URLSearchParams();
		queryParams.set("page", page.toString());
		queryParams.set("limit", limit.toString());

		if (filter.signupEnabled !== undefined) {
			queryParams.set("signupEnabled", filter.signupEnabled.toString());
		}
		if (filter.authkitEnabled !== undefined) {
			queryParams.set("authkitEnabled", filter.authkitEnabled.toString());
		}

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

	public async createWorkOSConfig(workosConfig: {
		isDefault: boolean;
		signupEnabled: boolean;
		workosClientId: string;
		authkitEnabled: boolean;
		workosClientSecret: string;
		metadata?: Record<string, any>;
		custom?: {
			enabledAuthMethods: string[];
			allowedSocialProviders?: string[];
		};
	}) {
		const response = await fetch(`${this.baseUrl}${this.path}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": this.apikey,
			},
			body: JSON.stringify(workosConfig),
		});

		return {
			success: response.ok,
			data: await response.json(),
		};
	}

	public async updateWorkOSConfig(
		workosConfigId: string,
		workosConfig: {
			isDefault?: boolean;
			workosClientId?: string;
			signupEnabled?: boolean;
			authkitEnabled?: boolean;
			workosClientSecret?: string;
			metadata?: Record<string, any>;
			custom?: {
				enabledAuthMethods: string[];
				allowedSocialProviders?: string[];
			};
		}
	) {
		const response = await fetch(`${this.baseUrl}${this.path}/${workosConfigId}`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": this.apikey,
			},
			body: JSON.stringify(workosConfig),
		});

		return {
			success: response.ok,
			data: await response.json(),
		};
	}

	public async deleteWorkOSConfig(workosConfigId: string) {
		const response = await fetch(`${this.baseUrl}${this.path}/${workosConfigId}`, {
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

export default WorkOSConfigAuthAPI;
