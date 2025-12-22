import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/projects.css';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get('/api/projects', { headers });
      setProjects(response.data.data.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.post('/api/projects', formData, { headers });
      setProjects([response.data.data, ...projects]);
      setFormData({ name: '', description: '' });
      setShowForm(false);
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="projects-container">
      <nav className="navbar">
        <div className="nav-brand">SaaS Platform</div>
        <div className="nav-menu">
          <a href="/dashboard">Dashboard</a>
          <a href="/projects" className="active">Projects</a>
          <a href="/users">Users</a>
          <button onClick={() => {
            localStorage.clear();
            navigate('/login');
          }}>Logout</button>
        </div>
      </nav>

      <div className="projects-content">
        <div className="section-header">
          <h1>Projects</h1>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            {showForm ? 'Cancel' : 'New Project'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreateProject} className="project-form">
            <input
              type="text"
              placeholder="Project name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
            <textarea
              placeholder="Project description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
            <button type="submit" className="btn-primary">Create</button>
          </form>
        )}

        <div className="projects-grid">
          {projects.length > 0 ? (
            projects.map(project => (
              <div key={project.id} className="project-card">
                <h2>{project.name}</h2>
                <p>{project.description}</p>
                <div className="project-meta">
                  <span className="status">{project.status}</span>
                  <button onClick={() => navigate(`/projects/${project.id}`)} className="btn-small">
                    View Details
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="empty-state">No projects found. Create your first project!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Projects;
