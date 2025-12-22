# API Documentation
## Multi-Tenant SaaS Platform - Complete 19 Endpoints

---

## Base URL

- **Local Development:** `http://localhost:5000/api`
- **Docker Network:** `http://backend:5000/api`
- **Production:** `https://yourdomain.com/api`

---

## Standard Response Format

### Success Response (200, 201)
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation successful"
}
```

### Error Response (4xx, 5xx)
```json
{
  "success": false,
  "message": "Error description"
}
```

---

## Authentication

All endpoints except `/auth/register-tenant` and `/auth/login` require JWT authentication.

**Header Format:**
```
Authorization: Bearer <JWT_TOKEN>
```

**JWT Token Contents:**
```json
{
  "userId": "uuid",
  "tenantId": "uuid or null for super_admin",
  "role": "super_admin | tenant_admin | user",
  "iat": 1234567890,
  "exp": 1234654290
}
```

**Token Expiry:** 24 hours

---

# Authentication Module (4 Endpoints)

## 1. Register Tenant

**Endpoint:** `POST /auth/register-tenant`  
**Authentication:** None (Public)  
**Authorization:** N/A  

### Request Body

```json
{
  "tenantName": "string (required, 2-255 chars)",
  "subdomain": "string (required, unique, alphanumeric + hyphen, 3-63 chars)",
  "adminEmail": "string (required, valid email)",
  "adminPassword": "string (required, minimum 8 chars)",
  "adminFullName": "string (required, 2-255 chars)"
}
```

### Example Request

```bash
curl -X POST http://localhost:5000/api/auth/register-tenant \
  -H "Content-Type: application/json" \
  -d '{
    "tenantName": "Test Company Alpha",
    "subdomain": "testalpha",
    "adminEmail": "admin@testalpha.com",
    "adminPassword": "TestPass@123",
    "adminFullName": "Alpha Admin"
  }'
```

### Success Response (201)

```json
{
  "success": true,
  "message": "Tenant registered successfully",
  "data": {
    "tenantId": "550e8400-e29b-41d4-a716-446655440000",
    "subdomain": "testalpha",
    "adminUser": {
      "id": "650e8400-e29b-41d4-a716-446655440000",
      "email": "admin@testalpha.com",
      "fullName": "Alpha Admin",
      "role": "tenant_admin"
    }
  }
}
```

### Error Responses

**400 Bad Request** - Validation error
```json
{
  "success": false,
  "message": "Validation failed: subdomain must be alphanumeric and unique"
}
```

**409 Conflict** - Subdomain or email already exists
```json
{
  "success": false,
  "message": "Subdomain 'testalpha' already registered"
}
```

### Business Logic
- Hash password with bcrypt (10 salt rounds)
- Create tenant with default 'free' plan
- Create admin user with role 'tenant_admin'
- Wrap in database transaction (rollback on failure)
- Log action in audit_logs

---

## 2. Login

**Endpoint:** `POST /auth/login`  
**Authentication:** None (Public)  
**Authorization:** N/A  

### Request Body

```json
{
  "email": "string (required, valid email)",
  "password": "string (required)",
  "tenantSubdomain": "string (required)"
}
```

### Example Request

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@demo.com",
    "password": "Demo@123",
    "tenantSubdomain": "demo"
  }'
```

### Success Response (200)

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "admin@demo.com",
      "fullName": "Admin User",
      "role": "tenant_admin",
      "tenantId": "450e8400-e29b-41d4-a716-446655440000"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400
  }
}
```

### Error Responses

**401 Unauthorized** - Invalid credentials
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

**404 Not Found** - Tenant not found
```json
{
  "success": false,
  "message": "Tenant not found"
}
```

**403 Forbidden** - Account inactive/suspended
```json
{
  "success": false,
  "message": "Account is suspended"
}
```

### Business Logic
- Find tenant by subdomain
- Find user by email in that tenant
- Verify password using bcrypt.compare()
- Generate JWT token with 24h expiry
- Log login action in audit_logs
- Return token to client

---

## 3. Get Current User

**Endpoint:** `GET /auth/me`  
**Authentication:** Required (JWT)  
**Authorization:** Any authenticated user  

### Request Headers

```
Authorization: Bearer <JWT_TOKEN>
```

### Example Request

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Success Response (200)

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "admin@demo.com",
    "fullName": "Admin User",
    "role": "tenant_admin",
    "isActive": true,
    "tenant": {
      "id": "450e8400-e29b-41d4-a716-446655440000",
      "name": "Demo Company",
      "subdomain": "demo",
      "subscriptionPlan": "pro",
      "maxUsers": 25,
      "maxProjects": 15,
      "status": "active"
    }
  }
}
```

