# API Documentation

## Overview

The Authentication API is a RESTful service that provides comprehensive authentication and authorization capabilities for any projects. It serves as the backend for the authentication package and CLI tool, managing users, projects, user-project relations, and WorkOS configurations.

## Architecture

The API is built with Express.js and follows a modular architecture:

```
API/
├── src/
│   ├── app/
│   │   ├── middlewares/          # Authentication, logging, sanitization
│   │   ├── models/               # Database schemas and models
│   │   ├── modules/              # Route modules organized by domain
│   │   │   ├── Base/             # Base controller and route classes
│   │   │   └── Embos/          # Business logic modules
│   │   │       ├── auth/         # Authentication-related routes
│   │   │       │   ├── users/    # User management
│   │   │       │   ├── userprojects/ # User-project relations
│   │   │       │   └── workosconfigs/ # WorkOS configurations
│   │   │       └── projects/     # Project management
│   │   ├── types/                # TypeScript type definitions
│   │   └── utils/                # Utility functions
│   ├── index.ts                  # Route registration
│   └── server.ts                 # Express server setup
```

## Authentication

The API uses API key-based authentication for all protected endpoints. The authentication flow works as follows:

1. **API Key Validation**: All requests must include an `x-api-key` header
2. **Project Resolution**: The API key is used to identify the associated project
3. **Hash Verification**: The API key is verified against the stored hash in the database
4. **Request Context**: Project information is attached to the request for use in controllers

### Authentication Middleware

```typescript
// Middleware: api/src/app/middlewares/authenticate.ts
export const secure = async (req: Request, res: Response, next: NextFunction) => {
	const apiKey = req.headers["x-api-key"] as string;

	// Find project by API key prefix
	const project = await database.Project.findOne({
		apiKeyHash: new RegExp(`^${prefix}:`),
	});

	// Verify API key hash
	const isValid = verifyApiKey(apiKey, project.apiKeyHash);

	if (isValid) {
		res.locals.project = project;
		res.locals.apiKey = apiKey;
		next();
	} else {
		res.status(401).json({ message: "Unauthorized" });
	}
};
```

## API Endpoints

### Base URL

```
http://localhost:3001/api
```

### Users Endpoints

#### GET /users

List all users for the authenticated project.

**Headers:**

- `x-api-key`: Project API key

**Query Parameters:**

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `email` (string): Filter by email
- `phone` (string): Filter by phone number

**Response:**

```json
{
	"success": true,
	"data": {
		"users": [
			{
				"id": "user_id",
				"email": "user@example.com",
				"firstName": "John",
				"lastName": "Doe",
				"phone": "+1234567890",
				"createdAt": "2024-01-01T00:00:00.000Z",
				"updatedAt": "2024-01-01T00:00:00.000Z"
			}
		],
		"pagination": {
			"page": 1,
			"limit": 10,
			"total": 100,
			"pages": 10
		}
	}
}
```

#### GET /users/:id

Get a specific user by ID.

**Headers:**

- `x-api-key`: Project API key

**Response:**

```json
{
	"success": true,
	"data": {
		"user": {
			"id": "user_id",
			"email": "user@example.com",
			"firstName": "John",
			"lastName": "Doe",
			"phone": "+1234567890",
			"createdAt": "2024-01-01T00:00:00.000Z",
			"updatedAt": "2024-01-01T00:00:00.000Z"
		}
	}
}
```

#### POST /users

Create a new user.

**Headers:**

- `x-api-key`: Project API key
- `Content-Type`: application/json

**Body:**

```json
{
	"email": "user@example.com",
	"firstName": "John",
	"lastName": "Doe",
	"phone": "+1234567890"
}
```

**Response:**

```json
{
	"success": true,
	"data": {
		"user": {
			"id": "new_user_id",
			"email": "user@example.com",
			"firstName": "John",
			"lastName": "Doe",
			"phone": "+1234567890",
			"createdAt": "2024-01-01T00:00:00.000Z",
			"updatedAt": "2024-01-01T00:00:00.000Z"
		}
	}
}
```

#### PUT /users/:id

