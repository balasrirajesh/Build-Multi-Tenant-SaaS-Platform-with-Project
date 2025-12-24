# API Testing Guide

## Using cURL

### 1. Register New Tenant

```bash
curl -X POST http://localhost:5000/api/auth/register-tenant \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Company",
    "email": "admin@mycompany.com",
    "password": "SecurePass123!",
    "subdomain": "mycompany"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "tenantId": 1,
    "userId": 1,
    "email": "admin@mycompany.com",
    "role": "tenant_admin",
    "token": "eyJhbGc..."
  }
}
```

### 2. Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@mycompany.com",
    "password": "SecurePass123!"
  }'
```

### 3. Get Current User Profile

```bash
TOKEN="YOUR_JWT_TOKEN"
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Create Project

```bash
TOKEN="YOUR_JWT_TOKEN"
curl -X POST http://localhost:5000/api/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Project",
    "description": "Project description here"
  }'
```

### 5. List Projects

```bash
TOKEN="YOUR_JWT_TOKEN"
curl -X GET "http://localhost:5000/api/projects?limit=10&offset=0" \
  -H "Authorization: Bearer $TOKEN"
```

### 6. Create Task

```bash
TOKEN="YOUR_JWT_TOKEN"
PROJECT_ID=1
curl -X POST http://localhost:5000/api/projects/$PROJECT_ID/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Task 1",
    "description": "Task description",
    "priority": "high"
  }'
```

### 7. Update Task Status

```bash
TOKEN="YOUR_JWT_TOKEN"
TASK_ID=1
curl -X PATCH http://localhost:5000/api/tasks/$TASK_ID/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in-progress"
  }'
```

### 8. Add User to Tenant

```bash
TOKEN="YOUR_JWT_TOKEN"
TENANT_ID=1
curl -X POST http://localhost:5000/api/tenants/$TENANT_ID/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@mycompany.com",
    "full_name": "John Doe",
    "role": "user",
    "password": "User123456!"
  }'
```

### 9. List Tenant Users

```bash
TOKEN="YOUR_JWT_TOKEN"
TENANT_ID=1
curl -X GET "http://localhost:5000/api/tenants/$TENANT_ID/users?limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

### 10. Health Check

```bash
curl -X GET http://localhost:5000/api/health
```

## Using Postman

1. Create new request
2. Set method (GET, POST, PUT, DELETE, PATCH)
3. Enter URL: `http://localhost:5000/api/...`
4. For protected routes:
   - Go to Authorization tab
   - Type: Bearer Token
   - Token: Your JWT token
5. Add JSON body in Body tab (for POST/PUT/PATCH)
6. Click Send

## Common Response Codes

- **200**: Success
- **201**: Created
- **400**: Bad request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not found
- **409**: Conflict (e.g., user limit exceeded)
- **500**: Server error

## Error Handling

All errors follow this format:
```json
{
  "success": false,
  "error": "Error message"
}
```

## Authentication

All protected endpoints require:
- Header: `Authorization: Bearer <JWT_TOKEN>`
- Token must be valid and not expired
- Token contains userId, tenantId, and role

## Data Isolation

Each request is automatically scoped to the user's tenant. Users cannot:
- Access other tenants' data
- Create resources for other tenants
- Update/delete other tenants' resources
