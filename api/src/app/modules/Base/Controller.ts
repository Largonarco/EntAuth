import { Request, Response, NextFunction } from "express";

class BaseController {
	req: Request = {} as Request;
	res: Response = {} as Response;
	next: NextFunction = {} as NextFunction;

	boot(req: Request, res: Response, next: NextFunction) {
		this.req = req;
		this.res = res;
		this.next = next;

		return this;
	}
}

export default BaseController;