### Error Responses

**401 Unauthorized** - Token invalid/expired/missing
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

**404 Not Found** - User not found
```json
{
  "success": false,
  "message": "User not found"
}
```

### Business Logic
- Extract JWT from Authorization header
- Verify JWT signature and expiry
- Extract userId from token
- Query user and tenant information
- Exclude password_hash from response

---

## 4. Logout

**Endpoint:** `POST /auth/logout`  
**Authentication:** Required (JWT)  
**Authorization:** Any authenticated user  

### Request Headers

```
Authorization: Bearer <JWT_TOKEN>
```

### Example Request

```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Success Response (200)

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Business Logic
- If using sessions: Delete session record
- If JWT only: Just return success
- Log logout action in audit_logs
- Client removes token from storage

---

# Tenant Management Module (3 Endpoints)

## 5. Get Tenant Details

**Endpoint:** `GET /api/tenants/:tenantId`  
**Authentication:** Required (JWT)  
**Authorization:** User belongs to tenant OR super_admin  

### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| tenantId | UUID | Yes | Tenant ID |

### Example Request

```bash
curl -X GET http://localhost:5000/api/tenants/450e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Success Response (200)

```json
{
  "success": true,
  "data": {
    "id": "450e8400-e29b-41d4-a716-446655440000",
    "name": "Demo Company",
    "subdomain": "demo",
    "status": "active",
    "subscriptionPlan": "pro",
    "maxUsers": 25,
    "maxProjects": 15,
    "createdAt": "2024-12-15T10:30:00Z",
    "stats": {
      "totalUsers": 5,
      "totalProjects": 3,
      "totalTasks": 15
    }
  }
}
```

### Error Responses

**403 Forbidden** - User doesn't belong to tenant
```json
{
  "success": false,
  "message": "Access denied"
}
```

**404 Not Found** - Tenant not found
```json
{
  "success": false,
  "message": "Tenant not found"
}
```

---

## 6. Update Tenant

**Endpoint:** `PUT /api/tenants/:tenantId`  
**Authentication:** Required (JWT)  
**Authorization:** tenant_admin (own tenant) OR super_admin  

### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| tenantId | UUID | Yes | Tenant ID |

### Request Body

```json
{
  "name": "string (optional, 2-255 chars)",
  "status": "enum (optional) - 'active' | 'suspended' | 'trial'",
  "subscriptionPlan": "enum (optional) - 'free' | 'pro' | 'enterprise'",
  "maxUsers": "integer (optional)",
  "maxProjects": "integer (optional)"
}
```

**Note:** Tenant admins can only update `name`. Super admins can update all fields.

### Example Request

```bash
curl -X PUT http://localhost:5000/api/tenants/450e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Company Name"
  }'
```

### Success Response (200)

```json
{
  "success": true,
  "message": "Tenant updated successfully",
  "data": {
    "id": "450e8400-e29b-41d4-a716-446655440000",
    "name": "Updated Company Name",
    "updatedAt": "2024-12-15T11:30:00Z"
  }
}
```

### Error Responses

**403 Forbidden** - Insufficient permissions
```json
{
  "success": false,
  "message": "You can only update tenant name"
}
```

---

## 7. List All Tenants

**Endpoint:** `GET /api/tenants`  
**Authentication:** Required (JWT)  
**Authorization:** super_admin ONLY  

### Query Parameters

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| page | integer | 1 | - | Page number for pagination |
| limit | integer | 10 | 100 | Items per page |
| status | enum | null | - | Filter by status (active/suspended/trial) |
| subscriptionPlan | enum | null | - | Filter by plan (free/pro/enterprise) |

### Example Request

