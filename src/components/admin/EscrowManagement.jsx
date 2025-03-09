// src/components/admin/EscrowManagement.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Material UI Components
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemText,
  List,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  LinearProgress
} from '@mui/material';

// Material UI Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import HistoryIcon from '@mui/icons-material/History';
import TimelineIcon from '@mui/icons-material/Timeline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';

const EscrowManagement = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [project, setProject] = useState(null);
  const [innovator, setInnovator] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [escrowTransactions, setEscrowTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  
  // Manual fund release
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [releaseAmount, setReleaseAmount] = useState(0);
  const [releaseNotes, setReleaseNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Escrow statistics
  const [escrowStats, setEscrowStats] = useState({
    totalEscrow: 0,
    releasedFunds: 0,
    pendingRelease: 0,
    availableBalance: 0
  });
  
  useEffect(() => {
    fetchProjectData();
  }, [projectId]);
  
  const fetchProjectData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Fetch project
      const projectResponse = await fetch(`${apiUrl}/projects/${projectId}`);
      if (!projectResponse.ok) {
        throw new Error('Project not found');
      }
      
      const projectData = await projectResponse.json();
      setProject(projectData);
      
      // Fetch innovator
      const innovatorResponse = await fetch(`${apiUrl}/users/${projectData.userId}`);
      if (innovatorResponse.ok) {
        const innovatorData = await innovatorResponse.json();
        setInnovator(innovatorData);
      }
      
      // Fetch milestones
      const milestonesResponse = await fetch(`${apiUrl}/milestones?projectId=${projectId}`);
      if (milestonesResponse.ok) {
        const milestonesData = await milestonesResponse.json();
        setMilestones(milestonesData);
      }
      
      // Fetch investments
      const investmentsResponse = await fetch(`${apiUrl}/investments?projectId=${projectId}`);
      if (investmentsResponse.ok) {
        const investmentsData = await investmentsResponse.json();
        setInvestments(investmentsData);
      }
      
      // Fetch escrow transactions
      const transactionsResponse = await fetch(`${apiUrl}/escrowTransactions?projectId=${projectId}`);
      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        setEscrowTransactions(transactionsData);
      }
      
      // Calculate escrow statistics
      calculateEscrowStats(projectData, investmentsData, transactionsData);
      
    } catch (err) {
      console.error('Error fetching project data:', err);
      setError(err.message || 'Failed to load project data');
    } finally {
      setLoading(false);
    }
  };
  
  const calculateEscrowStats = (projectData, investmentsData, transactionsData) => {
    // Calculate total escrow (total investment amount)
    const totalEscrow = investmentsData.reduce((sum, inv) => sum + inv.amount, 0);
    
    // Calculate released funds (total of transactions)
    const releasedFunds = transactionsData.reduce((sum, tx) => sum + tx.amount, 0);
    
    // Calculate pending release (funds for completed milestones not yet released)
    const completedMilestonesEstimatedFunding = milestones
      .filter(m => m.status === 'completed' && m.adminApproved && !transactionsData.some(tx => tx.milestoneId === m.id))
      .reduce((sum, m) => sum + (m.estimatedFunding || 0), 0);
    
    // Calculate available balance (total escrow minus released funds)
    const availableBalance = totalEscrow - releasedFunds;
    
    setEscrowStats({
      totalEscrow,
      releasedFunds,
      pendingRelease: completedMilestonesEstimatedFunding,
      availableBalance
    });
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Open fund release dialog
  const handleOpenReleaseDialog = (milestone) => {
    setSelectedMilestone(milestone);
    setReleaseAmount(milestone.estimatedFunding || 0);
    setReleaseNotes(`Fund release for milestone: ${milestone.title}`);
    setIsDialogOpen(true);
  };
  
  // Handle fund release
  const handleReleaseFunds = async () => {
    if (!selectedMilestone || releaseAmount <= 0) return;
    
    setIsSubmitting(true);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Create escrow transaction
      const response = await fetch(`${apiUrl}/escrowTransactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: parseInt(projectId),
          milestoneId: selectedMilestone.id,
          amount: parseFloat(releaseAmount),
          type: 'milestone_payment',
          status: 'completed',
          releasedBy: user.id,
          releasedAt: new Date().toISOString(),
          note: releaseNotes,
          createdAt: new Date().toISOString()
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to release funds');
      }
      
      // Update project funding if needed
      const projectUpdateResponse = await fetch(`${apiUrl}/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentFunding: project.currentFunding + parseFloat(releaseAmount)
        }),
      });
      
      if (!projectUpdateResponse.ok) {
        console.warn('Warning: Failed to update project funding');
      }
      
      // Success message and refresh data
      setSuccessMessage(`Successfully released ${formatCurrency(releaseAmount)} for milestone: ${selectedMilestone.title}`);
      setIsDialogOpen(false);
      
      // Refresh data
      fetchProjectData();
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      
    } catch (err) {
      console.error('Error releasing funds:', err);
      setError(err.message || 'Failed to release funds');
    } finally {
      setIsSubmitting(false);
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
  
  // Format time
  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
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
          onClick={() => navigate('/admin/projects')}
        >
          Back to Projects
        </Button>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/admin/projects')}
        >
          Back to Projects
        </Button>
      </Box>
      
      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}
      
      <Typography variant="h4" component="h1" gutterBottom>
        Escrow Management
      </Typography>
      
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Project: <strong>{project?.title}</strong>
      </Typography>
      
      {/* Escrow Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <AccountBalanceIcon sx={{ mr: 1 }} /> Total Escrow
              </Typography>
              <Typography variant="h4" component="div">
                {formatCurrency(escrowStats.totalEscrow)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Total funds invested in project
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <AttachMoneyIcon sx={{ mr: 1 }} /> Released Funds
              </Typography>
              <Typography variant="h4" component="div">
                {formatCurrency(escrowStats.releasedFunds)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Released to project innovator
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <TimelineIcon sx={{ mr: 1 }} /> Pending Release
              </Typography>
              <Typography variant="h4" component="div">
                {formatCurrency(escrowStats.pendingRelease)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Approved milestones awaiting release
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <AccountBalanceIcon sx={{ mr: 1 }} /> Available Balance
              </Typography>
              <Typography variant="h4" component="div">
                {formatCurrency(escrowStats.availableBalance)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Remaining funds in escrow
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab icon={<TimelineIcon />} iconPosition="start" label="Milestone Payments" />
          <Tab icon={<HistoryIcon />} iconPosition="start" label="Transaction History" />
          <Tab icon={<BusinessCenterIcon />} iconPosition="start" label="Project Details" />
        </Tabs>
      </Paper>
      
      {/* Tab Content */}
      {activeTab === 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Milestone Payment Management
          </Typography>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Release funds for completed and verified milestones. The funds will be transferred from the project escrow to the innovator's project balance.
            </Typography>
          </Alert>
          
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Milestone</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Estimated Funding</TableCell>
                  <TableCell>Completion Date</TableCell>
                  <TableCell>Release Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {milestones.map((milestone) => {
                  const isTransactionExists = escrowTransactions.some(tx => 
                    tx.milestoneId === milestone.id && tx.type === 'milestone_payment'
                  );
                  
                  const transaction = escrowTransactions.find(tx => 
                    tx.milestoneId === milestone.id && tx.type === 'milestone_payment'
                  );
                  
                  return (
                    <TableRow key={milestone.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {milestone.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Due: {formatDate(milestone.dueDate)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={
                            milestone.status === 'completed' && milestone.adminApproved ? 'Verified & Completed' :
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
                      </TableCell>
                      <TableCell>
                        {formatCurrency(milestone.estimatedFunding || 0)}
                      </TableCell>
                      <TableCell>
                        {milestone.completedDate ? formatDate(milestone.completedDate) : '-'}
                      </TableCell>
                      <TableCell>
                        {isTransactionExists ? (
                          <Chip 
                            icon={<CheckCircleIcon />}
                            label={`Released ${formatDate(transaction.releasedAt)}`}
                            color="success"
                            size="small"
                          />
                        ) : (
                          milestone.status === 'completed' && milestone.adminApproved ? (
                            <Chip 
                              label="Ready for Release"
                              color="warning"
                              size="small"
                            />
                          ) : (
                            <Chip 
                              label="Not Ready"
                              color="default"
                              size="small"
                            />
                          )
                        )}
                      </TableCell>
                      <TableCell>
                        {milestone.status === 'completed' && milestone.adminApproved && !isTransactionExists ? (
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<AttachMoneyIcon />}
                            onClick={() => handleOpenReleaseDialog(milestone)}
                          >
                            Release Funds
                          </Button>
                        ) : milestone.status === 'completed' && !milestone.adminApproved ? (
                          <Button
                            variant="outlined"
                            size="small"
                            component={Link}
                            to={`/admin/projects/${projectId}/milestones/${milestone.id}/verification`}
                          >
                            Verify
                          </Button>
                        ) : isTransactionExists ? (
                          <Button
                            variant="outlined"
                            size="small"
                            disabled
                          >
                            Released
                          </Button>
                        ) : (
                          <Button
                            variant="outlined"
                            size="small"
                            disabled
                          >
                            Not Ready
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                
                {milestones.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No milestones defined for this project.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Box sx={{ textAlign: 'right' }}>
            <Button
              variant="outlined"
              component={Link}
              to={`/admin/projects/${projectId}`}
            >
              View All Project Details
            </Button>
          </Box>
        </Paper>
      )}
      
      {activeTab === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Transaction History
          </Typography>
          
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Milestone</TableCell>
                  <TableCell>Released By</TableCell>
                  <TableCell>Notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {escrowTransactions.map((transaction) => {
                  const milestone = milestones.find(m => m.id === transaction.milestoneId);
                  
                  return (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(transaction.releasedAt)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatTime(transaction.releasedAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={
                            transaction.type === 'milestone_payment' ? 'Milestone Payment' :
                            transaction.type === 'initial_release' ? 'Initial Release' :
                            transaction.type === 'refund' ? 'Refund' : transaction.type
                          }
                          size="small"
                          color={
                            transaction.type === 'milestone_payment' ? 'success' :
                            transaction.type === 'initial_release' ? 'primary' :
                            transaction.type === 'refund' ? 'error' : 'default'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell>
                        {milestone ? milestone.title : 'N/A'}
                      </TableCell>
                      <TableCell>
                        Admin #{transaction.releasedBy}
                      </TableCell>
                      <TableCell>
                        {transaction.note || 'No notes'}
                      </TableCell>
                    </TableRow>
                  );
                })}
                
                {escrowTransactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No transactions found for this project.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
      
      {activeTab === 2 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Project & Innovator Details
          </Typography>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Project Information</Typography>
                  
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <BusinessCenterIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Title" 
                        secondary={project?.title} 
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon>
                        <InfoIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Category" 
                        secondary={project?.category} 
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon>
                        <AttachMoneyIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Funding Goal" 
                        secondary={formatCurrency(project?.fundingGoal)} 
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon>
                        <AttachMoneyIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Current Funding" 
                        secondary={formatCurrency(project?.currentFunding)} 
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon>
                        <TimelineIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Project Progress" 
                        secondary={`${project?.projectProgress || 0}%`} 
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon>
                        <CalendarTodayIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Created On" 
                        secondary={formatDate(project?.createdAt)} 
                      />
                    </ListItem>
                  </List>
                  
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Project Progress
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={project?.projectProgress || 0}
                      sx={{ height: 10, borderRadius: 5 }}
                    />
                  </Box>
                  
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Funding Progress
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={(project?.currentFunding / project?.fundingGoal) * 100}
                      sx={{ height: 10, borderRadius: 5 }}
                    />
                    <Typography variant="caption" sx={{ display: 'block', mt: 1, textAlign: 'right' }}>
                    {formatCurrency(project?.currentFunding)} of {formatCurrency(project?.fundingGoal)}
                      {' '}({((project?.currentFunding / project?.fundingGoal) * 100).toFixed(1)}%)
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
              
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Investments</Typography>
                  
                  {investments.length > 0 ? (
                    <List dense>
                      {investments.map(investment => (
                        <ListItem key={investment.id}>
                          <ListItemIcon>
                            <AttachMoneyIcon />
                          </ListItemIcon>
                          <ListItemText 
                            primary={`Investment #${investment.id}`} 
                            secondary={`${formatCurrency(investment.amount)} from Investor #${investment.userId}`} 
                          />
                          <Button
                            size="small"
                            variant="outlined"
                            component={Link}
                            to={`/admin/investments/${investment.id}`}
                          >
                            View
                          </Button>
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No investments found for this project.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Innovator Information</Typography>
                  
                  {innovator ? (
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Avatar 
                          src={innovator.profileImage}
                          sx={{ width: 60, height: 60, mr: 2 }}
                        >
                          {innovator.firstName?.[0]}{innovator.lastName?.[0]}
                        </Avatar>
                        
                        <Box>
                          <Typography variant="h6">
                            {innovator.firstName} {innovator.lastName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {innovator.email}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <List dense>
                        <ListItem>
                          <ListItemIcon>
                            <PersonIcon />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Account ID" 
                            secondary={`#${innovator.id}`} 
                          />
                        </ListItem>
                        
                        <ListItem>
                          <ListItemIcon>
                            <BusinessCenterIcon />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Projects" 
                            secondary={`${milestones.length} milestones across projects`} 
                          />
                        </ListItem>
                      </List>
                      
                      <Box sx={{ mt: 2 }}>
                        <Button
                          variant="outlined"
                          component={Link}
                          to={`/innovators/${innovator.id}`}
                          startIcon={<VisibilityIcon />}
                        >
                          View Innovator Profile
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Innovator information not available.
                    </Typography>
                  )}
                </CardContent>
              </Card>
              
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Escrow Summary</Typography>
                  
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <AccountBalanceIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Total Escrow" 
                        secondary={formatCurrency(escrowStats.totalEscrow)} 
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon>
                        <AttachMoneyIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Released Funds"

                        secondary={formatCurrency(escrowStats.releasedFunds)} 
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon>
                        <TimelineIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Pending Release" 
                        secondary={formatCurrency(escrowStats.pendingRelease)} 
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon>
                        <AccountBalanceIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Available Balance" 
                        secondary={formatCurrency(escrowStats.availableBalance)} 
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      {/* Fund Release Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Release Funds for Milestone</DialogTitle>
        <DialogContent>
          <DialogContentText paragraph>
            You are about to release funds for the milestone: <strong>{selectedMilestone?.title}</strong>
          </DialogContentText>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              This will release funds from the escrow account to the project's available balance.
            </Typography>
          </Alert>
          
          <TextField
            label="Amount to Release"
            type="number"
            fullWidth
            margin="normal"
            value={releaseAmount}
            onChange={(e) => setReleaseAmount(e.target.value)}
            InputProps={{
              startAdornment: <Box sx={{ mr: 1 }}>$</Box>,
            }}
            helperText={`Default: ${formatCurrency(selectedMilestone?.estimatedFunding || 0)}`}
          />
          
          <TextField
            label="Notes"
            fullWidth
            multiline
            rows={3}
            margin="normal"
            value={releaseNotes}
            onChange={(e) => setReleaseNotes(e.target.value)}
            placeholder="Enter notes about this fund release"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleReleaseFunds}
            disabled={isSubmitting || releaseAmount <= 0}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : <AttachMoneyIcon />}
          >
            {isSubmitting ? 'Processing...' : 'Release Funds'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EscrowManagement;