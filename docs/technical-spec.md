# Technical Specification Document
## Multi-Tenant SaaS Platform - Project & Task Management System

---

## 1. Project Structure

### 1.1 Backend Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js          # Database connection and pooling
│   │   └── constants.js         # Application constants
│   │
│   ├── middleware/
│   │   ├── auth.js              # JWT verification middleware
│   │   ├── authorize.js         # RBAC authorization middleware
│   │   ├── errorHandler.js      # Global error handling
│   │   ├── validate.js          # Request validation middleware
│   │   └── rateLimiter.js       # Rate limiting middleware
│   │
│   ├── controllers/
│   │   ├── authController.js    # Authentication endpoints
│   │   ├── tenantController.js  # Tenant management endpoints
│   │   ├── userController.js    # User management endpoints
│   │   ├── projectController.js # Project management endpoints
│   │   ├── taskController.js    # Task management endpoints
│   │   └── healthController.js  # Health check endpoint
│   │
│   ├── models/
│   │   ├── Tenant.js            # Tenant database model
│   │   ├── User.js              # User database model
│   │   ├── Project.js           # Project database model
│   │   ├── Task.js              # Task database model
│   │   └── AuditLog.js          # Audit logging model
│   │
│   ├── routes/
│   │   ├── auth.js              # Auth routes
│   │   ├── tenants.js           # Tenant routes
│   │   ├── users.js             # User routes
│   │   ├── projects.js          # Project routes
│   │   ├── tasks.js             # Task routes
│   │   └── health.js            # Health route
│   │
│   ├── services/
│   │   ├── authService.js       # Authentication business logic
│   │   ├── tenantService.js     # Tenant business logic
│   │   ├── userService.js       # User business logic
│   │   ├── projectService.js    # Project business logic
│   │   ├── taskService.js       # Task business logic
│   │   └── auditService.js      # Audit logging logic
│   │
│   ├── utils/
│   │   ├── jwt.js               # JWT token utilities
│   │   ├── password.js          # Password hashing utilities
│   │   ├── validators.js        # Input validation functions
│   │   ├── logger.js            # Logging utility
│   │   └── errors.js            # Custom error classes
│   │
│   └── app.js                    # Express app setup
│
├── migrations/
│   ├── 001_create_tenants.js
│   ├── 002_create_users.js
│   ├── 003_create_projects.js
│   ├── 004_create_tasks.js
│   ├── 005_create_audit_logs.js
│   └── index.js                 # Migration runner
│
├── seeds/
│   └── seed.js                   # Seed data loader
│
├── scripts/
│   └── init-db.js               # Database initialization script
│
├── .env.example                  # Environment variables template
├── package.json                  # Node.js dependencies
├── Dockerfile                    # Docker image configuration
├── server.js                     # Server entry point
└── README.md                     # Backend documentation
```

### 1.2 Frontend Project Structure

```
frontend/
├── public/
│   ├── index.html               # HTML entry point
│   └── favicon.ico              # Application icon
│
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Navigation.jsx   # Top navigation bar
│   │   │   ├── Sidebar.jsx      # Sidebar menu
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── ErrorAlert.jsx
│   │   │
│   │   ├── auth/
│   │   │   ├── RegisterTenant.jsx
│   │   │   ├── LoginForm.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── Dashboard.jsx    # Main dashboard page
│   │   │   ├── Statistics.jsx
│   │   │   ├── RecentProjects.jsx
│   │   │   └── MyTasks.jsx
│   │   │
│   │   ├── projects/
│   │   │   ├── ProjectsList.jsx
│   │   │   ├── ProjectDetails.jsx
│   │   │   ├── ProjectForm.jsx
│   │   │   └── TaskCard.jsx
│   │   │
│   │   ├── tasks/
│   │   │   ├── TaskList.jsx
│   │   │   ├── TaskForm.jsx
│   │   │   ├── TaskStatusBadge.jsx
│   │   │   └── TaskPriorityBadge.jsx
│   │   │
│   │   └── users/
│   │       ├── UsersList.jsx
│   │       ├── UserForm.jsx
│   │       └── UserCard.jsx
│   │
│   ├── hooks/
│   │   ├── useAuth.js           # Authentication hook
│   │   ├── useApi.js            # API communication hook
│   │   ├── useForm.js           # Form handling hook
│   │   └── usePagination.js     # Pagination hook
│   │
│   ├── context/
│   │   ├── AuthContext.js       # Authentication state
│   │   └── AppContext.js        # Global app state
│   │
│   ├── services/
│   │   ├── api.js               # Axios instance
│   │   ├── authService.js       # Auth API calls
│   │   ├── tenantService.js     # Tenant API calls
│   │   ├── userService.js       # User API calls
│   │   ├── projectService.js    # Project API calls
│   │   └── taskService.js       # Task API calls
│   │
│   ├── pages/
│   │   ├── RegisterPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── ProjectsPage.jsx
│   │   ├── ProjectDetailsPage.jsx
│   │   ├── UsersPage.jsx
│   │   └── NotFoundPage.jsx
│   │
│   ├── styles/
│   │   ├── index.css            # Global styles
│   │   └── variables.css        # CSS variables
│   │
│   ├── utils/
│   │   ├── localStorage.js      # Local storage utilities
│   │   ├── dateFormatter.js     # Date formatting
│   │   └── validators.js        # Form validation
│   │
│   ├── App.jsx                  # Main App component
│   └── index.js                 # React entry point
│
├── .env.example                 # Environment variables
├── package.json                 # Node.js dependencies
├── Dockerfile                   # Docker image configuration
├── tailwind.config.js           # Tailwind CSS config
├── postcss.config.js            # PostCSS config
└── README.md                    # Frontend documentation
```

---

## 2. Development Setup Guide

### 2.1 Prerequisites

**Required Software:**
- Node.js v18.0.0 or higher
- npm v9.0.0 or higher
- PostgreSQL v14.0 or higher
- Git v2.30.0 or higher
- Docker v20.10.0 and Docker Compose v1.29.0 (for containerized setup)

**System Requirements:**
- Minimum 4GB RAM
- At least 2GB free disk space
- Internet connection for npm package downloads

### 2.2 Environment Variables

#### Backend (.env file)

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=saas_db
DB_USER=postgres
DB_PASSWORD=postgres

# JWT Configuration
JWT_SECRET=your-super-secret-key-minimum-32-characters-long
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Optional: Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

#### Frontend (.env file)

```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 2.3 Local Development Installation