```bash
curl -X GET "http://localhost:5000/api/tenants?page=1&limit=10&status=active" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Success Response (200)

```json
{
  "success": true,
  "data": {
    "tenants": [
      {
        "id": "450e8400-e29b-41d4-a716-446655440000",
        "name": "Demo Company",
        "subdomain": "demo",
        "status": "active",
        "subscriptionPlan": "pro",
        "totalUsers": 5,
        "totalProjects": 3,
        "createdAt": "2024-12-15T10:30:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalTenants": 47,
      "limit": 10
    }
  }
}
```

### Error Responses

**403 Forbidden** - Not super_admin
```json
{
  "success": false,
  "message": "Only super admins can list all tenants"
}
```

---

# User Management Module (4 Endpoints)

## 8. Add User to Tenant

**Endpoint:** `POST /api/tenants/:tenantId/users`  
**Authentication:** Required (JWT)  
**Authorization:** tenant_admin (own tenant)  

### URL Parameters

| Parameter | Type | Required |
|-----------|------|----------|
| tenantId | UUID | Yes |

### Request Body

```json
{
  "email": "string (required, valid email)",
  "password": "string (required, minimum 8 chars)",
  "fullName": "string (required, 2-255 chars)",
  "role": "enum (optional, default: 'user') - 'user' | 'tenant_admin'"
}
```

### Example Request

```bash
curl -X POST http://localhost:5000/api/tenants/450e8400-e29b-41d4-a716-446655440000/users \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@demo.com",
    "password": "NewUser@123",
    "fullName": "New User",
    "role": "user"
  }'
```

### Success Response (201)

```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "newuser@demo.com",
    "fullName": "New User",
    "role": "user",
    "tenantId": "450e8400-e29b-41d4-a716-446655440000",
    "isActive": true,
    "createdAt": "2024-12-15T11:30:00Z"
  }
}
```

### Error Responses

**403 Forbidden** - User limit reached or not authorized
```json
{
  "success": false,
  "message": "Subscription limit reached: maximum 5 users allowed"
}
```

**409 Conflict** - Email already exists in tenant
```json
{
  "success": false,
  "message": "Email already exists in this organization"
}
```

### Business Logic
- Check user count vs tenant's maxUsers
- Hash password with bcrypt
- Email unique per tenant (composite key)
- Log action in audit_logs

---

## 9. List Tenant Users

**Endpoint:** `GET /api/tenants/:tenantId/users`  
**Authentication:** Required (JWT)  
**Authorization:** User belongs to tenant  

### URL Parameters

| Parameter | Type | Required |
|-----------|------|----------|
| tenantId | UUID | Yes |

### Query Parameters

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| search | string | null | - | Search by name or email (case-insensitive) |
| role | enum | null | - | Filter by role (super_admin/tenant_admin/user) |
| page | integer | 1 | - | Page number for pagination |
| limit | integer | 50 | 100 | Items per page |

### Example Request

```bash
curl -X GET "http://localhost:5000/api/tenants/450e8400-e29b-41d4-a716-446655440000/users?search=admin&page=1" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Success Response (200)

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "650e8400-e29b-41d4-a716-446655440000",
        "email": "admin@demo.com",
        "fullName": "Admin User",
        "role": "tenant_admin",
        "isActive": true,
        "createdAt": "2024-12-15T10:30:00Z"
      }
    ],
    "total": 1,
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "limit": 50
    }
  }
}
```

### Business Logic
- Filter by tenantId from JWT
- Never return password_hash
- Order by createdAt DESC
- Support search and filtering

---

## 10. Update User

**Endpoint:** `PUT /api/users/:userId`  
**Authentication:** Required (JWT)  
**Authorization:** tenant_admin OR self (limited fields)  

### URL Parameters

| Parameter | Type | Required |
|-----------|------|----------|
| userId | UUID | Yes |

### Request Body

```json
{
  "fullName": "string (optional, 2-255 chars)",
  "role": "enum (optional) - 'user' | 'tenant_admin'",
  "isActive": "boolean (optional)"
}
```

**Note:** Users can update their own fullName. Only tenant_admin can update role and isActive.

### Example Request

```bash
curl -X PUT http://localhost:5000/api/users/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Updated Name"
  }'
