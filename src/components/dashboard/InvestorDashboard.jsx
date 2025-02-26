// src/pages/Dashboard.jsx (Investor View)
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
  Avatar,
  CircularProgress,
  Alert,
  Stack,
  IconButton,
  Tooltip
} from '@mui/material';

// Material UI icons
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ExploreIcon from '@mui/icons-material/Explore';
import AddIcon from '@mui/icons-material/Add';
import InfoIcon from '@mui/icons-material/Info';
import GroupIcon from '@mui/icons-material/Group';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';

// Recharts
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
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

const InvestorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [investments, setInvestments] = useState([]);
  const [investmentProjects, setInvestmentProjects] = useState([]);
  const [trendingProjects, setTrendingProjects] = useState([]);
  const [syndicates, setSyndicates] = useState([]);
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [investmentsByCategory, setInvestmentsByCategory] = useState([]);
  const [investmentTimeline, setInvestmentTimeline] = useState([]);
  
  useEffect(() => {
    fetchDashboardData();
  }, [user]);
  
  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Fetch user's investments
      const investmentsResponse = await fetch(`${apiUrl}/investments?userId=${user.id}`);
      if (!investmentsResponse.ok) throw new Error('Failed to fetch investments');
      const investmentsData = await investmentsResponse.json();
      setInvestments(investmentsData);
      
      // Fetch investment projects
      if (investmentsData.length > 0) {
        const projectIds = [...new Set(investmentsData.map(inv => inv.projectId))];
        const projectsPromises = projectIds.map(id => 
          fetch(`${apiUrl}/projects/${id}`).then(res => res.ok ? res.json() : null)
        );
        
        const projectsData = (await Promise.all(projectsPromises)).filter(Boolean);
        setInvestmentProjects(projectsData);
        
        // Generate investments by category data
        const categoryCounts = {};
        projectsData.forEach(project => {
          categoryCounts[project.category] = (categoryCounts[project.category] || 0) + 1;
        });
        
        const categoryData = Object.entries(categoryCounts).map(([name, value]) => ({
          name,
          value
        }));
        
        setInvestmentsByCategory(categoryData);
        
        // Generate investment timeline data
        const timelineData = generateInvestmentTimeline(investmentsData);
        setInvestmentTimeline(timelineData);
      }
      
      // Fetch trending projects (latest 5 active projects)
      const trendingResponse = await fetch(`${apiUrl}/projects?status=active&_sort=createdAt&_order=desc&_limit=5`);
      if (trendingResponse.ok) {
        const trendingData = await trendingResponse.json();
        setTrendingProjects(trendingData);
      }
      
      // Fetch wallet transactions
      const walletResponse = await fetch(`${apiUrl}/walletTransactions?userId=${user.id}`);
      if (walletResponse.ok) {
        const walletData = await walletResponse.json();
        setWalletTransactions(walletData);
      }
      
      // Fetch syndicates
      const syndicatesResponse = await fetch(`${apiUrl}/syndicates?members_like=${user.id}`);
      if (syndicatesResponse.ok) {
        const syndicatesData = await syndicatesResponse.json();
        setSyndicates(syndicatesData);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Generate investment timeline data
  const generateInvestmentTimeline = (investmentsData) => {
    const timeline = {};
    
    investmentsData.forEach(investment => {
      const date = new Date(investment.createdAt);
      const yearMonth = date.toISOString().slice(0, 7); // YYYY-MM format
      
      if (!timeline[yearMonth]) {
        timeline[yearMonth] = 0;
      }
      
      timeline[yearMonth] += investment.amount;
    });
    
    // Convert to array and sort by date
    return Object.entries(timeline)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };
  
  // Calculate wallet balance
  const getWalletBalance = () => {
    return walletTransactions.reduce((balance, transaction) => {
      return balance + transaction.amount;
    }, 0);
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
  
  // Calculate total investment amount
  const getTotalInvestment = () => {
    return investments.reduce((total, investment) => total + investment.amount, 0);
  };
  
  // Get project details
  const getProjectDetails = (projectId) => {
    return investmentProjects.find(p => p.id === projectId) || {};
  };
  
  // Random colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
  
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
              startIcon={<ExploreIcon />}
              onClick={() => navigate('/projects')}
              sx={{ mr: 2 }}
            >
              Explore Projects
            </Button>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => navigate('/wallet/deposit')}
            >
              Add Funds
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Dashboard Summary */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Wallet Balance
            </Typography>
            <Typography component="p" variant="h4" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
            {formatCurrency(getWalletBalance())}
            </Typography>
            <Typography color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
              <AccountBalanceWalletIcon sx={{ mr: 1, fontSize: 20 }} />
              Available for investment
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Total Invested
            </Typography>
            <Typography component="p" variant="h4" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
              {formatCurrency(getTotalInvestment())}
            </Typography>
            <Typography color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
              <AttachMoneyIcon sx={{ mr: 1, fontSize: 20 }} />
              Across {investments.length} investments
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Active Projects
            </Typography>
            <Typography component="p" variant="h4" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
              {investmentProjects.filter(p => p.status === 'active').length}
            </Typography>
            <Typography color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
              <AssignmentIcon sx={{ mr: 1, fontSize: 20 }} />
              Projects you're backing
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Syndicates
            </Typography>
            <Typography component="p" variant="h4" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
              {syndicates.length}
            </Typography>
            <Typography color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
              <GroupIcon sx={{ mr: 1, fontSize: 20 }} />
              Investment groups
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Main Dashboard Content */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Portfolio Overview" />
            <Tab label="Investment Analysis" />
            <Tab label="Hot Projects" />
          </Tabs>
        </Box>
        
        {/* Portfolio Overview Tab */}
        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Your Investment Portfolio
            </Typography>
            
            {investments.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" gutterBottom>
                  You haven't made any investments yet.
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate('/projects')}
                  sx={{ mt: 2 }}
                >
                  Explore Projects
                </Button>
              </Box>
            ) : (
              <>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ height: 400, mb: 2 }}>
                      <Typography variant="subtitle1" align="center" gutterBottom>
                        Investment Timeline
                      </Typography>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={investmentTimeline}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis
                            tickFormatter={(value) => `$${value / 1000}k`}
                          />
                          <RechartsTooltip
                            formatter={(value) => [formatCurrency(value), 'Amount']}
                            labelFormatter={(value) => `Date: ${value}`}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="amount"
                            stroke="#8884d8"
                            activeDot={{ r: 8 }}
                            name="Investment Amount"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ height: 400, mb: 2 }}>
                      <Typography variant="subtitle1" align="center" gutterBottom>
                        Investments by Category
                      </Typography>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={investmentsByCategory}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={150}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {investmentsByCategory.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </Grid>
                </Grid>
                
                <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
                  Your Investments
                </Typography>
                
                <List>
                  {investments.map((investment) => {
                    const project = getProjectDetails(investment.projectId);
                    return (
                      <ListItem
                        key={investment.id}
                        sx={{
                          mb: 2,
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: 1,
                          p: 2,
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="subtitle1">
                                {project.title || `Project #${investment.projectId}`}
                              </Typography>
                              <Typography variant="h6" color="primary">
                                {formatCurrency(investment.amount)}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Box sx={{ mt: 1 }}>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                                {project.category && (
                                  <Chip
                                    label={project.category}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                  />
                                )}
                                {project.status && (
                                  <Chip
                                    label={project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                                    size="small"
                                    color={
                                      project.status === 'active' ? 'success' :
                                      project.status === 'pending' ? 'warning' : 'default'
                                    }
                                  />
                                )}
                                {project.sdgs?.slice(0, 3).map(sdg => (
                                  <Chip
                                    key={sdg}
                                    label={sdgNames[sdg]}
                                    size="small"
                                    style={{
                                      backgroundColor: sdgColors[sdg],
                                      color: 'white'
                                    }}
                                  />
                                ))}
                              </Box>
                              
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" color="text.secondary">
                                  Invested on {formatDate(investment.createdAt)}
                                </Typography>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  component={Link}
                                  to={`/projects/${investment.projectId}`}
                                >
                                  View Project
                                </Button>
                              </Box>
                            </Box>
                          }
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </>
            )}
          </Box>
        )}
        
        {/* Investment Analysis Tab */}
        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Investment Analysis
            </Typography>
            
            {investments.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1">
                  No investment data available for analysis.
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Investment Disbursement Schedule
                    </Typography>
                    
                    <List>
                      {investments.map((investment) => {
                        const project = getProjectDetails(investment.projectId);
                        if (!investment.disbursementSchedule) return null;
                        
                        return (
                          <ListItem
                            key={investment.id}
                            sx={{ display: 'block', mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}
                          >
                            <Typography variant="subtitle2" gutterBottom>
                              {project.title || `Project #${investment.projectId}`}
                            </Typography>
                            
                            {investment.disbursementSchedule.map((phase, idx) => (
                              <Box
                                key={idx}
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  my: 1,
                                  pl: 2,
                                  borderLeft: 2,
                                  borderColor: phase.released ? 'success.main' : 'info.main',
                                }}
                              >
                                <Box>
                                  <Typography variant="body2">
                                    {phase.phase} ({phase.percentage}%)
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {phase.condition}
                                  </Typography>
                                </Box>
                                <Box sx={{ textAlign: 'right' }}>
                                  <Typography variant="body2" fontWeight="bold">
                                    {formatCurrency(phase.amount)}
                                  </Typography>
                                  {phase.released ? (
                                    <Typography variant="caption" color="success.main">
                                      Released: {formatDate(phase.releaseDate)}
                                    </Typography>
                                  ) : (
                                    <Typography variant="caption" color="info.main">
                                      Pending release
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            ))}
                          </ListItem>
                        );
                      })}
                    </List>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Wallet Transactions
                    </Typography>
                    
                    <List dense>
                      {walletTransactions.map((transaction) => (
                        <ListItem
                          key={transaction.id}
                          sx={{
                            borderBottom: 1,
                            borderColor: 'divider',
                            py: 1,
                          }}
                        >
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2">
                                  {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                                  {transaction.projectId && ` - Project #${transaction.projectId}`}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color={transaction.amount > 0 ? 'success.main' : 'error.main'}
                                  fontWeight="bold"
                                >
                                  {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(transaction.createdAt)}
                              </Typography>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                    
                    {walletTransactions.length === 0 && (
                      <Typography variant="body2" textAlign="center" sx={{ py: 2 }}>
                        No wallet transactions yet.
                      </Typography>
                    )}
                    
                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => navigate('/wallet/transactions')}
                      >
                        View All Transactions
                      </Button>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            )}
          </Box>
        )}
        
        {/* Hot Projects Tab */}
        {activeTab === 2 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Hot Investment Opportunities
            </Typography>
            
            <Grid container spacing={3}>
              {trendingProjects.length === 0 ? (
                <Grid item xs={12}>
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1">
                      No trending projects available at the moment.
                    </Typography>
                  </Box>
                </Grid>
              ) : (
                trendingProjects.map(project => (
                  <Grid item xs={12} sm={6} md={4} key={project.id}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" gutterBottom noWrap>
                          {project.title}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                          <Chip
                            label={project.category}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          {project.sdgs?.slice(0, 2).map(sdg => (
                            <Chip
                              key={sdg}
                              label={sdgNames[sdg]}
                              size="small"
                              style={{
                                backgroundColor: sdgColors[sdg],
                                color: 'white'
                              }}
                            />
                          ))}
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, height: 60, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {project.description}
                        </Typography>
                        
                        <Box sx={{ mb: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">
                              {formatCurrency(project.currentFunding)} raised
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {formatCurrency(project.fundingGoal)} goal
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min((project.currentFunding / project.fundingGoal) * 100, 100)}
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                          <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', mt: 0.5 }}>
                            {Math.round((project.currentFunding / project.fundingGoal) * 100)}% funded
                          </Typography>
                        </Box>
                      </CardContent>
                      <CardActions>
                        <Button
                          size="small"
                          component={Link}
                          to={`/projects/${project.id}`}
                        >
                          View Details
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          onClick={() => navigate(`/projects/${project.id}?invest=true`)}
                        >
                          Invest Now
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))
              )}
            </Grid>
            
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/projects')}
              >
                Browse All Projects
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
      
      {/* Syndicates Section */}
      {syndicates.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Your Investment Syndicates
          </Typography>
          
          <Grid container spacing={3}>
            {syndicates.map(syndicate => (
              <Grid item xs={12} sm={6} key={syndicate.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {syndicate.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {syndicate.description}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Chip
                        icon={<GroupIcon />}
                        label={`${syndicate.members.length} Members`}
                        variant="outlined"
                        size="small"
                      />
                      <Button
                        size="small"
                        component={Link}
                        to={`/syndicates/${syndicate.id}`}
                      >
                        View Details
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}
    </Container>
  );
};

export default InvestorDashboard;