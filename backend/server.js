const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'saas_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

// Check database connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Database error:', err);
});

// Helper function to generate JWT token
const generateToken = (userId, tenantId, role) => {
  return jwt.sign(
    { userId, tenantId, role },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );
};

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    next();
  };
};

// Standard response format
const sendSuccess = (res, data, statusCode = 200) => {
  res.status(statusCode).json({ success: true, data });
};

const sendError = (res, error, statusCode = 400) => {
  res.status(statusCode).json({ success: false, error });
};

// ============ AUTHENTICATION ENDPOINTS ============

// 1. Register Tenant
app.post('/api/auth/register-tenant', async (req, res) => {
  try {
    const { name, email, password, subdomain } = req.body;

    if (!name || !email || !password || !subdomain) {
      return sendError(res, 'Missing required fields');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create tenant
    const tenantResult = await pool.query(
      'INSERT INTO tenants (name, subdomain, status, subscription_plan, max_users, max_projects, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING id',
      [name, subdomain, 'active', 'free', 5, 3]
    );

    const tenantId = tenantResult.rows[0].id;

    // Create admin user for tenant
    const userResult = await pool.query(
      'INSERT INTO users (tenant_id, email, password_hash, full_name, role, is_active, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING id, email, role',
      [tenantId, email, hashedPassword, name, 'tenant_admin', true]
    );

    const user = userResult.rows[0];
    const token = generateToken(user.id, tenantId, user.role);

    sendSuccess(res, {
      tenantId,
      userId: user.id,
      email: user.email,
      role: user.role,
      token,
      message: 'Tenant registered successfully'
    }, 201);
  } catch (error) {
    console.error('Register error:', error);
    sendError(res, error.message, 500);
  }
});

// 2. Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 'Email and password required');
    }

    const result = await pool.query(
      'SELECT u.id, u.email, u.password_hash, u.role, u.tenant_id, u.full_name, t.name as tenant_name FROM users u JOIN tenants t ON u.tenant_id = t.id WHERE u.email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return sendError(res, 'Invalid credentials', 401);
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return sendError(res, 'Invalid credentials', 401);
    }

    const token = generateToken(user.id, user.tenant_id, user.role);

    sendSuccess(res, {
      userId: user.id,
      tenantId: user.tenant_id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      tenantName: user.tenant_name,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    sendError(res, error.message, 500);
  }
});

// 3. Get Current User
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT u.id, u.email, u.full_name, u.role, u.tenant_id, t.name as tenant_name FROM users u JOIN tenants t ON u.tenant_id = t.id WHERE u.id = $1 AND u.tenant_id = $2',
      [req.user.userId, req.user.tenantId]
    );

    if (result.rows.length === 0) {
      return sendError(res, 'User not found', 404);
    }

    sendSuccess(res, result.rows[0]);
  } catch (error) {
    console.error('Get me error:', error);
    sendError(res, error.message, 500);
  }
});

// 4. Logout
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  sendSuccess(res, { message: 'Logged out successfully' });
});

// ============ TENANT MANAGEMENT ENDPOINTS ============

// 5. Get Tenant by ID
app.get('/api/tenants/:tenantId', authenticateToken, async (req, res) => {
  try {
    const { tenantId } = req.params;

    // Super admin can access any tenant, others only their own
    if (req.user.role !== 'super_admin' && req.user.tenantId !== parseInt(tenantId)) {
      return sendError(res, 'Forbidden', 403);
    }

    const result = await pool.query(
      'SELECT id, name, subdomain, status, subscription_plan, max_users, max_projects, created_at, updated_at FROM tenants WHERE id = $1',
      [tenantId]
    );

    if (result.rows.length === 0) {
      return sendError(res, 'Tenant not found', 404);
    }

    sendSuccess(res, result.rows[0]);
  } catch (error) {
    console.error('Get tenant error:', error);
    sendError(res, error.message, 500);
  }
});

