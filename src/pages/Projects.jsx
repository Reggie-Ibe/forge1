// src/pages/Projects.jsx
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../index.css';

// Material UI Icons
import AddIcon from '@mui/icons-material/Add';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';

// Custom Components
import ProjectsList from '../components/projects/ProjectsList';

const Projects = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [sortBy, setSortBy] = useState('newest');
  
  // Project groupings
  const [activeProjects, setActiveProjects] = useState([]);
  const [pendingApprovalProjects, setPendingApprovalProjects] = useState([]);
  const [rejectedProjects, setRejectedProjects] = useState([]);
  const [completedProjects, setCompletedProjects] = useState([]);
  
  useEffect(() => {
    fetchProjects();
    
    // Check for success messages from other components
    if (location.state?.message) {
      setStatusMessage(location.state.message);
      
      // Clear location state to prevent message reappearing on refresh
      navigate(location.pathname, { replace: true });
      
      // Clear status message after 6 seconds
      const timer = setTimeout(() => {
        setStatusMessage('');
      }, 6000);
      
      return () => clearTimeout(timer);
    }
  }, [location]);
  
  const fetchProjects = async () => {
    setLoading(true);
    setError('');
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      let response;
      if (user.role === 'admin') {
        // Admins can see all projects
        response = await fetch(`${apiUrl}/projects`);
      } else if (user.role === 'innovator') {
        // Innovators can see their own projects, including pending_approval ones
        response = await fetch(`${apiUrl}/projects?userId=${user.id}`);
      } else {
        // Investors can only see active and completed projects
        response = await fetch(`${apiUrl}/projects?status=active&status=completed`);
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      
      const projectsData = await response.json();
      setProjects(projectsData);
      
      // Group projects by status
      setActiveProjects(projectsData.filter(project => project.status === 'active'));
      setPendingApprovalProjects(projectsData.filter(project => project.status === 'pending_approval'));
      setRejectedProjects(projectsData.filter(project => project.status === 'rejected'));
      setCompletedProjects(projectsData.filter(project => project.status === 'completed'));
      
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to load projects. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleTabChange = (tabIndex) => {
    setActiveTab(tabIndex);
  };
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // All Projects
        return (
          <ProjectsList 
            initialProjects={projects} 
            isLoading={loading}
          />
        );
      case 1: // Active Projects
        return (
          <ProjectsList 
            initialProjects={activeProjects} 
            isLoading={loading}
          />
        );
      case 2: // Pending Approval
        return (
          <div className="pending-projects">
            {pendingApprovalProjects.length === 0 ? (
              <div className="empty-state">
                <h2>No pending projects</h2>
                <p>You don't have any projects awaiting approval.</p>
              </div>
            ) : (
              <div className="projects-grid">
                {pendingApprovalProjects.map(project => (
                  <div className="project-card pending" key={project.id}>
                    <div className="project-info">
                      <div className="project-header-row">
                        <h2>{project.title}</h2>
                        <div className="status-badge pending">
                          <HourglassEmptyIcon /> Pending Approval
                        </div>
                      </div>
                      
                      <p className="project-description">
                        {project.description.substring(0, 150)}
                        {project.description.length > 150 ? '...' : ''}
                      </p>
                      
                      <div className="project-tags">
                        <span className="category-tag">{project.category}</span>
                        {project.sdgs?.map(sdg => (
                          <span 
                            key={sdg}
                            className="sdg-tag"
                            style={{ backgroundColor: getSdgColor(sdg) }}
                          >
                            SDG {sdg}
                          </span>
                        ))}
                      </div>
                      
                      <div className="info-message">
                        This project is awaiting admin approval. You'll be notified once it's reviewed.
                      </div>
                      
                      <div className="project-actions">
                        <Link to={`/projects/${project.id}`} className="details-button">
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 3: // Rejected Projects
        return (
          <div className="rejected-projects">
            {rejectedProjects.length === 0 ? (
              <div className="empty-state">
                <h2>No rejected projects</h2>
                <p>You don't have any rejected projects.</p>
              </div>
            ) : (
              <div className="projects-grid">
                {rejectedProjects.map(project => (
                  <div className="project-card rejected" key={project.id}>
                    <div className="project-info">
                      <div className="project-header-row">
                        <h2>{project.title}</h2>
                        <div className="status-badge rejected">
                          <ErrorOutlineIcon /> Rejected
                        </div>
                      </div>
                      
                      <p className="project-description">
                        {project.description.substring(0, 150)}
                        {project.description.length > 150 ? '...' : ''}
                      </p>
                      
                      <div className="error-message">
                        <strong>Rejection Reason:</strong>
                        <p>{project.rejectionReason || 'No reason provided.'}</p>
                      </div>
                      
                      <div className="project-actions">
                        <Link to={`/projects/${project.id}`} className="details-button">
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 4: // Completed Projects
        return (
          <ProjectsList 
            initialProjects={completedProjects} 
            isLoading={loading}
          />
        );
      default:
        return null;
    }
  };
  
  // Helper function for SDG colors
  const getSdgColor = (sdg) => {
    const sdgColors = {
      1: '#E5243B', // No Poverty
      2: '#DDA63A', // Zero Hunger
      3: '#4C9F38', // Good Health
      4: '#C5192D', // Quality Education
      5: '#FF3A21', // Gender Equality
      6: '#26BDE2', // Clean Water
      7: '#FCC30B', // Affordable Energy
      8: '#A21942', // Decent Work
      9: '#FD6925', // Industry & Innovation
      10: '#DD1367', // Reduced Inequalities
      11: '#FD9D24', // Sustainable Cities
      12: '#BF8B2E', // Responsible Consumption
      13: '#3F7E44', // Climate Action
      14: '#0A97D9', // Life Below Water
      15: '#56C02B', // Life on Land
      16: '#00689D', // Peace & Justice
      17: '#19486A', // Partnerships
    };
    
    return sdgColors[sdg] || '#888888';
  };
  
  return (
    <div className="project-page">
      <div className="project-header">
        <h1>Projects</h1>
        <div className="project-header-underline"></div>
        
        {user.role === 'innovator' && (
          <Link to="/projects/create" className="create-button">
            <AddIcon /> Create Project
          </Link>
        )}
      </div>
      
      <div className="project-controls">
        <div className="search-container">
          <input 
            type="text" 
            placeholder="Search projects..." 
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
        
        <button className="filter-button">
          <span className="filter-icon">≡</span> Filters
        </button>
        
        <div className="sort-container">
          <label>Sort By</label>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="newest">Newest</option>
            <option value="funding">Funding</option>
            <option value="alphabetical">Alphabetical</option>
          </select>
        </div>
      </div>
      
      {statusMessage && (
        <div className="status-message success">
          <span className="close-icon" onClick={() => setStatusMessage('')}>×</span>
          {statusMessage}
        </div>
      )}
      
      {error && (
        <div className="status-message error">
          <span className="close-icon" onClick={() => setError('')}>×</span>
          {error}
        </div>
      )}
      
      <div className="tabs-container">
        <div className={`tab ${activeTab === 0 ? 'active' : ''}`} onClick={() => handleTabChange(0)}>
          <BusinessCenterIcon /> All Projects
        </div>
        <div className={`tab ${activeTab === 1 ? 'active' : ''}`} onClick={() => handleTabChange(1)}>
          <CheckCircleIcon className="success-icon" /> Active ({activeProjects.length})
        </div>
        
        {/* Only show pending approval tab for innovators and admins */}
        {(user.role === 'innovator' || user.role === 'admin') && (
          <div className={`tab ${activeTab === 2 ? 'active' : ''}`} onClick={() => handleTabChange(2)}>
            <HourglassEmptyIcon className="warning-icon" /> Pending ({pendingApprovalProjects.length})
          </div>
        )}
        
        {/* Only show rejected tab for innovators and admins */}
        {(user.role === 'innovator' || user.role === 'admin') && (
          <div className={`tab ${activeTab === 3 ? 'active' : ''}`} onClick={() => handleTabChange(3)}>
            <ErrorOutlineIcon className="error-icon" /> Rejected ({rejectedProjects.length})
          </div>
        )}
        
        <div className={`tab ${activeTab === 4 ? 'active' : ''}`} onClick={() => handleTabChange(4)}>
          Completed ({completedProjects.length})
        </div>
      </div>
      
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      ) : (
        renderTabContent()
      )}
    </div>
  );
};

export default Projects;