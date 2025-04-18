// src/components/dashboard/AdminDashboard.jsx - Updated to integrate project approval
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

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
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  CircularProgress,
  Alert,
  Avatar,
  Chip
} from '@mui/material';

// Material UI icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import GroupIcon from '@mui/icons-material/Group';
import SettingsIcon from '@mui/icons-material/Settings';
import PaymentIcon from '@mui/icons-material/Payment';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PeopleIcon from '@mui/icons-material/People';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import BlockIcon from '@mui/icons-material/Block';
import DocumentScannerIcon from '@mui/icons-material/DocumentScanner';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';

// Import admin components
import AdminProjects from '../admin/AdminProjects';
import AdminUserManagement from '../admin/AdminUserManagement';
import AdminSettings from '../admin/AdminSettings';
import UserVerification from '../admin/UserVerification';
import PendingProjectApproval from '../admin/PendingProjectApproval';
import EscrowManagement from '../admin/EscrowManagement';

// Import escrow management and payment methods
import AdminPaymentMethods from '../../pages/AdminPaymentMethods';

const AdminDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [flashMessage, setFlashMessage] = useState('');
  const [stats, setStats] = useState({
    users: { 
      total: 0, 
      investors: 0, 
      innovators: 0, 
      admins: 0,
      pending: 0,
      documentsRequested: 0,
      approved: 0,
      rejected: 0 
    },
    projects: { 
      total: 0, 
      active: 0, 
      pending: 0,
      pending_approval: 0, 
      completed: 0 
    },
    transactions: { total: 0, deposits: 0, investments: 0, disbursements: 0 },
    milestones: { 
      total: 0, 
      completed: 0, 
      inProgress: 0, 
      pending: 0,
      pendingVerification: 0
    }
  });
  
  // Check for messages passed via location state
  useEffect(() => {
    if (location.state?.message) {
      setFlashMessage(location.state.message);
      
      // Clear the location state to prevent message reappearing on refresh
      window.history.replaceState({}, document.title);
      
      // Clear flash message after 5 seconds
      const timer = setTimeout(() => {
        setFlashMessage('');
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [location]);
  
  useEffect(() => {
    // Map location to tab index
    if (location.pathname.includes('/admin/projects')) {
      setActiveTab(1);
    } else if (location.pathname.includes('/admin/wallet')) {
      setActiveTab(2);
    } else if (location.pathname.includes('/admin/users')) {
      setActiveTab(3);
    } else if (location.pathname.includes('/admin/settings')) {
      setActiveTab(4);
    } else {
      setActiveTab(0);
    }
    
    fetchDashboardStats();
  }, [location]);
  
  const fetchDashboardStats = async () => {
    setLoading(true);
    setError('');
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Fetch users
      const usersResponse = await fetch(`${apiUrl}/users`);
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        
        setStats(prevStats => ({
          ...prevStats,
          users: {
            total: usersData.length,
            investors: usersData.filter(u => u.role === 'investor').length,
            innovators: usersData.filter(u => u.role === 'innovator').length,
            admins: usersData.filter(u => u.role === 'admin').length,
            pending: usersData.filter(u => u.verificationStatus === 'pending').length,
            documentsRequested: usersData.filter(u => u.verificationStatus === 'documents_requested').length,
            approved: usersData.filter(u => u.verificationStatus === 'approved').length,
            rejected: usersData.filter(u => u.verificationStatus === 'rejected').length
          }
        }));
      }
      
      // Fetch projects
      const projectsResponse = await fetch(`${apiUrl}/projects`);
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        
        setStats(prevStats => ({
          ...prevStats,
          projects: {
            total: projectsData.length,
            active: projectsData.filter(p => p.status === 'active').length,
            pending: projectsData.filter(p => p.status === 'pending').length,
            pending_approval: projectsData.filter(p => p.status === 'pending_approval').length,
            completed: projectsData.filter(p => p.status === 'completed').length
          }
        }));
      }
      
      // Fetch transactions
      const transactionsResponse = await fetch(`${apiUrl}/walletTransactions`);
      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        
        setStats(prevStats => ({
          ...prevStats,
          transactions: {
            total: transactionsData.length,
            deposits: transactionsData.filter(t => t.type === 'deposit').length,
            investments: transactionsData.filter(t => t.type === 'investment').length,
            disbursements: transactionsData.filter(t => t.type === 'milestone_payment').length
          }
        }));
      }
      
      // Fetch milestones
      const milestonesResponse = await fetch(`${apiUrl}/milestones`);
      if (milestonesResponse.ok) {
        const milestonesData = await milestonesResponse.json();
        
        setStats(prevStats => ({
          ...prevStats,
          milestones: {
            total: milestonesData.length,
            completed: milestonesData.filter(m => m.status === 'completed' && m.adminApproved).length,
            inProgress: milestonesData.filter(m => m.status === 'inProgress').length,
            pending: milestonesData.filter(m => m.status === 'pending').length,
            pendingVerification: milestonesData.filter(m => m.status === 'completed' && !m.adminApproved).length
          }
        }));
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    
    // Navigate to corresponding route
    switch (newValue) {
      case 0:
        navigate('/admin');
        break;
      case 1:
        navigate('/admin/projects');
        break;
      case 2:
        navigate('/admin/wallet');
        break;
      case 3:
        navigate('/admin/users');
        break;
      case 4:
        navigate('/admin/settings');
        break;
      default:
        navigate('/admin');
    }
  };
  
  const renderContent = () => {
    // Check if we're on a specific path first
    if (location.pathname.includes('/admin/projects/pending')) {
      return <PendingProjectApproval />;
    }
    
    if (location.pathname.match(/\/admin\/projects\/\d+\/escrow/)) {
      return <EscrowManagement />;
    }
    
    // Otherwise, render based on tab index
    switch (activeTab) {
      case 1:
        return <AdminProjects />;
      case 2:
        return <AdminPaymentMethods />;
      case 3:
        // Check if we're on the user verification route
        if (location.pathname.includes('/admin/users/verification')) {
          return <UserVerification />;
        }
        return <AdminUserManagement />;
      case 4:
        return <AdminSettings />;
      default:
        return renderDashboardOverview();
    }
  };
  
  const renderDashboardOverview = () => {
    return (
      <Box>
        <Typography variant="h5" gutterBottom>
          Platform Overview
        </Typography>
        
        {flashMessage && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {flashMessage}
          </Alert>
        )}
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" color="primary" gutterBottom>
                    Users
                  </Typography>
                  <Typography variant="h3">{stats.users.total}</Typography>
                  <Box sx={{ mt: 2 }}>
                    <Chip
                      label={`${stats.users.investors} Investors`}
                      size="small"
                      sx={{ mr: 1, mb: 1 }}
                    />
                    <Chip
                      label={`${stats.users.innovators} Innovators`}
                      size="small"
                      sx={{ mr: 1, mb: 1 }}
                    />
                    <Chip
                      label={`${stats.users.admins} Admins`}
                      size="small"
                      sx={{ mb: 1 }}
                    />
                    <Chip
                      label={`${stats.users.pending || 0} Pending Verification`}
                      color="warning"
                      size="small"
                      sx={{ mr: 1, mb: 1 }}
                    />
                  </Box>
                </Paper>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" color="primary" gutterBottom>
                    Projects
                  </Typography>
                  <Typography variant="h3">{stats.projects.total}</Typography>
                  <Box sx={{ mt: 2 }}>
                    <Chip
                      label={`${stats.projects.active} Active`}
                      color="success"
                      size="small"
                      sx={{ mr: 1, mb: 1 }}
                    />
                    <Chip
                      label={`${stats.projects.pending_approval} Pending Approval`}
                      color="warning"
                      size="small"
                      sx={{ mr: 1, mb: 1 }}
                    />
                    <Chip
                      label={`${stats.projects.completed} Completed`}
                      color="info"
                      size="small"
                      sx={{ mb: 1 }}
                    />
                  </Box>
                </Paper>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" color="primary" gutterBottom>
                    Transactions
                  </Typography>
                  <Typography variant="h3">{stats.transactions.total}</Typography>
                  <Box sx={{ mt: 2 }}>
                    <Chip
                      label={`${stats.transactions.deposits} Deposits`}
                      size="small"
                      sx={{ mr: 1, mb: 1 }}
                    />
                    <Chip
                      label={`${stats.transactions.investments} Investments`}
                      size="small"
                      sx={{ mr: 1, mb: 1 }}
                    />
                    <Chip
                      label={`${stats.transactions.disbursements} Disbursements`}
                      size="small"
                      sx={{ mb: 1 }}
                    />
                  </Box>
                </Paper>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" color="primary" gutterBottom>
                    Milestones
                  </Typography>
                  <Typography variant="h3">{stats.milestones.total}</Typography>
                  <Box sx={{ mt: 2 }}>
                    <Chip
                      label={`${stats.milestones.completed} Completed`}
                      color="success"
                      size="small"
                      sx={{ mr: 1, mb: 1 }}
                    />
                    <Chip
                      label={`${stats.milestones.pendingVerification || 0} Pending Verification`}
                      color="warning"
                      size="small"
                      sx={{ mr: 1, mb: 1 }}
                    />
                    <Chip
                      label={`${stats.milestones.inProgress} In Progress`}
                      color="primary"
                      size="small"
                      sx={{ mb: 1 }}
                    />
                  </Box>
                </Paper>
              </Grid>
            </Grid>
            
            {/* Action Cards */}
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <BusinessCenterIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6">Project Management</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Manage all projects on the platform, approve pending projects, and release funds based on milestone completion.
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, p: 2 }}>
                    <Button size="small" component={Link} to="/admin/projects">
                      View All Projects
                    </Button>
                    {stats.projects.pending_approval > 0 && (
                      <Button 
                        size="small" 
                        variant="contained" 
                        color="warning"
                        component={Link} 
                        to="/admin/projects/pending"
                        startIcon={<WarningIcon />}
                      >
                        Approve {stats.projects.pending_approval} Pending Projects
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <AccountBalanceWalletIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6">Payment Settings</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Configure the platform's payment methods, including bank transfer and cryptocurrency options.
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ p: 2 }}>
                    <Button size="small" component={Link} to="/admin/wallet">
                      Payment Methods
                    </Button>
                    <Button 
                      size="small" 
                      variant="outlined"
                      component={Link} 
                      to="/admin/wallet/transactions"
                    >
                      Transaction History
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <GroupIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6">User Management</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Manage platform users, verify user accounts, and request identity documents for verification.
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, p: 2 }}>
                    <Button size="small" component={Link} to="/admin/users">
                      Manage Users
                    </Button>
                    {(stats.users.pending > 0 || stats.users.documentsRequested > 0) && (
                      <Button 
                        size="small" 
                        variant="contained" 
                        color="warning"
                        component={Link} 
                        to="/admin/users/verification"
                      >
                        Verify {stats.users.pending + (stats.users.documentsRequested || 0)} Users
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <AccountBalanceIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6">Escrow Management</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Manage escrow accounts, verify project milestones, and release funds to project owners based on completion.
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, p: 2 }}>
                    <Button 
                      size="small" 
                      component={Link} 
                      to="/admin/projects"
                    >
                      View Projects
                    </Button>
                    {stats.milestones.pendingVerification > 0 && (
                      <Button 
                        size="small" 
                        variant="contained" 
                        color="warning"
                        component={Link} 
                        to="/admin/projects?pendingVerification=true"
                        startIcon={<CheckCircleIcon />}
                      >
                        Verify {stats.milestones.pendingVerification} Milestones
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <SettingsIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6">System Settings</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Configure system-wide settings, security options, and platform parameters.
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ p: 2 }}>
                    <Button size="small" component={Link} to="/admin/settings">
                      System Settings
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            </Grid>
            
            {/* Platform Stats */}
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Pending Approvals
              </Typography>
              
              <Paper sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="warning.main">
                        {stats.projects.pending_approval}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Pending Projects
                      </Typography>
                      <Button 
                        size="small" 
                        variant="contained"
                        color="warning"
                        sx={{ mt: 1 }}
                        component={Link} 
                        to="/admin/projects/pending"
                      >
                        Approve Projects
                      </Button>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="warning.main">
                        {stats.users.pending || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Pending User Verifications
                      </Typography>
                      <Button 
                        size="small" 
                        variant="contained"
                        color="warning"
                        sx={{ mt: 1 }}
                        component={Link} 
                        to="/admin/users/verification"
                      >
                        Verify Users
                      </Button>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="warning.main">
                        {stats.milestones.pendingVerification || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Milestone Verifications
                      </Typography>
                      <Button 
                        size="small" 
                        variant="contained"
                        color="warning"
                        sx={{ mt: 1 }}
                        component={Link} 
                        to="/admin/projects?pendingVerification=true"
                      >
                        Verify Milestones
                      </Button>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="warning.main">
                        {stats.transactions.deposits}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Deposit Approvals
                      </Typography>
                      <Button 
                        size="small" 
                        variant="contained"
                        color="warning"
                        sx={{ mt: 1 }}
                        component={Link} 
                        to="/admin/wallet/transactions?type=deposit&status=pending"
                      >
                        Approve Deposits
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          </>
        )}
      </Box>
    );
  };
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage all aspects of the InnoCap Forge platform
        </Typography>
      </Box>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab 
            label="Overview" 
            icon={<DashboardIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Projects" 
            icon={<BusinessCenterIcon />} 
            iconPosition="start" 
          />
          <Tab 
            label="Payment Methods" 
            icon={<PaymentIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="User Management" 
            icon={<PeopleIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Settings" 
            icon={<SettingsIcon />} 
            iconPosition="start"
          />
        </Tabs>
      </Box>
      
      <Box>
        {renderContent()}
      </Box>
    </Container>
  );
};

export default AdminDashboard;