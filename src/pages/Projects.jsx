// src/pages/Projects.jsx
import './index.css';
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

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
          {statusMessage}
        </div>
      )}
      
      {error && (
        <div className="status-message error">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      ) : (
        <div className="projects-grid">
          <ProjectCard 
            title="Waste to Energy Converter"
            category="CleanTech"
            description="Technology that transforms organic waste into biogas for cooking and electricity"
            fundingProgress={30}
            currentFunding={27000}
            totalFunding={90000}
            status="seeking"
          />
          
          <ProjectCard 
            title="Healthcare AI Diagnostics"
            category="HealthTech"
            description="Machine learning platform for early disease detection in low-resource settings"
            fundingProgress={40}
            currentFunding={80000}
            totalFunding={200000}
            status="partially"
          />
          
          <ProjectCard 
            title="Smart Agriculture System"
            category="AgriTech"
            description="Sustainable farming using IoT sensors and AI for crop optimization"
            fundingProgress={20}
            currentFunding={10000}
            totalFunding={50000}
            status="seeking"
          />
          
          <ProjectCard 
            title="Clean Water Initiative"
            category="CleanTech"
            description="Affordable water purification systems for rural communities"
            fundingProgress={65}
            currentFunding={130000}
            totalFunding={200000}
            status="partially"
          />
          
          <ProjectCard 
            title="Digital Education Platform"
            category="EdTech"
            description="Interactive learning tools for underserved communities"
            fundingProgress={100}
            currentFunding={150000}
            totalFunding={150000}
            status="fully"
          />
          
          <ProjectCard 
            title="Solar Micro-Grids"
            category="CleanTech"
            description="Distributed solar energy systems for off-grid communities"
            fundingProgress={100}
            currentFunding={75000}
            totalFunding={75000}
            status="fully"
          />
        </div>
      )}
    </div>
  );
};

// ProjectCard Component
const ProjectCard = ({ title, category, description, fundingProgress, currentFunding, totalFunding, status }) => {
  let statusClass = '';
  let statusText = '';
  
  switch(status) {
    case 'seeking':
      statusClass = 'seeking-funding';
      statusText = 'Seeking Funding';
      break;
    case 'partially':
      statusClass = 'partially-funded';
      statusText = 'Partially Funded';
      break;
    case 'fully':
      statusClass = 'fully-funded';
      statusText = 'Fully Funded';
      break;
    default:
      statusClass = 'seeking-funding';
      statusText = 'Seeking Funding';
  }
  
  return (
    <div className="project-card">
      <div className="project-image">
        {/* Project image would go here */}
        <div className={`project-status ${statusClass}`}>
          {statusText}
        </div>
      </div>
      
      <div className="project-info">
        <h2>{title}</h2>
        <div className="project-category">
          <span className="category-icon">🏢</span> {category}
        </div>
        <p className="project-description">{description}</p>
        
        <div className="funding-details">
          <div className="funding-label">Funding Progress</div>
          <div className="funding-numbers">
            <span>${currentFunding.toLocaleString()}</span>
            <span>of ${totalFunding.toLocaleString()}</span>
          </div>
          <div className="progress-bar-container">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${fundingProgress}%` }}
            ></div>
          </div>
          <div className="funding-percentage">{fundingProgress}%</div>
        </div>
        
        <div className="project-actions">
          <button className="details-button">
            <span className="eye-icon">👁️</span> Details
          </button>
          <button className="invest-button">
            <span className="dollar-icon">$</span> Invest
          </button>
        </div>
      </div>
    </div>
  );
};

export default Projects;