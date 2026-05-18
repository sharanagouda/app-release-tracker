# CodePush Server API Documentation

## Table of Contents
1. [Authentication Flow](#authentication-flow)
2. [Web App Authentication Implementation](#web-app-authentication-implementation)
3. [API Endpoints & cURL Examples](#api-endpoints--curl-examples)
   - [Health Check](#health-check)
   - [Authentication](#authentication)
   - [Account Management](#account-management)
   - [Access Keys](#access-keys)
   - [Apps Management](#apps-management)
   - [Deployments](#deployments)
   - [Release Management](#release-management)
   - [Deployment History](#deployment-history)
   - [Rollout Management](#rollout-management)
   - [Metrics](#metrics)
   - [Update Check (Client SDK)](#update-check-client-sdk)

---

## Authentication Flow

### CLI Authentication Flow (Current Implementation)

The CLI uses a **browser-based OAuth flow** with manual token copy-paste:

1. **CLI Command**: User runs `code-push-standalone login https://codepush.landmarkgroup.com`
2. **Browser Launch**: CLI opens browser to `https://codepush.landmarkgroup.com/auth/login?hostname={machine-name}`
3. **Provider Selection**: User sees a web page with authentication provider options (GitHub, Microsoft, Azure AD)
4. **OAuth Flow**: User clicks a provider button → OAuth redirect → Provider authentication → Callback
5. **Token Generation**: Server generates a secure access key (60-day expiration)
6. **Token Display**: Browser displays the access key in a text field
7. **Manual Copy**: User manually copies the access key
8. **CLI Input**: User pastes the access key into the CLI prompt
9. **Token Storage**: CLI stores the token in `~/.code-push.config`
10. **API Requests**: All subsequent API calls use `Authorization: Bearer {access_key}` header

### Register Flow

The register flow is identical to login, except:
- Uses `/auth/register` endpoint instead of `/auth/login`
- Creates a new account if the user doesn't exist
- Returns error if the account already exists

---

## Web App Authentication Implementation

Since you're building a web app, you have **two main options**:

### Option 1: OAuth Integration (Recommended)

**Best for:** Production web applications with proper OAuth setup

Implement the same OAuth flow as the CLI, but directly in your web app:

```javascript
// Step 1: Redirect user to CodePush OAuth provider selection
window.location.href = 'https://codepush.landmarkgroup.com/auth/login';

// Step 2: User selects provider (GitHub/Microsoft/Azure AD)
// This redirects to: /auth/login/{provider}

// Step 3: OAuth callback returns to /auth/callback/{provider}
// Server creates session and redirects to /accesskey

// Step 4: Your web app captures the access key from the page
// You can either:
// a) Parse the access key from the DOM on the /accesskey page
// b) Set up a custom callback URL that the server redirects to with the token

// Step 5: Store the access key
localStorage.setItem('codePushAccessKey', accessKey);

// Step 6: Use the access key for all API requests
fetch('https://codepush.landmarkgroup.com/apps', {
  headers: {
    'Authorization': `Bearer ${accessKey}`,
    'Accept': 'application/vnd.code-push.v2+json',
    'Content-Type': 'application/json'
  }
});
```

**Implementation Steps:**

1. **Create a Login Button** in your web app
2. **Redirect to OAuth Flow**: `https://codepush.landmarkgroup.com/auth/login`
3. **Handle Callback**: After OAuth, user is redirected to `/accesskey` page
4. **Extract Token**: Parse the access key from the page or use postMessage
5. **Store Token**: Save in localStorage, sessionStorage, or secure cookie
6. **Make API Calls**: Use the token in Authorization header

### Option 2: Pre-Generated Access Keys

**Best for:** Internal tools, development, or when OAuth is not feasible

Generate a long-lived access key via CLI and use it in your web app:

```bash
# Generate a long-lived access key (60 days default)
code-push-standalone access-key add "WebAppKey"

# Use the generated key in your web app
```

```javascript
// In your web app
const ACCESS_KEY = 'your-generated-access-key';

fetch('https://codepush.landmarkgroup.com/apps', {
  headers: {
    'Authorization': `Bearer ${ACCESS_KEY}`,
    'Accept': 'application/vnd.code-push.v2+json'
  }
});
```

**Pros:**
- Simple to implement
- No OAuth flow needed
- Good for internal tools

**Cons:**
- Less secure (key is hardcoded or stored)
- Manual key rotation required
- No per-user authentication

### Option 3: Backend Proxy (Most Secure)

**Best for:** Production applications requiring highest security

Create a backend service that handles authentication:

```javascript
// Your Backend API
app.post('/api/codepush/login', async (req, res) => {
  // Implement your own authentication (JWT, session, etc.)
  const user = await authenticateUser(req);
  
  // Store CodePush access key per user in database
  const accessKey = await getOrCreateCodePushKey(user);
  
  // Return to frontend (don't expose actual CodePush key)
  res.json({ sessionToken: generateSessionToken(user) });
});

app.get('/api/codepush/apps', async (req, res) => {
  const user = await authenticateRequest(req);
  const accessKey = await getCodePushKey(user);
  
  // Proxy request to CodePush server
  const response = await fetch('https://codepush.landmarkgroup.com/apps', {
    headers: {
      'Authorization': `Bearer ${accessKey}`,
      'Accept': 'application/vnd.code-push.v2+json'
    }
  });
  
  res.json(await response.json());
});
```

**Pros:**
- Most secure (keys never exposed to frontend)
- Centralized authentication
- Easy to implement rate limiting and monitoring

**Cons:**
- Requires backend development
- Additional infrastructure

---

## API Endpoints & cURL Examples

### Base Configuration

```bash
# Set base URL
BASE_URL="https://codepush.landmarkgroup.com"

# Set your access token (obtained from login flow)
ACCESS_TOKEN="your-access-key-here"

# Common headers
HEADERS=(
  -H "Authorization: Bearer ${ACCESS_TOKEN}"
  -H "Accept: application/vnd.code-push.v2+json"
  -H "Content-Type: application/json"
)
```

---

## Health Check

### Check Server Health

```bash
curl -X GET \
  "${BASE_URL}/health"
```

**Response:**
```
Healthy
```

**Description:**
- Checks storage and Redis connectivity
- Returns 200 if healthy, error otherwise
- No authentication required

---

## Authentication

### Check if Authenticated

```bash
curl -X GET \
  "${BASE_URL}/authenticated" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Accept: application/vnd.code-push.v2+json"
```

**Response:**
```json
{
  "authenticated": true
}
```

**Description:**
- Validates if the access token is valid
- Rate limited: 100 requests per 15 minutes per IP
- Returns 401 if token is invalid or expired

### Login Flow (Browser-Based)

**Step 1: Open Login Page**
```bash
# This returns HTML, not suitable for cURL
# Open in browser instead:
open "${BASE_URL}/auth/login?hostname=$(hostname)"
```

**Step 2: Select Provider**
```bash
# User clicks on provider button, which redirects to:
# ${BASE_URL}/auth/login/github
# ${BASE_URL}/auth/login/microsoft
# ${BASE_URL}/auth/login/azure-ad
```

**Step 3: OAuth Callback**
```bash
# After OAuth, server redirects to:
# ${BASE_URL}/auth/callback/{provider}
# Then to: ${BASE_URL}/accesskey
# User manually copies the access key displayed
```

**Note:** Login/register cannot be done via cURL alone - it requires browser OAuth flow.

---

## Account Management

### Get Account Information

```bash
curl -X GET \
  "${BASE_URL}/account" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Accept: application/vnd.code-push.v2+json"
```

**Response:**
```json
{
  "account": {
    "email": "user@example.com",
    "name": "John Doe",
    "createdTime": 1640000000000
  }
}
```

**Description:**
- Returns current authenticated user's account information
- Requires valid access token

---

## Access Keys

### List All Access Keys

```bash
curl -X GET \
  "${BASE_URL}/accessKeys" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Accept: application/vnd.code-push.v2+json"
```

**Response:**
```json
{
  "accessKeys": [
    {
      "name": "(hidden)",
      "friendlyName": "MyAccessKey",
      "description": "MyAccessKey",
      "createdTime": 1640000000000,
      "createdBy": "my-machine",
      "expires": 1645184000000,
      "isSession": false
    }
  ]
}
```

**Description:**
- Lists all access keys (excluding sessions)
- Keys are masked for security (name shows as "(hidden)")
- Sorted by creation time

### Create Access Key

```bash
curl -X POST \
  "${BASE_URL}/accessKeys" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Accept: application/vnd.code-push.v2+json" \
  -H "Content-Type: application/json" \
  -d '{
    "friendlyName": "WebAppKey",
    "ttl": 5184000000
  }'
```

**Request Body:**
```json
{
  "friendlyName": "WebAppKey",     // Required: Display name for the key
  "ttl": 5184000000,                // Optional: Time to live in milliseconds (default: 60 days)
  "createdBy": "web-app"           // Optional: Creator identifier (default: IP address)
}
```

**Response:**
```json
{
  "accessKey": {
    "name": "actual-access-key-value-here",  // This is the key to use in Authorization header
    "friendlyName": "WebAppKey",
    "createdTime": 1640000000000,
    "expires": 1645184000000,
    "createdBy": "web-app"
  }
}
```

**Description:**
- Creates a new access key
- The `name` field in response contains the actual key value
- Default TTL is 60 days (5,184,000,000 milliseconds)
- Store the `name` value securely - it won't be shown again

### Get Access Key Details

```bash
curl -X GET \
  "${BASE_URL}/accessKeys/WebAppKey" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Accept: application/vnd.code-push.v2+json"
```

**Response:**
```json
{
  "accessKey": {
    "friendlyName": "WebAppKey",
    "description": "WebAppKey",
    "createdTime": 1640000000000,
    "createdBy": "web-app",
    "expires": 1645184000000
  }
}
```

**Description:**
- Get details of a specific access key by friendly name
- Key value is not returned (hidden for security)

### Update Access Key

```bash
curl -X PATCH \
  "${BASE_URL}/accessKeys/WebAppKey" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Accept: application/vnd.code-push.v2+json" \
  -H "Content-Type: application/json" \
  -d '{
    "friendlyName": "NewKeyName",
    "ttl": 7776000000
  }'
```

**Request Body:**
```json
{
  "friendlyName": "NewKeyName",    // Optional: New friendly name
  "ttl": 7776000000                 // Optional: New TTL (extends expiration from now)
}
```

**Response:**
```json
{
  "accessKey": {
    "friendlyName": "NewKeyName",
    "description": "NewKeyName",
    "createdTime": 1640000000000,
    "expires": 1647776000000
  }
}
```

**Description:**
- Update friendly name or extend expiration
- TTL is calculated from current time
- Use friendly name (not the actual key value) in URL

### Delete Access Key

```bash
curl -X DELETE \
  "${BASE_URL}/accessKeys/WebAppKey" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Accept: application/vnd.code-push.v2+json"
```

**Response:**
- Status: 204 No Content

**Description:**
- Permanently deletes the access key
- Key will be immediately invalid
- Cannot be undone

### Delete All Sessions by Machine

```bash
curl -X DELETE \
  "${BASE_URL}/sessions/my-machine-name" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Accept: application/vnd.code-push.v2+json"
```

**Response:**
- Status: 204 No Content

**Description:**
- Deletes all session keys created by a specific machine/device
- Useful for remote logout
- Only affects session keys (isSession: true)

---

## Apps Management

### List All Apps

```bash
curl -X GET \
  "${BASE_URL}/apps" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Accept: application/vnd.code-push.v2+json"
```

**Response:**
```json
{
  "apps": [
    {
      "name": "MyApp",
      "collaborators": {
        "user@example.com": {
          "permission": "Owner",
          "isCurrentAccount": true
        }
      },
      "deployments": ["Production", "Staging"]
    }
  ]
}
```

**Description:**
- Lists all apps the user owns or collaborates on
- Includes deployment names for each app
- Apps are sorted alphabetically

### Get App Details

```bash
curl -X GET \
  "${BASE_URL}/apps/MyApp" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Accept: application/vnd.code-push.v2+json"
```

**Response:**
```json
{
  "app": {
    "name": "MyApp",
    "collaborators": {
      "user@example.com": {
        "permission": "Owner",
        "isCurrentAccount": true
      }
    },
    "deployments": ["Production", "Staging"]
  }
}
```

**Description:**
- Get details of a specific app
- Returns app name, collaborators, and deployments
- App name in URL is case-sensitive

### Create App

```bash
curl -X POST \
  "${BASE_URL}/apps" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Accept: application/vnd.code-push.v2+json" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "MyNewApp",
    "manuallyProvisionDeployments": false
  }'
```

**Request Body:**
```json
{
  "name": "MyNewApp",                         // Required: App name (must be unique)
  "manuallyProvisionDeployments": false      // Optional: If false, creates Production and Staging deployments automatically
}
```

**Response:**
```json
{
  "app": {
    "name": "MyNewApp",
    "collaborators": {
      "user@example.com": {
        "permission": "Owner",
        "isCurrentAccount": true
      }
    },
    "deployments": ["Production", "Staging"]
  }
}
```

**Description:**
- Creates a new app
- By default, automatically creates Production and Staging deployments
- Returns 409 if app name already exists
- User becomes the owner

### Rename App

```bash
curl -X PATCH \
  "${BASE_URL}/apps/MyApp" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Accept: application/vnd.code-push.v2+json" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "MyRenamedApp"
  }'
```

**Request Body:**
```json
{
  "name": "MyRenamedApp"    // Required: New app name
}
```

**Response:**
```json
{
  "app": {
    "name": "MyRenamedApp",
    "collaborators": {...},
    "deployments": ["Production", "Staging"]
  }
}
```

**Description:**
- Renames an existing app
- Requires Owner permission
- Returns 409 if new name already exists

### Delete App

```bash
curl -X DELETE \
  "${BASE_URL}/apps/MyApp" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Accept: application/vnd.code-push.v2+json"
```

**Response:**
- Status: 204 No Content

**Description:**
- Permanently deletes the app and all its deployments
- Requires Owner permission
- Cannot be undone

### Transfer App Ownership

```bash
curl -X POST \
  "${BASE_URL}/apps/MyApp/transfer/newowner@example.com" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Accept: application/vnd.code-push.v2+json"
```

**Response:**
- Status: 201 Created

**Description:**
- Transfers app ownership to another user
- Requires Owner permission
- Target user must have an existing account

### List App Collaborators

```bash
curl -X GET \
  "${BASE_URL}/apps/MyApp/collaborators" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Accept: application/vnd.code-push.v2+json"
```

**Response:**
```json
{
  "collaborators": {
    "owner@example.com": {
      "permission": "Owner",
      "isCurrentAccount": true
    },
    "collab@example.com": {
      "permission": "Collaborator",
      "isCurrentAccount": false
    }
  }
}
```

**Description:**
- Lists all collaborators and their permissions
- Permissions: "Owner" or "Collaborator"
- Owner can manage app, deployments, and collaborators
- Collaborator can view app and create releases

### Add Collaborator

```bash
curl -X POST \
  "${BASE_URL}/apps/MyApp/collaborators/newcollab@example.com" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Accept: application/vnd.code-push.v2+json"
```

**Response:**
- Status: 201 Created

**Description:**
- Adds a collaborator to the app
- Requires Owner permission
- User must have an existing CodePush account
- Collaborators can create releases but cannot manage app settings

### Remove Collaborator

```bash
curl -X DELETE \
  "${BASE_URL}/apps/MyApp/collaborators/collab@example.com" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Accept: application/vnd.code-push.v2+json"
```

**Response:**
- Status: 204 No Content

**Description:**
- Removes a collaborator from the app
- Requires Owner permission (or user can remove themselves)
- Cannot remove the owner

---

## Deployments

### List Deployments

```bash
curl -X GET \
  "${BASE_URL}/apps/MyApp/deployments" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Accept: application/vnd.code-push.v2+json"
```

**Response:**
```json
{
  "deployments": [
    {
      "name": "Production",
      "key": "deployment-key-here",
      "package": {
        "label": "v1",
        "appVersion": "1.0.0",
        "description": "Initial release",
        "isMandatory": false,
        "isDisabled": false,
        "rollout": null,
        "packageHash": "hash123",
        "blobUrl": "https://...",
        "size": 1024000,
        "uploadTime": 1640000000000
      }
    },
    {
      "name": "Staging",
      "key": "another-deployment-key",
      "package": null
    }
  ]
}
```

**Description:**
- Lists all deployments for an app
- Includes latest package for each deployment
- Deployments are sorted alphabetically
- `package` is null if no releases exist

### Get Deployment Details

```bash
curl -X GET \
  "${BASE_URL}/apps/MyApp/deployments/Production" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Accept: application/vnd.code-push.v2+json"
```

**Response:**
```json
{
  "deployment": {
    "name": "Production",
    "key": "deployment-key-here",
    "package": {
      "label": "v1",
      "appVersion": "1.0.0",
      "description": "Initial release",
      "isMandatory": false,
      "isDisabled": false,
      "rollout": null,
      "packageHash": "hash123",
      "blobUrl": "https://...",
      "size": 1024000,
      "uploadTime": 1640000000000
    }
  }
}
```

**Description:**
- Get details of a specific deployment
- Includes the latest active release
- Deployment name in URL is case-sensitive

### Create Deployment

```bash
curl -X POST \
  "${BASE_URL}/apps/MyApp/deployments" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Accept: application/vnd.code-push.v2+json" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "QA",
    "key": "optional-custom-key"
  }'
```

**Request Body:**
```json
{
  "name": "QA",                    // Required: Deployment name
  "key": "optional-custom-key"     // Optional: Custom deployment key (auto-generated if not provided)
}
```

**Response:**
```json
{
  "deployment": {
    "name": "QA",
    "key": "generated-or-custom-key",
    "package": null
  }
}
```

**Description:**
- Creates a new deployment
- Requires Owner permission
- Returns 409 if deployment name already exists
- Deployment key is auto-generated unless specified

### Rename Deployment

```bash
curl -X PATCH \
  "${BASE_URL}/apps/MyApp/deployments/QA" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Accept: application/vnd.code-push.v2+json" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Testing"
  }'
```

**Request Body:**
```json
{
  "name": "Testing"    // Required: New deployment name
}
```

**Response:**
```json
{
  "deployment": {
    "name": "Testing",
    "key": "deployment-key-here",
    "package": null
  }
}
```

**Description:**
- Renames an existing deployment
- Requires Owner permission
- Returns 409 if new name already exists

### Delete Deployment

```bash
curl -X DELETE \
  "${BASE_URL}/apps/MyApp/deployments/QA" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Accept: application/vnd.code-push.v2+json"
```

**Response:**
- Status: 204 No Content

**Description:**
- Permanently deletes the deployment and all its releases
- Requires Owner permission
- Cannot be undone

---

## Release Management

### Upload New Release

```bash
curl -X POST \
  "${BASE_URL}/apps/MyApp/deployments/Production/release" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Accept: application/vnd.code-push.v2+json" \
  -F "package=@/path/to/your/bundle.zip" \
  -F 'packageInfo={
    "appVersion": "1.0.0",
    "description": "Bug fixes and improvements",
    "isMandatory": false,
    "rollout": 25
  }'
```

**Form Data:**
- `package`: (file) The update package (ZIP file or single file)
- `packageInfo`: (JSON string) Package metadata

**Package Info Fields:**
```json
{
  "appVersion": "1.0.0",              // Required: Target binary version (semver)
  "description": "Release notes",     // Optional: Release description
  "isMandatory": false,               // Optional: Force update (default: false)
  "rollout": 25                       // Optional: Gradual rollout percentage (1-100, null for 100%)
}
```

**Response:**
```json
{
  "package": {
    "label": "v2",
    "appVersion": "1.0.0",
    "description": "Bug fixes and improvements",
    "isMandatory": false,
    "isDisabled": false,
    "rollout": 25,
    "packageHash": "hash456",
    "blobUrl": "https://...",
    "size": 2048000,
    "uploadTime": 1640100000000,
    "releaseMethod": "Upload"
  }
}
```

**Description:**
- Uploads a new release to the deployment
- Rate limited: 100 requests per 15 minutes per IP
- Package can be a ZIP file (directory) or single file
- Cannot release if there's an unfinished rollout (rollout < 100%)
- Label is auto-generated (v1, v2, v3, ...)

### Update Release Metadata (Patch Release)

```bash
# Update rollout percentage
curl -X PATCH \
  "${BASE_URL}/apps/MyApp/deployments/Production/release" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Accept: application/vnd.code-push.v2+json" \
  -H "Content-Type: application/json" \
  -d '{
    "packageInfo": {
      "label": "v2",
      "rollout": 50
    }
  }'
```

**Request Body:**
```json
{
  "packageInfo": {
    "label": "v2",                  // Optional: Specific release label (default: latest)
    "isDisabled": false,            // Optional: Disable/enable release
    "isMandatory": true,            // Optional: Change mandatory flag
    "rollout": 50,                  // Optional: Increase rollout percentage
    "description": "Updated notes", // Optional: Update description
    "appVersion": "1.0.1"          // Optional: Update target version
  }
}
```

**Response:**
```json
{
  "package": {
    "label": "v2",
    "rollout": 50,
    ...
  }
}
```

**Description:**
- Update metadata of an existing release
- If no label specified, updates the latest release
- Rollout can only be increased (not decreased)
- Once rollout reaches 100%, it cannot be changed
- Used for gradual rollout increases

**Common Use Case - Increase Rollout:**
```bash
# Initial release with 25% rollout
code-push release MyApp /path/to/bundle.zip 1.0.0 --rollout 25

# Increase to 50%
curl -X PATCH "${BASE_URL}/apps/MyApp/deployments/Production/release" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"packageInfo": {"rollout": 50}}'

# Increase to 100% (complete rollout)
curl -X PATCH "${BASE_URL}/apps/MyApp/deployments/Production/release" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"packageInfo": {"rollout": 100}}'
```

---

## Deployment History

### Get Deployment History

```bash
curl -X GET \
  "${BASE_URL}/apps/MyApp/deployments/Production/history" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Accept: application/vnd.code-push.v2+json"
```

**Response:**
```json
{
  "history": [
    {
      "label": "v3",
      "appVersion": "1.0.0",
      "description": "Latest release",
      "isMandatory": false,
      "isDisabled": false,
      "rollout": null,
      "packageHash": "hash789",
      "blobUrl": "https://...",
      "size": 3072000,
      "uploadTime": 1640200000000,
      "releaseMethod": "Upload",
      "originalLabel": null,
      "originalDeployment": null
    },
    {
      "label": "v2",
      "appVersion": "1.0.0",
      "description": "Previous release",
      "isMandatory": false,
      "isDisabled": false,
      "rollout": null,
      "packageHash": "hash456",
      "blobUrl": "https://...",
      "size": 2048000,
      "uploadTime": 1640100000000,
      "releaseMethod": "Upload"
    },
    {
      "label": "v1",
      "appVersion": "1.0.0",
      "description": "Initial release",
      "isMandatory": false,
      "isDisabled": false,
      "rollout": null,
      "packageHash": "hash123",
      "blobUrl": "https://...",
      "size": 1024000,
      "uploadTime": 1640000000000,
      "releaseMethod": "Upload"
    }
  ]
}
```

**Description:**
- Returns all releases in the deployment history
- Sorted by label (newest first)
- Includes disabled releases
- releaseMethod: "Upload", "Promote", or "Rollback"

### Clear Deployment History

```bash
curl -X DELETE \
  "${BASE_URL}/apps/MyApp/deployments/Production/history" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Accept: application/vnd.code-push.v2+json"
```

**Response:**
- Status: 204 No Content

**Description:**
- Clears all release history for the deployment
- Requires Owner permission
- Also clears metrics data
- Cannot be undone

---

## Rollout Management

### Promote Release Between Deployments

```bash
curl -X POST \
  "${BASE_URL}/apps/MyApp/deployments/Staging/promote/Production" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Accept: application/vnd.code-push.v2+json" \
  -H "Content-Type: application/json" \
  -d '{
    "packageInfo": {
      "label": "v5",
      "description": "Promoted from Staging",
      "isMandatory": true,
      "rollout": 25
    }
  }'
```

**Request Body:**
```json
{
  "packageInfo": {
    "label": "v5",                      // Optional: Specific release to promote (default: latest)
    "description": "New description",   // Optional: Override description
    "isMandatory": true,                // Optional: Override mandatory flag
    "isDisabled": false,                // Optional: Override disabled flag
    "rollout": 25,                      // Optional: Set rollout percentage
    "appVersion": "1.0.1"              // Optional: Override target version
  }
}
```

**Response:**
```json
{
  "package": {
    "label": "v6",
    "appVersion": "1.0.0",
    "description": "Promoted from Staging",
    "isMandatory": true,
    "rollout": 25,
    "releaseMethod": "Promote",
    "originalLabel": "v5",
    "originalDeployment": "Staging",
    ...
  }
}
```

**Description:**
- Copies a release from source deployment to destination
- Creates a new release in destination with new label
- Useful for promoting tested releases from Staging to Production
- Cannot promote to deployment with unfinished rollout

### Rollback to Previous Release

```bash
# Rollback to previous release (v2 -> v1)
curl -X POST \
  "${BASE_URL}/apps/MyApp/deployments/Production/rollback" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Accept: application/vnd.code-push.v2+json"

# Rollback to specific release label
curl -X POST \
  "${BASE_URL}/apps/MyApp/deployments/Production/rollback/v3" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Accept: application/vnd.code-push.v2+json"
```

**Response:**
```json
{
  "package": {
    "label": "v7",
    "appVersion": "1.0.0",
    "description": "Rollback description",
    "releaseMethod": "Rollback",
    "originalLabel": "v1",
    ...
  }
}
```

**Description:**
- Creates a new release that duplicates a previous release
- If no target specified, rolls back to immediately previous release
- Can specify target release by label
- Cannot rollback if no previous releases exist
- Cannot rollback to different app version

---

## Metrics

### Get Deployment Metrics

```bash
curl -X GET \
  "${BASE_URL}/apps/MyApp/deployments/Production/metrics" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Accept: application/vnd.code-push.v2+json"
```

**Response:**
```json
{
  "metrics": {
    "v1": {
      "active": 1500,
      "downloaded": 2000,
      "failed": 10,
      "installed": 1450
    },
    "v2": {
      "active": 500,
      "downloaded": 600,
      "failed": 5,
      "installed": 490
    }
  }
}
```

**Metrics Fields:**
- `active`: Number of devices currently running this version
- `downloaded`: Total download count
- `failed`: Number of failed deployments
- `installed`: Number of successful installations

**Description:**
- Returns metrics for each release label
- Requires Redis to be enabled on the server
- Returns empty object if Redis is not configured
- Metrics are collected from client SDK status reports

---

## Update Check (Client SDK)

These endpoints are used by the React Native/Cordova client SDK to check for updates. You typically won't call these directly in your web app, but they're included for completeness.

### Check for Updates

```bash
curl -X GET \
  "${BASE_URL}/updateCheck?deploymentKey=DEPLOYMENT_KEY&appVersion=1.0.0&packageHash=current-hash&clientUniqueId=device-123"
```

**Query Parameters:**
- `deploymentKey`: (required) Deployment key from deployment settings
- `appVersion`: (required) Current binary version (semver)
- `packageHash`: (required) Current update package hash (or "" if none)
- `clientUniqueId`: (optional) Unique device identifier (for rollout selection)
- `label`: (optional) Current release label
- `isCompanion`: (optional) Boolean for companion apps

**Response (update available):**
```json
{
  "updateInfo": {
    "label": "v2",
    "appVersion": "1.0.0",
    "description": "New update available",
    "isMandatory": false,
    "isDisabled": false,
    "packageHash": "hash456",
    "downloadUrl": "https://...",
    "packageSize": 2048000,
    "target_binary_range": "1.0.0"
  }
}
```

**Response (no update):**
```json
{
  "updateInfo": {
    "isAvailable": false,
    "target_binary_range": "1.0.0"
  }
}
```

**Description:**
- Used by client SDKs to check for updates
- Considers rollout percentage and clientUniqueId
- Returns update only if newer than current packageHash
- Caches responses in Redis for performance

### Report Deployment Status

```bash
curl -X POST \
  "${BASE_URL}/reportStatus/deploy" \
  -H "Content-Type: application/json" \
  -d '{
    "deploymentKey": "DEPLOYMENT_KEY",
    "appVersion": "1.0.0",
    "label": "v2",
    "status": "DeploymentSucceeded",
    "clientUniqueId": "device-123"
  }'
```

**Request Body:**
```json
{
  "deploymentKey": "DEPLOYMENT_KEY",      // Required
  "appVersion": "1.0.0",                   // Required
  "label": "v2",                           // Optional: Release label
  "status": "DeploymentSucceeded",         // Optional: "DeploymentSucceeded" or "DeploymentFailed"
  "clientUniqueId": "device-123",          // Optional
  "previousDeploymentKey": "PREV_KEY",     // Optional
  "previousLabelOrAppVersion": "v1"        // Optional
}
```

**Response:**
- Status: 200 OK

**Description:**
- Used by client SDKs to report deployment status
- Updates metrics in Redis
- Helps track active users and deployment success rates

### Report Download Status

```bash
curl -X POST \
  "${BASE_URL}/reportStatus/download" \
  -H "Content-Type: application/json" \
  -d '{
    "deploymentKey": "DEPLOYMENT_KEY",
    "label": "v2"
  }'
```

**Request Body:**
```json
{
  "deploymentKey": "DEPLOYMENT_KEY",    // Required
  "label": "v2"                         // Required
}
```

**Response:**
- Status: 200 OK

**Description:**
- Used by client SDKs to report successful download
- Increments download count in metrics

---

## Common Workflows

### 1. Initial Setup

```bash
# 1. Authenticate (get access token via browser)
# Visit: https://codepush.landmarkgroup.com/auth/login

# 2. Create app
curl -X POST "${BASE_URL}/apps" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Accept: application/vnd.code-push.v2+json" \
  -H "Content-Type: application/json" \
  -d '{"name": "MyApp"}'

# 3. Get deployment keys
curl -X GET "${BASE_URL}/apps/MyApp/deployments" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Accept: application/vnd.code-push.v2+json"
```

### 2. Release Workflow

```bash
# 1. Create release with 25% rollout
curl -X POST "${BASE_URL}/apps/MyApp/deployments/Production/release" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Accept: application/vnd.code-push.v2+json" \
  -F "package=@bundle.zip" \
  -F 'packageInfo={"appVersion":"1.0.0","description":"New features","rollout":25}'

# 2. Monitor metrics
curl -X GET "${BASE_URL}/apps/MyApp/deployments/Production/metrics" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Accept: application/vnd.code-push.v2+json"

# 3. Increase rollout to 50%
curl -X PATCH "${BASE_URL}/apps/MyApp/deployments/Production/release" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"packageInfo":{"rollout":50}}'

# 4. Complete rollout (100%)
curl -X PATCH "${BASE_URL}/apps/MyApp/deployments/Production/release" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"packageInfo":{"rollout":100}}'
```

### 3. Staging to Production Workflow

```bash
# 1. Release to Staging
curl -X POST "${BASE_URL}/apps/MyApp/deployments/Staging/release" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -F "package=@bundle.zip" \
  -F 'packageInfo={"appVersion":"1.0.0","description":"Testing release"}'

# 2. Test in Staging environment

# 3. Promote to Production with gradual rollout
curl -X POST "${BASE_URL}/apps/MyApp/deployments/Staging/promote/Production" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"packageInfo":{"description":"Promoted from Staging","rollout":25}}'

# 4. Monitor and increase rollout
curl -X PATCH "${BASE_URL}/apps/MyApp/deployments/Production/release" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"packageInfo":{"rollout":100}}'
```

### 4. Emergency Rollback

```bash
# 1. Check current history
curl -X GET "${BASE_URL}/apps/MyApp/deployments/Production/history" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Accept: application/vnd.code-push.v2+json"

# 2. Rollback to previous stable release
curl -X POST "${BASE_URL}/apps/MyApp/deployments/Production/rollback" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Accept: application/vnd.code-push.v2+json"

# OR rollback to specific version
curl -X POST "${BASE_URL}/apps/MyApp/deployments/Production/rollback/v5" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Accept: application/vnd.code-push.v2+json"
```

---

## Error Responses

All error responses follow this format:

```json
{
  "message": "Error description",
  "statusCode": 400
}
```

### Common Status Codes

- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `204 No Content`: Successful deletion
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Invalid or expired access token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource already exists or conflict
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

---

## Rate Limits

- `/authenticated`: 100 requests per 15 minutes per IP
- `/apps/:appName/deployments/:deploymentName/release`: 100 requests per 15 minutes per IP
- All `/auth/*` routes: 100 requests per 15 minutes per IP
- `/accesskey`: 100 requests per 15 minutes per IP

---

## Notes

1. **Access Token**: All management endpoints require `Authorization: Bearer {access_key}` header
2. **Accept Header**: Include `Accept: application/vnd.code-push.v2+json` for proper API versioning
3. **Content-Type**: Use `Content-Type: application/json` for JSON payloads
4. **Case Sensitivity**: App names and deployment names are case-sensitive
5. **Deployment Keys**: Each deployment has a unique key used by client SDKs
6. **Rollout**: Gradual rollout allows testing with a subset of users (1-100%)
7. **TTL**: Default access key expiration is 60 days (5,184,000,000 milliseconds)
8. **Sessions**: Login via CLI creates session keys that expire after 60 days

---

## Additional Resources

- Server URL: `https://codepush.landmarkgroup.com`
- API Version: v2
- Default Port: 3000 (if running locally)
- Storage: Azure Blob Storage (default) or local filesystem
- Cache: Redis (optional, for metrics and caching)

---

## Summary for Web App Implementation

For your web app, here's the recommended approach:

1. **Authentication**: 
   - Use OAuth flow by redirecting to `/auth/login`
   - Capture access key from `/accesskey` page
   - Store in localStorage or secure cookie

2. **List Apps**:
   ```javascript
   GET /apps
   ```

3. **Get Deployment History**:
   ```javascript
   GET /apps/{appName}/deployments/{deploymentName}/history
   ```

4. **Increase Rollout** (your `patch` command):
   ```javascript
   PATCH /apps/{appName}/deployments/{deploymentName}/release
   Body: {"packageInfo": {"label": "v39", "rollout": 100}}
   ```

5. **Get Metrics**:
   ```javascript
   GET /apps/{appName}/deployments/{deploymentName}/metrics
   ```

All requests must include:
```javascript
headers: {
  'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
  'Accept': 'application/vnd.code-push.v2+json',
  'Content-Type': 'application/json'
}
```
