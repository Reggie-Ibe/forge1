// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Material UI components
import {
  Box,
  Typography,
  Container,
  Grid,
  Paper,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Button,
  Alert
} from '@mui/material';

// Recharts for data visualization
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [activeView, setActiveView] = useState(0);
  const [fundingTrend, setFundingTrend] = useState([]);
  const [milestoneMetrics, setMilestoneMetrics] = useState({ completed: 0, inProgress: 0, pending: 0, total: 0 });
  const [sdgImpact, setSdgImpact] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Fetch dashboard data
    fetchDashboardData();
  }, [isAuthenticated, navigate]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // In a real app, these would be API calls
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Fetch projects
      if (user) {
        const projectsResponse = await fetch(`${apiUrl}/projects?userId=${user.id}`);
        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          setProjects(projectsData);
        }
      }
      
      // For demo purposes, we'll use mock data
      setMockData();
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const setMockData = () => {
    // Mock funding trend data
    setFundingTrend([
      { month: 'Jan', funding: 125000 },
      { month: 'Feb', funding: 210000 },
      { month: 'Mar', funding: 350000 },
      { month: 'Apr', funding: 475000 },
      { month: 'May', funding: 520000 },
      { month: 'Jun', funding: 620000 }
    ]);

    // Mock milestone metrics
    setMilestoneMetrics({ 
      completed: 10, 
      inProgress: 5, 
      pending: 3, 
      total: 18 
    });

    // Mock SDG impact data
    setSdgImpact([
      { name: 'No Poverty', value: 5, color: '#E5243B' },
      { name: 'Zero Hunger', value: 3, color: '#DDA63A' },
      { name: 'Clean Water', value: 4, color: '#4C9F38' },
      { name: 'Climate Action', value: 6, color: '#3F7E44' },
      { name: 'Quality Education', value: 2, color: '#C5192D' }
    ]);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  const handleTabChange = (event, newValue) => {
    setActiveView(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Loading dashboard...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Paper sx={{ p: 4, maxWidth: 500, width: '100%' }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button variant="contained" onClick={fetchDashboardData}>
            Try Again
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome back, {user?.firstName || 'User'}! Here's an overview of your {user?.role === 'investor' ? 'investments' : 'projects'}.
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeView} onChange={handleTabChange} aria-label="dashboard views">
          <Tab label="Overview" />
          <Tab label="Funding" />
          <Tab label="Milestones" />
          <Tab label="Impact" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Paper sx={{ p: 3 }}>
        {/* Overview Tab */}
        {activeView === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Funding Overview
            </Typography>
            <Box sx={{ height: 400, mt: 2 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={fundingTrend}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis 
                    tickFormatter={(value) => `$${value / 1000}k`}
                    domain={[0, 'dataMax + 100000']}
                  />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value), 'Funding']}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="funding" 
                    stroke="#3f51b5" 
                    strokeWidth={2}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>

            <Grid container spacing={3} sx={{ mt: 2 }}>
              <Grid item xs={12} md={4}>
                <Card sx={{ bgcolor: '#e3f2fd' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#1976d2' }}>
                      Total Funding
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ mt: 1, fontWeight: 'bold', color: '#0d47a1' }}>
                      {formatCurrency(fundingTrend.reduce((acc, item) => acc + item.funding, 0))}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ bgcolor: '#e8f5e9' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#2e7d32' }}>
                      Total Projects
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ mt: 1, fontWeight: 'bold', color: '#1b5e20' }}>
                      {projects.length}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ bgcolor: '#f3e5f5' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#7b1fa2' }}>
                      Milestone Completion
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ mt: 1, fontWeight: 'bold', color: '#4a148c' }}>
                      {milestoneMetrics.completed}/{milestoneMetrics.total}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Funding Tab */}
        {activeView === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Monthly Funding
            </Typography>
            <Box sx={{ height: 400, mt: 2 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={fundingTrend}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis 
                    tickFormatter={(value) => `$${value / 1000}k`}
                  />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value), 'Funding']}
                  />
                  <Legend />
                  <Bar dataKey="funding" fill="#2e7d32" />
                </BarChart>
              </ResponsiveContainer>
            </Box>

            <Grid container spacing={3} sx={{ mt: 2 }}>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="primary">
                      Total Funding
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ mt: 1, fontWeight: 'bold' }}>
                      {formatCurrency(fundingTrend.reduce((acc, item) => acc + item.funding, 0))}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="primary">
                      Average Monthly
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ mt: 1, fontWeight: 'bold' }}>
                      {formatCurrency(fundingTrend.reduce((acc, item) => acc + item.funding, 0) / fundingTrend.length)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="primary">
                      Growth Rate
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ mt: 1, fontWeight: 'bold' }}>
                      {fundingTrend.length > 1 ? 
                        `${(((fundingTrend[fundingTrend.length - 1].funding / fundingTrend[0].funding) - 1) * 100).toFixed(1)}%` : 
                        'N/A'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Milestones Tab */}
        {activeView === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Milestone Completion
            </Typography>
            
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Total
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {milestoneMetrics.total}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', bgcolor: '#e8f5e9' }}>
                  <Typography variant="body2" color="text.secondary">
                    Completed
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                    {milestoneMetrics.completed}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', bgcolor: '#fff8e1' }}>
                  <Typography variant="body2" color="text.secondary">
                    In Progress
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: '#f57f17' }}>
                    {milestoneMetrics.inProgress}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', bgcolor: '#ffebee' }}>
                  <Typography variant="body2" color="text.secondary">
                    Pending
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: '#c62828' }}>
                    {milestoneMetrics.pending}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
            
            <Card>
              <CardHeader title="Recent Updates" />
              <Divider />
              <List>
                <ListItem divider>
                  <ListItemText 
                    primary="Prototype Development" 
                    secondary="Engineering team is finalizing the first working prototype. Expected completion next week."
                    primaryTypographyProps={{ fontWeight: 'medium' }}
                  />
                  <Chip label="In Progress" color="warning" size="small" />
                </ListItem>
                <ListItem divider>
                  <ListItemText 
                    primary="Patent Application" 
                    secondary="Legal team is preparing documentation for patent application."
                    primaryTypographyProps={{ fontWeight: 'medium' }}
                  />
                  <Chip label="Pending" color="error" size="small" />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Market Research" 
                    secondary="Initial market research and competitive analysis has been completed."
                    primaryTypographyProps={{ fontWeight: 'medium' }}
                  />
                  <Chip label="Completed" color="success" size="small" />
                </ListItem>
              </List>
            </Card>
          </Box>
        )}

        {/* Impact Tab */}
        {activeView === 3 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              SDG Impact
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sdgImpact}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        dataKey="value"
                      >
                        {sdgImpact.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Impact Breakdown
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {sdgImpact.map((sdg, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box 
                            sx={{ 
                              width: 12, 
                              height: 12, 
                              borderRadius: '50%', 
                              bgcolor: sdg.color, 
                              mr: 1 
                            }} 
                          />
                          <Typography variant="body2">{sdg.name}</Typography>
                        </Box>
                        <Typography variant="body2">{sdg.value} projects</Typography>
                      </Box>
                      <Box sx={{ width: '100%', bgcolor: '#e0e0e0', height: 8, borderRadius: 4 }}>
                        <Box 
                          sx={{ 
                            height: '100%', 
                            borderRadius: 4,
                            width: `${(sdg.value / sdgImpact.reduce((acc, item) => acc + item.value, 0)) * 100}%`,
                            bgcolor: sdg.color 
                          }}
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 4 }}>
              <Typography variant="subtitle1" gutterBottom>
                Impact Stories
              </Typography>
              <Alert severity="success" sx={{ mt: 1 }}>
                <Typography variant="subtitle2">
                  Project Spotlight: Clean Water Initiative
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Our clean water project has successfully provided access to clean drinking water for over 5,000 people in rural communities, contributing directly to SDG 6 (Clean Water and Sanitation).
                </Typography>
              </Alert>
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default Dashboard;