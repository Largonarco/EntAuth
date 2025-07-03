import mongoose from "mongoose";
import database from "app/models";
import { Request, Response } from "express";
import BaseController from "app/modules/Base/Controller";

export default class UserProjectController extends BaseController {
	// @route POST /user-projects
	// @description Create a new user project relation
	// @body { userId, projectId, role, workosUserId, sessionIds, isActive }
	// @returns { message: "User Project Relation created successfully", userProjectRelation }
	// @error { error: "User, Project, and Role are required" }
	// @error { error: "Invalid User or Project ID" }
	// @error { error: "User already has a project relation" }
	// @error { error: "User not found" }
	// @error { error: "Project not found" }
	createUserProjectRelation = async (req: Request, res: Response) => {
		try {
			const { userId, projectId, role, workosUserId, sessionIds, isActive } = req.body;

			// Validation
			if (!userId || !projectId || !role) {
				res.status(400).json({
					error: "User, Project, and Role are required",
				});
				return;
			}
			if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(projectId)) {
				res.status(400).json({ error: "Invalid User or Project ID" });
				return;
			}

			// Existing UserProject relation check
			const existingUserProjectRelation = await database.UserProject.findOne({
				user: userId,
				project: projectId,
			});
			if (existingUserProjectRelation) {
				res.status(400).json({ error: "User already has a relation with this Project" });
				return;
			}
			// User check
			const existingUser = await database.User.findById(userId);
			if (!existingUser) {
				res.status(400).json({ error: "User not found" });
				return;
			}
			// Project check
			const existingProject = await database.Project.findById(projectId);
			if (!existingProject) {
				res.status(400).json({ error: "Project not found" });
				return;
			}

			// Create project
			const userProjectRelation = await database.UserProject.create({
				role,
				user: existingUser._id,
				isActive: isActive || true,
				project: existingProject._id,
				sessionIds: sessionIds || [],
				workosUser: workosUserId || "",
			});

			res.status(201).json({
				userProjectRelation,
				message: "User Project Relation created successfully",
			});
		} catch (error: any) {
			res.status(400).json({ error: error.message });
		}
	};

	// @route GET /user-projects
	// @description Get all user project relations
	// @query { page, limit, userId, projectId, workosUserId }
	// @returns { message: "User Project Relations fetched successfully", userProjectRelations, page, limit }
	getUserProjectRelations = async (req: Request, res: Response) => {
		try {
			const { page, limit, userId, projectId, workosUserId } = req.query;

			// Pagination
			const pageNumber = parseInt(page as string) || 1;
			const limitNumber = parseInt(limit as string) || 10;
			const skip = (pageNumber - 1) * limitNumber;

			// Filtering
			const filter: any = {};
			if (workosUserId) {
				filter.workosUser = workosUserId;
			}
			if (userId && mongoose.Types.ObjectId.isValid(userId as string)) {
				filter.user = userId;
			}
			if (projectId && mongoose.Types.ObjectId.isValid(projectId as string)) {
				filter.project = projectId;
			}

			// Fetch projects
			const userProjectRelations = await database.UserProject.find(filter)
				.skip(skip)
				.limit(limitNumber);

			res.json({
				page: pageNumber,
				limit: limitNumber,
				userProjectRelations,
				message: "User Project Relations fetched successfully",
			});
		} catch (error: any) {
			res.status(500).json({ error: error.message });
		}
	};

	// @route GET /user-projects/:id
	// @description Get a user project relation by ID
	// @params { id }
	// @returns { message: "User Project Relation fetched successfully", userProjectRelation }
	// @error { error: "Invalid User Project Relation ID" }
	getUserProjectRelation = async (req: Request, res: Response) => {
		try {
			const { id } = req.params;

			// Validation
			if (!mongoose.Types.ObjectId.isValid(id)) {
				res.status(400).json({ error: "Invalid User Project Relation ID" });
				return;
			}

			// Fetch user project relation
			const userProjectRelation = await database.UserProject.findById(id);
			if (!userProjectRelation) {
				res.status(404).json({ error: "User Project Relation not found" });
				return;
			}

			res.json({ message: "User Project Relation fetched successfully", userProjectRelation });
		} catch (error: any) {
			res.status(500).json({ error: error.message });
		}
	};

	// @route PUT /user-projects/:id
	// @description Update a user project relation by ID
	// @params { id }
	// @body { role, sessionIds }
	// @returns { message: "User Project Relation updated successfully", userProjectRelation }
	// @error { error: "Invalid User Project Relation ID" }
	// @error { error: "Invalid fields <field1>, <field2>, ..." }
	// @error { error: "User Project Relation not found" }
	updateUserProjectRelation = async (req: Request, res: Response) => {
		try {
			const { id } = req.params;
			const updates = req.body;

			// Validation
			if (!mongoose.Types.ObjectId.isValid(id)) {
				res.status(400).json({ error: "Invalid User Project Relation ID" });
				return;
			}
			// Extra fields check
			const allowedFields = ["role", "sessionIds"];
			const extraFields = Object.keys(updates).filter((field) => !allowedFields.includes(field));
			if (extraFields.length > 0) {
				res.status(400).json({ error: `Invalid fields: ${extraFields.join(", ")}` });
				return;
			}

			// Update user project relation
			const userProjectRelation = await database.UserProject.findByIdAndUpdate(id, updates, {
				new: true,
			});
			if (!userProjectRelation) {
				res.status(404).json({ error: "User Project Relation not found" });
				return;
			}

			res.json({ message: "User Project Relation updated successfully", userProjectRelation });
		} catch (error: any) {
			res.status(400).json({ error: error.message });
		}
	};

	// @route DELETE /user-projects/:id
	// @description Delete a user project relation by ID
	// @params { id }
	// @returns { message: "User Project Relation deleted successfully" }
	// @error { error: "Invalid User Project Relation ID" }
	deleteUserProjectRelation = async (req: Request, res: Response) => {
		try {
			const { id } = req.params;

			// Validation
			if (!mongoose.Types.ObjectId.isValid(id)) {
				res.status(400).json({ error: "Invalid User Project Relation ID" });
				return;
			}

			// Deactivate user project relation
			const userProjectRelation = await database.UserProject.findByIdAndUpdate(
				id,
				{
					isActive: false,
				},
				{ new: true }
			);
			if (!userProjectRelation) {
				res.status(404).json({ error: "User Project Relation not found" });
				return;
			}

			res.json({ message: "User Project Relation deactivated successfully", userProjectRelation });
		} catch (error: any) {
			res.status(500).json({ error: error.message });
		}
	};
}
