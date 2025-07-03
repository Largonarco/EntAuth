import dotenv from "dotenv";
import mongoose from "mongoose";
import { ProjectModel } from "./project.schema";
import { UserModel, UserProjectModel, WorkOSConfigModel } from "./auth.schema";

dotenv.config();

export class Database {
	private static instance: Database;

	private constructor() {
		if (!process.env.MONGO_URL) {
			throw new Error("MONGO_URL is not set as an environment variable");
		}

		mongoose.connect(process.env.MONGO_URL, {
			connectTimeoutMS: 90000,
			serverSelectionTimeoutMS: 90000,
		});
		mongoose.connection.on("error", (error) => {
			console.error(error);
		});
		mongoose.connection.once("open", () => {
			console.log("Connected to database");
		});
	}

	public static getInstance(): Database {
		if (!Database.instance) {
			Database.instance = new Database();
		}

		return Database.instance;
	}

	User = UserModel;
	Project = ProjectModel;
	UserProject = UserProjectModel;
	WorkOSConfig = WorkOSConfigModel;
}

const database = Database.getInstance();

export default database;
