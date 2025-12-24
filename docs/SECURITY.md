# Security Guide

## Security Architecture

The application implements multi-layered security:

```
┌─────────────────────────────────────────┐
│ Transport Security (HTTPS/TLS)          │
├─────────────────────────────────────────┤
│ Authentication (JWT Tokens)              │
├─────────────────────────────────────────┤
│ Authorization (Role-Based Access Control)│
├─────────────────────────────────────────┤
│ Input Validation & Sanitization         │
├─────────────────────────────────────────┤
│ Data Access Control (Tenant Isolation)   │
├─────────────────────────────────────────┤
│ Database Security (Parameterized Queries)│
├─────────────────────────────────────────┤
│ Audit Logging                            │
└─────────────────────────────────────────┘
```

## Authentication

### JWT Tokens
- **Issue**: Upon successful login
- **Validity**: 24 hours
- **Storage**: Browser localStorage (frontend)
- **Transmission**: HTTP Authorization header

### Token Structure
```json
{
  "userId": 1,
  "tenantId": 1,
  "role": "tenant_admin",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Token Validation
- Verify signature with JWT_SECRET
- Check expiration
- Ensure userId and tenantId are valid
- Validate role permissions

## Password Security

### Hashing
- Algorithm: bcryptjs
- Salt rounds: 10
- Never store plain text passwords
- Use `bcrypt.compare()` for verification

### Password Requirements (Recommended)
- Minimum 8 characters
- Mix of uppercase, lowercase, numbers, symbols
- No dictionary words
- No reused passwords

## Authorization

### Role-Based Access Control (RBAC)

**super_admin**
- Access all tenants
- Full system management
- User management across tenants
- System configuration

**tenant_admin**
- Full access to own tenant
- User management
- Project management
- Subscription configuration

**user**
- Access assigned projects
- Create/view own tasks
- Limited to own tenant
- Cannot manage users

### Authorization Checks
```javascript
// Check role
authorize('tenant_admin', 'super_admin')

// Check tenant ownership
if (req.user.tenantId !== parseInt(tenantId)) {
  return res.status(403).json({ error: 'Forbidden' });
}

// Check resource ownership
if (resource.tenant_id !== req.user.tenantId) {
  return res.status(403).json({ error: 'Forbidden' });
}
```

## Data Isolation

### Implementation
1. Every table includes `tenant_id` column
2. Automatic filtering in all queries
3. Foreign key constraints
4. Unique constraints per tenant

### Example Query
```sql
SELECT * FROM projects 
WHERE tenant_id = $1 AND id = $2
```

### Guarantees
- No cross-tenant data access
- Users cannot query other tenants
- Resources filtered by tenant context
- Deletion respects tenant boundaries

## Input Validation

### Server-Side Validation
- Validate all inputs
- Check data types
- Validate email format
- Sanitize strings
- Check length constraints

### Client-Side Validation
- User feedback
- Reduced server requests
- Better UX

### Example
```javascript
if (!email || !validator.isEmail(email)) {
  return res.status(400).json({ error: 'Invalid email' });
}
```

## SQL Injection Prevention

### Use Parameterized Queries
```javascript
// ✓ Safe
await pool.query('SELECT * FROM users WHERE id = $1', [userId]);

// ✗ Unsafe
await pool.query(`SELECT * FROM users WHERE id = ${userId}`);
```

### Why?
- SQL injection attempts in params are treated as data
- Cannot alter query logic
- Database driver handles escaping

## CORS Configuration

### Setup
```javascript
app.use(cors());
```

### Production Setup
```javascript
app.use(cors({
  origin: ['https://yourdomain.com'],
  credentials: true
}));
```

### What it Protects
- Prevents unauthorized cross-origin requests
- Protects against CSRF
- Restricts resource access

## Audit Logging

### What's Logged
- User login/logout
- Create/update/delete operations
- Permission changes
- Sensitive data access

### Example Entry
```json
{
  "id": 1,
  "tenant_id": 1,
  "user_id": 1,
  "action": "create_project",
  "entity_type": "project",
  "entity_id": 5,
  "ip_address": "192.168.1.1",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### Retention
- Keep minimum 90 days
- Archive older logs
- Comply with regulations (GDPR, etc.)

## Environment Secrets

### Do Not Commit
- .env files
- API keys
- Database passwords
- JWT secrets

### Use Instead
- Environment variables
- Secrets management (AWS Secrets Manager, etc.)
- CI/CD secure variables

## HTTPS/TLS

### Production Requirement
- Enable HTTPS on all endpoints
- Use valid SSL certificate
- Redirect HTTP to HTTPS
- Set HSTS headers

### Certificate Management
- Use Let's Encrypt (free)
- Auto-renew certificates
- Monitor expiration

## Rate Limiting

### Implementation (Future)
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### Why?
- Prevent brute force attacks
- Protect against DDoS
- Fair resource usage

## Security Best Practices

### For Developers
- [ ] Never log sensitive data (passwords, tokens)
- [ ] Validate all inputs
- [ ] Use HTTPS in production
- [ ] Keep dependencies updated
- [ ] Run security audits
- [ ] Code review security-critical code
- [ ] Use parameterized queries
- [ ] Implement proper error handling

### For Deployment
- [ ] Strong database passwords
- [ ] Unique JWT_SECRET per environment
- [ ] Restrict network access
- [ ] Enable logging
- [ ] Monitor for suspicious activity
- [ ] Regular backups
- [ ] Incident response plan

### For Users
- [ ] Use strong passwords
- [ ] Don't share credentials
- [ ] Use unique emails
- [ ] Enable 2FA (when available)
- [ ] Keep software updated

## Vulnerability Reporting

**Found a security issue?**

1. Do not disclose publicly
2. Email security@example.com
3. Include: description, steps to reproduce, impact
4. Allow time for fix before disclosure

## Compliance

### Standards
- OWASP Top 10
- GDPR (for EU users)
- HIPAA (if handling health data)
- SOC 2 (recommended for SaaS)

### Data Protection
- Encrypt sensitive data at rest
- Use HTTPS for in-transit data
- Implement proper access controls
- Regular security audits
- Incident response plan

## Security Checklist

Before production deployment:
- [ ] JWT_SECRET is strong and unique
- [ ] Database passwords are strong
- [ ] HTTPS/TLS enabled
- [ ] Input validation implemented
- [ ] SQL injection prevented
- [ ] XSS protection enabled
- [ ] CORS properly configured
- [ ] Error messages don't leak info
- [ ] Audit logging enabled
- [ ] Rate limiting implemented
- [ ] Security headers set
- [ ] Dependencies updated
- [ ] Secrets not in code
- [ ] Backup strategy in place
- [ ] Monitoring and alerts set
