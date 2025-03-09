// src/pages/ProjectDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Material UI components
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Chip,
  Divider,
  Tabs,
  Tab,
  LinearProgress,
  Card,
  CardContent,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  IconButton
} from '@mui/material';

// Material UI icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BusinessIcon from '@mui/icons-material/Business';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TimelineIcon from '@mui/icons-material/Timeline';
import PersonIcon from '@mui/icons-material/Person';
import InfoIcon from '@mui/icons-material/Info';
import CategoryIcon from '@mui/icons-material/Category';
import LanguageIcon from '@mui/icons-material/Language';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ChatIcon from '@mui/icons-material/Chat';

// Import our new components
import MilestoneList from '../components/projects/MilestoneList';
import MilestoneTimeline from '../components/escrow/MilestoneTimeline';
import VerificationStatusBoard from '../components/escrow/VerificationStatusBoard';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [project, setProject] = useState(null);
  const [innovator, setInnovator] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [flashMessage, setFlashMessage] = useState('');
  
  // Check for any message passed via location state
  useEffect(() => {
    if (location.state?.message) {
      setFlashMessage(location.state.message);
      
      // Set initial tab if provided
      if (location.state?.tab !== undefined) {
        setActiveTab(location.state.tab);
      }
      
      // Clear the location state to prevent message reappearing on refresh
      window.history.replaceState({}, document.title);
    }
    
    // Clear flash message after 5 seconds
    if (flashMessage) {
      const timer = setTimeout(() => {
        setFlashMessage('');
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [location, flashMessage]);
  
  useEffect(() => {
    fetchProjectData();
  }, [id]);
  
  const fetchProjectData = async () => {
    setLoading(true);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Fetch project
      const projectResponse = await fetch(`${apiUrl}/projects/${id}`);
      if (!projectResponse.ok) {
        throw new Error('Project not found');
      }
      
      const projectData = await projectResponse.json();
      setProject(projectData);
      
      // Fetch user/innovator data
      const userResponse = await fetch(`${apiUrl}/users/${projectData.userId}`);
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setInnovator(userData);
      }
      
      // Fetch milestones
      const milestonesResponse = await fetch(`${apiUrl}/milestones?projectId=${id}`);
      if (milestonesResponse.ok) {
        const milestonesData = await milestonesResponse.json();
        setMilestones(milestonesData);
        
        // Fetch verifications for milestones that are completed
        const completedMilestoneIds = milestonesData
          .filter(m => m.status === 'completed')
          .map(m => m.id);
        
        if (completedMilestoneIds.length > 0) {
          const verificationsPromises = completedMilestoneIds.map(milestoneId => 
            fetch(`${apiUrl}/verifications?milestoneId=${milestoneId}`)
              .then(res => res.ok ? res.json() : [])
          );
          
          const verificationsResults = await Promise.all(verificationsPromises);
          const allVerifications = verificationsResults.flat();
          setVerifications(allVerifications);
        }
      }
      
      // Fetch investments if user is investor or admin, or project owner
      if (user.role === 'investor' || user.role === 'admin' || user.id === projectData.userId) {
        const investmentsResponse = await fetch(`${apiUrl}/investments?projectId=${id}`);
        if (investmentsResponse.ok) {
          const investmentsData = await investmentsResponse.json();
          setInvestments(investmentsData);
        }
      }
      
    } catch (err) {
      console.error('Error fetching project data:', err);
      setError(err.message || 'Failed to load project data');
    } finally {
      setLoading(false);
    }
  };
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Handle milestone updates
  const handleMilestoneUpdate = (updatedMilestones) => {
    setMilestones(updatedMilestones);
    
    // If project progress depends on milestone completion, recalculate
    if (project) {
      const completedMilestones = updatedMilestones.filter(
        m => m.status === 'completed' && m.adminApproved
      );
      
      const totalProgress = completedMilestones.reduce(
        (sum, milestone) => sum + (milestone.completionPercentage || 0), 
        0
      );
      
      // If progress has changed, update project
      if (totalProgress !== project.projectProgress) {
        updateProjectProgress(totalProgress);
      }
    }
  };
  
  // Update project progress in the database
  const updateProjectProgress = async (progress) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      await fetch(`${apiUrl}/projects/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectProgress: progress }),
      });
      
      // Update local state
      setProject(prev => ({ ...prev, projectProgress: progress }));
      
    } catch (err) {
      console.error('Error updating project progress:', err);
    }
  };
  
  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };
  
  // Check permissions for project editing
  const canEditProject = user && (user.id === project?.userId || user.role === 'admin');
  
  // SDG color mapping
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
  
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/projects')}
        >
          Back to Projects
        </Button>
      </Container>
    );
  }
  
  if (!project) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          Project not found.
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/projects')}
        >
          Back to Projects
        </Button>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {flashMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {flashMessage}
        </Alert>
      )}
      
      <Button
        variant="text"
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/projects')}
        sx={{ mb: 2 }}
      >
        Back to Projects
      </Button>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Typography variant="h4" component="h1" gutterBottom>
                {project.title}
              </Typography>
              
              {canEditProject && (
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  component={Link}
                  to={`/projects/${id}/edit`}
                  size="small"
                >
                  Edit Project
                </Button>
              )}
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Chip
                icon={<CategoryIcon />}
                label={project.category}
                variant="outlined"
                sx={{ mr: 1 }}
              />
              
              <Chip
                color={
                  project.status === 'active' ? 'success' :
                  project.status === 'pending' || project.status === 'pending_approval' ? 'warning' :
                  project.status === 'completed' ? 'primary' :
                  'default'
                }
                label={
                  project.status === 'pending_approval' ? 'Pending Approval' :
                  project.status.charAt(0).toUpperCase() + project.status.slice(1)
                }
                variant="outlined"
              />
              
              {/* Display creation date */}
              <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                <CalendarTodayIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
                <Typography variant="body2" color="text.secondary">
                  Created: {formatDate(project.createdAt)}
                </Typography>
              </Box>
            </Box>
            
            {/* Display SDGs */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {project.sdgs?.map((sdg) => (
                <Chip
                  key={sdg}
                  label={`SDG ${sdg}`}
                  size="small"
                  sx={{
                    bgcolor: sdgColors[sdg] || '#888888',
                    color: 'white',
                  }}
                />
              ))}
            </Box>
            
            <Typography variant="body1" paragraph>
              {project.description}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={4}>
            {/* Innovator/Project Owner Card */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                    {innovator?.firstName?.[0] || 'U'}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {innovator 
                        ? `${innovator.firstName} ${innovator.lastName}` 
                        : 'Unknown Innovator'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Project Innovator
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<PersonIcon />}
                    component={Link}
                    to={`/innovators/${project.userId}`}
                  >
                    View Profile
                  </Button>
                  
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<ChatIcon />}
                    component={Link}
                    to={`/messages?contact=${project.userId}`}
                  >
                    Contact
                  </Button>
                </Box>
              </CardContent>
            </Card>
            
            {/* Project Progress & Funding Card */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Project Status
                </Typography>
                
                {/* Project Progress */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">Project Progress</Typography>
                    <Typography variant="body2">{project.projectProgress || 0}%</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={project.projectProgress || 0} 
                    sx={{ height: 8, borderRadius: 5 }}
                    color="success"
                  />
                </Box>
                
                {/* Funding Progress */}
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">Funding Progress</Typography>
                    <Typography variant="body2">
                      {formatCurrency(project.currentFunding)} / {formatCurrency(project.fundingGoal)}
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={(project.currentFunding / project.fundingGoal) * 100} 
                    sx={{ height: 8, borderRadius: 5 }}
                  />
                  <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', mt: 0.5 }}>
                    {((project.currentFunding / project.fundingGoal) * 100).toFixed(1)}% funded
                  </Typography>
                </Box>
                
                {/* Investment Actions */}
                {user.role === 'investor' && project.status === 'active' && (
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<AttachMoneyIcon />}
                    sx={{ mt: 1 }}
                    component={Link}
                    to={`/projects/${id}/invest`}
                  >
                    Invest in Project
                  </Button>
                )}
                
                {/* Admin Actions */}
                {user.role === 'admin' && (
                  <Box sx={{ mt: 2 }}>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="subtitle2" gutterBottom>
                      Admin Actions
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<AccountBalanceIcon />}
                      fullWidth
                      sx={{ mb: 1 }}
                      component={Link}
                      to={`/admin/projects/${id}/escrow`}
                    >
                      Escrow Management
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Tabs for Project Details */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Overview" />
          <Tab label="Timeline" />
          <Tab label="Financials" />
          <Tab label="Documents" />
        </Tabs>
      </Box>
      
      {/* Tab Contents */}
      <Box sx={{ mb: 4 }}>
        {/* Overview Tab */}
        {activeTab === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Impact
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                  {project.impact}
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Timeline
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                  {project.timeline}
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Project Milestones Overview
                </Typography>
                {milestones.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="body1" color="text.secondary">
                      No milestones have been defined for this project yet.
                    </Typography>
                    
                    {canEditProject && project.status === 'active' && (
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        component={Link}
                        to={`/projects/${id}/milestones/add`}
                        sx={{ mt: 2 }}
                      >
                        Add First Milestone
                      </Button>
                    )}
                  </Box>
                ) : (
                  <List>
                    {milestones.slice(0, 3).map((milestone) => (
                      <ListItem 
                        key={milestone.id}
                        secondaryAction={
                          <Tooltip title="View Details">
                            <IconButton 
                              edge="end" 
                              onClick={() => setActiveTab(1)}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                        }
                      >
                        <ListItemIcon>
                          {milestone.status === 'completed' && milestone.adminApproved ? (
                            <Chip size="small" color="success" label="Completed" />
                          ) : milestone.status === 'completed' && !milestone.adminApproved ? (
                            <Chip size="small" color="warning" label="Awaiting Verification" />
                          ) : milestone.status === 'inProgress' ? (
                            <Chip size="small" color="primary" label="In Progress" />
                          ) : (
                            <Chip size="small" color="default" label="Pending" />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={milestone.title}
                          secondary={`Due: ${formatDate(milestone.dueDate)}`}
                        />
                      </ListItem>
                    ))}
                    
                    {milestones.length > 3 && (
                      <Button
                        fullWidth
                        variant="text"
                        onClick={() => setActiveTab(1)}
                        sx={{ mt: 1 }}
                      >
                        View All {milestones.length} Milestones
                      </Button>
                    )}
                  </List>
                )}
              </Paper>
            </Grid>
          </Grid>
        )}
        
        {/* Timeline Tab */}
        {activeTab === 1 && (
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                Project Timeline & Milestones
              </Typography>
              
              {canEditProject && project.status === 'active' && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  component={Link}
                  to={`/projects/${id}/milestones/add`}
                >
                  Add Milestone
                </Button>
              )}
            </Box>
            
            {/* Integrate MilestoneList component */}
            <MilestoneList 
              milestones={milestones}
              projectId={id}
              projectOwnerId={project.userId}
              onMilestoneUpdate={handleMilestoneUpdate}
              projectStatus={project.status}
            />
          </Paper>
        )}
        
        {/* Financials Tab */}
        {activeTab === 2 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Financial Details
            </Typography>
            
            <Grid container spacing={3}>
              {/* Financial summary */}
              <Grid item xs={12} md={6}>
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Funding Summary
                    </Typography>
                    
                    <List>
                      <ListItem>
                        <ListItemText 
                          primary="Funding Goal" 
                          secondary={formatCurrency(project.fundingGoal)} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Current Funding" 
                          secondary={formatCurrency(project.currentFunding)} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Funding Remaining" 
                          secondary={formatCurrency(project.fundingGoal - project.currentFunding)} 
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Investments */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Milestone Funding Details
                    </Typography>
                    
                    {milestones.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        No milestones defined yet.
                      </Typography>
                    ) : (
                      <List dense>
                        {milestones.map(milestone => (
                          <ListItem key={milestone.id}>
                            <ListItemText
                              primary={milestone.title}
                              secondary={`Estimated Funding: ${formatCurrency(milestone.estimatedFunding || 0)}`}
                            />
                            <Chip
                              size="small"
                              label={
                                milestone.status === 'completed' && milestone.adminApproved ? 'Funded' :
                                milestone.status === 'completed' && !milestone.adminApproved ? 'Pending Approval' :
                                'Not Released'
                              }
                              color={
                                milestone.status === 'completed' && milestone.adminApproved ? 'success' :
                                milestone.status === 'completed' && !milestone.adminApproved ? 'warning' :
                                'default'
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Milestone Timeline - Advanced view for investors & admins */}
              {(user.role === 'investor' || user.role === 'admin' || user.id === project.userId) && (
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Funding Release Timeline
                      </Typography>
                      
                      <MilestoneTimeline 
                        projectId={id}
                        milestones={milestones}
                        investments={investments}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </Paper>
        )}
        
        {/* Documents Tab */}
        {activeTab === 3 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Project Documents
            </Typography>
            
            {/* For milestones with verification documents */}
            {milestones.some(m => m.status === 'completed' && m.verificationDocuments?.length > 0) ? (
              <Grid container spacing={3}>
                {milestones
                  .filter(m => m.status === 'completed' && m.verificationDocuments?.length > 0)
                  .map(milestone => (
                    <Grid item xs={12} key={milestone.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle1">{milestone.title}</Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {milestone.adminApproved ? 'Verified & Completed' : 'Awaiting Verification'}
                          </Typography>
                          
                          <List dense>
                            {milestone.verificationDocuments.map((doc, index) => (
                              <ListItem key={index}>
                                <ListItemIcon>
                                  <AttachFileIcon />
                                </ListItemIcon>
                                <ListItemText
                                  primary={doc.name}
                                  secondary={`Uploaded on ${formatDate(doc.uploadedAt)}`}
                                />
                                <Button
                                  size="small"
                                  component="a"
                                  href={doc.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  View
                                </Button>
                              </ListItem>
                            ))}
                          </List>
                          
                          {/* Verification History */}
                          {milestone.status === 'completed' && (
                            <Box sx={{ mt: 2 }}>
                              <VerificationStatusBoard
                                milestone={milestone}
                                verifications={verifications.filter(v => v.milestoneId === milestone.id)}
                              />
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
              </Grid>
            ) : (
              <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                No project documents available yet. Documents will be added as milestones are completed.
              </Typography>
            )}
          </Paper>
        )}
      </Box>
    </Container>
  );
};

export default ProjectDetail;