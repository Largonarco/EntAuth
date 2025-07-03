import mongoose, { Document, ObjectId, Schema } from "mongoose";

// <---------- Project ---------->
// Interface
export interface ProjectDocument extends Document<ObjectId> {
	name: string;
	isActive: boolean;
	apiKeyHash: string;
	description?: string;
	organisationName: string;
	workosConfig: Schema.Types.ObjectId;
	configuration: Record<string, string>;
	emailConfig: {
		senders: string[];
		recipients: string[];
		webhookUrls: string[];
		notifyOnSlack: boolean;
		slackNotificationEmails: string[];
	};
	authConfig: {
		logoutURL: string[];
		redirectURL: string[];
		organisationId: string;
		authkitEnabled: boolean;
		rbac: {
			enabled: boolean;
			roles?: {
				name: string;
				permissions: string[];
			}[];
		};
		custom?: {
			enabledAuthMethods?: string[];
			allowedSocialProviders?: string[];
		};
	};
}

// Schema
const ProjectSchema = new Schema(
	{
		name: {
			type: String,
			trim: true,
			unique: true,
			required: true,
		},
		description: {
			trim: true,
			type: String,
		},
		emailConfig: {
			senders: {
				type: [String],
				required: false,
			},
			recipients: {
				type: [String],
				required: false,
			},
			webhookUrls: {
				type: [String],
				required: false,
			},
			notifyOnSlack: {
				type: Boolean,
				required: false,
				default: false,
			},
			slackNotificationEmails: {
				type: [String],
				required: false,
			},
		},
		configuration: {
			type: Map,
			of: String,
		},
		isActive: {
			type: Boolean,
			default: true,
			required: true,
		},
		organisationName: {
			trim: true,
			type: String,
			required: false,
		},
		apiKeyHash: {
			type: String,
			required: true,
		},
		workosConfig: {
			required: true,
			ref: "WorkosConfig",
			type: Schema.Types.ObjectId,
		},
		authConfig: {
			organisationId: { type: String, required: true },
			authkitEnabled: { type: Boolean, required: true, default: true },
			logoutURL: {
				type: [String],
				required: true,
			},
			redirectURL: {
				type: [String],
				required: true,
			},
			rbac: {
				enabled: { type: Boolean, required: true, default: false },
				roles: { type: [{ name: String, permissions: [String] }], required: false },
			},
			custom: {
				enabledAuthMethods: { type: [String], required: false },
				allowedSocialProviders: {
					type: [String],
					required: false,
					enum: ["google", "github", "microsoft", "apple"],
				},
			},
		},
	},
	{ timestamps: true }
);

export const ProjectModel = mongoose.model<ProjectDocument>("Project", ProjectSchema);
