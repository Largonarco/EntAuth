# Authentication Module

This module will help to setup authentication in projects with ease and consistency.

## Module Usage Examples

For detailed examples of how to use this package as a module in your code, check out the example files in the `examples` directory:

- [AuthKit Integration Example](examples/authkit.ts) - WorkOS AuthKit integration
- [Standard Authentication Example](examples/standard.ts) - Basic authentication flows

# Auth CLI tool

A command-line interface tool for managing authentication-related resources in your application.

## Installation

### For Module Users

#### Global Installation (Recommended for CLI usage)

```bash
# Install the package globally
npm install -g @embos/auth

# Now you can use the CLI from anywhere
auth-cli users list
```

#### Local Installation (For project-specific usage)

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

## Configuration

Create a `.env` file in your project root with the following variables:

```env
API_KEY=your_api_key_here
BASE_URL=http://localhost:3000  # Optional, defaults to http://localhost:3000
```

## Usage

The CLI tool provides commands for managing users, projects, user-project relations, and WorkOS configurations.

### Users

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

### Projects

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

### User-Project Relations

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

### WorkOS Configurations

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

## Common Options

Most list commands support the following options:

- `-p, --page <number>`: Page number (default: 1)
- `-l, --limit <number>`: Items per page (default: 10)

## Examples

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