```

### Success Response (200)

```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "fullName": "Updated Name",
    "role": "user",
    "updatedAt": "2024-12-15T12:30:00Z"
  }
}
```

---

## 11. Delete User

**Endpoint:** `DELETE /api/users/:userId`  
**Authentication:** Required (JWT)  
**Authorization:** tenant_admin (own tenant)  

### URL Parameters

| Parameter | Type | Required |
|-----------|------|----------|
| userId | UUID | Yes |

### Example Request

```bash
curl -X DELETE http://localhost:5000/api/users/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Success Response (200)

```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

### Error Responses

**403 Forbidden** - Cannot delete self
```json
{
  "success": false,
  "message": "You cannot delete yourself"
}
```

### Business Logic
- Prevent admin from deleting themselves
- Verify user belongs to same tenant
- Set assigned_to = NULL in tasks
- Log deletion in audit_logs

---

# Project Management Module (4 Endpoints)

## 12. Create Project

**Endpoint:** `POST /api/projects`  
**Authentication:** Required (JWT)  
**Authorization:** Any authenticated user  

### Request Body

```json
{
  "name": "string (required, 2-255 chars)",
  "description": "string (optional, max 2000 chars)",
  "status": "enum (optional, default: 'active') - 'active' | 'archived' | 'completed'"
}
```

### Example Request

```bash
curl -X POST http://localhost:5000/api/projects \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Website Redesign Project",
    "description": "Complete redesign of company website"
  }'
```

### Success Response (201)

```json
{
  "success": true,
  "data": {
    "id": "750e8400-e29b-41d4-a716-446655440000",
    "tenantId": "450e8400-e29b-41d4-a716-446655440000",
    "name": "Website Redesign Project",
    "description": "Complete redesign of company website",
    "status": "active",
    "createdBy": "650e8400-e29b-41d4-a716-446655440000",
    "createdAt": "2024-12-15T13:30:00Z"
  }
}
```

### Error Responses

**403 Forbidden** - Project limit reached
```json
{
  "success": false,
  "message": "Subscription limit reached: maximum 3 projects allowed"
}
```

### Business Logic
- Check project count vs tenant's maxProjects
- Get tenantId from JWT token
- Get createdBy from JWT token
- Log action in audit_logs

---

## 13. List Projects

**Endpoint:** `GET /api/projects`  
**Authentication:** Required (JWT)  
**Authorization:** Any authenticated user  

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| status | enum | null | Filter by status (active/archived/completed) |
| search | string | null | Search by project name (case-insensitive) |
| page | integer | 1 | Page number |
| limit | integer | 20 | Items per page (max 100) |

### Example Request

```bash
curl -X GET "http://localhost:5000/api/projects?status=active&search=website&page=1" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Success Response (200)

```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "750e8400-e29b-41d4-a716-446655440000",
        "name": "Website Redesign Project",
        "description": "Complete redesign of company website",
        "status": "active",
        "createdBy": {
          "id": "650e8400-e29b-41d4-a716-446655440000",
          "fullName": "Admin User"
        },
        "taskCount": 5,
        "completedTaskCount": 2,
        "createdAt": "2024-12-15T13:30:00Z"
      }
    ],
    "total": 1,
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "limit": 20
    }
  }
}
```

### Business Logic
- Filter by user's tenantId automatically
- Join with users table for creator info
- Calculate taskCount and completedTaskCount

---

## 14. Update Project

**Endpoint:** `PUT /api/projects/:projectId`  
**Authentication:** Required (JWT)  
**Authorization:** tenant_admin OR project creator  

### URL Parameters

| Parameter | Type | Required |
|-----------|------|----------|
| projectId | UUID | Yes |

### Request Body

```json
{
  "name": "string (optional, 2-255 chars)",
  "description": "string (optional, max 2000 chars)",
  "status": "enum (optional) - 'active' | 'archived' | 'completed'"
}
```

### Example Request

```bash
curl -X PUT http://localhost:5000/api/projects/750e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Project Name",
    "status": "archived"
  }'
```

### Success Response (200)

