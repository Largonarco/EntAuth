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
