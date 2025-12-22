import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserAndProjects();
  }, []);

  const fetchUserAndProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const userRes = await axios.get('/api/auth/me', { headers });
      setUser(userRes.data.data);

      const projectsRes = await axios.get('/api/projects', { headers });
      setProjects(projectsRes.data.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <div className="nav-brand">SaaS Platform</div>
        <div className="nav-user">
          <span>{user?.fullName}</span>
          <button onClick={() => {
            localStorage.clear();
            navigate('/login');
          }}>Logout</button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="welcome-section">
          <h1>Welcome, {user?.fullName}!</h1>
          <p>Tenant: {user?.tenantName}</p>
        </div>

        <div className="dashboard-grid">
          <div className="stat-card">
            <h3>Total Projects</h3>
            <p className="stat-number">{projects.length}</p>
          </div>
          <div className="stat-card">
            <h3>Active Projects</h3>
            <p className="stat-number">{projects.filter(p => p.status === 'active').length}</p>
          </div>
          <div className="stat-card">
            <h3>Your Role</h3>
            <p className="stat-value">{user?.role}</p>
          </div>
        </div>

        <div className="projects-section">
          <div className="section-header">
            <h2>Recent Projects</h2>
            <button onClick={() => navigate('/projects')} className="btn-primary">View All</button>
          </div>
          
          {projects.length > 0 ? (
            <div className="projects-list">
              {projects.slice(0, 5).map(project => (
                <div key={project.id} className="project-item">
                  <h3>{project.name}</h3>
                  <p>{project.description}</p>
                  <span className="status">{project.status}</span>
                  <button onClick={() => navigate(`/projects/${project.id}`)} className="btn-small">
                    View
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No projects yet. <a href="/projects">Create one</a></p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
