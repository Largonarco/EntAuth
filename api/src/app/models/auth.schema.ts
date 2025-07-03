import mongoose, { Schema } from "mongoose";

// <---------- User ---------->
// Interface
export interface User extends mongoose.Document {
	email: string;
	phone?: string;
	lastName: string;
	firstName: string;
}

// Schema
const UserSchema = new Schema<User>(
	{
		phone: { type: String },
		lastName: { type: String, required: true },
		firstName: { type: String, required: true },
		email: { type: String, required: true, unique: true },
	},
	{ timestamps: true }
);

// <---------- UserProject ---------->
// Interface
export interface UserProject extends mongoose.Document {
	lastActive?: Date;
	isActive: boolean;
	sessionIds: string[];
	workosUser: string;
	user: mongoose.Types.ObjectId;
	project: mongoose.Types.ObjectId;
	role: {
		name: string;
		permissions: string[];
	};
}

// Schema
const UserProjectSchema = new Schema<UserProject>(
	{
		lastActive: { type: Date },
		workosUser: { type: String, required: true },
		isActive: { type: Boolean, required: true, default: true },
		sessionIds: [{ type: String, required: true, default: [] }],
		user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
		project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
		role: {
			name: { type: String, required: true, default: "user" },
			permissions: [{ type: String, required: true, default: [] }],
		},
	},
	{ timestamps: true }
);

// <---------- WorkOSConfig ---------->
// Interface
export interface WorkOSConfig extends mongoose.Document {
	_id: mongoose.Types.ObjectId;
	isDefault: boolean;
	metadata?: Record<string, any>;
	signupEnabled: boolean;
	authkitEnabled: boolean;
	workosClientSecret: {
		staging: string;
		production?: string;
	};
	workosClientId: {
		staging: string;
		production?: string;
	};
	custom: {
		enabledAuthMethods?: string[];
		allowedSocialProviders?: string[];
	};
}

// Schema
const WorkOSConfigSchema = new Schema<WorkOSConfig>(
	{
		isDefault: { type: Boolean, required: true, default: false },
		signupEnabled: { type: Boolean, required: true, default: false },
		metadata: { type: mongoose.Schema.Types.Mixed, required: false },
		authkitEnabled: { type: Boolean, required: true, default: true },
		workosClientId: {
			staging: { type: String, required: true },
			production: { type: String, required: false },
		},
		workosClientSecret: {
			staging: { type: String, required: true },
			production: { type: String, required: false },
		},
		custom: {
			allowedSocialProviders: {
				type: [String],
				required: false,
				enum: ["google", "github", "microsoft", "apple"],
			},
			enabledAuthMethods: [
				{
					type: String,
					required: false,
					enum: ["sso", "email_password", "magic_link", "social", "mfa"],
				},
			],
		},
	},
	{ timestamps: true }
);

export const UserModel = mongoose.model<User>("User", UserSchema);

export const UserProjectModel = mongoose.model<UserProject>("UserProject", UserProjectSchema);

export const WorkOSConfigModel = mongoose.model<WorkOSConfig>("WorkOSConfig", WorkOSConfigSchema);
