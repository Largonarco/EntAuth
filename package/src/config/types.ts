// Auth Methods Enum
export enum AuthMethod {
	SSO = "sso",
	MFA = "mfa",
	SOCIAL = "social",
	MAGIC_LINK = "magic_link",
	EMAIL_PASSWORD = "email_password",
}

// Delivery Configs
export interface ApiKeyDeliveryConfig {
	enabled: boolean;
	headerName?: string;
	apiKeyValue?: string;
}

export interface JWTDeliveryConfig {
	secret: string;
	enabled: boolean;
	expiresIn: number;
	sendVia: ("cookie" | "header")[];
}

// RBAC Config
export interface RBACConfig {
	enabled: boolean;
	roles?: {
		name: string;
		permissions: string[];
	}[];
}

// Main Config
export interface AuthConfig {
	apikey: string;
	projectName: string;
	delivery: {
		jwt: JWTDeliveryConfig;
		apiKey: ApiKeyDeliveryConfig;
	};
	workos: {
		rbac?: RBACConfig;
		clientId?: string;
		logoutURL?: string[];
		clientSecret?: string;
		redirectURL?: string[];
		signupEnabled?: boolean;
		authkitEnabled?: boolean;
		env: "staging" | "production";
		useDefaultWorkosConfig?: boolean;
		enabledAuthMethods?: AuthMethod[];
		allowedSocialProviders?: string[];
	};
}
