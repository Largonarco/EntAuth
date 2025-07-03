import express from "express";
import createAuth from "../src";
import type { AuthConfig } from "../src/config/types";

const app = express();
app.use(express.json());

// Standard Auth Configuration
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
	const standard = auth.standard();

	// OAuth Routes (Google as example)
	const googleOAuth = standard.oauth("google");

	app.post("/auth/oauth/google/prompt", googleOAuth.prompt(), (req, res) => {
		res.json({ authURL: res.locals.authURL });
	});

	app.get("/auth/oauth/google/callback", googleOAuth.callback(), (req, res) => {
		res.json({ message: "Authentication successful", token: res.locals.auth.token });
	});

	// Password Routes
	const password = standard.password();

	app.post("/auth/password/signup", password.signup(), (req, res) => {
		res.json({ message: "Signup successful", token: res.locals.auth.token });
	});

	app.post("/auth/password/signin", password.signin(), (req, res) => {
		res.json({ message: "Signin successful", token: res.locals.auth.token });
	});

	// Magic Link Routes
	const magicLink = standard.magicLink();

	app.post("/auth/magic-link/generate", magicLink.generate(), (req, res) => {
		res.json({ message: "Magic link generated", magicAuth: res.locals.magicAuth });
	});

	app.post("/auth/magic-link/verify", magicLink.verify(), (req, res) => {
		res.json({ message: "Magic link verified", token: res.locals.auth.token });
	});

	// Common Routes
	app.get("/auth/validate", password.validate(), (req, res) => {
		res.json({
			message: "Token is valid",
			userProjectRelation: res.locals.auth.userProjectRelation,
		});
	});

	app.post("/auth/logout", password.validate(), password.logout(), (req, res) => {
		res.json({ message: "Logout successful", logoutURL: res.locals.logoutURL });
	});

	// Protected Route Example
	app.get("/protected", password.validate(), (req, res) => {
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
