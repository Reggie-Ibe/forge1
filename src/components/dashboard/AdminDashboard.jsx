// src/components/dashboard/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  Button,
  Divider,
  Chip,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';

// Material UI icons
import PersonIcon from '@mui/icons-material/Person';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import SettingsIcon from '@mui/icons-material/Settings';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import DeleteIcon from '@mui/icons-material/Delete';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RefreshIcon from '@mui/icons-material/Refresh';
import DoneIcon from '@mui/icons-material/Done';

// Recharts
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pendingProjects, setPendingProjects] = useState([]);
  const [pendingDeletions, setPendingDeletions] = useState([]);
  const [pendingMilestones, setPendingMilestones] = useState([]);
  const [pendingDeposits, setPendingDeposits] = useState([]);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState(null);
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [systemSettings, setSystemSettings] = useState({});
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [editedSettings, setEditedSettings] = useState({});
  const [projectStats, setProjectStats] = useState([]);
  const [userStats, setUserStats] = useState([]);
  
  useEffect(() => {
    fetchDashboardData();
  }, [user]);
  
  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Fetch users
      const usersResponse = await fetch(`${apiUrl}/users`);
      if (!usersResponse.ok) throw new Error('Failed to fetch users');
      const usersData = await usersResponse.json();
      setUsers(usersData);
      
      // Fetch projects
      const projectsResponse = await fetch(`${apiUrl}/projects`);
      if (!projectsResponse.ok) throw new Error('Failed to fetch projects');
      const projectsData = await projectsResponse.json();
      setProjects(projectsData);
      
      // Fetch pending projects (status = pending)
      const pendingProjectsData = projectsData.filter(p => p.status === 'pending');
      setPendingProjects(pendingProjectsData);
      
      // Fetch projects pending deletion
      const pendingDeletionsData = projectsData.filter(p => p.pendingDeletion);
      setPendingDeletions(pendingDeletionsData);
      
      // Fetch investments
      const investmentsResponse = await fetch(`${apiUrl}/investments`);
      if (!investmentsResponse.ok) throw new Error('Failed to fetch investments');
      const investmentsData = await investmentsResponse.json();
      setInvestments(investmentsData);
      
      // Fetch milestones that need approval
      const milestonesResponse = await fetch(`${apiUrl}/milestones?status=completed&adminApproved=false`);
      if (!milestonesResponse.ok) throw new Error('Failed to fetch milestones');
      const milestonesData = await milestonesResponse.json();
      setPendingMilestones(milestonesData);
      
      // Fetch pending deposits
      const depositsResponse = await fetch(`${apiUrl}/walletTransactions?status=pending`);
      if (!depositsResponse.ok) throw new Error('Failed to fetch deposits');
      const depositsData = await depositsResponse.json();
      setPendingDeposits(depositsData);
      
      // Fetch system settings
      const settingsResponse = await fetch(`${apiUrl}/systemSettings`);
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        setSystemSettings(settingsData);
        setEditedSettings(settingsData);
      }
      
      // Generate project stats by category
      const categoryCounts = {};
      projectsData.forEach(project => {
        categoryCounts[project.category] = (categoryCounts[project.category] || 0) + 1;
      });
      
      const categoryData = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));
      setProjectStats(categoryData);
      
      // Generate user stats by role
      const roleCounts = {
        innovator: usersData.filter(u => u.role === 'innovator').length,
        investor: usersData.filter(u => u.role === 'investor').length,
        admin: usersData.filter(u => u.role === 'admin').length
      };
      
      const userData = Object.entries(roleCounts).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1) + 's',
        value
      }));
      setUserStats(userData);
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
  
  // Handle milestone approval/rejection
  const handleMilestoneAction = async (approve) => {
    if (!selectedMilestone) return;
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Update milestone
      await fetch(`${apiUrl}/milestones/${selectedMilestone.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminApproved: approve,
          approvedBy: user.id,
          approvedDate: new Date().toISOString(),
        }),
      });
      
      // Update local state
      setPendingMilestones(prev => prev.filter(m => m.id !== selectedMilestone.id));
      setMilestoneDialogOpen(false);
      setSelectedMilestone(null);
    } catch (err) {
      console.error('Error updating milestone:', err);
    }
  };
  
  // Handle deposit approval/rejection
  const handleDepositAction = async (approve) => {
    if (!selectedDeposit) return;
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Update transaction
      await fetch(`${apiUrl}/walletTransactions/${selectedDeposit.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: approve ? 'completed' : 'rejected',
          approvedBy: user.id,
            approvedAt: new Date().toISOString(),
        }),
      });
      
      // Update local state
      setPendingDeposits(prev => prev.filter(d => d.id !== selectedDeposit.id));
      setDepositDialogOpen(false);
      setSelectedDeposit(null);
    } catch (err) {
      console.error('Error updating deposit:', err);
    }
  };
  
  // Handle system settings update
  const handleSettingsUpdate = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Update settings
      await fetch(`${apiUrl}/systemSettings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedSettings),
      });
      
      // Update local state
      setSystemSettings(editedSettings);
      setSettingsDialogOpen(false);
    } catch (err) {
      console.error('Error updating settings:', err);
    }
  };
  
  // Handle project approval
  const handleProjectApproval = async (projectId, approve) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Update project
      await fetch(`${apiUrl}/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: approve ? 'active' : 'rejected',
        }),
      });
      
      // Update local state
      setPendingProjects(prev => prev.filter(p => p.id !== projectId));
    } catch (err) {
      console.error('Error updating project:', err);
    }
  };
  
  // Handle deletion request
  const handleDeletionRequest = async (projectId, approve) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      if (approve) {
        // Delete project
        await fetch(`${apiUrl}/projects/${projectId}`, {
          method: 'DELETE',
        });
      } else {
        // Reject deletion request
        await fetch(`${apiUrl}/projects/${projectId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pendingDeletion: false,
          }),
        });
      }
      
      // Update local state
      setPendingDeletions(prev => prev.filter(p => p.id !== projectId));
    } catch (err) {
      console.error('Error handling deletion request:', err);
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  // Random colors for charts
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
                sx={{ width: 64, height: 64, mr: 2, bgcolor: 'primary.main' }}
              >
                {!user.profileImage && `${user.firstName?.[0]}${user.lastName?.[0]}`}
              </Avatar>
              <Box>
                <Typography variant="h4" gutterBottom>
                  Admin Dashboard
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
              startIcon={<RefreshIcon />}
              onClick={fetchDashboardData}
              sx={{ mr: 2 }}
            >
              Refresh Data
            </Button>
            <Button
              variant="outlined"
              startIcon={<SettingsIcon />}
              onClick={() => setSettingsDialogOpen(true)}
            >
              System Settings
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Dashboard Summary */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Total Users
            </Typography>
            <Typography component="p" variant="h4" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
              {users.length}
            </Typography>
            <Typography color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
              <PersonIcon sx={{ mr: 1, fontSize: 20 }} />
              Active platform users
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Active Projects
            </Typography>
            <Typography component="p" variant="h4" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
              {projects.filter(p => p.status === 'active').length}
            </Typography>
            <Typography color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
              <BusinessCenterIcon sx={{ mr: 1, fontSize: 20 }} />
              Of {projects.length} total projects
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Total Investments
            </Typography>
            <Typography component="p" variant="h4" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
              {investments.length}
            </Typography>
            <Typography color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
              <MonetizationOnIcon sx={{ mr: 1, fontSize: 20 }} />
              Platform transactions
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140, bgcolor: 'warning.light' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Pending Approvals
            </Typography>
            <Typography component="p" variant="h4" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
              {pendingProjects.length + pendingMilestones.length + pendingDeposits.length + pendingDeletions.length}
            </Typography>
            <Typography color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
              <FactCheckIcon sx={{ mr: 1, fontSize: 20 }} />
              Items requiring action
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Main Dashboard Content */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Platform Overview" />
            <Tab label={`Pending Approvals (${pendingProjects.length + pendingMilestones.length + pendingDeposits.length + pendingDeletions.length})`} />
            <Tab label="User Management" />
          </Tabs>
        </Box>
        
        {/* Platform Overview Tab */}
        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Platform Statistics
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: 400 }}>
                  <Typography variant="subtitle1" align="center" gutterBottom>
                    Projects by Category
                  </Typography>
                  <ResponsiveContainer width="100%" height="90%">
                    <PieChart>
                      <Pie
                        data={projectStats}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {projectStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: 400 }}>
                  <Typography variant="subtitle1" align="center" gutterBottom>
                    User Distribution
                  </Typography>
                  <ResponsiveContainer width="100%" height="90%">
                    <BarChart
                      data={userStats}
                      layout="vertical"
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#3f51b5" name="Number of Users" />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
              <Grid item xs={12}>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Metric</TableCell>
                        <TableCell align="right">Value</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>Total Investment Amount</TableCell>
                        <TableCell align="right">
                          {formatCurrency(investments.reduce((sum, inv) => sum + inv.amount, 0))}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Average Investment Size</TableCell>
                        <TableCell align="right">
                          {formatCurrency(
                            investments.length > 0 
                              ? investments.reduce((sum, inv) => sum + inv.amount, 0) / investments.length 
                              : 0
                          )}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Total Funding Goal</TableCell>
                        <TableCell align="right">
                          {formatCurrency(projects.reduce((sum, proj) => sum + proj.fundingGoal, 0))}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Average Funding Progress</TableCell>
                        <TableCell align="right">
                          {projects.length > 0 
                            ? `${(projects.reduce((sum, proj) => sum + (proj.currentFunding / proj.fundingGoal), 0) / projects.length * 100).toFixed(1)}%` 
                            : '0%'
                          }
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          </Box>
        )}
        
        {/* Pending Approvals Tab */}
        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Pending Approvals
            </Typography>
            
            {pendingProjects.length + pendingMilestones.length + pendingDeposits.length + pendingDeletions.length === 0 ? (
              <Alert severity="info" sx={{ mb: 3 }}>
                No pending approvals at this time.
              </Alert>
            ) : (
              <>
                {pendingProjects.length > 0 && (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Project Approvals
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Project Name</TableCell>
                            <TableCell>Category</TableCell>
                            <TableCell>Funding Goal</TableCell>
                            <TableCell>Created By</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell align="center">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {pendingProjects.map((project) => (
                            <TableRow key={project.id}>
                              <TableCell>{project.title}</TableCell>
                              <TableCell>{project.category}</TableCell>
                              <TableCell>{formatCurrency(project.fundingGoal)}</TableCell>
                              <TableCell>User #{project.userId}</TableCell>
                              <TableCell>{formatDate(project.createdAt)}</TableCell>
                              <TableCell align="center">
                                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                  <Tooltip title="View Details">
                                    <IconButton 
                                      size="small" 
                                      component={Link} 
                                      to={`/projects/${project.id}`}
                                    >
                                      <VisibilityIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="View Documents">
                                    <IconButton 
                                      size="small"
                                      disabled={!project.documents?.length}
                                    >
                                      <AttachFileIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Approve">
                                    <IconButton 
                                      size="small" 
                                      color="success"
                                      onClick={() => handleProjectApproval(project.id, true)}
                                    >
                                      <CheckCircleIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Reject">
                                    <IconButton 
                                      size="small" 
                                      color="error"
                                      onClick={() => handleProjectApproval(project.id, false)}
                                    >
                                      <CancelIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}
                
                {pendingMilestones.length > 0 && (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Milestone Approvals
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Project</TableCell>
                            <TableCell>Milestone</TableCell>
                            <TableCell>Due Date</TableCell>
                            <TableCell>Completed Date</TableCell>
                            <TableCell align="center">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {pendingMilestones.map((milestone) => (
                            <TableRow key={milestone.id}>
                              <TableCell>Project #{milestone.projectId}</TableCell>
                              <TableCell>{milestone.title}</TableCell>
                              <TableCell>{formatDate(milestone.dueDate)}</TableCell>
                              <TableCell>{milestone.completedDate ? formatDate(milestone.completedDate) : 'N/A'}</TableCell>
                              <TableCell align="center">
                                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                  <Tooltip title="View Details">
                                    <IconButton 
                                      size="small" 
                                      onClick={() => {
                                        setSelectedMilestone(milestone);
                                        setMilestoneDialogOpen(true);
                                      }}
                                    >
                                      <VisibilityIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="View Documents">
                                    <IconButton 
                                      size="small"
                                      disabled={!milestone.documents?.length}
                                    >
                                      <AttachFileIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Approve">
                                    <IconButton 
                                      size="small" 
                                      color="success"
                                      onClick={() => {
                                        setSelectedMilestone(milestone);
                                        handleMilestoneAction(true);
                                      }}
                                    >
                                      <CheckCircleIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Reject">
                                    <IconButton 
                                      size="small" 
                                      color="error"
                                      onClick={() => {
                                        setSelectedMilestone(milestone);
                                        handleMilestoneAction(false);
                                      }}
                                    >
                                      <CancelIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}
                
                {pendingDeposits.length > 0 && (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Deposit Approvals
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>User</TableCell>
                            <TableCell>Amount</TableCell>
                            <TableCell>Payment Method</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell align="center">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {pendingDeposits.map((deposit) => (
                            <TableRow key={deposit.id}>
                              <TableCell>User #{deposit.userId}</TableCell>
                              <TableCell>{formatCurrency(deposit.amount)}</TableCell>
                              <TableCell>{deposit.paymentMethod.replace('_', ' ').toUpperCase()}</TableCell>
                              <TableCell>{formatDate(deposit.createdAt)}</TableCell>
                              <TableCell align="center">
                                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                  <Tooltip title="View Proof">
                                    <IconButton 
                                      size="small"
                                      disabled={!deposit.paymentProof}
                                    >
                                      <AttachFileIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Approve">
                                    <IconButton 
                                      size="small" 
                                      color="success"
                                      onClick={() => {
                                        setSelectedDeposit(deposit);
                                        handleDepositAction(true);
                                      }}
                                    >
                                      <CheckCircleIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Reject">
                                    <IconButton 
                                      size="small" 
                                      color="error"
                                      onClick={() => {
                                        setSelectedDeposit(deposit);
                                        handleDepositAction(false);
                                      }}
                                    >
                                      <CancelIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}
                
                {pendingDeletions.length > 0 && (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Deletion Requests
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Project</TableCell>
                            <TableCell>Category</TableCell>
                            <TableCell>Current Funding</TableCell>
                            <TableCell>Created By</TableCell>
                            <TableCell align="center">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {pendingDeletions.map((project) => (
                            <TableRow key={project.id}>
                              <TableCell>{project.title}</TableCell>
                              <TableCell>{project.category}</TableCell>
                              <TableCell>{formatCurrency(project.currentFunding)}</TableCell>
                              <TableCell>User #{project.userId}</TableCell>
                              <TableCell align="center">
                                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                  <Tooltip title="View Details">
                                    <IconButton 
                                      size="small" 
                                      component={Link} 
                                      to={`/projects/${project.id}`}
                                    >
                                      <VisibilityIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Approve Deletion">
                                    <IconButton 
                                      size="small" 
                                      color="error"
                                      onClick={() => handleDeletionRequest(project.id, true)}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Reject Deletion">
                                    <IconButton 
                                      size="small" 
                                      color="success"
                                      onClick={() => handleDeletionRequest(project.id, false)}
                                    >
                                      <CancelIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}
              </>
            )}
          </Box>
        )}
        
        {/* User Management Tab */}
        {activeTab === 2 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              User Management
            </Typography>
            
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Joined</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.id}</TableCell>
                      <TableCell>{user.firstName} {user.lastName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip 
                          label={user.role.charAt(0).toUpperCase() + user.role.slice(1)} 
                          color={
                            user.role === 'admin' ? 'error' :
                            user.role === 'investor' ? 'info' : 
                            'success'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <Tooltip title="View Profile">
                            <IconButton size="small">
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton size="small">
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Paper>
      
      {/* Milestone Details Dialog */}
      <Dialog open={milestoneDialogOpen} onClose={() => setMilestoneDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Milestone Details</DialogTitle>
        <DialogContent dividers>
          {selectedMilestone && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Project ID</Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedMilestone.projectId}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Milestone Title</Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedMilestone.title}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Description</Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedMilestone.description}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Due Date</Typography>
                <Typography variant="body1" gutterBottom>
                  {formatDate(selectedMilestone.dueDate)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Completed Date</Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedMilestone.completedDate ? formatDate(selectedMilestone.completedDate) : 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Documents</Typography>
                <List dense>
                  {selectedMilestone.documents?.map((doc, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <AttachFileIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary={doc.name} 
                        secondary={`Uploaded: ${formatDate(doc.uploadedAt)}`}
                      />
                    </ListItem>
                  ))}
                  {(!selectedMilestone.documents || selectedMilestone.documents.length === 0) && (
                    <Typography variant="body2" color="text.secondary">
                      No documents attached
                    </Typography>
                  )}
                </List>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMilestoneDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            color="success" 
            onClick={() => handleMilestoneAction(true)}
            startIcon={<CheckCircleIcon />}
          >
            Approve
          </Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={() => handleMilestoneAction(false)}
            startIcon={<CancelIcon />}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* System Settings Dialog */}
      <Dialog open={settingsDialogOpen} onClose={() => setSettingsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>System Settings</DialogTitle>
        <DialogContent dividers>
          <Typography variant="h6" gutterBottom>Payment Methods</Typography>
          
          <Typography variant="subtitle1" gutterBottom>Bank Transfer</Typography>
          <FormControl fullWidth margin="normal">
            <InputLabel>Status</InputLabel>
            <Select
              value={editedSettings.paymentMethods?.bankTransfer?.enabled ? 'enabled' : 'disabled'}
            onChange={(e) => setEditedSettings({
    ...editedSettings,
    paymentMethods: {
      ...editedSettings.paymentMethods,
      bankTransfer: {
        ...editedSettings.paymentMethods?.bankTransfer,
        enabled: e.target.value === 'enabled'
      }
    }
  })}
>
  <MenuItem value="enabled">Enabled</MenuItem>
  <MenuItem value="disabled">Disabled</MenuItem>
</Select>
</FormControl>

<Grid container spacing={2}>
<Grid item xs={12} sm={6}>
  <TextField
    fullWidth
    margin="normal"
    label="Account Name"
    value={editedSettings.paymentMethods?.bankTransfer?.accountName || ''}
    onChange={(e) => setEditedSettings({
      ...editedSettings,
      paymentMethods: {
        ...editedSettings.paymentMethods,
        bankTransfer: {
          ...editedSettings.paymentMethods?.bankTransfer,
          accountName: e.target.value
        }
      }
    })}
  />
</Grid>
<Grid item xs={12} sm={6}>
  <TextField
    fullWidth
    margin="normal"
    label="Account Number"
    value={editedSettings.paymentMethods?.bankTransfer?.accountNumber || ''}
    onChange={(e) => setEditedSettings({
      ...editedSettings,
      paymentMethods: {
        ...editedSettings.paymentMethods,
        bankTransfer: {
          ...editedSettings.paymentMethods?.bankTransfer,
          accountNumber: e.target.value
        }
      }
    })}
  />
</Grid>
<Grid item xs={12} sm={6}>
  <TextField
    fullWidth
    margin="normal"
    label="Bank Name"
    value={editedSettings.paymentMethods?.bankTransfer?.bankName || ''}
    onChange={(e) => setEditedSettings({
      ...editedSettings,
      paymentMethods: {
        ...editedSettings.paymentMethods,
        bankTransfer: {
          ...editedSettings.paymentMethods?.bankTransfer,
          bankName: e.target.value
        }
      }
    })}
  />
</Grid>
<Grid item xs={12} sm={6}>
  <TextField
    fullWidth
    margin="normal"
    label="SWIFT Code"
    value={editedSettings.paymentMethods?.bankTransfer?.swiftCode || ''}
    onChange={(e) => setEditedSettings({
      ...editedSettings,
      paymentMethods: {
        ...editedSettings.paymentMethods,
        bankTransfer: {
          ...editedSettings.paymentMethods?.bankTransfer,
          swiftCode: e.target.value
        }
      }
    })}
  />
</Grid>
</Grid>

<TextField
fullWidth
margin="normal"
label="Instructions"
multiline
rows={2}
value={editedSettings.paymentMethods?.bankTransfer?.instructions || ''}
onChange={(e) => setEditedSettings({
  ...editedSettings,
  paymentMethods: {
    ...editedSettings.paymentMethods,
    bankTransfer: {
      ...editedSettings.paymentMethods?.bankTransfer,
      instructions: e.target.value
    }
  }
})}
/>

<Divider sx={{ my: 3 }} />

<Typography variant="subtitle1" gutterBottom>Cryptocurrency</Typography>
<FormControl fullWidth margin="normal">
<InputLabel>Status</InputLabel>
<Select
  value={editedSettings.paymentMethods?.crypto?.enabled ? 'enabled' : 'disabled'}
  onChange={(e) => setEditedSettings({
    ...editedSettings,
    paymentMethods: {
      ...editedSettings.paymentMethods,
      crypto: {
        ...editedSettings.paymentMethods?.crypto,
        enabled: e.target.value === 'enabled'
      }
    }
  })}
>
  <MenuItem value="enabled">Enabled</MenuItem>
  <MenuItem value="disabled">Disabled</MenuItem>
</Select>
</FormControl>

<Typography variant="subtitle2" gutterBottom>Wallet Addresses</Typography>

{editedSettings.paymentMethods?.crypto?.acceptedCurrencies?.map((currency, index) => (
<TextField
  key={currency}
  fullWidth
  margin="normal"
  label={`${currency} Wallet Address`}
  value={editedSettings.paymentMethods?.crypto?.walletAddresses?.[currency] || ''}
  onChange={(e) => {
    const updatedWalletAddresses = {
      ...editedSettings.paymentMethods?.crypto?.walletAddresses,
      [currency]: e.target.value
    };
    
    setEditedSettings({
      ...editedSettings,
      paymentMethods: {
        ...editedSettings.paymentMethods,
        crypto: {
          ...editedSettings.paymentMethods?.crypto,
          walletAddresses: updatedWalletAddresses
        }
      }
    });
  }}
/>
))}

<TextField
fullWidth
margin="normal"
label="Instructions"
multiline
rows={2}
value={editedSettings.paymentMethods?.crypto?.instructions || ''}
onChange={(e) => setEditedSettings({
  ...editedSettings,
  paymentMethods: {
    ...editedSettings.paymentMethods,
    crypto: {
      ...editedSettings.paymentMethods?.crypto,
      instructions: e.target.value
    }
  }
})}
/>
</DialogContent>
<DialogActions>
<Button onClick={() => setSettingsDialogOpen(false)}>Cancel</Button>
<Button 
variant="contained" 
color="primary" 
onClick={handleSettingsUpdate}
>
Save Settings
</Button>
</DialogActions>
</Dialog>
</Container>
);
};

export default AdminDashboard;