import express from "express";
import createAuth from "../src";
import { type AuthConfig } from "../src/config/types";

const app = express();
app.use(express.json());

// AuthKit Configuration
const config: AuthConfig = {
	apikey: "project-api-key",
	projectName: "project-name",
	workos: {
		env: "production",
	},
	delivery: {
		jwt: {
			enabled: true,
			expiresIn: 86400,
			secret: "jwt-secret",
			sendVia: ["cookie", "header"],
		},
		apiKey: {
			enabled: false,
		},
	},
};

// Initialize Auth
const initAuth = async () => {
	const auth = await createAuth(config);
	const authkit = auth.authkit();

	// AuthKit Routes
	app.post("/auth/prompt", authkit.prompt(), (req, res) => {
		res.json({ authURL: res.locals.authURL });
	});

	app.get("/auth/callback", authkit.callback(), (req, res) => {
		res.json({ message: "Authentication successful", token: res.locals.auth.token });
	});

	app.get("/auth/validate", authkit.validate(), (req, res) => {
		res.json({
			message: "Token is valid",
			userProjectRelation: res.locals.auth.userProjectRelation,
		});
	});

	app.post("/auth/logout", authkit.validate(), authkit.logout(), (req, res) => {
		res.json({ message: "Logout successful", logoutURL: res.locals.logoutURL });
	});

	// Protected Route Example
	app.get("/protected", authkit.validate(), (req, res) => {
		res.json({
			message: "This is a protected route",
			userProjectRelation: res.locals.auth.userProjectRelation,
		});
	});
};

// Start Server
const PORT = process.env.PORT || 3000;
initAuth().then(() => {
	app.listen(PORT, () => {
		console.log(`Server is running on port ${PORT}`);
	});
});
