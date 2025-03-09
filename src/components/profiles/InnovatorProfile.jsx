// src/components/profiles/InnovatorProfile.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

// Material UI components
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Avatar,
  Divider,
  Chip,
  Card,
  CardContent,
  CardActionArea,
  LinearProgress,
  CircularProgress,
  Alert,
  Button,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';

// Material UI icons
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CallIcon from '@mui/icons-material/Call';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import LanguageIcon from '@mui/icons-material/Language';
import TimelineIcon from '@mui/icons-material/Timeline';
import ChatIcon from '@mui/icons-material/Chat';

const InnovatorProfile = () => {
  const { id } = useParams();
  const [innovator, setInnovator] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [completedMilestones, setCompletedMilestones] = useState([]);

  useEffect(() => {
    fetchInnovatorData();
  }, [id]);

  const fetchInnovatorData = async () => {
    setLoading(true);
    try {
      // Fetch innovator profile and their projects
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Fetch innovator data
      const innovatorResponse = await fetch(`${apiUrl}/users/${id}`);
      if (!innovatorResponse.ok) {
        throw new Error('Innovator not found');
      }
      const innovatorData = await innovatorResponse.json();
      
      // Verify the user is an innovator
      if (innovatorData.role !== 'innovator') {
        throw new Error('Requested user is not an innovator');
      }
      
      setInnovator(innovatorData);
      
      // Fetch projects
      const projectsResponse = await fetch(`${apiUrl}/projects?userId=${id}`);
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        
        // Filter out pending_approval projects for non-owners/non-admins
        const filteredProjects = projectsData.filter(project => 
          project.status !== 'pending_approval'
        );
        
        setProjects(filteredProjects);
        
        // Fetch milestones for all projects
        const milestonesPromises = filteredProjects.map(project => 
          fetch(`${apiUrl}/milestones?projectId=${project.id}&status=completed&adminApproved=true`)
            .then(res => res.ok ? res.json() : [])
        );
        
        const milestonesResults = await Promise.all(milestonesPromises);
        const allCompletedMilestones = milestonesResults.flat();
        setCompletedMilestones(allCompletedMilestones);
      }
    } catch (error) {
      console.error('Error fetching innovator data:', error);
      setError(error.message || 'Failed to load innovator profile');
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (value) => {
    if (!value && value !== 0) return '$0';
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Calculate various metrics
  const calculateTotalFunding = () => {
    return projects.reduce((sum, project) => sum + (project.currentFunding || 0), 0);
  };
  
  const calculateSuccessRate = () => {
    if (completedMilestones.length === 0) return 0;
    
    const totalMilestones = projects.reduce((sum, project) => {
      // Get all milestones for this project
      const projectMilestones = completedMilestones.filter(m => m.projectId === project.id);
      return sum + projectMilestones.length;
    }, 0);
    
    const onTimeMilestones = completedMilestones.filter(milestone => {
      if (!milestone.completedDate || !milestone.dueDate) return false;
      return new Date(milestone.completedDate) <= new Date(milestone.dueDate);
    }).length;
    
    return totalMilestones > 0 ? (onTimeMilestones / totalMilestones) * 100 : 0;
  };
  
  const calculateAverageProjectProgress = () => {
    if (projects.length === 0) return 0;
    return projects.reduce((sum, project) => sum + (project.projectProgress || 0), 0) / projects.length;
  };
  
  const getActiveProjects = () => {
    return projects.filter(project => project.status === 'active');
  };
  
  const getCompletedProjects = () => {
    return projects.filter(project => project.status === 'completed');
  };
  
  // Get all unique SDGs from projects
  const getAllSDGs = () => {
    const sdgSet = new Set();
    projects.forEach(project => {
      if (project.sdgs && Array.isArray(project.sdgs)) {
        project.sdgs.forEach(sdg => sdgSet.add(sdg));
      }
    });
    return Array.from(sdgSet).sort((a, b) => a - b);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
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
        <Button component={Link} to="/projects" variant="outlined">
          Back to Projects
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Avatar
                src={innovator.profileImage}
                sx={{ width: 150, height: 150, mb: 2 }}
              >
                {innovator.firstName?.[0]}{innovator.lastName?.[0]}
              </Avatar>
              <Chip 
                icon={<CheckCircleIcon />} 
                label="Verified Innovator" 
                color="success" 
                variant="outlined" 
              />
            </Box>
          </Grid>
          
          <Grid item xs={12} md={9}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Typography variant="h4" gutterBottom>
                {innovator.firstName} {innovator.lastName}
              </Typography>
              
              <Button
                variant="outlined"
                startIcon={<ChatIcon />}
                component={Link}
                to={`/messages?contact=${innovator.id}`}
              >
                Contact
              </Button>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <EmailIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                <Typography variant="body2">{innovator.email}</Typography>
              </Box>
              
              {innovator.phone && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CallIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                  <Typography variant="body2">{innovator.phone}</Typography>
                </Box>
              )}
              
              {innovator.address && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LocationOnIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                  <Typography variant="body2">{innovator.address}</Typography>
                </Box>
              )}
            </Box>
            
            <Typography variant="body1" color="text.secondary" paragraph>
              {innovator.bio || 'No bio provided.'}
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5">{projects.length}</Typography>
                  <Typography variant="body2" color="text.secondary">Total Projects</Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5">{formatCurrency(calculateTotalFunding())}</Typography>
                  <Typography variant="body2" color="text.secondary">Total Funding</Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5">{completedMilestones.length}</Typography>
                  <Typography variant="body2" color="text.secondary">Milestones Completed</Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5">{calculateSuccessRate().toFixed(0)}%</Typography>
                  <Typography variant="body2" color="text.secondary">On-Time Completion</Typography>
                </Box>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Tabs section */}
      <Box sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Projects" icon={<BusinessCenterIcon />} iconPosition="start" />
          <Tab label="Impact Areas" icon={<LanguageIcon />} iconPosition="start" />
          <Tab label="Milestones" icon={<TimelineIcon />} iconPosition="start" />
        </Tabs>
      </Box>
      
      {/* Projects Tab */}
      {activeTab === 0 && (
        <Box>
          <Typography variant="h5" gutterBottom>
            {innovator.firstName}'s Projects
          </Typography>
          
          {projects.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1">
                No projects found for this innovator.
              </Typography>
            </Paper>
          ) : (
            <>
              <Typography variant="h6" gutterBottom>
                Active Projects
              </Typography>
              
              <Grid container spacing={3} sx={{ mb: 4 }}>
                {getActiveProjects().map(project => (
                  <Grid item xs={12} sm={6} md={4} key={project.id}>
                    <Card>
                      <CardActionArea component={Link} to={`/projects/${project.id}`}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            {project.title}
                          </Typography>
                          
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {project.description.substring(0, 120)}
                            {project.description.length > 120 ? '...' : ''}
                          </Typography>
                          
                          <Box sx={{ mb: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="body2">Funding Progress</Typography>
                              <Typography variant="body2">
                                {formatCurrency(project.currentFunding)} / {formatCurrency(project.fundingGoal)}
                              </Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={(project.currentFunding / project.fundingGoal) * 100} 
                              sx={{ height: 6, borderRadius: 5 }}
                            />
                          </Box>
                          
                          {project.projectProgress !== undefined && (
                            <Box sx={{ mb: 1 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="body2">Project Progress</Typography>
                                <Typography variant="body2">{project.projectProgress}%</Typography>
                              </Box>
                              <LinearProgress 
                                variant="determinate" 
                                value={project.projectProgress} 
                                color="success"
                                sx={{ height: 6, borderRadius: 5 }}
                              />
                            </Box>
                          )}
                          
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 2 }}>
                            <Chip 
                              label={project.category} 
                              size="small" 
                              variant="outlined"
                            />
                            
                            {project.sdgs?.slice(0, 2).map(sdg => (
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
                            
                            {project.sdgs?.length > 2 && (
                              <Chip
                                label={`+${project.sdgs.length - 2} more`}
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Grid>
                ))}

                {getActiveProjects().length === 0 && (
                  <Grid item xs={12}>
                    <Alert severity="info">
                      No active projects at the moment.
                    </Alert>
                  </Grid>
                )}
              </Grid>
              
              {getCompletedProjects().length > 0 && (
                <>
                  <Typography variant="h6" gutterBottom>
                    Completed Projects
                  </Typography>
                  
                  <Grid container spacing={3}>
                    {getCompletedProjects().map(project => (
                      <Grid item xs={12} sm={6} md={4} key={project.id}>
                        <Card>
                          <CardActionArea component={Link} to={`/projects/${project.id}`}>
                            <CardContent>
                              <Typography variant="h6" gutterBottom>
                                {project.title}
                              </Typography>
                              
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                {project.description.substring(0, 120)}
                                {project.description.length > 120 ? '...' : ''}
                              </Typography>
                              
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="body2">Final Funding</Typography>
                                <Typography variant="body2">
                                  {formatCurrency(project.currentFunding)}
                                </Typography>
                              </Box>
                              
                              <Chip 
                                label="Completed" 
                                color="success" 
                                size="small" 
                                sx={{ mt: 1 }}
                              />
                            </CardContent>
                          </CardActionArea>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </>
              )}
            </>
          )}
        </Box>
      )}
      
      {/* Impact Areas Tab */}
      {activeTab === 1 && (
        <Box>
          <Typography variant="h5" gutterBottom>
            Impact Areas
          </Typography>
          
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Sustainable Development Goals
            </Typography>
            
            <Grid container spacing={2}>
              {getAllSDGs().map(sdg => (
                <Grid item xs={12} sm={6} md={4} key={sdg}>
                  <Card sx={{ 
                    p: 2, 
                    bgcolor: sdgColors[sdg] || '#888888',
                    color: 'white'
                  }}>
                    <Typography variant="h6" gutterBottom>
                      SDG {sdg}
                    </Typography>
                    <Typography variant="body2">
                      {sdgNames[sdg] || `Sustainable Development Goal ${sdg}`}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
                      {projects.filter(p => p.sdgs?.includes(sdg)).length} projects
                    </Typography>
                  </Card>
                </Grid>
              ))}

              {getAllSDGs().length === 0 && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    No SDG information available for this innovator's projects.
                  </Alert>
                </Grid>
              )}
            </Grid>
          </Paper>
          
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Impact Summary
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Total Impact
                  </Typography>
                  
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <EmojiEventsIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Projects Initiated" 
                        secondary={projects.length} 
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon>
                        <EmojiEventsIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Total Funding Secured" 
                        secondary={formatCurrency(calculateTotalFunding())} 
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon>
                        <EmojiEventsIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Average Project Progress" 
                        secondary={`${calculateAverageProjectProgress().toFixed(0)}%`} 
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon>
                        <EmojiEventsIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Milestones Achieved" 
                        secondary={completedMilestones.length} 
                      />
                    </ListItem>
                  </List>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Social & Environmental Impact
                  </Typography>
                  
                  <Typography variant="body2" paragraph>
                    {innovator.firstName} {innovator.lastName} has worked on projects across {getAllSDGs().length} different Sustainable Development Goals, primarily focusing on:
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {getAllSDGs().slice(0, 5).map(sdg => (
                      <Chip
                        key={sdg}
                        label={sdgNames[sdg] || `SDG ${sdg}`}
                        sx={{
                          bgcolor: sdgColors[sdg] || '#888888',
                          color: 'white',
                        }}
                      />
                    ))}
                  </Box>
                  
                  <Typography variant="body2" sx={{ mt: 2 }}>
                    With a project success rate of {calculateSuccessRate().toFixed(0)}%, this innovator has demonstrated strong capability in delivering impactful solutions.
                  </Typography>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Box>
      )}
      
      {/* Milestones Tab */}
      {activeTab === 2 && (
        <Box>
          <Typography variant="h5" gutterBottom>
            Completed Milestones
          </Typography>
          
          {completedMilestones.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1">
                No completed milestones found for this innovator.
              </Typography>
            </Paper>
          ) : (
            <Paper sx={{ p: 3 }}>
              <List>
                {completedMilestones.map(milestone => {
                  const projectForMilestone = projects.find(p => p.id === milestone.projectId);
                  
                  return (
                    <ListItem 
                      key={milestone.id}
                      sx={{ 
                        mb: 2, 
                        border: 1, 
                        borderColor: 'divider',
                        borderRadius: 1,
                        p: 2
                      }}
                    >
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={8}>
                          <Typography variant="subtitle1">{milestone.title}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {milestone.description}
                          </Typography>
                          
                          {projectForMilestone && (
                            <Typography variant="caption" color="primary" component={Link} to={`/projects/${projectForMilestone.id}`} sx={{ display: 'block', mt: 1 }}>
                              Project: {projectForMilestone.title}
                            </Typography>
                          )}
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                          <Box sx={{ textAlign: 'right' }}>
                            <Chip 
                              icon={<CheckCircleIcon />}
                              label="Completed"
                              color="success"
                              size="small"
                              sx={{ mb: 1 }}
                            />
                            
                            <Typography variant="body2">
                              Completed on: {formatDate(milestone.completedDate)}
                            </Typography>
                            
                            {milestone.completionPercentage && (
                              <Typography variant="body2">
                                Project Contribution: {milestone.completionPercentage}%
                              </Typography>
                            )}
                          </Box>
                        </Grid>
                      </Grid>
                    </ListItem>
                  );
                })}
              </List>
            </Paper>
          )}
        </Box>
      )}
    </Container>
  );
};

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

// SDG names
const sdgNames = {
  1: 'No Poverty',
  2: 'Zero Hunger',
  3: 'Good Health and Well-being',
  4: 'Quality Education',
  5: 'Gender Equality',
  6: 'Clean Water and Sanitation',
  7: 'Affordable and Clean Energy',
  8: 'Decent Work and Economic Growth',
  9: 'Industry, Innovation, and Infrastructure',
  10: 'Reduced Inequalities',
  11: 'Sustainable Cities and Communities',
  12: 'Responsible Consumption and Production',
  13: 'Climate Action',
  14: 'Life Below Water',
  15: 'Life on Land',
  16: 'Peace, Justice, and Strong Institutions',
  17: 'Partnerships for the Goals',
};

export default InnovatorProfile;