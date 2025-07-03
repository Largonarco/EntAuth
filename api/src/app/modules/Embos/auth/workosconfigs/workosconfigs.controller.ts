import mongoose from "mongoose";
import database from "app/models";
import { Request, Response } from "express";
import BaseController from "app/modules/Base/Controller";

export default class WorkOSConfigController extends BaseController {
	// @route POST /workos-configs
	// @description Create a new WorkOSConfig
	// @body { signupEnabled, isDefault, metadata, workosClientId, authkitEnabled, workosClientSecret, custom }
	// @returns { message: "WorkOSConfig created successfully", workosConfig }
	// @error { error: "Required fields missing" }
	createWorkOSConfig = async (req: Request, res: Response) => {
		try {
			const {
				custom,
				metadata,
				isDefault,
				signupEnabled,
				workosClientId,
				authkitEnabled,
				workosClientSecret,
			} = req.body;

			// Validation
			if (
				!workosClientId ||
				!workosClientSecret ||
				isDefault === undefined ||
				signupEnabled === undefined ||
				authkitEnabled === undefined ||
				(!authkitEnabled && !custom)
			) {
				return res.status(400).json({
					error: "Required fields missing",
				});
			}

			// Create WorkOSConfig
			const workosConfig = await database.WorkOSConfig.create({
				custom,
				metadata,
				isDefault,
				signupEnabled,
				authkitEnabled,
				workosClientId,
				workosClientSecret,
			});

			res.status(201).json({ message: "WorkOSConfig created successfully", workosConfig });
		} catch (error: any) {
			res.status(400).json({ error: error.message });
		}
	};

	// @route GET /workos-configs
	// @description Get all WorkOSConfigs
	// @query { page, limit, authkitEnabled, signupEnabled }
	// @returns { message: "WorkOSConfigs fetched successfully", workosConfigs, page, limit }
	getWorkOSConfigs = async (req: Request, res: Response) => {
		try {
			const { page, limit, authkitEnabled, signupEnabled } = req.query;

			// Pagination
			const pageNumber = parseInt(page as string) || 1;
			const limitNumber = parseInt(limit as string) || 10;
			const skip = (pageNumber - 1) * limitNumber;

			// Filter
			const filter: any = {};
			if (signupEnabled) {
				filter.signupEnabled = signupEnabled === "true";
			}
			if (authkitEnabled) {
				filter.authkitEnabled = authkitEnabled === "true";
			}

			// Fetch WorkOSConfigs
			const workosConfigs = await database.WorkOSConfig.find(filter).skip(skip).limit(limitNumber);

			res.json({
				workosConfigs,
				page: pageNumber,
				limit: limitNumber,
				message: "WorkOSConfigs fetched successfully",
			});
		} catch (error: any) {
			res.status(500).json({ error: error.message });
		}
	};

	// @route GET /workos-configs/:id
	// @description Get a WorkOSConfig by ID
	// @params { id }
	// @returns { message: "WorkOSConfig fetched successfully", workosConfig }
	// @error { error: "Invalid WorkOSConfig ID" }
	getWorkOSConfig = async (req: Request, res: Response) => {
		try {
			const { id } = req.params;

			// Validation
			if (!mongoose.Types.ObjectId.isValid(id)) {
				return res.status(400).json({ error: "Invalid WorkOSConfig ID" });
			}

			// Fetch WorkOSConfig
			const workosConfig = await database.WorkOSConfig.findById(id);
			if (!workosConfig) {
				return res.status(404).json({ error: "WorkOSConfig not found" });
			}

			res.json({ message: "WorkOSConfig fetched successfully", workosConfig });
		} catch (error: any) {
			res.status(500).json({ error: error.message });
		}
	};

	// @route PUT /workos-configs/:id
	// @description Update a WorkOSConfig by ID
	// @params { id }
	// @body { signupEnabled, isDefault, metadata, workosClientId, authkitEnabled, workosClientSecret, custom }
	// @returns { message: "WorkOSConfig updated successfully", workosConfig }
	// @error { error: "Invalid WorkOSConfig ID" }
	// @error { error: "Invalid fields <field1>, <field2>, ..." }
	// @error { error: "WorkOSConfig not found" }
	updateWorkOSConfig = async (req: Request, res: Response) => {
		try {
			const { id } = req.params;
			const updates = req.body;

			// Validation
			if (!mongoose.Types.ObjectId.isValid(id)) {
				return res.status(400).json({ error: "Invalid WorkOSConfig ID" });
			}

			// Extra fields check
			const allowedFields = [
				"custom",
				"metadata",
				"isDefault",
				"signupEnabled",
				"authkitEnabled",
				"workosClientId",
				"workosClientSecret",
			];
			const extraFields = Object.keys(updates).filter((field) => !allowedFields.includes(field));
			if (extraFields.length > 0) {
				return res.status(400).json({ error: `Invalid fields: ${extraFields.join(", ")}` });
			}

			// Update WorkOSConfig
			const workosConfig = await database.WorkOSConfig.findByIdAndUpdate(id, updates, {
				new: true,
			});
			if (!workosConfig) {
				return res.status(404).json({ error: "WorkOSConfig not found" });
			}

			res.json({ message: "WorkOSConfig updated successfully", workosConfig });
		} catch (error: any) {
			res.status(400).json({ error: error.message });
		}
	};

	// @route DELETE /workos-configs/:id
	// @description Delete a WorkOSConfig by ID
	// @params { id }
	// @returns { message: "WorkOSConfig deleted successfully" }
	// @error { error: "Invalid WorkOSConfig ID" }
	// @error { error: "WorkOSConfig not found" }
	deleteWorkOSConfig = async (req: Request, res: Response) => {
		try {
			const { id } = req.params;

			// Validation
			if (!mongoose.Types.ObjectId.isValid(id)) {
				return res.status(400).json({ error: "Invalid WorkOSConfig ID" });
			}

			// Delete WorkOSConfig
			const workosConfig = await database.WorkOSConfig.findByIdAndDelete(id);
			if (!workosConfig) {
				return res.status(404).json({ error: "WorkOSConfig not found" });
			}

			res.json({ message: "WorkOSConfig deleted successfully" });
		} catch (error: any) {
			res.status(500).json({ error: error.message });
		}
	};
}
