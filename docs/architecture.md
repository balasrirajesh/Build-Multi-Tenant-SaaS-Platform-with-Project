# System Architecture Document
## Multi-Tenant SaaS Platform - Project & Task Management System

---

## 1. System Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│                      (Web Browser)                               │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  React Single Page Application                          │    │
│  │  - Authentication Pages (Register, Login)              │    │
│  │  - Dashboard with Statistics                           │    │
│  │  - Project & Task Management                           │    │
│  │  - User Management                                     │    │
│  │  - Role-Based UI Components                            │    │
│  └────────────────────────────────────────────────────────┘    │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       │ HTTPS Requests
                       │ (JWT Token in Header)
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│                    PRESENTATION LAYER                            │
│                   (Frontend Routing)                             │
│  - Route Authorization Guards                                   │
│  - Token Storage (localStorage)                                 │
│  - API Client Configuration                                     │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       │ HTTP/REST API Calls
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│                    APPLICATION LAYER                             │
│                  (Node.js + Express)                             │
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  Authentication Middleware                           │      │
│  │  - JWT Verification                                 │      │
│  │  - Token Extraction                                 │      │
│  │  - User Context Injection                           │      │
│  └──────────────────────────────────────────────────────┘      │
│                           ↓                                      │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  Authorization Middleware (RBAC)                     │      │
│  │  - Role Checking                                    │      │
│  │  - Tenant Access Verification                       │      │
│  │  - Permission Enforcement                           │      │
│  └──────────────────────────────────────────────────────┘      │
│                           ↓                                      │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  Input Validation Middleware                         │      │
│  │  - Request Body Validation                          │      │
│  │  - Data Sanitization                                │      │
│  │  - Type Checking                                    │      │
│  └──────────────────────────────────────────────────────┘      │
│                           ↓                                      │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  Route Handlers (Controllers)                        │      │
│  │  - Auth Routes (4 endpoints)                        │      │
│  │  - Tenant Routes (3 endpoints)                      │      │
│  │  - User Routes (4 endpoints)                        │      │
│  │  - Project Routes (4 endpoints)                     │      │
│  │  - Task Routes (4 endpoints)                        │      │
│  │  - Health Check (1 endpoint)                        │      │
│  └──────────────────────────────────────────────────────┘      │
│                           ↓                                      │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  Business Logic & Services                           │      │
│  │  - Authentication Service                           │      │
│  │  - Tenant Service                                   │      │
│  │  - User Service                                     │      │
│  │  - Project Service                                  │      │
│  │  - Task Service                                     │      │
│  └──────────────────────────────────────────────────────┘      │
│                           ↓                                      │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  Audit Logging Service                               │      │
│  │  - Log All Important Actions                        │      │
│  │  - Track Data Access                                │      │
│  │  - Security Event Logging                           │      │
│  └──────────────────────────────────────────────────────┘      │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       │ SQL Queries with tenant_id filters
                       │ Parameterized statements
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│                    DATA ACCESS LAYER                             │
│                   (Knex.js + Raw SQL)                            │
│  - Query Construction                                           │
│  - Parameter Binding                                            │
│  - Connection Management                                        │
│  - Transaction Handling                                         │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│                    DATABASE LAYER                                │
│                  (PostgreSQL)                                    │
│                                                                  │
│  Tables:                                                        │
│  - tenants (organization records)                              │
│  - users (user accounts with tenant_id)                        │
│  - projects (projects with tenant_id)                          │
│  - tasks (tasks with tenant_id)                                │
│  - audit_logs (security audit trail)                           │
│                                                                  │
│  Features:                                                      │
│  - Foreign Key Constraints                                     │
│  - Indexes on tenant_id columns                                │
│  - Unique constraints for isolation                            │
│  - Cascade delete for relationships                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Database Schema Design

### 2.1 Entity Relationship Diagram (ERD)

