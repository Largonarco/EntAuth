import { AuthConfig, AuthMethod } from "./types";

const config: AuthConfig = {
	projectName: "Project",
	apikey: process.env.API_KEY!,
	workos: {
		env: process.env.NODE_ENV as "staging" | "production",
	},
	delivery: {
		jwt: {
			enabled: true,
			expiresIn: 86400,
			sendVia: ["cookie"],
			secret: process.env.JWT_SECRET!,
		},
		apiKey: {
			enabled: false,
		},
	},
};

export default config;
