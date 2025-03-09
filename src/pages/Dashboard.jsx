// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Material UI Components
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  LinearProgress,
  Divider,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Stack
} from '@mui/material';

// Material UI Icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TimelineIcon from '@mui/icons-material/Timeline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PersonIcon from '@mui/icons-material/Person';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import StarIcon from '@mui/icons-material/Star';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState({
    projects: [],
    milestones: [],
    investments: [],
    verifications: [],
    notifications: []
  });
  
  useEffect(() => {
    fetchDashboardData();
  }, []);
  
  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Fetch data based on user role
      if (user.role === 'innovator') {
        await fetchInnovatorData(apiUrl);
      } else if (user.role === 'investor') {
        await fetchInvestorData(apiUrl);
      } else if (user.role === 'admin') {
        await fetchAdminData(apiUrl);
      }
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchInnovatorData = async (apiUrl) => {
    // Fetch projects created by the innovator
    const projectsResponse = await fetch(`${apiUrl}/projects?userId=${user.id}`);
    if (projectsResponse.ok) {
      const projectsData = await projectsResponse.json();
      
      // Fetch milestones for all projects
      const projectIds = projectsData.map(project => project.id);
      
      let allMilestones = [];
      if (projectIds.length > 0) {
        const milestonesPromises = projectIds.map(projectId => 
          fetch(`${apiUrl}/milestones?projectId=${projectId}`)
            .then(res => res.ok ? res.json() : [])
        );
        
        const milestonesResults = await Promise.all(milestonesPromises);
        allMilestones = milestonesResults.flat();
      }
      
      // Generate mock notifications
      const notifications = generateNotifications(projectsData, allMilestones);
      
      setDashboardData({
        projects: projectsData,
        milestones: allMilestones,
        investments: [],
        verifications: [],
        notifications
      });
    }
  };
  
  const fetchInvestorData = async (apiUrl) => {
    // Fetch investments made by the investor
    const investmentsResponse = await fetch(`${apiUrl}/investments?userId=${user.id}`);
    let investmentsData = [];
    let projectsData = [];
    
    if (investmentsResponse.ok) {
      investmentsData = await investmentsResponse.json();
      
      // Fetch projects the investor has invested in
      const projectIds = [...new Set(investmentsData.map(inv => inv.projectId))];
      
      if (projectIds.length > 0) {
        const projectsPromises = projectIds.map(projectId => 
          fetch(`${apiUrl}/projects/${projectId}`)
            .then(res => res.ok ? res.json() : null)
        );
        
        const projectsResults = await Promise.all(projectsPromises);
        projectsData = projectsResults.filter(project => project !== null);
      }
    }
    
    // Fetch pending verifications (milestones awaiting verification)
    const milestonesResponse = await fetch(`${apiUrl}/milestones?status=completed&adminApproved=false`);
    let pendingVerifications = [];
    
    if (milestonesResponse.ok) {
      const milestones = await milestonesResponse.json();
      
      // Filter milestones for projects the investor has invested in
      pendingVerifications = milestones.filter(milestone => 
        investmentsData.some(inv => inv.projectId === milestone.projectId)
      );
    }
    
    // Fetch previous verifications by this investor
    const verificationsResponse = await fetch(`${apiUrl}/verifications?verifierId=${user.id}`);
    let previousVerifications = [];
    
    if (verificationsResponse.ok) {
      previousVerifications = await verificationsResponse.json();
    }
    
    // Generate mock notifications
    const notifications = generateInvestorNotifications(investmentsData, pendingVerifications);
    
    setDashboardData({
      projects: projectsData,
      milestones: pendingVerifications,
      investments: investmentsData,
      verifications: previousVerifications,
      notifications
    });
  };
  
  const fetchAdminData = async (apiUrl) => {
    // Fetch pending approval projects
    const pendingProjectsResponse = await fetch(`${apiUrl}/projects?status=pending_approval`);
    let pendingProjects = [];
    
    if (pendingProjectsResponse.ok) {
      pendingProjects = await pendingProjectsResponse.json();
    }
    
    // Fetch pending milestone verifications
    const pendingVerificationsResponse = await fetch(`${apiUrl}/milestones?status=completed&adminApproved=false`);
    let pendingVerifications = [];
    
    if (pendingVerificationsResponse.ok) {
      pendingVerifications = await pendingVerificationsResponse.json();
    }
    
    // Generate admin notifications
    const notifications = [
      {
        id: 1,
        type: 'admin',
        title: `${pendingProjects.length} Projects Pending Approval`,
        message: 'New projects are waiting for your review and approval.',
        createdAt: new Date().toISOString(),
        read: false,
        link: '/admin/projects/pending'
      },
      {
        id: 2,
        type: 'verification',
        title: `${pendingVerifications.length} Milestones Need Verification`,
        message: 'Milestone completions awaiting your verification and fund release.',
        createdAt: new Date().toISOString(),
        read: false,
        link: '/admin/projects?pendingVerification=true'
      }
    ];
    
    setDashboardData({
      projects: pendingProjects,
      milestones: pendingVerifications,
      investments: [],
      verifications: [],
      notifications
    });
  };
  
  const generateNotifications = (projects, milestones) => {
    const pendingApprovalProjects = projects.filter(p => p.status === 'pending_approval');
    const rejectedProjects = projects.filter(p => p.status === 'rejected');
    const approvedProjects = projects.filter(p => p.status === 'active');
    const pendingMilestones = milestones.filter(m => m.status === 'completed' && !m.adminApproved);
    const approvedMilestones = milestones.filter(m => m.status === 'completed' && m.adminApproved);
    
    const notifications = [];
    
    // Pending approval projects
    pendingApprovalProjects.forEach(project => {
      notifications.push({
        id: `proj-pending-${project.id}`,
        type: 'project',
        title: 'Project Pending Approval',
        message: `Your project "${project.title}" is awaiting admin approval.`,
        createdAt: project.createdAt,
        read: false,
        link: `/projects/${project.id}`
      });
    });
    
    // Rejected projects
    rejectedProjects.forEach(project => {
      notifications.push({
        id: `proj-rejected-${project.id}`,
        type: 'project',
        title: 'Project Rejected',
        message: `Your project "${project.title}" was not approved. Reason: ${project.rejectionReason || 'No reason provided.'}`,
        createdAt: project.rejectedAt,
        read: false,
        link: `/projects/${project.id}`
      });
    });
    
    // Approved projects
    approvedProjects.slice(0, 3).forEach(project => {
      notifications.push({
        id: `proj-approved-${project.id}`,
        type: 'project',
        title: 'Project Approved',
        message: `Your project "${project.title}" has been approved and is now visible to investors.`,
        createdAt: project.approvedAt,
        read: false,
        link: `/projects/${project.id}`
      });
    });
    
    // Pending milestone verifications
    pendingMilestones.forEach(milestone => {
      const project = projects.find(p => p.id === milestone.projectId);
      notifications.push({
        id: `milestone-pending-${milestone.id}`,
        type: 'milestone',
        title: 'Milestone Awaiting Verification',
        message: `Your milestone "${milestone.title}" for project "${project?.title}" is awaiting verification.`,
        createdAt: milestone.verificationDate,
        read: false,
        link: `/projects/${milestone.projectId}`
      });
    });
    
    // Approved milestones
    approvedMilestones.slice(0, 3).forEach(milestone => {
      const project = projects.find(p => p.id === milestone.projectId);
      notifications.push({
        id: `milestone-approved-${milestone.id}`,
        type: 'milestone',
        title: 'Milestone Verified',
        message: `Your milestone "${milestone.title}" for project "${project?.title}" has been verified and funds have been released.`,
        createdAt: milestone.approvedDate,
        read: false,
        link: `/projects/${milestone.projectId}`
      });
    });
    
    // Sort notifications by date (newest first)
    return notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };
  
  const generateInvestorNotifications = (investments, pendingVerifications) => {
    const notifications = [];
    
    // Recent investments
    investments.slice(0, 3).forEach(investment => {
      notifications.push({
        id: `investment-${investment.id}`,
        type: 'investment',
        title: 'Investment Made',
        message: `Your investment of ${formatCurrency(investment.amount)} has been processed successfully.`,
        createdAt: investment.createdAt,
        read: false,
        link: `/investments`
      });
    });
    
    // Pending verifications
    pendingVerifications.forEach(milestone => {
      notifications.push({
        id: `verification-${milestone.id}`,
        type: 'verification',
        title: 'Verification Requested',
        message: `A milestone verification is requested for "${milestone.title}".`,
        createdAt: milestone.verificationDate,
        read: false,
        link: `/projects/${milestone.projectId}/milestones/${milestone.id}/verify`
      });
    });
    
    return notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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
    const date = new Date(dateString);
    
    // If date is today, show "Today at HH:MM"
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // If date is yesterday, show "Yesterday at HH:MM"
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Otherwise show full date
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const renderInnovatorDashboard = () => {
    const { projects, milestones, notifications } = dashboardData;
    
    // Filter by status
    const pendingApprovalProjects = projects.filter(p => p.status === 'pending_approval');
    const activeProjects = projects.filter(p => p.status === 'active');
    const completedProjects = projects.filter(p => p.status === 'completed');
    const rejectedProjects = projects.filter(p => p.status === 'rejected');
    
    // Milestone stats
    const pendingMilestones = milestones.filter(m => m.status === 'pending');
    const inProgressMilestones = milestones.filter(m => m.status === 'inProgress');
    const completedMilestones = milestones.filter(m => m.status === 'completed' && m.adminApproved);
    const pendingVerificationMilestones = milestones.filter(m => m.status === 'completed' && !m.adminApproved);
    
    return (
      <>
        {/* Quick Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Projects</Typography>
                <Typography variant="h3">{projects.length}</Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {activeProjects.length} Active
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {pendingApprovalProjects.length} Pending Approval
                  </Typography>
                </Box>
              </CardContent>
              <CardActions>
                <Button size="small" component={Link} to="/projects">View All</Button>
              </CardActions>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Milestones</Typography>
                <Typography variant="h3">{milestones.length}</Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {completedMilestones.length} Completed
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {pendingVerificationMilestones.length} Awaiting Verification
                  </Typography>
                </Box>
              </CardContent>
              <CardActions>
                <Button size="small" component={Link} to="/projects">View Projects</Button>
              </CardActions>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Funding Received</Typography>
                <Typography variant="h3">
                  {formatCurrency(activeProjects.reduce((sum, project) => sum + (project.currentFunding || 0), 0))}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Target: {formatCurrency(activeProjects.reduce((sum, project) => sum + (project.fundingGoal || 0), 0))}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Across {activeProjects.length} Active Projects
                  </Typography>
                </Box>
              </CardContent>
              <CardActions>
                <Button size="small" component={Link} to="/projects">View Funding</Button>
              </CardActions>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Progress</Typography>
                <Typography variant="h3">
                  {activeProjects.length > 0 
                    ? Math.round(activeProjects.reduce((sum, p) => sum + (p.projectProgress || 0), 0) / activeProjects.length)
                    : 0}%
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {inProgressMilestones.length} Milestones In Progress
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {pendingMilestones.length} Milestones Not Started
                  </Typography>
                </Box>
              </CardContent>
              <CardActions>
                <Button size="small" component={Link} to="/projects">View Progress</Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
        
        {/* Pending Approvals Section */}
        {pendingApprovalProjects.length > 0 && (
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <HourglassEmptyIcon color="warning" sx={{ mr: 1 }} />
              Pending Project Approvals
            </Typography>
            
            <Grid container spacing={2}>
              {pendingApprovalProjects.map(project => (
                <Grid item xs={12} md={6} key={project.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="subtitle1">{project.title}</Typography>
                        <Chip 
                          label="Pending Approval" 
                          color="warning" 
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {project.description.substring(0, 120)}
                        {project.description.length > 120 ? '...' : ''}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Submitted on {formatDate(project.createdAt)}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button size="small" component={Link} to={`/projects/${project.id}`}>
                        View Details
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        )}
        
        {/* Rejected Projects Section */}
        {rejectedProjects.length > 0 && (
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <ErrorOutlineIcon color="error" sx={{ mr: 1 }} />
              Rejected Projects
            </Typography>
            
            <Grid container spacing={2}>
              {rejectedProjects.map(project => (
                <Grid item xs={12} key={project.id}>
                  <Alert severity="error" sx={{ mb: 2 }}>
                    <Box>
                      <Typography variant="subtitle1">{project.title}</Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        <strong>Rejection Reason:</strong> {project.rejectionReason || 'No reason provided.'}
                      </Typography>
                      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        Rejected on {formatDate(project.rejectedAt)}
                      </Typography>
                      <Button size="small" component={Link} to={`/projects/${project.id}`} sx={{ mt: 1 }}>
                        View Details
                      </Button>
                    </Box>
                  </Alert>
                </Grid>
              ))}
            </Grid>
          </Paper>
        )}
        
        {/* Active Projects */}
        {activeProjects.length > 0 && (
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Active Projects
            </Typography>
            
            <Grid container spacing={3}>
              {activeProjects.map(project => (
                <Grid item xs={12} key={project.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h6">{project.title}</Typography>
                        <Chip 
                          label="Active" 
                          color="success" 
                          size="small"
                        />
                      </Box>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {project.description.substring(0, 150)}
                            {project.description.length > 150 ? '...' : ''}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          {/* Funding Progress */}
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            Funding: {formatCurrency(project.currentFunding)} of {formatCurrency(project.fundingGoal)}
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={(project.currentFunding / project.fundingGoal) * 100}
                            sx={{ mb: 2, height: 8, borderRadius: 5 }}
                          />
                          
                          {/* Project Progress */}
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            Project Progress: {project.projectProgress || 0}%
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={project.projectProgress || 0}
                            color="success"
                            sx={{ mb: 2, height: 8, borderRadius: 5 }}
                          />
                        </Grid>
                      </Grid>
                      
                      {/* Milestone Overview */}
                      <Typography variant="subtitle2" gutterBottom>
                        Milestones:
                      </Typography>
                      
                      {milestones.filter(m => m.projectId === project.id)
                        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
                        .map(milestone => (
                          <Box 
                            key={milestone.id} 
                            sx={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center',
                              mb: 1,
                              p: 1,
                              borderRadius: 1,
                              bgcolor: 'background.default'
                            }}
                          >
                            <Box>
                              <Typography variant="body2">{milestone.title}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                Due: {formatDate(milestone.dueDate)}
                              </Typography>
                            </Box>
                            <Chip 
                              label={
                                milestone.status === 'completed' && milestone.adminApproved ? 'Completed' :
                                milestone.status === 'completed' && !milestone.adminApproved ? 'Awaiting Verification' :
                                milestone.status === 'inProgress' ? 'In Progress' : 'Pending'
                              }
                              color={
                                milestone.status === 'completed' && milestone.adminApproved ? 'success' :
                                milestone.status === 'completed' && !milestone.adminApproved ? 'warning' :
                                milestone.status === 'inProgress' ? 'primary' : 'default'
                              }
                              size="small"
                            />
                          </Box>
                        ))}
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        component={Link} 
                        to={`/projects/${project.id}`}
                        startIcon={<VisibilityIcon />}
                      >
                        View Details
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        )}
        
        {/* Notifications */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <NotificationsActiveIcon sx={{ mr: 1 }} />
            Recent Notifications
          </Typography>
          
          {notifications.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="body1" color="text.secondary">
                No notifications yet.
              </Typography>
            </Box>
          ) : (
            <List>
              {notifications.slice(0, 5).map((notification) => (
                <ListItem 
                  key={notification.id} 
                  alignItems="flex-start"
                  sx={{ 
                    mb: 1, 
                    borderRadius: 1,
                    bgcolor: notification.read ? 'transparent' : 'action.hover'
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 
                      notification.type === 'project' ? 'primary.main' : 
                      notification.type === 'milestone' ? 'success.main' : 
                      'warning.main'
                    }}>
                      {notification.type === 'project' ? <BusinessCenterIcon /> : 
                       notification.type === 'milestone' ? <TimelineIcon /> : 
                       <NotificationsActiveIcon />}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1">
                        {notification.title}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="text.primary">
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(notification.createdAt)}
                        </Typography>
                      </>
                    }
                  />
                  <Button 
                    size="small" 
                    component={Link} 
                    to={notification.link}
                    sx={{ ml: 2, alignSelf: 'center' }}
                  >
                    View
                  </Button>
                </ListItem>
              ))}
              
              {notifications.length > 5 && (
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Button 
                    size="small" 
                    component={Link} 
                    to="/notifications"
                  >
                    View All Notifications
                  </Button>
                </Box>
              )}
            </List>
          )}
        </Paper>
      </>
    );
  };
  
  const renderInvestorDashboard = () => {
    const { projects, investments, milestones, notifications } = dashboardData;
    
    // Calculate total investments
    const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
    
    // Find milestones that need verification
    const pendingVerifications = milestones;
    
    return (
      <>
        {/* Quick Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Projects Invested</Typography>
                <Typography variant="h3">{projects.length}</Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Across {investments.length} Investments
                  </Typography>
                </Box>
              </CardContent>
              <CardActions>
                <Button size="small" component={Link} to="/investments">View Investments</Button>
              </CardActions>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Total Invested</Typography>
                <Typography variant="h3">{formatCurrency(totalInvested)}</Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Available Balance: {formatCurrency(user.walletBalance || 0)}
                  </Typography>
                </Box>
              </CardContent>
              <CardActions>
                <Button size="small" component={Link} to="/wallet">Wallet</Button>
              </CardActions>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
              <Typography variant="h6" gutterBottom>Pending Verifications</Typography>
                <Typography variant="h3">{pendingVerifications.length}</Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Milestones awaiting your verification
                  </Typography>
                </Box>
              </CardContent>
              <CardActions>
                <Button size="small" component={Link} to="/projects">View Projects</Button>
              </CardActions>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Project Progress</Typography>
                <Typography variant="h3">
                  {projects.length > 0 
                    ? Math.round(projects.reduce((sum, p) => sum + (p.projectProgress || 0), 0) / projects.length)
                    : 0}%
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Average across all invested projects
                  </Typography>
                </Box>
              </CardContent>
              <CardActions>
                <Button size="small" component={Link} to="/projects">View Progress</Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
        
        {/* Pending Verifications */}
        {pendingVerifications.length > 0 && (
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <VerifiedUserIcon color="warning" sx={{ mr: 1 }} />
              Milestones Awaiting Verification
            </Typography>
            
            <Grid container spacing={2}>
              {pendingVerifications.map(milestone => {
                const project = projects.find(p => p.id === milestone.projectId);
                
                return (
                  <Grid item xs={12} key={milestone.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={8}>
                            <Typography variant="subtitle1">{milestone.title}</Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                              {milestone.description}
                            </Typography>
                            
                            <Typography variant="body2">
                              <strong>Project:</strong> {project?.title || 'Unknown Project'}
                            </Typography>
                            
                            <Typography variant="body2">
                              <strong>Submitted:</strong> {formatDate(milestone.verificationDate)}
                            </Typography>
                            
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                              <Chip 
                                icon={<AttachMoneyIcon />}
                                label={`Est. Funding: ${formatCurrency(milestone.estimatedFunding)}`}
                                variant="outlined"
                                size="small"
                              />
                              
                              <Chip 
                                icon={<StarIcon />}
                                label={`Weight: ${milestone.completionPercentage}%`}
                                variant="outlined"
                                size="small"
                              />
                            </Box>
                          </Grid>
                          
                          <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                            <Button
                              variant="contained"
                              color="primary"
                              component={Link}
                              to={`/projects/${milestone.projectId}/milestones/${milestone.id}/verify`}
                              startIcon={<VerifiedUserIcon />}
                              sx={{ mb: 2 }}
                            >
                              Verify Now
                            </Button>
                            
                            <Button
                              variant="outlined"
                              component={Link}
                              to={`/projects/${milestone.projectId}`}
                            >
                              View Project
                            </Button>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Paper>
        )}
        
        {/* Invested Projects */}
        {projects.length > 0 && (
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Your Investments
            </Typography>
            
            <Grid container spacing={3}>
              {projects.map(project => {
                const projectInvestments = investments.filter(inv => inv.projectId === project.id);
                const totalProjectInvestment = projectInvestments.reduce((sum, inv) => sum + inv.amount, 0);
                
                return (
                  <Grid item xs={12} key={project.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Typography variant="h6">{project.title}</Typography>
                          <Chip 
                            label={project.status.charAt(0).toUpperCase() + project.status.slice(1)} 
                            color={project.status === 'active' ? 'success' : 'primary'} 
                            size="small"
                          />
                        </Box>
                        
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <Typography variant="body2" color="text.secondary" paragraph>
                              {project.description.substring(0, 150)}
                              {project.description.length > 150 ? '...' : ''}
                            </Typography>
                            
                            <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                              <Typography variant="body2">
                                <strong>Your Investment:</strong> {formatCurrency(totalProjectInvestment)}
                              </Typography>
                              
                              <Typography variant="body2">
                                <strong>Portfolio Share:</strong> {((totalProjectInvestment / totalInvested) * 100).toFixed(1)}%
                              </Typography>
                            </Box>
                            
                            <Typography variant="body2">
                              <strong>Innovator:</strong> <Link to={`/innovators/${project.userId}`}>View Profile</Link>
                            </Typography>
                          </Grid>
                          
                          <Grid item xs={12} md={6}>
                            {/* Funding Progress */}
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              Funding: {formatCurrency(project.currentFunding)} of {formatCurrency(project.fundingGoal)}
                            </Typography>
                            <LinearProgress 
                              variant="determinate" 
                              value={(project.currentFunding / project.fundingGoal) * 100}
                              sx={{ mb: 2, height: 8, borderRadius: 5 }}
                            />
                            
                            {/* Project Progress */}
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              Project Progress: {project.projectProgress || 0}%
                            </Typography>
                            <LinearProgress 
                              variant="determinate" 
                              value={project.projectProgress || 0}
                              color="success"
                              sx={{ mb: 2, height: 8, borderRadius: 5 }}
                            />
                          </Grid>
                        </Grid>
                      </CardContent>
                      <CardActions>
                        <Button 
                          size="small" 
                          component={Link} 
                          to={`/projects/${project.id}`}
                          startIcon={<VisibilityIcon />}
                        >
                          View Project Details
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Paper>
        )}
        
        {/* Notifications */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <NotificationsActiveIcon sx={{ mr: 1 }} />
            Recent Notifications
          </Typography>
          
          {notifications.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="body1" color="text.secondary">
                No notifications yet.
              </Typography>
            </Box>
          ) : (
            <List>
              {notifications.slice(0, 5).map((notification) => (
                <ListItem 
                  key={notification.id} 
                  alignItems="flex-start"
                  sx={{ 
                    mb: 1, 
                    borderRadius: 1,
                    bgcolor: notification.read ? 'transparent' : 'action.hover'
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 
                      notification.type === 'investment' ? 'success.main' : 
                      notification.type === 'verification' ? 'warning.main' : 
                      'primary.main'
                    }}>
                      {notification.type === 'investment' ? <AttachMoneyIcon /> : 
                       notification.type === 'verification' ? <VerifiedUserIcon /> : 
                       <NotificationsActiveIcon />}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1">
                        {notification.title}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="text.primary">
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(notification.createdAt)}
                        </Typography>
                      </>
                    }
                  />
                  <Button 
                    size="small" 
                    component={Link} 
                    to={notification.link}
                    sx={{ ml: 2, alignSelf: 'center' }}
                  >
                    View
                  </Button>
                </ListItem>
              ))}
              
              {notifications.length > 5 && (
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Button 
                    size="small" 
                    component={Link} 
                    to="/notifications"
                  >
                    View All Notifications
                  </Button>
                </Box>
              )}
            </List>
          )}
        </Paper>
      </>
    );
  };
  
  const renderAdminDashboard = () => {
    const { projects, milestones, notifications } = dashboardData;
    
    return (
      <>
        <Alert severity="info" sx={{ mb: 4 }}>
          <Typography variant="subtitle1">Welcome to the Admin Dashboard</Typography>
          <Typography variant="body2">
            Use this dashboard to manage project approvals, milestone verifications, and escrow funds.
          </Typography>
        </Alert>
        
        {/* Quick Actions */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <BusinessCenterIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
                    <Typography variant="h6" gutterBottom>Project Approvals</Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {projects.length} projects awaiting your approval
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center' }}>
                  <Button 
                    variant="contained" 
                    component={Link} 
                    to="/admin/projects/pending"
                  >
                    Review Projects
                  </Button>
                </CardActions>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <VerifiedUserIcon color="warning" sx={{ fontSize: 48, mb: 2 }} />
                    <Typography variant="h6" gutterBottom>Milestone Verifications</Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {milestones.length} milestones need verification
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center' }}>
                  <Button 
                    variant="contained" 
                    component={Link} 
                    to="/admin/projects?pendingVerification=true"
                  >
                    Verify Milestones
                  </Button>
                </CardActions>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <AccountBalanceIcon color="success" sx={{ fontSize: 48, mb: 2 }} />
                    <Typography variant="h6" gutterBottom>Escrow Management</Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Manage project funds and milestone payments
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center' }}>
                  <Button 
                    variant="contained" 
                    component={Link} 
                    to="/admin/projects"
                  >
                    Manage Escrow
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          </Grid>
        </Paper>
        
        {/* Pending Items */}
        {(projects.length > 0 || milestones.length > 0) && (
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Pending Items
            </Typography>
            
            <List>
              {projects.map(project => (
                <ListItem 
                  key={`project-${project.id}`} 
                  sx={{ 
                    mb: 1, 
                    borderRadius: 1,
                    bgcolor: 'background.default'
                  }}
                >
                  <ListItemIcon>
                    <BusinessCenterIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={`Project Approval: ${project.title}`}
                    secondary={`Submitted on ${formatDate(project.createdAt)} by Innovator #${project.userId}`}
                  />
                  <Button 
                    variant="outlined" 
                    component={Link} 
                    to={`/admin/projects/pending`}
                    sx={{ mr: 1 }}
                  >
                    Review
                  </Button>
                </ListItem>
              ))}
              
              {milestones.map(milestone => (
                <ListItem 
                  key={`milestone-${milestone.id}`} 
                  sx={{ 
                    mb: 1, 
                    borderRadius: 1,
                    bgcolor: 'background.default'
                  }}
                >
                  <ListItemIcon>
                    <VerifiedUserIcon color="warning" />
                  </ListItemIcon>
                  <ListItemText
                    primary={`Milestone Verification: ${milestone.title}`}
                    secondary={`Project #${milestone.projectId} - Submitted on ${formatDate(milestone.verificationDate)}`}
                  />
                  <Button 
                    variant="outlined" 
                    component={Link} 
                    to={`/admin/projects/${milestone.projectId}/milestones/${milestone.id}/verification`}
                  >
                    Verify
                  </Button>
                </ListItem>
              ))}
            </List>
          </Paper>
        )}
        
        {/* Notifications */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <NotificationsActiveIcon sx={{ mr: 1 }} />
            System Notifications
          </Typography>
          
          {notifications.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="body1" color="text.secondary">
                No system notifications.
              </Typography>
            </Box>
          ) : (
            <List>
              {notifications.map((notification) => (
                <ListItem 
                  key={notification.id} 
                  alignItems="flex-start"
                  sx={{ 
                    mb: 1, 
                    borderRadius: 1,
                    bgcolor: notification.read ? 'transparent' : 'action.hover'
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 
                      notification.type === 'admin' ? 'primary.main' : 
                      notification.type === 'verification' ? 'warning.main' : 
                      'error.main'
                    }}>
                      {notification.type === 'admin' ? <BusinessCenterIcon /> : 
                       notification.type === 'verification' ? <VerifiedUserIcon /> : 
                       <NotificationsActiveIcon />}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1">
                        {notification.title}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="text.primary">
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(notification.createdAt)}
                        </Typography>
                      </>
                    }
                  />
                  <Button 
                    size="small" 
                    component={Link} 
                    to={notification.link}
                    sx={{ ml: 2, alignSelf: 'center' }}
                    variant="contained"
                  >
                    Take Action
                  </Button>
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      </>
    );
  };
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <DashboardIcon sx={{ mr: 1 }} />
        Dashboard
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {user.role === 'innovator' && renderInnovatorDashboard()}
          {user.role === 'investor' && renderInvestorDashboard()}
          {user.role === 'admin' && renderAdminDashboard()}
        </>
      )}
    </Container>
  );
};

export default Dashboard;