import database from "app/models";
import { verifyApiKey } from "app/utils/encryption";
import { Request, Response, NextFunction } from "express";

export const secure = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
	try {
		const apiKey = req.headers["x-api-key"]! as string;

		if (apiKey) {
			const prefix = apiKey.slice(0, 8);
			const project = await database.Project.findOne({
				apiKeyHash: new RegExp(`^${prefix}:`),
			});

			if (!project) {
				next({
					message: "Unauthorized",
					status: 401,
				});
				return;
			}

			const isValid = verifyApiKey(apiKey, project.apiKeyHash);
			if (!isValid) {
				next({
					message: "Unauthorized",
					status: 401,
				});
				return;
			}

			res.locals.project = project;
			res.locals.apiKey = apiKey;

			next();
		} else {
			next({
				message: "Unauthorized",
				status: 401,
			});
			return;
		}
	} catch (error) {
		next({
			message: "Unauthorized",
			status: 401,
		});
		return;
	}
};
