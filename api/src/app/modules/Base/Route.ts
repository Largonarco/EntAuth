import BaseController from "./Controller";
import { DntelError } from "../../types/errors";
import { Request, Response, NextFunction, Router } from "express";

type HttpMethod = "get" | "post" | "put" | "delete" | "patch";
type Middleware = (req: Request, res: Response, next: NextFunction) => void;

class BaseRouter<T extends BaseController> {
	controller: T;
	router: Router;
	endpoint: string;

	constructor(router: Router, endpoint: string, controller: T) {
		this.router = router;
		this.endpoint = endpoint;
		this.controller = controller;
	}

	private serve = (
		fn: (req: any, res: Response, ...params: any[]) => Promise<any> | any,
		...params: any[]
	) => {
		return async (req: Request, res: Response, next: NextFunction) => {
			try {
				this.controller.boot(req, res, next);
				await fn(req, res, ...params);
			} catch (error: unknown) {
				if (error instanceof DntelError) {
					res.status(error.statusCode).json({ error: error.message });
				} else {
					console.error("Unhandled error:", error);
					res.status(500).json({ error: "An unexpected error occurred" });
				}
			}
		};
	};

	protected route(
		method: HttpMethod,
		path: string,
		handler: (req: any, res: Response, ...params: any[]) => Promise<any> | any,
		middlewares: Middleware[] = [],
		...params: any[]
	) {
		console.log(`${method.toUpperCase()} ${this.endpoint}${path}`);
		this.router[method](path, ...middlewares, this.serve(handler, ...params));
	}
}

export default BaseRouter;
