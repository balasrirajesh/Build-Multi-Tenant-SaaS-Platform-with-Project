# Multi-Tenant SaaS Platform - Project & Task Management System

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [API Reference](#api-reference)
- [Security](#security)

---

## 🎯 Overview

A production-ready, multi-tenant SaaS application for project and task management. Multiple organizations can register, manage teams, create projects, and track tasks with complete data isolation, RBAC, and subscription management.

**Key Features:**
- ✅ Complete multi-tenancy with data isolation
- ✅ Role-based access control (super_admin, tenant_admin, user)
- ✅ Subscription plan management (free, pro, enterprise)
- ✅ 19 fully functional API endpoints
- ✅ Responsive frontend application
- ✅ Docker containerization
- ✅ Production-ready security

---

## ✨ Features

### Core Functionality
- **Tenant Management**: Register organizations with unique subdomains
- **Team Management**: Add users with role-based permissions
- **Project Management**: Create, organize, and track projects
- **Task Management**: Create, assign, and track tasks with priorities
- **Subscription Plans**: Three tiers with feature limits
- **Audit Logging**: Comprehensive security audit trail

---

## 🛠 Technology Stack

### Backend
- Node.js v18+ / Express.js
- PostgreSQL 15
- JWT Authentication
- bcrypt Password Hashing
- Knex.js Migrations

### Frontend
- React 18+
- React Router
- Axios HTTP Client
- React Context State Management
- Tailwind CSS

### Infrastructure
- Docker & Docker Compose
- Service Networking
- Volume Persistence

---

## 🚀 Quick Start

### Docker (Recommended)
```bash
git clone <repo-url>
cd saas-platform
docker-compose up -d
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
# Database: localhost:5432
```

### Local Development
```bash
# Backend
cd backend
npm install
npm run migrate:latest
npm run seed
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm start
```

**Test Credentials:**
- Admin: superadmin@system.com / Admin@123
- Tenant: demo / admin@demo.com / Demo@123

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [research.md](research.md) | Multi-tenancy analysis, tech justification, security |
| [PRD.md](PRD.md) | User personas, functional & non-functional requirements |
| [architecture.md](architecture.md) | System design, database schema, API architecture |
| [technical-spec.md](technical-spec.md) | Project structure, setup, deployment |
| [API.md](API.md) | Complete 19 endpoint documentation |

---

## 🔌 API Endpoints (19 Total)

### Authentication (4)
- `POST /auth/register-tenant` - Register organization
- `POST /auth/login` - Login
- `GET /auth/me` - Current user
- `POST /auth/logout` - Logout

### Tenants (3)
- `GET /tenants` - List all (super_admin)
- `GET /tenants/:id` - Get details
- `PUT /tenants/:id` - Update

### Users (4)
- `POST /tenants/:tenantId/users` - Add user
- `GET /tenants/:tenantId/users` - List users
- `PUT /users/:userId` - Update
- `DELETE /users/:userId` - Delete

### Projects (4)
- `POST /projects` - Create
- `GET /projects` - List
- `PUT /projects/:id` - Update
- `DELETE /projects/:id` - Delete

### Tasks (4)
- `POST /projects/:projectId/tasks` - Create
- `GET /projects/:projectId/tasks` - List
- `PUT /tasks/:taskId` - Update
- `PATCH /tasks/:taskId/status` - Update status

### Health (1)
- `GET /health` - System status

---

## 🔐 Security

- JWT-based authentication (24h expiry)
- Bcrypt password hashing
- Role-based access control (RBAC)
- SQL injection prevention
- Input validation & sanitization
- Audit logging of all actions
- CORS configuration
- Tenant data isolation

---

## 📁 Project Structure

```
saas-platform/
├── backend/                 # Node.js API
├── frontend/               # React App
├── docs/                   # Documentation
├── docker-compose.yml      # Container config
├── submission.json         # Test credentials
└── README.md              # This file
```

---

## 📝 Environment Setup

### Backend .env
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=saas_db
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your-32-char-secret-key-here
JWT_EXPIRES_IN=24h
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Frontend .env
```env
REACT_APP_API_URL=http://localhost:5000/api
```

---

## 🧪 Testing

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test

# API Health Check
curl http://localhost:5000/api/health
```

---

## 🚢 Deployment

```bash
docker-compose up -d
```

All services start automatically:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000/api
- Database: localhost:5432

---

## 🐛 Troubleshooting

```bash
# Restart services
docker-compose restart

# View logs
docker-compose logs -f backend

# Reset database
docker-compose down -v && docker-compose up -d
```

---

## 📊 Database Schema

5 Tables:
1. **tenants** - Organizations
2. **users** - User accounts
3. **projects** - Projects
4. **tasks** - Tasks
5. **audit_logs** - Audit trail

---

## 📞 Support

1. Check [technical-spec.md](technical-spec.md) troubleshooting
2. Review [API.md](API.md) for endpoint details
3. Check logs: `docker-compose logs backend`

---

**Version:** 1.0  
**Status:** Production Ready  
**Last Updated:** December 2024
