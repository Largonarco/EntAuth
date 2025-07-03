import mongoose from "mongoose";
import database from "app/models";
import { Request, Response } from "express";
import BaseController from "app/modules/Base/Controller";
import { encrypt, generateApiKeyAndHash } from "app/utils/encryption";

export default class ProjectsController extends BaseController {
	// @route POST /projects
	// @description Create a new project
	// @body { name, description, organizationName, workosConfig, emailConfig, authConfig, configuration }
	// @returns { message: "Project created successfully", project, apiKey }
	// @error { error: "Name, Description, Organization Name, and Workos Config are required" }
	// @error { error: "Workos Config not found" }
	// @error { error: "Senders already exist in another project" }
	createProject = async (req: Request, res: Response) => {
		try {
			const {
				name,
				authConfig,
				emailConfig,
				description,
				workosConfig,
				configuration,
				organizationName,
			} = req.body;

			// Validation
			if (!name || !organizationName || !workosConfig || !authConfig) {
				res.status(400).json({
					error:
						"Name, Description, Organization Name, Workos Config, and Auth Config are required",
				});
				return;
			}

			// Workos Config check
			const workOSConfig = await database.WorkOSConfig.findById(workosConfig);
			if (!workOSConfig) {
				res.status(400).json({ error: "Workos Config not found" });
				return;
			}

			// Email Config check
			if (emailConfig?.senders) {
				const senders = emailConfig.senders;
				const existingProjects = await database.Project.find({
					"emailConfig.senders": { $in: senders },
				});

				if (existingProjects.length > 0) {
					res.status(400).json({ error: "Senders already exist in another project" });
					return;
				}
			}

			// Auth Config check
			if (authConfig) {
				if (
					authConfig.custom &&
					Object.keys(authConfig.custom).length !== 0 &&
					(!workOSConfig.custom || Object.keys(workOSConfig.custom).length === 0)
				) {
					res.status(400).json({ error: "WorkOSConfig does not support custom configuration" });
					return;
				}
				if (
					authConfig.authkitEnabled !== undefined &&
					Boolean(authConfig.authkitEnabled) !== workOSConfig.authkitEnabled
				) {
					res.status(400).json({ error: "WorkOSConfig does not have Authkit enabled" });
					return;
				}
			}

			// Create API key
			const { apiKey, hash } = generateApiKeyAndHash();

			// Create project
			const project = await database.Project.create({
				name,
				authConfig,
				isActive: true,
				apiKeyHash: hash,
				emailConfig: emailConfig || {},
				description: description || "",
				workosConfig: workOSConfig._id,
				configuration: configuration || {},
				organisationName: organizationName,
			});

			res.status(201).json({ message: "Project created successfully", project, apiKey });
		} catch (error: any) {
			res.status(400).json({ error: error.message });
		}
	};

	// @route GET /projects
	// @description Get all projects
	// @query { page, limit, name, apiKey }
	// @returns { message: "Projects fetched successfully", projects, page, limit }
	// @error { error: "Invalid project ID" }
	getProjects = async (req: Request, res: Response) => {
		try {
			const { page, limit, name, apiKey } = req.query;

			// Pagination
			const pageNumber = parseInt(page as string) || 1;
			const limitNumber = parseInt(limit as string) || 10;
			const skip = (pageNumber - 1) * limitNumber;

			// Filter
			const filter: any = {};
			if (name) {
				filter.name = name as string;
			}
			if (apiKey) {
				filter.apiKeyHash = new RegExp(`^${(apiKey as string).slice(0, 8)}:`);
			}

			// Fetch projects
			let projects: any = await database.Project.find(filter).skip(skip).limit(limitNumber);

			res.json({
				projects,
				page: pageNumber,
				limit: limitNumber,
				message: "Projects fetched successfully",
			});
		} catch (error: any) {
			res.status(500).json({ error: error.message });
		}
	};

