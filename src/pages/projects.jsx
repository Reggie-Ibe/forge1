// src/pages/Projects.jsx
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Material UI Components
import {
  Container,
  Typography,
  Box,
  Button,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Paper,
  Divider,
  Grid,
  Chip,
  Card,
  CardContent
} from '@mui/material';

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
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
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
          <Box>
            {pendingApprovalProjects.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>No pending projects</Typography>
                <Typography variant="body1" color="text.secondary">
                  You don't have any projects awaiting approval.
                </Typography>
              </Paper>
            ) : (
              <Grid container spacing={3}>
                {pendingApprovalProjects.map(project => (
                  <Grid item xs={12} md={6} key={project.id}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Typography variant="h6">{project.title}</Typography>
                          <Chip 
                            icon={<HourglassEmptyIcon />} 
                            label="Pending Approval" 
                            color="warning" 
                            variant="outlined"
                          />
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {project.description.substring(0, 150)}
                          {project.description.length > 150 ? '...' : ''}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                          <Chip 
                            label={project.category} 
                            variant="outlined" 
                            size="small"
                          />
                          {project.sdgs?.map(sdg => (
                            <Chip
                              key={sdg}
                              label={`SDG ${sdg}`}
                              size="small"
                              sx={{
                                bgcolor: getSdgColor(sdg),
                                color: 'white',
                              }}
                            />
                          ))}
                        </Box>
                        
                        <Alert severity="info" sx={{ mb: 2 }}>
                          <Typography variant="body2">
                            This project is awaiting admin approval. You'll be notified once it's reviewed.
                          </Typography>
                        </Alert>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <Button
                            variant="outlined"
                            size="small"
                            component={Link}
                            to={`/projects/${project.id}`}
                          >
                            View Details
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        );
      case 3: // Rejected Projects
        return (
          <Box>
            {rejectedProjects.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>No rejected projects</Typography>
                <Typography variant="body1" color="text.secondary">
                  You don't have any rejected projects.
                </Typography>
              </Paper>
            ) : (
              <Grid container spacing={3}>
                {rejectedProjects.map(project => (
                  <Grid item xs={12} md={6} key={project.id}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Typography variant="h6">{project.title}</Typography>
                          <Chip 
                            icon={<ErrorOutlineIcon />} 
                            label="Rejected" 
                            color="error" 
                            variant="outlined"
                          />
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {project.description.substring(0, 150)}
                          {project.description.length > 150 ? '...' : ''}
                        </Typography>
                        
                        <Alert severity="error" sx={{ mb: 2 }}>
                          <Typography variant="subtitle2">Rejection Reason:</Typography>
                          <Typography variant="body2">
                            {project.rejectionReason || 'No reason provided.'}
                          </Typography>
                        </Alert>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <Button
                            variant="outlined"
                            size="small"
                            component={Link}
                            to={`/projects/${project.id}`}
                          >
                            View Details
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Projects
        </Typography>
        
        {user.role === 'innovator' && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            component={Link}
            to="/projects/create"
          >
            Create Project
          </Button>
        )}
      </Box>
      
      {statusMessage && (
        <Alert 
          severity="success" 
          sx={{ mb: 3 }}
          onClose={() => setStatusMessage('')}
        >
          {statusMessage}
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<BusinessCenterIcon />} iconPosition="start" label="All Projects" />
          <Tab 
            icon={<CheckCircleIcon color="success" />} 
            iconPosition="start" 
            label={`Active (${activeProjects.length})`} 
          />
          
          {/* Only show pending approval tab for innovators and admins */}
          {(user.role === 'innovator' || user.role === 'admin') && (
            <Tab 
              icon={<HourglassEmptyIcon color="warning" />} 
              iconPosition="start" 
              label={`Pending Approval (${pendingApprovalProjects.length})`} 
            />
          )}
          
          {/* Only show rejected tab for innovators and admins */}
          {(user.role === 'innovator' || user.role === 'admin') && (
            <Tab 
              icon={<ErrorOutlineIcon color="error" />} 
              iconPosition="start" 
              label={`Rejected (${rejectedProjects.length})`} 
            />
          )}
          
          <Tab 
            label={`Completed (${completedProjects.length})`} 
          />
        </Tabs>
      </Paper>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        renderTabContent()
      )}
    </Container>
  );
};

export default Projects;