```
┌─────────────────────┐
│      TENANTS        │
├─────────────────────┤
│ PK: id              │
│     name            │
│     subdomain (UQ)  │
│     status          │
│     subscription_   │
│      plan           │
│     max_users       │
│     max_projects    │
│     created_at      │
│     updated_at      │
└──────────┬──────────┘
           │ 1:N
           │
      ┌────┴────────────┬────────────────┐
      │                 │                │
      ▼                 ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌─────────────┐
│    USERS     │  │  PROJECTS    │  │ AUDIT_LOGS  │
├──────────────┤  ├──────────────┤  ├─────────────┤
│ PK: id       │  │ PK: id       │  │ PK: id      │
│ FK: tenant   │  │ FK: tenant   │  │ FK: tenant  │
│     email    │  │ FK: created_ │  │ FK: user    │
│     password │  │     by       │  │     action  │
│     full_name│  │     name     │  │     entity  │
│     role (E) │  │     descrip  │  │     created │
│     is_active│  │     status   │  │     _at     │
│ UQ(tenant,   │  │     created_ │  └─────────────┘
│    email)    │  │     at       │
│     created  │  │     updated_ │
│     _at      │  │     at       │
│     updated  │  └──────┬───────┘
│     _at      │         │ 1:N
└──────┬───────┘         │
       │                 ▼
       │            ┌──────────────┐
       │            │    TASKS     │
       │            ├──────────────┤
       │            │ PK: id       │
       │            │ FK: project  │
       │            │ FK: tenant   │
       │            │ FK: assigned │
       │            │ title        │
       │            │ description  │
       │            │ status (E)   │
       │            │ priority (E) │
       │            │ due_date     │
       │            │ created_at   │
       │            │ updated_at   │
       │            └──────────────┘
       │
       └─► Tasks.assigned_to → Users.id (optional)
```

### 2.2 Table Specifications

#### Table 1: tenants
```sql
CREATE TABLE tenants (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(63) NOT NULL UNIQUE,
  status ENUM('active', 'suspended', 'trial') DEFAULT 'active',
  subscription_plan ENUM('free', 'pro', 'enterprise') DEFAULT 'free',
  max_users INTEGER DEFAULT 5,
  max_projects INTEGER DEFAULT 3,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_subdomain (subdomain),
  INDEX idx_status (status)
);
```

#### Table 2: users
```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36),
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role ENUM('super_admin', 'tenant_admin', 'user') DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  UNIQUE KEY uk_tenant_email (tenant_id, email),
  INDEX idx_tenant_id (tenant_id),
  INDEX idx_role (role)
);
```

#### Table 3: projects
```sql
CREATE TABLE projects (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('active', 'archived', 'completed') DEFAULT 'active',
  created_by VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_tenant_id (tenant_id),
  INDEX idx_status (status)
);
```

#### Table 4: tasks
```sql
CREATE TABLE tasks (
  id VARCHAR(36) PRIMARY KEY,
  project_id VARCHAR(36) NOT NULL,
  tenant_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('todo', 'in_progress', 'completed') DEFAULT 'todo',
  priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
  assigned_to VARCHAR(36),
  due_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_tenant_project (tenant_id, project_id),
  INDEX idx_status (status),
  INDEX idx_assigned_to (assigned_to)
);
```

#### Table 5: audit_logs
```sql
CREATE TABLE audit_logs (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36),
  user_id VARCHAR(36),
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100),
  entity_id VARCHAR(36),
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_tenant_id (tenant_id),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
);
```

---

## 3. API Architecture

### 3.1 API Endpoints Overview

#### Authentication Module (4 endpoints)
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/auth/register-tenant` | None | - | Register new tenant with admin user |
| POST | `/api/auth/login` | None | - | Authenticate user and return JWT token |
| GET | `/api/auth/me` | JWT | Any | Get current authenticated user info |
| POST | `/api/auth/logout` | JWT | Any | Logout and invalidate session |

#### Tenant Management Module (3 endpoints)
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/tenants/:tenantId` | JWT | Admin/Super | Get tenant details with stats |
| PUT | `/api/tenants/:tenantId` | JWT | Admin/Super | Update tenant information |
| GET | `/api/tenants` | JWT | Super | List all tenants with pagination |