#### Step 1: Clone Repository

```bash
git clone <repository-url>
cd project-root
```

#### Step 2: Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file from template
cp .env.example .env

# Create database
createdb saas_db

# Run migrations
npm run migrate:latest

# Load seed data
npm run seed

# Start backend server
npm run dev
```

Backend will be available at `http://localhost:5000`

#### Step 3: Frontend Setup

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Create .env file from template
cp .env.example .env

# Start frontend development server
npm start
```

Frontend will be available at `http://localhost:3000`

---

## 3. Docker Setup Guide

### 3.1 Running with Docker Compose

**Quick Start (Recommended):**

```bash
# From project root directory
docker-compose up -d

# Wait 30 seconds for services to initialize

# Verify all services are running
docker-compose ps

# Check health
curl http://localhost:5000/api/health

# Access application
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000/api
# Database: localhost:5432
```

**Manual Service Management:**

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs database

# Stop all services
docker-compose stop

# Stop and remove containers
docker-compose down

# Remove volumes (delete data)
docker-compose down -v

# Rebuild containers
docker-compose build --no-cache

# Run commands in container
docker-compose exec backend npm run migrate
docker-compose exec backend npm run seed
```

### 3.2 Docker Files

#### docker-compose.yml

Located in project root, defines three services:
- **database**: PostgreSQL 15
- **backend**: Node.js API server
- **frontend**: React application

**Key Features:**
- Fixed port mappings (5432, 5000, 3000)
- Service health checks
- Automatic dependency management
- Volume persistence for database
- Environment variable configuration

#### Backend Dockerfile

Located in `backend/Dockerfile`

**Key Features:**
- Multi-stage build (dependencies, development, production)
- Non-root user for security
- Automatic migrations on startup
- Health check support
- Environment variable configuration

#### Frontend Dockerfile

Located in `frontend/Dockerfile`

**Key Features:**
- Build stage creates production build
- Serves static files with nginx
- CORS-configured to communicate with backend
- Lightweight final image
- Health check support

---

## 4. Database Setup

### 4.1 Migration Scripts

Migration files are located in `backend/migrations/`:

```bash
# Run all pending migrations
npm run migrate:latest

# Rollback last migration
npm run migrate:rollback

