import { ProjectDocument } from "../models/project.schema";
import { Request } from "express";

declare global {
	namespace Express {
		interface Response {
			locals: {
				apiKey?: string;
				project?: ProjectDocument;
			};
		}
	}
}