Update an existing user.

**Headers:**

- `x-api-key`: Project API key
- `Content-Type`: application/json

**Body:**

```json
{
	"firstName": "Jane",
	"lastName": "Smith",
	"phone": "+0987654321"
}
```

#### DELETE /users/:id

Delete a user.

**Headers:**

- `x-api-key`: Project API key

### Projects Endpoints

#### GET /projects

List all projects for the authenticated API key.

**Headers:**

- `x-api-key`: Project API key

**Query Parameters:**

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `name` (string): Filter by project name

#### GET /projects/current

Get the current project based on the API key.

**Headers:**

- `x-api-key`: Project API key

#### GET /projects/:id

Get a specific project by ID.

**Headers:**

- `x-api-key`: Project API key

#### POST /projects

Create a new project.

**Headers:**

- `Content-Type`: application/json

**Body:**

```json
{
	"name": "Project Name",
	"organizationName": "Organization Name",
	"description": "Project description",
	"workosConfig": "workos_config_id",
	"emailConfig": {
		"webhookUrl": "https://api.example.com/webhook",
		"senders": ["noreply@example.com"]
	},
	"configuration": {
		"feature_flag": "enabled"
	}
}
```

### User-Project Relations Endpoints

#### GET /userprojects

List all user-project relations.

**Headers:**

- `x-api-key`: Project API key

**Query Parameters:**

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `userId` (string): Filter by user ID
- `projectId` (string): Filter by project ID
- `workosUserId` (string): Filter by WorkOS user ID

#### POST /userprojects

Create a new user-project relation.

**Headers:**

- `x-api-key`: Project API key
- `Content-Type`: application/json

**Body:**

```json
{
	"userId": "user_id",
	"projectId": "project_id",
	"role": {
		"name": "user",
		"permissions": []
	},
	"sessionIds": ["session_1", "session_2"],
	"workosUserId": "workos_user_id"
}
```

### WorkOS Configurations Endpoints

#### GET /workosconfigs

List all WorkOS configurations.

**Headers:**

- `x-api-key`: Project API key

**Query Parameters:**

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `rbac` (boolean): Filter by RBAC enabled
- `signup` (boolean): Filter by signup enabled
- `authkit` (boolean): Filter by AuthKit enabled

#### POST /workosconfigs

Create a new WorkOS configuration.

**Headers:**

- `x-api-key`: Project API key
- `Content-Type`: application/json

**Body:**

```json
{
	"isDefault": true,
	"signupEnabled": true,
	"rbacEnabled": true,
	"authkitEnabled": true,
	"workosClientId": {
		"staging": "client_staging_id",
		"production": "client_production_id"
	},
	"workosClientSecret": {
		"staging": "secret_staging",
		"production": "secret_production"
	},
	"authkitLogoutUrl": {
		"staging": "https://staging.example.com/logout",
		"production": "https://example.com/logout"
	},
	"authkitRedirectUrl": {
		"staging": "https://staging.example.com/callback",
		"production": "https://example.com/callback"
	},
	"enabledAuthMethods": ["email_password", "magic_link", "social"],
	"allowedSocialProviders": [
		{
			"provider": "google",
			"redirectURL": {
				"staging": "https://staging.example.com/auth/google",
				"production": "https://example.com/auth/google"
			}
		}
	],
	"rbacRoles": [
		{
			"name": "user",
			"permissions": []
		}
	],
	"metadata": {
		"custom_field": "value"
	}
}
```

## Data Models

### User Model

```typescript
interface User {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	phone?: string;
	createdAt: Date;
	updatedAt: Date;
}
```

### Project Model

```typescript
interface Project {
	id: string;
	name: string;
	organizationName: string;
	description?: string;
	apiKeyHash: string;
	workosConfig?: string;
	authConfig: {
		rbac: boolean;
		logoutURL: string[];
		redirectURL: string[];
		authkitEnabled: boolean;
		custom?: {
			enabledAuthMethods: string[];
			allowedSocialProviders: string[];
		};
	};
	emailConfig?: {
		webhookUrl: string;
		senders: string[];
	};
	configuration?: Record<string, any>;
	createdAt: Date;
	updatedAt: Date;
}
```