	// @route GET /projects/:id
	// @description Get a project by ID
	// @params { id }
	// @returns { message: "Project fetched successfully", project }
	// @error { error: "Invalid project ID" }
	getProject = async (req: Request, res: Response) => {
		try {
			const { id } = req.params;

			// Validation
			if (!mongoose.Types.ObjectId.isValid(id)) {
				res.status(400).json({ error: "Invalid project ID" });
				return;
			}

			// Fetch project
			const project = await database.Project.findById(id);
			if (!project) {
				res.status(404).json({ error: "Project not found" });
				return;
			}

			res.json({ message: "Project fetched successfully", project });
		} catch (error: any) {
			res.status(500).json({ error: error.message });
		}
	};

	// @route GET /projects/current
	// @description Get the current project
	// @returns { message: "Project fetched successfully", project }
	// @error { error: "Project not found" }
	getCurrentProject = async (req: Request, res: Response) => {
		try {
			const data = res.locals.project;
			res.json({ message: "Project fetched successfully", data });
		} catch (error: any) {
			res.status(500).json({ error: error.message });
		}
	};

	// @route PUT /projects/:id
	// @description Update a project by ID
	// @params { id }
	// @body { name, description, organizationName, workosConfig, authConfig, emailConfig }
	// @returns { message: "Project updated successfully", project }
	// @error { error: "Invalid project ID" }
	// @error { error: "Workos Config not found" }
	updateProject = async (req: Request, res: Response) => {
		try {
			const updates = req.body;
			const { id } = req.params;

			// Validation
			if (!mongoose.Types.ObjectId.isValid(id)) {
				res.status(400).json({ error: "Invalid project ID" });
				return;
			}
			// Extra fields check
			const allowedFields = [
				"name",
				"emailConfig",
				"authConfig",
				"description",
				"workosConfig",
				"organizationName",
			];
			const extraFields = Object.keys(updates).filter((field) => !allowedFields.includes(field));
			if (extraFields.length > 0) {
				res.status(400).json({ error: `Invalid fields: ${extraFields.join(", ")}` });
				return;
			}

			// Workos Config check
			if (updates.workosConfig) {
				const workOSConfig = await database.WorkOSConfig.findById(updates.workosConfig);
				if (!workOSConfig) {
					res.status(400).json({ error: "Workos Config not found" });
					return;
				}

				if (
					updates.authConfig.custom &&
					Object.keys(updates.authConfig.custom).length !== 0 &&
					(!workOSConfig.custom || Object.keys(workOSConfig.custom).length === 0)
				) {
					res.status(400).json({ error: "WorkOSConfig does not support custom configuration" });
					return;
				}
				if (
					updates.authConfig.authkitEnabled !== undefined &&
					Boolean(updates.authConfig.authkitEnabled) !== workOSConfig.authkitEnabled
				) {
					res.status(400).json({ error: "WorkOSConfig does not have Authkit enabled" });
					return;
				}
			}

			// Update project
			const project = await database.Project.findByIdAndUpdate(id, updates, { new: true });
			if (!project) {
				res.status(404).json({ error: "Project not found" });
				return;
			}

			res.json({ message: "Project updated successfully", project });
		} catch (error: any) {
			res.status(400).json({ error: error.message });
		}
	};

	// @route DELETE /projects/:id
	// @description Delete a project by ID
	// @params { id }
	// @returns { message: "Project deleted successfully" }
	// @error { error: "Invalid project ID" }
	deleteProject = async (req: Request, res: Response) => {
		try {
			const { id } = req.params;

			// Validation
			if (!mongoose.Types.ObjectId.isValid(id)) {
				res.status(400).json({ error: "Invalid project ID" });
				return;
			}

			// Delete project
			const project = await database.Project.findByIdAndDelete(id);
			if (!project) {
				res.status(404).json({ error: "Project not found" });
				return;
			}
			// Delete all user projects from the project
			await database.UserProject.deleteMany({ project: id });

			res.json({ message: "Project deleted successfully" });
		} catch (error: any) {
			res.status(500).json({ error: error.message });
		}
	};
}
