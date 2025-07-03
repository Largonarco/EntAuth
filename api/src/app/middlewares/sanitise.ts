import { v4 } from "uuid";
import { Request, Response, NextFunction } from "express";

const sanitiserMiddleware = (req: Request, res: Response, next: NextFunction): void => {
	const oldSend = res.json;

	const requestId = v4();
	(req as any).requestId = requestId;

	res.json = function (data: any) {
		if (res.statusCode === 200) {
			oldSend.call(this, {
				data: data,
				success: true,
				requestId: requestId,
				server: process.env.API_SERVER,
				// timeTaken: Date.now() - (req as any).startTime,
			});
		} else {
			oldSend.call(this, {
				data: data,
				success: false,
				requestId: requestId,
				server: process.env.API_SERVER,
				// timeTaken: Date.now() - (req as any).startTime,
			});
		}

		return res;
	};

	next();
};

export default sanitiserMiddleware;