### User-Project Relation Model

```typescript
interface UserProjectRelation {
	id: string;
	userId: string;
	projectId: string;
	role: {
		name: string;
		permissions: string[];
	};
	sessionIds: string[];
	workosUserId?: string;
	createdAt: Date;
	updatedAt: Date;
}
```

### WorkOS Configuration Model

```typescript
interface WorkOSConfig {
	id: string;
	isDefault: boolean;
	signupEnabled: boolean;
	rbacEnabled: boolean;
	authkitEnabled: boolean;
	workosClientId: {
		staging: string;
		production: string;
	};
	workosClientSecret: {
		staging: string;
		production: string;
	};
	authkitLogoutUrl: {
		staging: string;
		production: string;
	};
	authkitRedirectUrl: {
		staging: string;
		production: string;
	};
	enabledAuthMethods: string[];
	allowedSocialProviders: string[];
	rbacRoles: Array<{
		name: string;
		permissions: string[];
	}>;
	metadata?: Record<string, any>;
	createdAt: Date;
	updatedAt: Date;
}
```

# Authentication Module

This module will help to setup authentication in projects with ease and consistency.

## Module Usage Examples

For detailed examples of how to use this package as a module in your code, check out the example files in the `examples` directory:

- [AuthKit Integration Example](examples/authkit.ts) - WorkOS AuthKit integration
- [Standard Authentication Example](examples/standard.ts) - Basic authentication flows

## Auth CLI tool

A command-line interface tool for managing authentication-related resources in your application.

### Installation

#### For Module Users

##### Global Installation (Recommended for CLI usage)

```bash
# Install the package globally
npm install -g @embos/auth

# Now you can use the CLI from anywhere
auth-cli users list
```

##### Local Installation (For project-specific usage)

```bash
# Install the package in your project
npm install @embos/auth

# Use the CLI through npx
npx auth-cli users list
```

### For Developers

```bash
# Clone the repository
git clone <repository-url>
cd ent-auth

# Install dependencies
yarn install

# Build the project
yarn build

# Link the CLI tool globally (for development)
yarn link
```

### Configuration

Create a `.env` file in your project root with the following variables:

```env
API_KEY=your_api_key_here
BASE_URL=http://localhost:3000  # Optional, defaults to http://localhost:3000
```

### Usage

The CLI tool provides commands for managing users, projects, user-project relations, and WorkOS configurations.

#### Users

```bash
# List all users with optional filters
auth-cli users list [-p <page>] [-l <limit>] [-e <email>] [-c <phone>]

# Get a user by ID
auth-cli users get <id>

# Create a new user
auth-cli users create -e <email> -f <first-name> -l <last-name> [-p <phone>]

# Update a user
auth-cli users update <id> [-p <phone>] [-f <first-name>] [-l <last-name>]

# Delete a user
auth-cli users delete <id>
```

#### Projects

```bash
# List all projects with optional filters
auth-cli projects list [-p <page>] [-l <limit>] [-n <name>]

# Get a project by ID
auth-cli projects get <id>

# Create a new project
auth-cli projects create \
  -n <name> \
  -w <workos-config-id> \
  -o <organization-name> \
  [-d <description>] \
  [--email-config <json>] \
  [--configuration <json>]

# Update a project
auth-cli projects update <id> [-n <name>] [-d <description>] [-w <workos-config>] [-o <organization-name>]

# Delete a project
auth-cli projects delete <id>
```

#### User-Project Relations

```bash
# List all user-project relations with optional filters
auth-cli relations list [-p <page>] [-l <limit>] [-u <user-id>] [-j <project-id>] [-w <workos-user-id>]

# Create a new user-project relation
auth-cli relations create -u <user-id> -p <project-id> -r <role> [-s <session-ids...>] [-w <workos-user-id>]

# Update a user-project relation
auth-cli relations update <id> [-s <session-ids...>] [-r <role>]

# Delete a user-project relation
auth-cli relations delete <id>
```

