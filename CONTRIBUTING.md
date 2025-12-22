# Contributing Guide

## Project Structure

The project is organized into three main parts:

### Backend (`/backend`)
- **server.js** - Main Express server with all 19 API endpoints
- **migrations/** - Database schema SQL files
- **scripts/** - Utility scripts (database initialization)
- **package.json** - Node.js dependencies

### Frontend (`/frontend`)
- **src/pages/** - 6 main React pages
- **src/styles/** - CSS files for styling
- **src/App.jsx** - Main application component
- **src/index.js** - React entry point
- **package.json** - React dependencies

### Documentation (`/docs`)
- **API.md** - Complete API documentation
- **architecture.md** - System design documentation
- Other specification and guide files

## Code Standards

### Backend (Node.js/Express)
- Use ES6+ syntax
- Follow RESTful conventions
- Include input validation
- Handle errors gracefully
- Add middleware for cross-cutting concerns
- Use parameterized queries (no SQL injection)

### Frontend (React)
- Use functional components with hooks
- Keep components focused and reusable
- Use proper component naming (PascalCase)
- Handle loading and error states
- Implement proper error boundaries
- Use CSS modules or inline styles

## Git Workflow

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes with meaningful commits
3. Push branch: `git push origin feature/your-feature`
4. Create pull request with description
5. Code review before merging
6. Squash commits if needed
7. Merge to main

## Commit Message Convention

Format: `<type>: <description>`

Types:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `refactor:` - Code refactoring
- `test:` - Tests
- `chore:` - Maintenance

Examples:
- `feat: add project filtering by status`
- `fix: correct user role validation`
- `docs: update API documentation`

## Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
cd frontend
npm test
```

### API Testing
See `API_TESTING.md` for cURL examples

## Local Development

1. Clone repository
2. Install dependencies: `npm install` in both backend and frontend
3. Set up environment variables (.env files)
4. Run database migrations: `npm run migrate`
5. Start backend: `npm start` in /backend
6. Start frontend: `npm start` in /frontend

## Database Migrations

Adding new database schema:

1. Create SQL file in `/backend/migrations/`
2. Name format: `NNN_description.sql`
3. Run migration: `npm run migrate`
4. Test thoroughly before committing

## Adding New API Endpoints

1. Update `server.js` with new endpoint
2. Update `docs/API.md` with documentation
3. Add test cases (future)
4. Include input validation
5. Handle errors appropriately
6. Commit with descriptive message

## Adding New Frontend Pages

1. Create component in `src/pages/`
2. Add route in `App.jsx`
3. Create corresponding CSS in `src/styles/`
4. Add navigation link if needed
5. Test all user roles and scenarios
6. Update documentation

## Environment Variables

### Backend (.env)
```
DB_HOST=
DB_PORT=
DB_NAME=
DB_USER=
DB_PASSWORD=
JWT_SECRET=
PORT=
```

### Frontend (.env)
```
REACT_APP_API_URL=
```

**Never commit .env files!** Use .env.example instead.

## Documentation

- Update README.md for user-facing changes
- Update API.md for new endpoints
- Update architecture.md for design changes
- Keep docs in sync with code

## Performance Considerations

- Optimize database queries
- Use proper indexing
- Implement pagination for large datasets
- Cache when appropriate
- Monitor API response times

## Security Checklist

- [ ] Input validation implemented
- [ ] SQL injection prevented (use parameterized queries)
- [ ] XSS prevention (React escaping, sanitization)
- [ ] CSRF protection (if cookies used)
- [ ] Secrets not committed to repo
- [ ] Password hashing implemented
- [ ] Rate limiting considered
- [ ] Audit logging for sensitive operations

## Deployment

See `DEPLOYMENT.md` for production deployment guide.
