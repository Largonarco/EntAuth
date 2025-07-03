#!/usr/bin/env node

import dotenv from "dotenv";
import AuthAPI from "./api/index.js";
import { Command } from "commander";
import * as readline from "readline";

dotenv.config();

async function apikeyPrompt(): Promise<string> {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	return new Promise((resolve) => {
		rl.question("Please enter your API key: ", (apiKey) => {
			rl.close();
			resolve(apiKey);
		});
	});
}

interface ListOptions {
	page?: string;
	limit?: string;
	email?: string;
	phone?: string;
}

// User
interface UserCreateOptions {
	email: string;
	phone?: string;
	lastName: string;
	firstName: string;
}

interface UserUpdateOptions {
	email?: string;
	phone?: string;
	lastName?: string;
	firstName?: string;
}

// Project
interface ProjectListOptions {
	page?: string;
	name?: string;
	limit?: string;
	apiKey?: string;
}

interface ProjectCreateOptions {
	name: string;
	delivery: string;
	authConfig?: string;
	description?: string;
	workosConfig: string;
	emailConfig?: string;
	configuration?: string;
	organizationName: string;
}

interface ProjectUpdateOptions {
	name?: string;
	authConfig?: string;
	emailConfig?: string;
	description?: string;
	workosConfig?: string;
	organizationName?: string;
}

// UserProjectRelation
interface RelationCreateOptions {
	userId: string;
	role?: string;
	projectId: string;
	sessionIds?: string[];
	workosUserId?: string;
}

interface RelationUpdateOptions {
	role?: string;
	sessionIds?: string[];
}

interface RelationListOptions {
	page?: string;
	limit?: string;
	userId?: string;
	projectId?: string;
	workosUserId?: string;
}

// WorkOSConfig
interface WorkOSCreateOptions {
	metadata?: string;
	isDefault: boolean;
	rbacRoles?: string;
	rbacEnabled: boolean;
	signupEnabled: boolean;
	authkitEnabled: boolean;
	workosClientId: string;
	enabledAuthMethods?: string[];
	authkitLogoutUrlStaging: string;
	allowedSocialProviders?: string;
	workosClientSecret: string;
	authkitRedirectUrlStaging: string;
	authkitLogoutUrlProduction?: string;
	authkitRedirectUrlProduction?: string;
}

interface WorkOSUpdateOptions {
	metadata?: string;
	isDefault?: boolean;
	signupEnabled?: boolean;
	authkitEnabled?: boolean;
	workosClientId?: string;
	workosClientSecret?: string;
	enabledAuthMethods?: string[];
	allowedSocialProviders?: string;
}

interface WorkOSListOptions {
	page?: string;
	limit?: string;
	rbacEnabled?: boolean;
	signupEnabled?: boolean;
	authkitEnabled?: boolean;
}

const program = new Command();
let api: AuthAPI;

