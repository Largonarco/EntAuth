import cors from "cors";
import dotenv from "dotenv";
import BaseApiRouteBuilder from ".";
import express, { Router } from "express";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "250mb" }));
app.use(express.urlencoded({ extended: true, limit: "250mb" }));

const router = Router();

const port = process.env.PORT || 3002;

const initializeApp = async () => {
	app.use("/api", await BaseApiRouteBuilder(router));

	app.get("/", (req, res) => {
		res.send("Hello World!");
	});

	let shuttingDown = false;
	app.get("/health", (req, res) => {
		if (shuttingDown) {
			res.status(503).send("Server is shutting down");
			return;
		}
		res.send("OK");
	});
	app.post("/shutdown", (req, res) => {
		shuttingDown = true;
		res.send("Shutting down");
	});

	app.listen(port, () => {
		console.log(`Server is running on port ${port}`);
	});
};

try {
	initializeApp();
} catch (error) {
	console.error(`Error starting server`, { error });
}

export default app;