#### User Management Module (4 endpoints)
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/tenants/:tenantId/users` | JWT | Admin | Add user to tenant |
| GET | `/api/tenants/:tenantId/users` | JWT | Any | List tenant users with search/filter |
| PUT | `/api/users/:userId` | JWT | Admin/Self | Update user profile |
| DELETE | `/api/users/:userId` | JWT | Admin | Delete user from tenant |

#### Project Management Module (4 endpoints)
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/projects` | JWT | Any | Create new project |
| GET | `/api/projects` | JWT | Any | List projects with pagination |
| PUT | `/api/projects/:projectId` | JWT | Creator/Admin | Update project |
| DELETE | `/api/projects/:projectId` | JWT | Creator/Admin | Delete project |

#### Task Management Module (4 endpoints)
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/projects/:projectId/tasks` | JWT | Any | Create task in project |
| GET | `/api/projects/:projectId/tasks` | JWT | Any | List project tasks with filters |
| PATCH | `/api/tasks/:taskId/status` | JWT | Any | Update task status quickly |
| PUT | `/api/tasks/:taskId` | JWT | Any | Full task update |

#### Health Check (1 endpoint)
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/health` | None | - | System health and DB status |

### 3.2 Standard Response Format

**Success Response (200, 201):**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Error Response (4xx, 5xx):**
```json
{
  "success": false,
  "message": "Error description"
}
```

### 3.3 Authentication Flow

```
User Registration
    ↓
User enters: email, password, tenant name, subdomain
    ↓
Backend: Create tenant record (transaction)
    ↓
Backend: Create admin user with tenant_id
    ↓
Backend: Hash password with bcrypt
    ↓
Return: Tenant ID and success message
    ↓
Frontend: Redirect to login page

User Login
    ↓
User enters: email, password, subdomain
    ↓
Backend: Find tenant by subdomain
    ↓
Backend: Find user by email in that tenant
    ↓
Backend: Verify password hash matches
    ↓
Backend: Generate JWT token {userId, tenantId, role}
    ↓
Return: JWT token (24h expiry) and user info
    ↓
Frontend: Store token in localStorage
    ↓
Frontend: Add Authorization header to all API calls

Protected Route Access
    ↓
Frontend: Check if valid token in localStorage
    ↓
Frontend: If no token, redirect to login
    ↓
Backend: Each API request includes JWT in header
    ↓
Backend: Verify JWT signature and expiry
    ↓
Backend: Extract userId, tenantId, role
    ↓
Backend: Check user authorization for action
    ↓
Backend: Filter data by tenant_id automatically
    ↓
Return: Tenant-isolated data
```

---

## 4. Data Flow Diagrams

### 4.1 Multi-Tenancy Data Isolation

```
Database (Single PostgreSQL Instance)

Project Table:
┌─────────┬───────────────┐
│ Project │ tenant_id     │
├─────────┼───────────────┤
│ Proj-1  │ tenant-abc    │  ← Tenant A's project
│ Proj-2  │ tenant-abc    │  ← Tenant A's project
│ Proj-3  │ tenant-xyz    │  ← Tenant B's project
│ Proj-4  │ tenant-xyz    │  ← Tenant B's project
└─────────┴───────────────┘

User A (from tenant-abc) logged in, JWT contains tenantId: tenant-abc
    ↓
Query: SELECT * FROM projects WHERE tenant_id = 'tenant-abc'
    ↓
Returns: Only Proj-1 and Proj-2
    ↓
Result: User A sees only their tenant's projects

User B (from tenant-xyz) logged in, JWT contains tenantId: tenant-xyz
    ↓
Query: SELECT * FROM projects WHERE tenant_id = 'tenant-xyz'
    ↓
Returns: Only Proj-3 and Proj-4
    ↓
Result: User B sees only their tenant's projects

Even if User A modifies URL to access Proj-3:
    ↓
Request: GET /api/projects/Proj-3
    ↓
Backend: Extract tenantId from JWT (tenant-abc)
    ↓
Backend: Query project Proj-3
    ↓
Backend: Check if project.tenant_id === JWT.tenantId
    ↓
Backend: 403 Forbidden (Proj-3 belongs to tenant-xyz)
```

---

## 5. Deployment Architecture (Docker)

