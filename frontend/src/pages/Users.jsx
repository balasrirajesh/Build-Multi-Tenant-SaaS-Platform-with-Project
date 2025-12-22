import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/users.css';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: 'user',
    password: 'TempPass123!'
  });
  const [userRole, setUserRole] = useState('user');
  const tenantId = localStorage.getItem('tenantId');
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get('/api/auth/me', { headers });
      setUserRole(response.data.data.role);
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`/api/tenants/${tenantId}/users`, { headers });
      setUsers(response.data.data.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.post(
        `/api/tenants/${tenantId}/users`,
        formData,
        { headers }
      );
      setUsers([response.data.data, ...users]);
      setFormData({ email: '', full_name: '', role: 'user', password: 'TempPass123!' });
      setShowForm(false);
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`/api/users/${userId}`, { headers });
      setUsers(users.filter(u => u.id !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="users-container">
      <nav className="navbar">
        <div className="nav-brand">SaaS Platform</div>
        <div className="nav-menu">
          <a href="/dashboard">Dashboard</a>
          <a href="/projects">Projects</a>
          <a href="/users" className="active">Users</a>
          <button onClick={() => {
            localStorage.clear();
            navigate('/login');
          }}>Logout</button>
        </div>
      </nav>

      <div className="users-content">
        <div className="section-header">
          <h1>Team Members</h1>
          {(userRole === 'tenant_admin' || userRole === 'super_admin') && (
            <button onClick={() => setShowForm(!showForm)} className="btn-primary">
              {showForm ? 'Cancel' : 'Add User'}
            </button>
          )}
        </div>

        {(userRole === 'tenant_admin' || userRole === 'super_admin') && showForm && (
          <form onSubmit={handleAddUser} className="user-form">
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
            <input
              type="text"
              placeholder="Full Name"
              value={formData.full_name}
              onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              required
            />
            <select
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
            >
              <option value="user">User</option>
              <option value="tenant_admin">Admin</option>
            </select>
            <button type="submit" className="btn-primary">Add User</button>
          </form>
        )}

        <div className="users-grid">
          {users.length > 0 ? (
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  {(userRole === 'tenant_admin' || userRole === 'super_admin') && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.full_name}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>{user.is_active ? 'Active' : 'Inactive'}</td>
                    {(userRole === 'tenant_admin' || userRole === 'super_admin') && (
                      <td>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="btn-danger"
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="empty-state">No users found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Users;
