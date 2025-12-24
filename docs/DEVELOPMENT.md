# Development Setup

## Prerequisites

- Node.js v18+
- npm v9+
- PostgreSQL 14+ (or Docker)
- Git

## Quick Start with Docker

```bash
docker-compose up -d
```

Access:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Database: localhost:5432

## Local Development

### Backend

```bash
cd backend
npm install
npm run migrate
npm start
```

### Frontend

```bash
cd frontend
npm install
npm start
```

## Test Credentials

- Email: `tenant1@company.com`
- Password: `Company123456!`
- Role: `tenant_admin`

See submission.json for more test accounts.