#### WorkOS Configurations

```bash
# List all WorkOS configurations with optional filters
auth-cli workos list [-p <page>] [-l <limit>] [-r] [-s] [-a]

# Get a WorkOS configuration by ID
auth-cli workos get <id>

# Create a new WorkOS configuration
auth-cli workos create \
  --is-default \
  --signup-enabled \
  --rbac-enabled \
  --authkit-enabled \
  --workos-client-id-staging <client-id> \
  --workos-client-secret-staging <client-secret> \
  --authkit-logout-url-staging <url> \
  --authkit-redirect-url-staging <url> \
  [--metadata <json-string>] \
  [--enabled-auth-methods <methods...>] \
  [--allowed-social-providers <json-string>] \
  [--workos-client-id-production <client-id>] \
  [--workos-client-secret-production <client-secret>] \
  [--authkit-logout-url-production <url>] \
  [--authkit-redirect-url-production <url>] \
  [--rbac-roles <json-string>]

# Update a WorkOS configuration
auth-cli workos update <id> \
  [--is-default] \
  [--signup-enabled] \
  [--rbac-enabled] \
  [--authkit-enabled] \
  [--workos-client-id-staging <client-id>] \
  [--workos-client-secret-staging <client-secret>] \
  [--authkit-logout-url-staging <url>] \
  [--authkit-redirect-url-staging <url>] \
  [--metadata <json-string>] \
  [--enabled-auth-methods <methods...>] \
  [--allowed-social-providers <json-string>] \
  [--workos-client-id-production <client-id>] \
  [--workos-client-secret-production <client-secret>] \
  [--authkit-logout-url-production <url>] \
  [--authkit-redirect-url-production <url>] \
  [--rbac-roles <json-string>]

# Delete a WorkOS configuration
auth-cli workos delete <id>
```

### Common Options

Most list commands support the following options:

- `-p, --page <number>`: Page number (default: 1)
- `-l, --limit <number>`: Items per page (default: 10)

### Examples

```bash
# List users with pagination and filters
auth-cli users list -p 2 -l 20 -e john@example.com -c +1234567890

# Create a new user
auth-cli users create -e john@example.com -f John -l Doe -p +1234567890

# Create a new project with email configuration and custom settings
auth-cli projects create \
  -n "Project Name" \
  -w workos-123 \
  -o "Organisation Name" \
  -d "Project Description" \
  --email-config '{"webhookUrl": "https://api.example.com/webhook", "senders": ["noreply@example.com"]}' \
  --configuration '{"feature_flag": "enabled"}'

# Create a user-project relation with role
auth-cli relations create -u 6847e9bb461066474600929e -p 684739f9ae9738d07631a9bd -r '{"name": "user", "permissions": []}' -w user_01JVKXSE91C5578BTMQ11PVW01

# Create a WorkOS configuration
auth-cli workos create \
  --is-default \
  --rbac-enabled false \
  --signup-enabled false \
  --authkit-enabled \
  --workos-client-id-staging "xxx" \
  --workos-client-id-production "xxx" \
  --workos-client-secret-staging "xxxx" \
  --workos-client-secret-production "xxxx" \
  --authkit-logout-url-staging "https://staging.example.com/logout" \
  --authkit-redirect-url-staging "https://staging.example.com/callback" \
  --rbac-roles '[{"name": "user", "permissions": []}]' \
  --enabled-auth-methods "email_password" "magic_link" "social" \
  --metadata '{"custom_field": "value"}' \
  --allowed-social-providers '[{"provider": "google", "redirectURL": {"staging": "https://staging.example.com/auth/google", "production": "https://example.com/auth/google"}}, {"provider": "microsoft", "redirectURL": {"staging": "https://staging.example.com/auth/google", "production": "https://example.com/auth/microsoft"}}]'
```

# Package-API Integration

## How the Package Interacts with the API

The authentication package serves as a client library that communicates with the API to provide authentication functionality. Here's how the integration works:

### 1. Initialization Flow

