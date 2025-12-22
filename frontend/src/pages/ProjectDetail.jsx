import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/project-detail.css';

const ProjectDetail = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjectAndTasks();
  }, [projectId]);

  const fetchProjectAndTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch project from list (no single project endpoint in spec)
      const projectsRes = await axios.get('/api/projects', { headers });
      const proj = projectsRes.data.data.data.find(p => p.id === parseInt(projectId));
      setProject(proj);

      // Fetch tasks
      const tasksRes = await axios.get(`/api/projects/${projectId}/tasks`, { headers });
      setTasks(tasksRes.data.data);
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.post(`/api/projects/${projectId}/tasks`, taskForm, { headers });
      setTasks([response.data.data, ...tasks]);
      setTaskForm({ title: '', description: '', priority: 'medium' });
      setShowTaskForm(false);
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const updateTaskStatus = async (taskId, status) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.patch(`/api/tasks/${taskId}/status`, { status }, { headers });
      setTasks(tasks.map(t => t.id === taskId ? {...t, status} : t));
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!project) return <div className="error">Project not found</div>;

  return (
    <div className="project-detail-container">
      <nav className="navbar">
        <div className="nav-brand">SaaS Platform</div>
        <button onClick={() => navigate('/projects')} className="btn-back">← Back</button>
      </nav>

      <div className="project-detail-content">
        <div className="project-header">
          <h1>{project.name}</h1>
          <p>{project.description}</p>
          <span className="status">{project.status}</span>
        </div>

        <div className="section-header">
          <h2>Tasks</h2>
          <button onClick={() => setShowTaskForm(!showTaskForm)} className="btn-primary">
            {showTaskForm ? 'Cancel' : 'New Task'}
          </button>
        </div>

        {showTaskForm && (
          <form onSubmit={handleCreateTask} className="task-form">
            <input
              type="text"
              placeholder="Task title"
              value={taskForm.title}
              onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
              required
            />
            <textarea
              placeholder="Task description"
              value={taskForm.description}
              onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
            />
            <select
              value={taskForm.priority}
              onChange={(e) => setTaskForm({...taskForm, priority: e.target.value})}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <button type="submit" className="btn-primary">Create Task</button>
          </form>
        )}

        <div className="tasks-container">
          {tasks.length > 0 ? (
            <div className="tasks-list">
              {tasks.map(task => (
                <div key={task.id} className="task-card">
                  <div className="task-header">
                    <h3>{task.title}</h3>
                    <span className={`priority ${task.priority}`}>{task.priority}</span>
                  </div>
                  <p>{task.description}</p>
                  <select
                    value={task.status}
                    onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                    className="task-status"
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No tasks yet. Create your first task!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
