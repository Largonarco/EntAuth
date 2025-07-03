class UserProjectRelationAuthAPI {
	private path: string;
	private apikey: string;
	private baseUrl: string;

	constructor(apikey: string) {
		this.apikey = apikey;
		this.path = "/api/user-projects";
		this.baseUrl = process.env.STACK_API_BASE_URL || "http://localhost:3001";
	}

	public async createUserProjectRelation(relation: {
		userId: string;
		projectId: string;
		sessionIds?: string[];
		workosUserId?: string;
		role: {
			name: string;
			permissions: string[];
		};
	}) {
		const response = await fetch(`${this.baseUrl}${this.path}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": this.apikey,
			},
			body: JSON.stringify(relation),
		});

		return {
			success: response.ok,
			data: await response.json(),
		};
	}

	public async getUserProjectRelations(
		page: number = 1,
		limit: number = 10,
		filter: { userId?: string; projectId?: string; workosUserId?: string } = {}
	) {
		const queryParams = new URLSearchParams();
		queryParams.set("page", page.toString());
		queryParams.set("limit", limit.toString());
		if (filter.userId) queryParams.set("userId", filter.userId);
		if (filter.projectId) queryParams.set("projectId", filter.projectId);
		if (filter.workosUserId) queryParams.set("workosUserId", filter.workosUserId);

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

	public async getUserProjectRelation(relationId: string) {
		const response = await fetch(`${this.baseUrl}${this.path}/${relationId}`, {
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

	public async updateUserProjectRelation(
		relationId: string,
		relation: {
			sessionIds?: string[];
			role?: {
				name: string;
				permissions: string[];
			};
		}
	) {
		const response = await fetch(`${this.baseUrl}${this.path}/${relationId}`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": this.apikey,
			},
			body: JSON.stringify(relation),
		});

		return {
			success: response.ok,
			data: await response.json(),
		};
	}

	public async deleteUserProjectRelation(relationId: string) {
		const response = await fetch(`${this.baseUrl}${this.path}/${relationId}`, {
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

export default UserProjectRelationAuthAPI;