```json
{
  "success": true,
  "message": "Project updated successfully",
  "data": {
    "id": "750e8400-e29b-41d4-a716-446655440000",
    "name": "Updated Project Name",
    "description": "Complete redesign of company website",
    "status": "archived",
    "updatedAt": "2024-12-15T14:30:00Z"
  }
}
```

---

## 15. Delete Project

**Endpoint:** `DELETE /api/projects/:projectId`  
**Authentication:** Required (JWT)  
**Authorization:** tenant_admin OR project creator  

### URL Parameters

| Parameter | Type | Required |
|-----------|------|----------|
| projectId | UUID | Yes |

### Example Request

```bash
curl -X DELETE http://localhost:5000/api/projects/750e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Success Response (200)

```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

### Business Logic
- Verify project belongs to user's tenant
- Cascade delete tasks OR handle foreign key
- Log deletion in audit_logs

---

# Task Management Module (4 Endpoints)

## 16. Create Task

**Endpoint:** `POST /api/projects/:projectId/tasks`  
**Authentication:** Required (JWT)  
**Authorization:** Any authenticated user in tenant  

### URL Parameters

| Parameter | Type | Required |
|-----------|------|----------|
| projectId | UUID | Yes |

### Request Body

```json
{
  "title": "string (required, 2-255 chars)",
  "description": "string (optional, max 2000 chars)",
  "assignedTo": "UUID (optional)",
  "priority": "enum (optional, default: 'medium') - 'low' | 'medium' | 'high'",
  "dueDate": "date (optional, format: YYYY-MM-DD)"
}
```

### Example Request

```bash
curl -X POST http://localhost:5000/api/projects/750e8400-e29b-41d4-a716-446655440000/tasks \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Design homepage mockup",
    "description": "Create high-fidelity design",
    "priority": "high",
    "dueDate": "2024-07-15"
  }'
```

### Success Response (201)

```json
{
  "success": true,
  "data": {
    "id": "850e8400-e29b-41d4-a716-446655440000",
    "projectId": "750e8400-e29b-41d4-a716-446655440000",
    "tenantId": "450e8400-e29b-41d4-a716-446655440000",
    "title": "Design homepage mockup",
    "description": "Create high-fidelity design",
    "status": "todo",
    "priority": "high",
    "assignedTo": null,
    "dueDate": "2024-07-15",
    "createdAt": "2024-12-15T15:30:00Z"
  }
}
```

### Error Responses

**400 Bad Request** - Invalid assignedTo user
```json
{
  "success": false,
  "message": "Assigned user does not belong to this tenant"
}
```

---

## 17. List Project Tasks

**Endpoint:** `GET /api/projects/:projectId/tasks`  
**Authentication:** Required (JWT)  
**Authorization:** User belongs to tenant  

### URL Parameters

| Parameter | Type | Required |
|-----------|------|----------|
| projectId | UUID | Yes |

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| status | enum | null | Filter by status (todo/in_progress/completed) |
| assignedTo | UUID | null | Filter by assigned user |
| priority | enum | null | Filter by priority (low/medium/high) |
| search | string | null | Search by task title |
| page | integer | 1 | Page number |
| limit | integer | 50 | Items per page (max 100) |

### Example Request

```bash
curl -X GET "http://localhost:5000/api/projects/750e8400-e29b-41d4-a716-446655440000/tasks?status=todo&priority=high" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Success Response (200)

```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "850e8400-e29b-41d4-a716-446655440000",
        "title": "Design homepage mockup",
        "description": "Create high-fidelity design",
        "status": "in_progress",
        "priority": "high",
        "assignedTo": {
          "id": "650e8400-e29b-41d4-a716-446655440000",
          "fullName": "Admin User",
          "email": "admin@demo.com"
        },
        "dueDate": "2024-07-15",
        "createdAt": "2024-12-15T15:30:00Z"
      }
    ],
    "total": 1,
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "limit": 50
    }
  }
}
```

### Business Logic
- Verify project belongs to user's tenant
- Order by priority DESC, dueDate ASC

---

## 18. Update Task Status

**Endpoint:** `PATCH /api/tasks/:taskId/status`  
**Authentication:** Required (JWT)  
**Authorization:** User belongs to tenant  

### URL Parameters

| Parameter | Type | Required |
|-----------|------|----------|
| taskId | UUID | Yes |

### Request Body

```json
{
  "status": "enum (required) - 'todo' | 'in_progress' | 'completed'"
}
```

### Example Request

```bash
curl -X PATCH http://localhost:5000/api/tasks/850e8400-e29b-41d4-a716-446655440000/status \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed"
  }'
