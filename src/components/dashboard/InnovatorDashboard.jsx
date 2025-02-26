// src/pages/Dashboard.jsx (Innovator View)
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Material UI components
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  CardActions,
  Button,
  Divider,
  Chip,
  LinearProgress,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Avatar
} from '@mui/material';

// Material UI icons
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PendingIcon from '@mui/icons-material/Pending';
import PersonIcon from '@mui/icons-material/Person';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssignmentIcon from '@mui/icons-material/Assignment';

// Recharts
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

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

const InnovatorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [investors, setInvestors] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [selectedProject, setSelectedProject] = useState(null);
  const [fundingTrend, setFundingTrend] = useState([]);
  
  useEffect(() => {
    fetchDashboardData();
  }, [user]);
  
  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Fetch user's projects
      const projectsResponse = await fetch(`${apiUrl}/projects?userId=${user.id}`);
      if (!projectsResponse.ok) throw new Error('Failed to fetch projects');
      const projectsData = await projectsResponse.json();
      setProjects(projectsData);
      
      if (projectsData.length > 0) {
        // Select the first project by default
        setSelectedProject(projectsData[0]);
        
        // Fetch milestones for all projects
        const milestonesPromises = projectsData.map(project => 
          fetch(`${apiUrl}/milestones?projectId=${project.id}`)
            .then(res => res.ok ? res.json() : [])
        );
        
        const allMilestones = await Promise.all(milestonesPromises);
        setMilestones(allMilestones.flat());
        
        // Fetch investors for selected project
        const investmentsResponse = await fetch(`${apiUrl}/investments?projectId=${projectsData[0].id}`);
        if (investmentsResponse.ok) {
          const investmentsData = await investmentsResponse.json();
          
          // Fetch investor details
          const investorIds = [...new Set(investmentsData.map(inv => inv.userId))];
          const investorsPromises = investorIds.map(id => 
            fetch(`${apiUrl}/users/${id}`).then(res => res.ok ? res.json() : null)
          );
          
          const investorsData = (await Promise.all(investorsPromises)).filter(Boolean);
          setInvestors(investorsData);
        }
        
        // Generate funding trend data (mock data based on project creation date)
        const mockFundingTrend = generateMockFundingTrend(projectsData[0]);
        setFundingTrend(mockFundingTrend);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleProjectChange = async (event) => {
    const projectId = event.target.value;
    const selectedProj = projects.find(p => p.id === projectId);
    setSelectedProject(selectedProj);
    
    if (selectedProj) {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        
        // Fetch investors for selected project
        const investmentsResponse = await fetch(`${apiUrl}/investments?projectId=${projectId}`);
        if (investmentsResponse.ok) {
          const investmentsData = await investmentsResponse.json();
          
          // Fetch investor details
          const investorIds = [...new Set(investmentsData.map(inv => inv.userId))];
          const investorsPromises = investorIds.map(id => 
            fetch(`${apiUrl}/users/${id}`).then(res => res.ok ? res.json() : null)
          );
          
          const investorsData = (await Promise.all(investorsPromises)).filter(Boolean);
          setInvestors(investorsData);
        } else {
          setInvestors([]);
        }
        
        // Generate funding trend data
        const mockFundingTrend = generateMockFundingTrend(selectedProj);
        setFundingTrend(mockFundingTrend);
      } catch (err) {
        console.error('Error fetching project details:', err);
      }
    }
  };
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Helper to generate mock funding trend data
  const generateMockFundingTrend = (project) => {
    if (!project) return [];
    
    const startDate = new Date(project.createdAt);
    const today = new Date();
    const monthsDiff = differenceInMonths(today, startDate);
    
    const result = [];
    let cumulativeFunding = 0;
    
    for (let i = 0; i <= monthsDiff; i++) {
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + i);
      
      // Generate a random funding amount for each month
      // In a real app, this would come from actual investment data
      const monthlyFunding = i === 0 ? 0 : Math.floor(Math.random() * 30000) + 10000;
      cumulativeFunding += monthlyFunding;
      
      // Ensure the total doesn't exceed the current funding amount
      const adjustedFunding = Math.min(cumulativeFunding, project.currentFunding);
      
      result.push({
        date: date.toISOString().slice(0, 7), // YYYY-MM format
        funding: adjustedFunding
      });
    }
    
    return result;
  };
  
  // Helper function to calculate months difference
  const differenceInMonths = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    let months = (d1.getFullYear() - d2.getFullYear()) * 12;
    months -= d2.getMonth();
    months += d1.getMonth();
    return months <= 0 ? 0 : months;
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  // Get project milestones
  const getProjectMilestones = (projectId) => {
    return milestones.filter(m => m.projectId === projectId);
  };
  
  // Calculate milestone statistics
  const getMilestoneStats = (projectId) => {
    const projectMilestones = getProjectMilestones(projectId);
    const total = projectMilestones.length;
    const completed = projectMilestones.filter(m => m.status === 'completed').length;
    const inProgress = projectMilestones.filter(m => m.status === 'inProgress').length;
    const pending = projectMilestones.filter(m => m.status === 'pending').length;
    
    return { total, completed, inProgress, pending };
  };
  
  // Calculate total funding across all projects
  const getTotalFunding = () => {
    return projects.reduce((sum, project) => sum + project.currentFunding, 0);
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Header Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar
                src={user.profileImage}
                sx={{ width: 64, height: 64, mr: 2 }}
              >
                {!user.profileImage && `${user.firstName?.[0]}${user.lastName?.[0]}`}
              </Avatar>
              <Box>
                <Typography variant="h4" gutterBottom>
                  Welcome, {user.firstName}!
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => navigate('/projects/create')}
            >
              Create New Project
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Dashboard Summary */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Total Projects
            </Typography>
            <Typography component="p" variant="h4" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
              {projects.length}
            </Typography>
            <Typography color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
              <AssignmentIcon sx={{ mr: 1, fontSize: 20 }} />
              Active: {projects.filter(p => p.status === 'active').length}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Total Funding
            </Typography>
            <Typography component="p" variant="h4" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
              {formatCurrency(getTotalFunding())}
            </Typography>
            <Typography color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
              <AttachMoneyIcon sx={{ mr: 1, fontSize: 20 }} />
                Across {projects.length} projects
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Total Investors
            </Typography>
            <Typography component="p" variant="h4" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
              {investors.length}
            </Typography>
            <Typography color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
              <PersonIcon sx={{ mr: 1, fontSize: 20 }} />
              Supporting your projects
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Funding Goal Progress
            </Typography>
            <Typography component="p" variant="h4" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
              {projects.length > 0 ? 
                `${Math.round((getTotalFunding() / projects.reduce((sum, p) => sum + p.fundingGoal, 0)) * 100)}%` : 
                '0%'
              }
            </Typography>
            <Typography color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
              <TrendingUpIcon sx={{ mr: 1, fontSize: 20 }} />
              Overall completion
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Project Selection */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Project Milestone & Funding Dashboard
        </Typography>
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel id="project-select-label">Select Project</InputLabel>
          <Select
            labelId="project-select-label"
            id="project-select"
            value={selectedProject?.id || ''}
            label="Select Project"
            onChange={handleProjectChange}
          >
            {projects.map((project) => (
              <MenuItem key={project.id} value={project.id}>
                {project.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>
      
      {selectedProject ? (
        <>
          {/* Project Overview */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h5" gutterBottom>
                    {selectedProject.title}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    <Chip
                      label={selectedProject.category}
                      color="primary"
                      variant="outlined"
                    />
                    <Chip
                      label={selectedProject.status.charAt(0).toUpperCase() + selectedProject.status.slice(1)}
                      color={
                        selectedProject.status === 'active' ? 'success' :
                        selectedProject.status === 'pending' ? 'warning' : 'default'
                      }
                    />
                    {selectedProject.sdgs?.map(sdg => (
                      <Chip
                        key={sdg}
                        label={sdgNames[sdg]}
                        style={{
                          backgroundColor: sdgColors[sdg],
                          color: 'white'
                        }}
                      />
                    ))}
                  </Box>
                  <Typography variant="body1">
                    {selectedProject.description}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="h6" align="center" gutterBottom>
                    {formatCurrency(selectedProject.currentFunding)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" align="center" gutterBottom>
                    of {formatCurrency(selectedProject.fundingGoal)} target
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min((selectedProject.currentFunding / selectedProject.fundingGoal) * 100, 100)}
                    sx={{ height: 10, borderRadius: 5, my: 1 }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">
                      {Math.round((selectedProject.currentFunding / selectedProject.fundingGoal) * 100)}% Funded
                    </Typography>
                    <Typography variant="body2">
                      {investors.length} Investors
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>
          
          {/* Project Tabs */}
          <Paper sx={{ mb: 3 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={activeTab} onChange={handleTabChange}>
                <Tab label="Milestone Progress" />
                <Tab label="Funding Progress" />
                <Tab label="Investment Details" />
              </Tabs>
            </Box>
            
            {/* Milestone Progress Tab */}
            {activeTab === 0 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Milestone Timeline
                </Typography>
                
                <Box sx={{ mb: 4 }}>
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6} sm={3}>
                      <Paper 
                        elevation={0} 
                        sx={{ 
                          p: 2, 
                          textAlign: 'center',
                          bgcolor: 'grey.100',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center'
                        }}
                      >
                        <Typography variant="h5" color="text.primary">
                          {getMilestoneStats(selectedProject.id).total}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Milestones
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Paper 
                        elevation={0} 
                        sx={{ 
                          p: 2, 
                          textAlign: 'center',
                          bgcolor: 'success.light',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center'
                        }}
                      >
                        <Typography variant="h5" color="success.dark">
                          {getMilestoneStats(selectedProject.id).completed}
                        </Typography>
                        <Typography variant="body2" color="success.dark">
                          Completed
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Paper 
                        elevation={0} 
                        sx={{ 
                          p: 2, 
                          textAlign: 'center',
                          bgcolor: 'warning.light',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center'
                        }}
                      >
                        <Typography variant="h5" color="warning.dark">
                          {getMilestoneStats(selectedProject.id).inProgress}
                        </Typography>
                        <Typography variant="body2" color="warning.dark">
                          In Progress
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Paper 
                        elevation={0} 
                        sx={{ 
                          p: 2, 
                          textAlign: 'center',
                          bgcolor: 'info.light',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center'
                        }}
                      >
                        <Typography variant="h5" color="info.dark">
                          {getMilestoneStats(selectedProject.id).pending}
                        </Typography>
                        <Typography variant="body2" color="info.dark">
                          Pending
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                  
                  <List>
                    {getProjectMilestones(selectedProject.id).map((milestone) => (
                      <ListItem 
                        key={milestone.id}
                        sx={{
                          mb: 2,
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: 1,
                          bgcolor: 
                            milestone.status === 'completed' ? 'success.50' :
                            milestone.status === 'inProgress' ? 'warning.50' : 'grey.50',
                        }}
                      >
                        <ListItemIcon>
                          {milestone.status === 'completed' ? (
                            <CheckCircleIcon color="success" />
                          ) : milestone.status === 'inProgress' ? (
                            <AccessTimeIcon color="warning" />
                          ) : (
                            <PendingIcon color="disabled" />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="subtitle1">
                                {milestone.title}
                              </Typography>
                              <Chip
                                size="small"
                                label={
                                  milestone.status === 'completed' ? 'Completed' :
                                  milestone.status === 'inProgress' ? 'In Progress' : 'Pending'
                                }
                                color={
                                  milestone.status === 'completed' ? 'success' :
                                  milestone.status === 'inProgress' ? 'warning' : 'default'
                                }
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2">
                                {milestone.description}
                              </Typography>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                <Typography variant="caption" color="text.secondary">
                                  Due: {formatDate(milestone.dueDate)}
                                </Typography>
                                {milestone.completedDate && (
                                  <Typography variant="caption" color="success.main">
                                    Completed: {formatDate(milestone.completedDate)}
                                  </Typography>
                                )}
                              </Box>
                              {milestone.adminApproved && (
                                <Typography variant="caption" color="success.main" sx={{ display: 'block' }}>
                                  Admin Approved: {formatDate(milestone.approvedDate)}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                  
                  <Box sx={{ mt: 3, textAlign: 'center' }}>
                    <Button
                      variant="outlined"
                      component={Link}
                      to={`/projects/${selectedProject.id}/milestones/add`}
                    >
                      Add New Milestone
                    </Button>
                  </Box>
                </Box>
              </Box>
            )}
            
            {/* Funding Progress Tab */}
            {activeTab === 1 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Funding Progress
                </Typography>
                
                <Box sx={{ height: 400, mb: 4 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={fundingTrend}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis 
                        tickFormatter={(value) => `$${value / 1000}k`}
                      />
                      <Tooltip 
                        formatter={(value) => [formatCurrency(value), 'Total Funding']}
                        labelFormatter={(value) => `Date: ${value}`}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="funding" 
                        stroke="#2196f3" 
                        activeDot={{ r: 8 }}
                        name="Total Funding"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
                
                <Typography variant="h6" gutterBottom>
                  Funding Breakdown
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <Box sx={{ maxWidth: 600, width: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Current Funding:
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {formatCurrency(selectedProject.currentFunding)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Funding Goal:
                      </Typography>
                      <Typography variant="body1">
                        {formatCurrency(selectedProject.fundingGoal)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Funding Progress:
                      </Typography>
                      <Typography variant="body1">
                        {Math.round((selectedProject.currentFunding / selectedProject.fundingGoal) * 100)}%
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Remaining to Goal:
                      </Typography>
                      <Typography variant="body1">
                        {formatCurrency(Math.max(0, selectedProject.fundingGoal - selectedProject.currentFunding))}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Number of Investors:
                      </Typography>
                      <Typography variant="body1">
                        {investors.length}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            )}
            
            {/* Investment Details Tab */}
            {activeTab === 2 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Investment Details
                </Typography>
                
                <List>
                  {investors.map((investor) => (
                    <ListItem 
                      key={investor.id}
                      sx={{
                        mb: 2,
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                      }}
                    >
                      <ListItemIcon>
                        <Avatar
                          src={investor.profileImage}
                          alt={`${investor.firstName} ${investor.lastName}`}
                        >
                          {investor.firstName?.[0]}{investor.lastName?.[0]}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle1">
                              {investor.firstName} {investor.lastName}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Investor
                            </Typography>
                            <Button
                              size="small"
                              variant="outlined"
                              sx={{ mt: 1 }}
                              component={Link}
                              to={`/messages`}
                              state={{ contactId: investor.id }}
                            >
                              Contact Investor
                            </Button>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
                
                {investors.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No investors yet for this project.
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Paper>
        </>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            You don't have any projects yet
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Create your first project to start tracking milestones and funding.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/projects/create')}
          >
            Create New Project
          </Button>
        </Paper>
      )}
    </Container>
  );
};

export default InnovatorDashboard;