```typescript
// Package initialization
const auth = await createAuth({
	apikey: "project-api-key",
	projectName: "project-name",
	workos: { env: "production" },
	delivery: {
		/* JWT/API Key config */
	},
});
```

**What happens during initialization:**

1. **Project Resolution**: The package calls `GET /api/projects` to find the project by name
2. **WorkOS Config Retrieval**: If the project has a WorkOS config, it fetches the configuration using `GET /api/workosconfigs/:id`
3. **Configuration Enhancement**: The package enriches the configuration with project-specific settings
4. **Method Selection**: Based on the WorkOS config, it determines whether to use AuthKit or Standard authentication

### 2. Authentication Methods

The package provides two main authentication approaches:

#### AuthKit Method

```typescript
const authkit = auth.authkit();

// Prompt for authentication
app.post("/auth/prompt", authkit.prompt(), (req, res) => {
	res.json({ authURL: res.locals.authURL });
});

// Handle callback
app.get("/auth/callback", authkit.callback(), (req, res) => {
	res.json({ token: res.locals.auth.token });
});
```

**API Interactions:**

- **User Creation**: Creates users via `POST /api/users` when new users authenticate
- **User-Project Relations**: Creates relations via `POST /api/userprojects` to link users to projects
- **Session Management**: Manages user sessions through the user-project relation model

#### Standard Method

```typescript
const standard = auth.standard();

// OAuth authentication
const googleOAuth = standard.oauth("google");
app.post("/auth/oauth/google/prompt", googleOAuth.prompt());
app.get("/auth/oauth/google/callback", googleOAuth.callback());

// Password authentication
const password = standard.password();
app.post("/auth/password/signup", password.signup());
app.post("/auth/password/signin", password.signin());

// Magic link authentication
const magicLink = standard.magicLink();
app.post("/auth/magic-link/generate", magicLink.generate());
app.post("/auth/magic-link/verify", magicLink.verify());
```

**API Interactions:**

- **User Management**: Full CRUD operations on users via `/api/users` endpoints
- **Authentication Flow**: Handles various authentication methods (OAuth, password, magic link)
- **Session Management**: Creates and manages user sessions

### 3. Token Validation

```typescript
// Validate authentication tokens
app.get("/auth/validate", authkit.validate(), (req, res) => {
	res.json({ userProjectRelation: res.locals.auth.userProjectRelation });
});
```

**API Interactions:**

- **User Lookup**: Validates tokens by looking up user-project relations
- **Permission Checking**: Verifies user roles and permissions
- **Session Validation**: Ensures sessions are still active

### 4. Error Handling

The package handles various API error scenarios:

```typescript
// API response structure
interface APIResponse<T> {
	success: boolean;
	data: T;
	error?: string;
}

// Error handling in package
if (!response.success) {
	throw new Error(`API Error: ${response.error}`);
}
```

## Configuration Synchronization

The package automatically synchronizes configuration with the API:

1. **Project Settings**: Retrieves project-specific authentication settings
2. **WorkOS Configuration**: Fetches and applies WorkOS client credentials
3. **RBAC Settings**: Loads role-based access control configurations
4. **Auth Methods**: Determines which authentication methods are enabled
5. **Social Providers**: Configures allowed social authentication providers

### Security Considerations

1. **API Key Management**: API keys are hashed and stored securely in the database
2. **Request Validation**: All requests are validated and sanitized
3. **Rate Limiting**: API endpoints implement rate limiting to prevent abuse
4. **CORS Configuration**: Cross-origin requests are properly configured
5. **Error Handling**: Sensitive information is not exposed in error messages

## Development and Testing

### Running the API Locally

```bash
cd api
npm install
npm run dev
```

The API will be available at `http://localhost:3001`

### Environment Variables

```env
# API Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DATABASE_URL=your_database_url

# Encryption
ENCRYPTION_KEY=your_encryption_key
```

### Testing the Integration

```bash
# Test API endpoints
curl -H "x-api-key: your_api_key" http://localhost:3001/api/users

# Test package integration
cd package
npm run test
```

This comprehensive integration ensures that the authentication package provides a seamless developer experience while maintaining security and scalability through the robust API backend.