// Initialize API with user input
(async () => {
	const apiKey = await apikeyPrompt();
	api = new AuthAPI(apiKey);

	// Users commands
	program
		.command("users")
		.description("Manage users")
		.addCommand(
			new Command("list")
				.description("List all users")
				.option("-p, --page <number>", "Page number", "1")
				.option("-e, --email <string>", "Filter by email")
				.option("-c, --phone <string>", "Filter by phone")
				.option("-l, --limit <number>", "Items per page", "10")
				.action(async (options: ListOptions) => {
					const result = await api
						.user()
						.getAll(parseInt(options.page || "1"), parseInt(options.limit || "10"), {
							email: options.email,
							phone: options.phone,
						});
					console.log(JSON.stringify(result.data, null, 2));
				})
		)
		.addCommand(
			new Command("get")
				.argument("<id>", "User ID")
				.description("Get a user by ID")
				.action(async (id: string) => {
					const result = await api.user().get(id);
					console.log(JSON.stringify(result.data, null, 2));
				})
		)
		.addCommand(
			new Command("create")
				.description("Create a new user")
				.option("-p, --phone <string>", "User phone")
				.requiredOption("-e, --email <string>", "User email")
				.requiredOption("-l, --last-name <string>", "User last name")
				.requiredOption("-f, --first-name <string>", "User first name")
				.action(async (options: UserCreateOptions) => {
					const result = await api.user().create({
						email: options.email,
						phone: options.phone,
						lastName: options.lastName,
						firstName: options.firstName,
					});
					console.log(JSON.stringify(result.data, null, 2));
				})
		)
		.addCommand(
			new Command("update")
				.argument("<id>", "User ID")
				.description("Update a user")
				.option("-p, --phone <string>", "User phone")
				.option("-l, --last-name <string>", "User last name")
				.option("-f, --first-name <string>", "User first name")
				.action(async (id: string, options: UserUpdateOptions) => {
					const result = await api.user().update(id, {
						phone: options.phone,
						lastName: options.lastName,
						firstName: options.firstName,
					});
					console.log(JSON.stringify(result.data, null, 2));
				})
		)
		.addCommand(
			new Command("delete")
				.argument("<id>", "User ID")
				.description("Delete a user")
				.action(async (id: string) => {
					const result = await api.user().delete(id);
					console.log(JSON.stringify(result.data, null, 2));
				})
		);

	// Projects commands
	program
		.command("projects")
		.description("Manage projects")
		.addCommand(
			new Command("list")
				.description("List all projects")
				.option("-p, --page <number>", "Page number", "1")
				.option("-l, --limit <number>", "Items per page", "10")
				.option("-n, --name <string>", "Filter by project name")
				.option("-k, --api-key <string>", "Filter by project API key")
				.action(async (options: ProjectListOptions) => {
					const result = await api
						.project()
						.getAll(parseInt(options.page || "1"), parseInt(options.limit || "10"), {
							name: options.name,
							apiKey: options.apiKey,
						});
					console.log(JSON.stringify(result.data, null, 2));
				})
		)
		.addCommand(
			new Command("get")
				.argument("<id>", "Project ID")
				.description("Get a project by ID")
				.action(async (id: string) => {
					const result = await api.project().get(id);
					console.log(JSON.stringify(result.data, null, 2));
				})
		)
		.addCommand(
			new Command("create")
				.description("Create a new project")
				.requiredOption("-n, --name <string>", "Project name")
				.requiredOption("-a, --auth-config <json>", "Auth configuration")
				.requiredOption("-w, --workos-config <string>", "WorkOS Config ID")
				.requiredOption("-o, --organization-name <string>", "Organization name")
				.option("-e, --description <string>", "Project description")
				.option("--configuration <json>", "Custom configuration object")
				.option("--email-config <json>", "Email configuration with webhookUrl and senders")
				.action(async (options: ProjectCreateOptions) => {
					const result = await api.project().create({
						name: options.name,
						description: options.description,
						workosConfig: options.workosConfig,
						organizationName: options.organizationName,
						authConfig: options.authConfig ? JSON.parse(options.authConfig) : undefined,
						emailConfig: options.emailConfig ? JSON.parse(options.emailConfig) : undefined,
						configuration: options.configuration ? JSON.parse(options.configuration) : undefined,
					});
					console.log(JSON.stringify(result.data, null, 2));
				})
		)
		.addCommand(
			new Command("update")
				.argument("<id>", "Project ID")
				.description("Update a project")
				.option("-n, --name <string>", "Project name")
				.option("-a, --auth-config <json>", "Auth configuration")
				.option("-w, --workos-config <string>", "WorkOS Config ID")
				.option("-e, --email-config <json>", "Email configuration")
				.option("-d, --description <string>", "Project description")
				.option("-o, --organization-name <string>", "Organization name")
				.action(async (id: string, options: ProjectUpdateOptions) => {
					const result = await api.project().update(id, {
						name: options.name,
						description: options.description,
						workosConfig: options.workosConfig,
						organizationName: options.organizationName,
						authConfig: options.authConfig ? JSON.parse(options.authConfig) : undefined,
						emailConfig: options.emailConfig ? JSON.parse(options.emailConfig) : undefined,
					});
					console.log(JSON.stringify(result.data, null, 2));
				})
		)
		.addCommand(
			new Command("delete")
				.argument("<id>", "Project ID")
				.description("Delete a project")
				.action(async (id: string) => {
					const result = await api.project().delete(id);
					console.log(JSON.stringify(result.data, null, 2));
				})
		);

	// UserProjectRelation commands
	program
		.command("relations")
		.description("Manage user-project relations")
		.addCommand(
			new Command("list")
				.description("List all user-project relations")
				.option("-p, --page <number>", "Page number", "1")
				.option("-u, --user-id <string>", "Filter by user ID")
				.option("-l, --limit <number>", "Items per page", "10")
				.option("-j, --project-id <string>", "Filter by project ID")
				.option("-w, --workos-user-id <string>", "Filter by WorkOS user ID")
				.action(async (options: RelationListOptions) => {
					const result = await api
						.userProjectRelation()
						.getAll(parseInt(options.page || "1"), parseInt(options.limit || "10"), {
							userId: options.userId,
							projectId: options.projectId,
							workosUserId: options.workosUserId,
						});
					console.log(JSON.stringify(result.data, null, 2));
				})
		)
		.addCommand(
			new Command("create")
				.description("Create a new user-project relation")
				.requiredOption("-u, --user-id <string>", "User ID")
				.option("-s, --session-ids <string...>", "Session IDs")
				.requiredOption("-p, --project-id <string>", "Project ID")
				.option("-w, --workos-user-id <string>", "WorkOS user ID")
				.requiredOption("-r, --role <string>", "JSON string of user role in project")
				.action(async (options: RelationCreateOptions) => {
					const result = await api.userProjectRelation().create({
						userId: options.userId,
						projectId: options.projectId,
						sessionIds: options.sessionIds,
						workosUserId: options.workosUserId,
						role: options.role ? JSON.parse(options.role) : { name: "user", permissions: [] },
					});
					console.log(JSON.stringify(result.data, null, 2));
				})
		)
		.addCommand(
			new Command("update")
				.argument("<id>", "User-project relation ID")
				.description("Update a user-project relation")
				.option("-r, --role <string>", "JSON string of user role in project")
				.option("-s, --session-ids <string...>", "Session IDs")
				.action(async (id: string, options: RelationUpdateOptions) => {
					const result = await api.userProjectRelation().update(id, {
						sessionIds: options.sessionIds,
						role: options.role ? JSON.parse(options.role) : { name: "user", permissions: [] },
					});
					console.log(JSON.stringify(result.data, null, 2));
				})
		)
		.addCommand(
			new Command("delete")
				.argument("<id>", "User-project relation ID")
				.description("Delete a user-project relation")
				.action(async (id: string) => {
					const result = await api.userProjectRelation().delete(id);
					console.log(JSON.stringify(result.data, null, 2));
				})
		);

	// WorkOSConfig commands
	program
		.command("workos")
		.description("Manage WorkOS configurations")
		.addCommand(
			new Command("list")
				.description("List all WorkOS configurations")
				.option("-p, --page <number>", "Page number", "1")
				.option("-l, --limit <number>", "Items per page", "10")
				.option("-r, --rbac-enabled", "Filter by RBAC enabled")
				.option("-s, --signup-enabled", "Filter by signup enabled")
				.option("-a, --authkit-enabled", "Filter by AuthKit enabled")
				.action(async (options: WorkOSListOptions) => {
					const result = await api
						.workosConfig()
						.getAll(parseInt(options.page || "1"), parseInt(options.limit || "10"), {
							signupEnabled: options.signupEnabled,
							authkitEnabled: options.authkitEnabled,
						});
					console.log(JSON.stringify(result.data, null, 2));
				})
		)
		.addCommand(
			new Command("get")
				.argument("<id>", "WorkOS configuration ID")
				.description("Get a WorkOS configuration by ID")
				.action(async (id: string) => {
					const result = await api.workosConfig().get(id);
					console.log(JSON.stringify(result.data, null, 2));
				})
		)
		.addCommand(
			new Command("create")
				.description("Create a WorkOS configuration")
				.requiredOption("--rbac-enabled", "Enable RBAC")
				.requiredOption("--signup-enabled", "Enable signup")
				.requiredOption("--authkit-enabled", "Enable AuthKit")
				.requiredOption("--is-default", "Set as default configuration")
				.requiredOption("--workos-client-id <string>", "WorkOS Client ID (staging)")
				.requiredOption("--workos-client-secret <string>", "WorkOS Client Secret (staging)")
				.requiredOption("--authkit-logout-url-staging <string>", "AuthKit logout URL for staging")
				.requiredOption(
					"--authkit-redirect-url-staging <string>",
					"AuthKit redirect URL for staging"
				)
				.option("--metadata <string>", "JSON metadata")
				.option("--rbac-roles <string>", "JSON string of RBAC roles array")
				.option("--enabled-auth-methods <string...>", "Enabled authentication methods")
				.option("--allowed-social-providers <string>", "JSON string of social providers array")
				.option("--authkit-logout-url-production <string>", "AuthKit logout URL for production")
				.option("--authkit-redirect-url-production <string>", "AuthKit redirect URL for production")
				.action(async (options: WorkOSCreateOptions) => {
					const result = await api.workosConfig().create({
						isDefault: options.isDefault,
						signupEnabled: options.signupEnabled,
						workosClientId: options.workosClientId,
						authkitEnabled: options.authkitEnabled,
						workosClientSecret: options.workosClientSecret,
						custom: {
							enabledAuthMethods: options.enabledAuthMethods || [],
							allowedSocialProviders: options.allowedSocialProviders
								? JSON.parse(options.allowedSocialProviders)
								: undefined,
						},
						metadata: options.metadata ? JSON.parse(options.metadata) : undefined,
					});
					console.log(JSON.stringify(result.data, null, 2));
				})
		)
		.addCommand(
			new Command("update")
				.argument("<id>", "WorkOS configuration ID")
				.description("Update a WorkOS configuration")
				.option("--rbac-enabled", "Enable RBAC")
				.option("--signup-enabled", "Enable signup")
				.option("--authkit-enabled", "Enable AuthKit")
				.option("--is-default", "Set as default configuration")
				.option("--workos-client-id-staging <string>", "WorkOS Client ID (staging)")
				.option("--enabled-auth-methods <string...>", "Enabled authentication methods")
				.option("--authkit-logout-url-staging <string>", "AuthKit logout URL for staging")
				.option("--workos-client-id-production <string>", "WorkOS Client ID (production)")
				.option("--workos-client-secret-staging <string>", "WorkOS Client Secret (staging)")
				.option("--authkit-redirect-url-staging <string>", "AuthKit redirect URL for staging")
				.option("--authkit-logout-url-production <string>", "AuthKit logout URL for production")
				.option("--workos-client-secret-production <string>", "WorkOS Client Secret (production)")
				.option("--authkit-redirect-url-production <string>", "AuthKit redirect URL for production")
				.option(
					"--allowed-social-providers <string>",
					"JSON string of social providers array with provider and redirectURL"
				)
				.option(
					"--rbac-roles <string>",
					"JSON string of RBAC roles array with name and permissions"
				)

				.action(async (id: string, options: WorkOSUpdateOptions) => {
					const result = await api.workosConfig().update(id, {
						isDefault: options.isDefault,
						signupEnabled: options.signupEnabled,
						workosClientId: options.workosClientId,
						authkitEnabled: options.authkitEnabled,
						workosClientSecret: options.workosClientSecret,
						metadata: options.metadata ? JSON.parse(options.metadata) : undefined,
						custom: {
							enabledAuthMethods: options.enabledAuthMethods || [],
							allowedSocialProviders: options.allowedSocialProviders
								? JSON.parse(options.allowedSocialProviders)
								: undefined,
						},
					});
					console.log(JSON.stringify(result.data, null, 2));
				})
		)
		.addCommand(
			new Command("delete")
				.argument("<id>", "WorkOS configuration ID")
				.description("Delete a WorkOS configuration")
				.action(async (id: string) => {
					const result = await api.workosConfig().delete(id);
					console.log(JSON.stringify(result.data, null, 2));
				})
		);

	program.parse();
})();
