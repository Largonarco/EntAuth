import mongoose from "mongoose";
import database from "app/models";
import { Request, Response } from "express";
import BaseController from "app/modules/Base/Controller";

export default class UserController extends BaseController {
	// @route POST /users
	// @description Create a new user
	// @body { firstName, lastName, email, phone }
	// @returns { message: "User created successfully", user }
	// @error { error: "First Name, Last Name, and Email are required" }
	// @error { error: "Email already exists" }
	createUser = async (req: Request, res: Response) => {
		try {
			const { firstName, lastName, email, phone } = req.body;

			// Validation
			if (!firstName || !lastName || !email) {
				res.status(400).json({ error: "First Name, Last Name, and Email are required" });
				return;
			}

			// Check for existing email
			const existingUser = await database.User.findOne({ email });
			if (existingUser) {
				res.status(400).json({ error: "Email already exists" });
				return;
			}

			// Create user
			const user = await database.User.create({
				email,
				lastName,
				firstName,
				phone: phone || "",
			});

			res.status(201).json({ message: "User created successfully", user });
		} catch (error: any) {
			res.status(400).json({ error: error.message });
		}
	};

	// @route GET /users
	// @description Get all users
	// @query { page, limit, email, phone }
	// @returns { message: "Users fetched successfully", users, page, limit }
	getUsers = async (req: Request, res: Response) => {
		try {
			const { page, limit, email, phone } = req.query;

			// Pagination
			const pageNumber = parseInt(page as string) || 1;
			const limitNumber = parseInt(limit as string) || 10;
			const skip = (pageNumber - 1) * limitNumber;

			// Filter
			const filter: any = {};
			if (email) filter.email = email;
			if (phone) filter.phone = phone;

			// Fetch users
			const users = await database.User.find(filter).skip(skip).limit(limitNumber);

			res.json({
				users,
				page: pageNumber,
				limit: limitNumber,
				message: "Users fetched successfully",
			});
		} catch (error: any) {
			res.status(500).json({ error: error.message });
		}
	};

	// @route GET /users/:id
	// @description Get a user by ID
	// @params { id }
	// @returns { message: "User fetched successfully", user }
	// @error { error: "Invalid user ID" }
	getUser = async (req: Request, res: Response) => {
		try {
			const { id } = req.params;

			// Validation
			if (!mongoose.Types.ObjectId.isValid(id)) {
				res.status(400).json({ error: "Invalid user ID" });
				return;
			}

			// Fetch user
			const user = await database.User.findById(id);
			if (!user) {
				res.status(404).json({ error: "User not found" });
				return;
			}

			res.json({ message: "User fetched successfully", user });
		} catch (error: any) {
			res.status(500).json({ error: error.message });
		}
	};

	// @route PUT /users/:id
	// @description Update a user by ID
	// @params { id }
	// @body { firstName, lastName, phone }
	// @returns { message: "User updated successfully", user }
	// @error { error: "Invalid user ID" }
	// @error { error: "Invalid fields: <field1>, <field2>, ..." }
	updateUser = async (req: Request, res: Response) => {
		try {
			const { id } = req.params;
			const updates = req.body;

			// Validation
			if (!mongoose.Types.ObjectId.isValid(id)) {
				res.status(400).json({ error: "Invalid user ID" });
				return;
			}

			// Extra fields check
			const allowedFields = ["firstName", "lastName", "phone"];
			const extraFields = Object.keys(updates).filter((field) => !allowedFields.includes(field));
			if (extraFields.length > 0) {
				res.status(400).json({ error: `Invalid fields: ${extraFields.join(", ")}` });
				return;
			}

			// Update user
			const user = await database.User.findByIdAndUpdate(id, updates, { new: true });
			if (!user) {
				res.status(404).json({ error: "User not found" });
				return;
			}

			res.json({ message: "User updated successfully", user });
		} catch (error: any) {
			res.status(400).json({ error: error.message });
		}
	};

	// @route DELETE /users/:id
	// @description Delete a user by ID
	// @params { id }
	// @returns { message: "User deleted successfully" }
	// @error { error: "Invalid user ID" }
	// @error { error: "User not found" }
	deleteUser = async (req: Request, res: Response) => {
		try {
			const { id } = req.params;

			// Validation
			if (!mongoose.Types.ObjectId.isValid(id)) {
				res.status(400).json({ error: "Invalid user ID" });
				return;
			}

			// Delete user
			const user = await database.User.findByIdAndDelete(id);
			if (!user) {
				res.status(404).json({ error: "User not found" });
				return;
			}

			res.json({ message: "User deleted successfully" });
		} catch (error: any) {
			res.status(500).json({ error: error.message });
		}
	};
}
