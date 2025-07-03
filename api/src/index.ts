import fs from "fs";
import path from "path";
import { Router } from "express";
import loggerMiddleware from "./app/middlewares/logger";
import sanitiserMiddleware from "./app/middlewares/sanitise";

const routesDir = path.join(__dirname, "app", "modules");

// Function to dynamically import route files
const importRoutes = async (baseRouter: Router) => {
	const getRouteFiles = (dir: string): string[] => {
		const entries = fs.readdirSync(dir, { withFileTypes: true });
		return entries.flatMap((entry) => {
			const fullPath = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				return getRouteFiles(fullPath);
			} else if (
				entry.isFile() &&
				(entry.name.endsWith(".routes.ts") || entry.name.endsWith(".routes.js"))
			) {
				return [fullPath];
			}
			return [];
		});
	};

	const routeFiles = getRouteFiles(routesDir);

	await Promise.all(
		routeFiles.map(async (file) => {
			try {
				const routePath = path.relative(__dirname, file);
				const route = await import(`./${routePath}`);

				if (route.default) {
					const router = Router();

					const routeHandler = new route.default(router);
					baseRouter.use(routeHandler.endpoint, routeHandler.init());
					console.log(`Route file imported: ${file}`);
				}
			} catch (error) {
				console.error(`Error importing route file ${file}:`, error);
			}
		})
	);

	// baseRouter.use(corsMiddleware);
	baseRouter.use(loggerMiddleware);
	baseRouter.use(sanitiserMiddleware);
	baseRouter.get("/", (req, res, next) => {
		res.json({ message: "Hello World" });
	});

	return baseRouter;
};

export default importRoutes;