```
┌──────────────────────────────────────────────────┐
│           Docker Compose Network                  │
├──────────────────────────────────────────────────┤
│                                                  │
│  ┌─────────────────────────────────────┐        │
│  │  Frontend Container                  │        │
│  │  - React App (npm build)             │        │
│  │  - Served via nginx or serve         │        │
│  │  - Port 3000:3000                    │        │
│  │  - Env: REACT_APP_API_URL            │        │
│  │         =http://backend:5000/api     │        │
│  └─────────────────────────────────────┘        │
│                     │                             │
│                     │ http://backend:5000         │
│                     ▼                             │
│  ┌─────────────────────────────────────┐        │
│  │  Backend Container                   │        │
│  │  - Node.js + Express                │        │
│  │  - Port 5000:5000                    │        │
│  │  - Health check: GET /api/health    │        │
│  │  - Env: DB_HOST=database             │        │
│  │         DB_PORT=5432                 │        │
│  │         JWT_SECRET=...               │        │
│  │         FRONTEND_URL=                │        │
│  │         http://frontend:3000         │        │
│  │                                       │        │
│  │  On startup:                          │        │
│  │  - Wait for database                 │        │
│  │  - Run migrations                    │        │
│  │  - Load seed data                    │        │
│  │  - Start server                      │        │
│  └─────────────────────────────────────┘        │
│                     │                             │
│        postgres://database:5432                  │
│                     ▼                             │
│  ┌─────────────────────────────────────┐        │
│  │  Database Container                  │        │
│  │  - PostgreSQL 15                     │        │
│  │  - Port 5432:5432                    │        │
│  │  - Volume: db_data (persistent)      │        │
│  │  - Env: POSTGRES_DB=saas_db          │        │
│  │         POSTGRES_USER=postgres       │        │
│  │         POSTGRES_PASSWORD=postgres   │        │
│  │                                       │        │
│  │  On startup:                          │        │
│  │  - Initialize PostgreSQL             │        │
│  │  - Run init scripts                  │        │
│  └─────────────────────────────────────┘        │
│                                                  │
└──────────────────────────────────────────────────┘

localhost:3000 ←→ localhost:5000 ←→ localhost:5432
(external)         (external)         (external)
```

---

## 6. Security Architecture

### 6.1 Security Layers

```
Layer 1: Transport Security
├─ HTTPS/TLS encryption
├─ Certificate validation
└─ Secure headers

Layer 2: Authentication
├─ JWT token verification
├─ Token expiration (24 hours)
├─ Secret key validation
└─ Session management

Layer 3: Authorization
├─ Role checking (super_admin, tenant_admin, user)
├─ Tenant access verification
├─ Resource ownership verification
└─ Permission enforcement

Layer 4: Data Access
├─ Automatic tenant_id filtering
├─ SQL injection prevention (parameterized queries)
├─ Input validation and sanitization
└─ Rate limiting

Layer 5: Database
├─ Foreign key constraints
├─ Unique constraints
├─ Check constraints
└─ Index optimization

Layer 6: Audit
├─ All actions logged
├─ User tracking
├─ Entity tracking
└─ IP address logging
```

---

## 7. Performance Considerations

### 7.1 Database Optimization

**Indexes:**
- `tenants(subdomain)` - Fast subdomain lookup during login
- `users(tenant_id, email)` - Fast user lookup by email in tenant
- `projects(tenant_id, status)` - Fast project filtering
- `tasks(tenant_id, project_id, status)` - Fast task filtering
- `audit_logs(tenant_id, created_at)` - Fast audit log queries

**Query Patterns:**
- All project queries include `WHERE tenant_id = ?`
- All task queries include `WHERE tenant_id = ?`
- All user queries include `WHERE tenant_id = ?`
- Connection pooling for efficient database access

### 7.2 Caching Strategy

- JWT tokens cached in-memory (no database lookup per request)
- Database connection pooling (min 5, max 20 connections)
- Query result caching for tenant statistics (optional)

---

## Document Details

- **Last Updated:** December 2024
- **Version:** 1.0
- **Status:** Complete
- **Note:** Diagrams represent logical architecture. System diagram and ERD images should be created as separate PNG files in docs/images/