```

### Success Response (200)

```json
{
  "success": true,
  "data": {
    "id": "850e8400-e29b-41d4-a716-446655440000",
    "status": "completed",
    "updatedAt": "2024-12-15T16:30:00Z"
  }
}
```

---

## 19. Update Task

**Endpoint:** `PUT /api/tasks/:taskId`  
**Authentication:** Required (JWT)  
**Authorization:** User belongs to tenant  

### URL Parameters

| Parameter | Type | Required |
|-----------|------|----------|
| taskId | UUID | Yes |

### Request Body

```json
{
  "title": "string (optional, 2-255 chars)",
  "description": "string (optional, max 2000 chars)",
  "status": "enum (optional) - 'todo' | 'in_progress' | 'completed'",
  "priority": "enum (optional) - 'low' | 'medium' | 'high'",
  "assignedTo": "UUID (optional, null to unassign)",
  "dueDate": "date (optional, null to clear)"
}
```

### Example Request

```bash
curl -X PUT http://localhost:5000/api/tasks/850e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated task title",
    "priority": "high",
    "status": "in_progress",
    "dueDate": "2024-08-01"
  }'
```

### Success Response (200)

```json
{
  "success": true,
  "message": "Task updated successfully",
  "data": {
    "id": "850e8400-e29b-41d4-a716-446655440000",
    "title": "Updated task title",
    "description": "Create high-fidelity design",
    "status": "in_progress",
    "priority": "high",
    "assignedTo": {
      "id": "650e8400-e29b-41d4-a716-446655440000",
      "fullName": "Admin User",
      "email": "admin@demo.com"
    },
    "dueDate": "2024-08-01",
    "updatedAt": "2024-12-15T16:30:00Z"
  }
}
```

### Business Logic
- Verify task belongs to user's tenant
- If assignedTo provided, verify user belongs to same tenant
- Update only provided fields (partial update)
- Log in audit_logs

---

# Health Check Endpoint (1 Endpoint)

## 20. Health Check

**Endpoint:** `GET /api/health`  
**Authentication:** None (Public)  
**Authorization:** N/A  

### Example Request

```bash
curl -X GET http://localhost:5000/api/health
```

### Success Response (200)

```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2024-12-15T17:30:00Z"
}
```

### Error Response (503)

```json
{
  "status": "error",
  "database": "disconnected",
  "timestamp": "2024-12-15T17:30:00Z"
}
```

### Business Logic
- Verify API server is running
- Verify database connection is active
- Return system status
- Used by Docker health checks

---

# HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET, PUT, PATCH requests |
| 201 | Created | Successful POST requests (resource created) |
| 400 | Bad Request | Validation errors, invalid input |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | User lacks permission for action |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource (email, subdomain) |
| 500 | Internal Server Error | Unexpected server error |

---

# Error Handling

All errors follow standard format:

```json
{
  "success": false,
  "message": "Descriptive error message"
}
```

**Error messages:**
- Generic for security (don't expose internals)
- Actionable for users
- Clear indication of problem

---

# Rate Limiting

Recommended rate limits:
- 100 requests per 15 minutes per IP
- 1000 requests per hour per authenticated user

---

# CORS Configuration

Allowed origins:
- Local: `http://localhost:3000`
- Docker: `http://frontend:3000`
- Production: `https://yourdomain.com`

Allowed methods: GET, POST, PUT, DELETE, PATCH, OPTIONS

---

# Pagination

List endpoints support pagination:

Query parameters:
- `page` (default: 1)
- `limit` (default: varies, max: 100)

Response includes:
- `total` - total items
- `pagination.currentPage`
- `pagination.totalPages`
- `pagination.limit`

---

**Last Updated:** December 2024  
**Version:** 1.0  
**Total Endpoints:** 19 (excluding health check, or 20 including it)