// 6. List Tenants
app.get('/api/tenants', authenticateToken, authorize('super_admin'), async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const result = await pool.query(
      'SELECT id, name, subdomain, status, subscription_plan, max_users, max_projects, created_at, updated_at FROM tenants ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    const countResult = await pool.query('SELECT COUNT(*) as total FROM tenants');

    sendSuccess(res, {
      data: result.rows,
      total: countResult.rows[0].total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('List tenants error:', error);
    sendError(res, error.message, 500);
  }
});

// 7. Update Tenant
app.put('/api/tenants/:tenantId', authenticateToken, authorize('tenant_admin', 'super_admin'), async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { name, subscription_plan } = req.body;

    // Tenant admin can only update their own tenant
    if (req.user.role === 'tenant_admin' && req.user.tenantId !== parseInt(tenantId)) {
      return sendError(res, 'Forbidden', 403);
    }

    const result = await pool.query(
      'UPDATE tenants SET name = COALESCE($1, name), subscription_plan = COALESCE($2, subscription_plan), updated_at = NOW() WHERE id = $3 RETURNING *',
      [name, subscription_plan, tenantId]
    );

    if (result.rows.length === 0) {
      return sendError(res, 'Tenant not found', 404);
    }

    sendSuccess(res, result.rows[0]);
  } catch (error) {
    console.error('Update tenant error:', error);
    sendError(res, error.message, 500);
  }
});

// ============ USER MANAGEMENT ENDPOINTS ============

// 8. Add User to Tenant
app.post('/api/tenants/:tenantId/users', authenticateToken, authorize('tenant_admin', 'super_admin'), async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { email, full_name, role = 'user', password } = req.body;

    // Tenant admin can only add users to their own tenant
    if (req.user.role === 'tenant_admin' && req.user.tenantId !== parseInt(tenantId)) {
      return sendError(res, 'Forbidden', 403);
    }

    // Check tenant exists and count users
    const tenantResult = await pool.query(
      'SELECT max_users FROM tenants WHERE id = $1',
      [tenantId]
    );

    if (tenantResult.rows.length === 0) {
      return sendError(res, 'Tenant not found', 404);
    }

    const userCountResult = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE tenant_id = $1',
      [tenantId]
    );

    if (userCountResult.rows[0].count >= tenantResult.rows[0].max_users) {
      return sendError(res, 'User limit reached for this plan', 409);
    }

    const hashedPassword = await bcrypt.hash(password || 'DefaultPass123!', 10);

    const result = await pool.query(
      'INSERT INTO users (tenant_id, email, password_hash, full_name, role, is_active, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING id, email, full_name, role, is_active',
      [tenantId, email, hashedPassword, full_name, role, true]
    );

    sendSuccess(res, result.rows[0], 201);
  } catch (error) {
    console.error('Add user error:', error);
    sendError(res, error.message, 500);
  }
});

// 9. List Users in Tenant
app.get('/api/tenants/:tenantId/users', authenticateToken, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { limit = 20, offset = 0, role } = req.query;

    // Users can only see users from their own tenant
    if (req.user.tenantId !== parseInt(tenantId) && req.user.role !== 'super_admin') {
      return sendError(res, 'Forbidden', 403);
    }

    let query = 'SELECT id, email, full_name, role, is_active, created_at FROM users WHERE tenant_id = $1';
    let params = [tenantId];

    if (role) {
      query += ' AND role = $2';
      params.push(role);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await pool.query(query, params);

    const countQuery = 'SELECT COUNT(*) as total FROM users WHERE tenant_id = $1' + (role ? ' AND role = $2' : '');
    const countParams = role ? [tenantId, role] : [tenantId];
    const countResult = await pool.query(countQuery, countParams);

    sendSuccess(res, {
      data: result.rows,
      total: countResult.rows[0].total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('List users error:', error);
    sendError(res, error.message, 500);
  }
});

// 10. Update User
app.put('/api/users/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { full_name, role, is_active } = req.body;

    // Get user's tenant
    const userResult = await pool.query('SELECT tenant_id FROM users WHERE id = $1', [userId]);

    if (userResult.rows.length === 0) {
      return sendError(res, 'User not found', 404);
    }

    const userTenantId = userResult.rows[0].tenant_id;

    // Check authorization
    if (req.user.role === 'tenant_admin' && req.user.tenantId !== userTenantId) {
      return sendError(res, 'Forbidden', 403);
    }

    // Users can only update their own role if they're admins
    if (req.user.userId !== parseInt(userId) && req.user.role !== 'tenant_admin' && req.user.role !== 'super_admin') {
      return sendError(res, 'Forbidden', 403);
    }

    const result = await pool.query(
      'UPDATE users SET full_name = COALESCE($1, full_name), role = COALESCE($2, role), is_active = COALESCE($3, is_active), updated_at = NOW() WHERE id = $4 RETURNING id, email, full_name, role, is_active',
      [full_name, role, is_active, userId]
    );

    sendSuccess(res, result.rows[0]);
  } catch (error) {
    console.error('Update user error:', error);
    sendError(res, error.message, 500);
  }
});