# Create specific migration
npm run migrate:create migration_name
```

### 4.2 Seed Data

Seed data is loaded automatically on Docker startup or manually:

```bash
npm run seed
```

**Seed Data Includes:**
- 1 Super Admin user
- 1 Demo Tenant
- 1 Tenant Admin user
- 2 Regular users
- 2 Sample projects
- 5 Sample tasks

### 4.3 Database Connection

**Local Development:**
```
Host: localhost
Port: 5432
Database: saas_db
User: postgres
Password: postgres
```

**Docker Network:**
```
Host: database
Port: 5432
Database: saas_db
User: postgres
Password: postgres
```

---

## 5. Running Tests

### 5.1 Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- auth.test.js

# Watch mode (re-run on file changes)
npm test -- --watch
```

### 5.2 Frontend Tests

```bash
cd frontend

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm test -- --watch
```

---

## 6. API Testing

### 6.1 Using Postman

1. Import Postman collection: `docs/postman-collection.json`
2. Set environment variables:
   - `base_url`: http://localhost:5000/api
   - `token`: (automatically filled after login)
3. Run requests in order:
   - First: Register tenant
   - Then: Login
   - Then: Test other endpoints

### 6.2 Using cURL

```bash
# Register tenant
curl -X POST http://localhost:5000/api/auth/register-tenant \
  -H "Content-Type: application/json" \
  -d '{
    "tenantName": "Test Company",
    "subdomain": "testco",
    "adminEmail": "admin@testco.com",
    "adminPassword": "SecurePass@123",
    "adminFullName": "Admin User"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@testco.com",
    "password": "SecurePass@123",
    "tenantSubdomain": "testco"
  }'

# Get current user (replace TOKEN with actual JWT)
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer TOKEN"
```

---

## 7. Troubleshooting

### 7.1 Common Issues

**Docker Services Not Starting:**
```bash
# Check logs
docker-compose logs

# Verify ports not in use
netstat -tulpn | grep 5000

# Rebuild containers
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

**Database Connection Failed:**
```bash
# Verify database is running
docker-compose ps database

# Check database logs
docker-compose logs database

# Test connection
psql -h localhost -U postgres -d saas_db
```

**Frontend Cannot Connect to Backend:**
```bash
# Verify backend is running
curl http://localhost:5000/api/health

# Check CORS configuration
# Frontend env variable REACT_APP_API_URL should be:
# http://localhost:5000/api (local)
# http://backend:5000/api (Docker)
```

**JWT Token Invalid:**
```bash
# Token may have expired (24h expiration)
# Login again to get new token

# Verify JWT_SECRET matches between:
# - .env file
# - docker-compose.yml
# - Client requests
```

---

## 8. Deployment Considerations

### 8.1 Environment Configuration for Production

```env
# Use strong, random values
DB_PASSWORD=generate-strong-password-here
JWT_SECRET=generate-32-char-random-string

# Use production values
NODE_ENV=production
PORT=5000

# Use production domain
FRONTEND_URL=https://yourdomain.com

# Use secure database host
DB_HOST=prod-database.rds.amazonaws.com
```

### 8.2 Security Best Practices

- Never commit `.env` files with secrets
- Use environment variable management services
- Enable HTTPS in production
- Use strong JWT secrets (minimum 32 characters)
- Implement rate limiting in production
- Enable CORS only for known domains
- Keep dependencies updated
- Enable database backups
- Use connection pooling
- Monitor application logs

---

## 9. Performance Optimization

### 9.1 Database Optimization

- Indexes on `tenant_id` columns for fast filtering
- Connection pooling (min 5, max 20 connections)
- Query optimization for complex joins
- Caching layer for frequently accessed data (optional)

### 9.2 API Optimization

- Pagination for list endpoints
- Response compression with gzip
- Efficient JWT verification
- Rate limiting to prevent abuse
- Error handling without stack traces in production

### 9.3 Frontend Optimization

- Code splitting with React.lazy
- Lazy loading of images
- Caching of API responses
- Minification and bundling in production
- CSS-in-JS optimization

---

## 10. Monitoring & Logging

### 10.1 Application Logs

```bash
# View application logs
docker-compose logs backend

# Follow logs in real-time
docker-compose logs -f backend

# View last 100 lines
docker-compose logs --tail=100 backend
```

### 10.2 Database Audit Logs

Query audit logs in database:

```sql
SELECT * FROM audit_logs 
WHERE tenant_id = 'tenant-id'
ORDER BY created_at DESC
LIMIT 100;
```

---

## Document Details

- **Last Updated:** December 2024
- **Version:** 1.0
- **Status:** Complete
- **Next Steps:** Implement backend, test with Postman, deploy to Docker
