import { Request, Response, NextFunction } from "express";
import { sendLog } from "../utils/log";

const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
	const start = Date.now();
	const originalSend = res.send;
	const originalJson = res.json;

	// Log Request
	console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

	// Capture Response
	res.send = function (body) {
		const duration = Date.now() - start;

		console.log(
			`[${new Date().toISOString()}] Response sent - Status: ${res.statusCode}, Duration: ${duration}ms, Body: ${body}`
		);
		sendLog(
			`[${new Date().toISOString()}] Response sent - Status: ${res.statusCode}, Duration: ${duration}ms`,
			{
				method: req.method,
				url: req.url,
				status: res.statusCode,
				duration: duration,
				body: body,
			}
		);

		return originalSend.call(this, body);
	};

	res.json = function (body) {
		const duration = Date.now() - start;

		console.log(
			`[${new Date().toISOString()}] Response sent - Status: ${res.statusCode}, Duration: ${duration}ms, Body: ${JSON.stringify(body)}`
		);
		sendLog(
			`[${new Date().toISOString()}] Response sent - Status: ${res.statusCode}, Duration: ${duration}ms`,
			{
				method: req.method,
				url: req.url,
				status: res.statusCode,
				duration: duration,
				body: body,
			}
		);

		return originalJson.call(this, body);
	};

	next();
};

export default loggerMiddleware;