// 11. Delete User
app.delete('/api/users/:userId', authenticateToken, authorize('tenant_admin', 'super_admin'), async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user's tenant
    const userResult = await pool.query('SELECT tenant_id FROM users WHERE id = $1', [userId]);

    if (userResult.rows.length === 0) {
      return sendError(res, 'User not found', 404);
    }

    // Tenant admin can only delete users from their own tenant
    if (req.user.role === 'tenant_admin' && req.user.tenantId !== userResult.rows[0].tenant_id) {
      return sendError(res, 'Forbidden', 403);
    }

    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    sendSuccess(res, { message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    sendError(res, error.message, 500);
  }
});

// ============ PROJECT MANAGEMENT ENDPOINTS ============

// 12. Create Project
app.post('/api/projects', authenticateToken, authorize('tenant_admin', 'user'), async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return sendError(res, 'Project name required');
    }

    // Check project limit
    const tenantResult = await pool.query(
      'SELECT max_projects FROM tenants WHERE id = $1',
      [req.user.tenantId]
    );

    if (tenantResult.rows.length === 0) {
      return sendError(res, 'Tenant not found', 404);
    }

    const projectCountResult = await pool.query(
      'SELECT COUNT(*) as count FROM projects WHERE tenant_id = $1',
      [req.user.tenantId]
    );

    if (projectCountResult.rows[0].count >= tenantResult.rows[0].max_projects) {
      return sendError(res, 'Project limit reached for this plan', 409);
    }

    const result = await pool.query(
      'INSERT INTO projects (tenant_id, name, description, status, created_by, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id, name, description, status, created_by, created_at, updated_at',
      [req.user.tenantId, name, description || null, 'active', req.user.userId]
    );

    sendSuccess(res, result.rows[0], 201);
  } catch (error) {
    console.error('Create project error:', error);
    sendError(res, error.message, 500);
  }
});

// 13. List Projects
app.get('/api/projects', authenticateToken, async (req, res) => {
  try {
    const { limit = 20, offset = 0, status } = req.query;

    let query = 'SELECT id, name, description, status, created_by, created_at, updated_at FROM projects WHERE tenant_id = $1';
    let params = [req.user.tenantId];

    if (status) {
      query += ' AND status = $2';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await pool.query(query, params);

    const countQuery = 'SELECT COUNT(*) as total FROM projects WHERE tenant_id = $1' + (status ? ' AND status = $2' : '');
    const countParams = status ? [req.user.tenantId, status] : [req.user.tenantId];
    const countResult = await pool.query(countQuery, countParams);

    sendSuccess(res, {
      data: result.rows,
      total: countResult.rows[0].total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('List projects error:', error);
    sendError(res, error.message, 500);
  }
});

// 14. Update Project
app.put('/api/projects/:projectId', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, description, status } = req.body;

    // Verify project belongs to user's tenant
    const projectResult = await pool.query(
      'SELECT tenant_id FROM projects WHERE id = $1',
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      return sendError(res, 'Project not found', 404);
    }

    if (projectResult.rows[0].tenant_id !== req.user.tenantId) {
      return sendError(res, 'Forbidden', 403);
    }

    const result = await pool.query(
      'UPDATE projects SET name = COALESCE($1, name), description = COALESCE($2, description), status = COALESCE($3, status), updated_at = NOW() WHERE id = $4 RETURNING id, name, description, status, created_by, created_at, updated_at',
      [name, description, status, projectId]
    );

    sendSuccess(res, result.rows[0]);
  } catch (error) {
    console.error('Update project error:', error);
    sendError(res, error.message, 500);
  }
});

// 15. Delete Project
app.delete('/api/projects/:projectId', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;

    // Verify project belongs to user's tenant
    const projectResult = await pool.query(
      'SELECT tenant_id FROM projects WHERE id = $1',
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      return sendError(res, 'Project not found', 404);
    }

    if (projectResult.rows[0].tenant_id !== req.user.tenantId) {
      return sendError(res, 'Forbidden', 403);
    }

    // Delete project and associated tasks
    await pool.query('DELETE FROM tasks WHERE project_id = $1', [projectId]);
    await pool.query('DELETE FROM projects WHERE id = $1', [projectId]);

    sendSuccess(res, { message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    sendError(res, error.message, 500);
  }
});

// ============ TASK MANAGEMENT ENDPOINTS ============

// 16. Create Task
app.post('/api/projects/:projectId/tasks', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, priority = 'medium', assigned_to, due_date } = req.body;

    if (!title) {
      return sendError(res, 'Task title required');
    }

    // Verify project belongs to user's tenant
    const projectResult = await pool.query(
      'SELECT tenant_id FROM projects WHERE id = $1',
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      return sendError(res, 'Project not found', 404);
    }

    if (projectResult.rows[0].tenant_id !== req.user.tenantId) {
      return sendError(res, 'Forbidden', 403);
    }

    const result = await pool.query(
      'INSERT INTO tasks (project_id, tenant_id, title, description, status, priority, assigned_to, due_date, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()) RETURNING id, project_id, title, description, status, priority, assigned_to, due_date, created_at, updated_at',
      [projectId, req.user.tenantId, title, description || null, 'pending', priority, assigned_to || null, due_date || null]
    );

    sendSuccess(res, result.rows[0], 201);
  } catch (error) {
    console.error('Create task error:', error);
    sendError(res, error.message, 500);
  }
});

// 17. List Tasks
app.get('/api/projects/:projectId/tasks', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { limit = 20, offset = 0, status, priority } = req.query;

    // Verify project belongs to user's tenant
    const projectResult = await pool.query(
      'SELECT tenant_id FROM projects WHERE id = $1',
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      return sendError(res, 'Project not found', 404);
    }

    if (projectResult.rows[0].tenant_id !== req.user.tenantId) {
      return sendError(res, 'Forbidden', 403);
    }

    let query = 'SELECT id, project_id, title, description, status, priority, assigned_to, due_date, created_at, updated_at FROM tasks WHERE project_id = $1 AND tenant_id = $2';
    let params = [projectId, req.user.tenantId];

    if (status) {
      query += ' AND status = $' + (params.length + 1);
      params.push(status);
    }

    if (priority) {
      query += ' AND priority = $' + (params.length + 1);
      params.push(priority);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await pool.query(query, params);

    sendSuccess(res, {
      data: result.rows,
      total: result.rows.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('List tasks error:', error);
    sendError(res, error.message, 500);
  }
});

// 18. Update Task (full update)
app.put('/api/tasks/:taskId', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, description, status, priority, assigned_to, due_date } = req.body;

    // Verify task belongs to user's tenant
    const taskResult = await pool.query(
      'SELECT tenant_id FROM tasks WHERE id = $1',
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      return sendError(res, 'Task not found', 404);
    }

    if (taskResult.rows[0].tenant_id !== req.user.tenantId) {
      return sendError(res, 'Forbidden', 403);
    }

    const result = await pool.query(
      'UPDATE tasks SET title = COALESCE($1, title), description = COALESCE($2, description), status = COALESCE($3, status), priority = COALESCE($4, priority), assigned_to = COALESCE($5, assigned_to), due_date = COALESCE($6, due_date), updated_at = NOW() WHERE id = $7 RETURNING id, project_id, title, description, status, priority, assigned_to, due_date, created_at, updated_at',
      [title, description, status, priority, assigned_to, due_date, taskId]
    );

    sendSuccess(res, result.rows[0]);
  } catch (error) {
    console.error('Update task error:', error);
    sendError(res, error.message, 500);
  }
});

// 19. Update Task Status (patch)
app.patch('/api/tasks/:taskId/status', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    if (!status) {
      return sendError(res, 'Status required');
    }

    // Verify task belongs to user's tenant
    const taskResult = await pool.query(
      'SELECT tenant_id FROM tasks WHERE id = $1',
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      return sendError(res, 'Task not found', 404);
    }

    if (taskResult.rows[0].tenant_id !== req.user.tenantId) {
      return sendError(res, 'Forbidden', 403);
    }

    const result = await pool.query(
      'UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, project_id, title, status, updated_at',
      [status, taskId]
    );

    sendSuccess(res, result.rows[0]);
  } catch (error) {
    console.error('Update task status error:', error);
    sendError(res, error.message, 500);
  }
});

// ============ HEALTH CHECK ENDPOINT ============

// 20. Health Check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT NOW()');
    sendSuccess(res, { status: 'healthy', timestamp: new Date() });
  } catch (error) {
    res.status(500).json({ success: false, status: 'unhealthy', error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  sendError(res, 'Internal server error', 500);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
