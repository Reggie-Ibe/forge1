// src/components/admin/EscrowManagement.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Material UI components
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  Stack,
  Divider,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment
} from '@mui/material';

// Material UI icons
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EventIcon from '@mui/icons-material/Event';
import PersonIcon from '@mui/icons-material/Person';
import CategoryIcon from '@mui/icons-material/Category';
import AssignmentIcon from '@mui/icons-material/Assignment';
import TimelineIcon from '@mui/icons-material/Timeline';
import SendIcon from '@mui/icons-material/Send';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ReceiptIcon from '@mui/icons-material/Receipt';

const EscrowManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [escrowTransactions, setEscrowTransactions] = useState([]);
  const [activeMilestones, setActiveMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Selected item state
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [fundReleaseDialog, setFundReleaseDialog] = useState(false);
  const [viewTransactionDialog, setViewTransactionDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Release amount state
  const [releaseAmount, setReleaseAmount] = useState('');
  const [releasePercentage, setReleasePercentage] = useState(100);
  const [releaseNote, setReleaseNote] = useState('');
  
  useEffect(() => {
    fetchEscrowData();
  }, [activeTab]);
  
  const fetchEscrowData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      if (activeTab === 0) {
        // Fetch pending milestone verifications
        const milestonesResponse = await fetch(`${apiUrl}/milestones?status=completed&adminApproved=false`);
        if (milestonesResponse.ok) {
          const milestones = await milestonesResponse.json();
          
          // Fetch additional project info for each milestone
          const enhancedMilestones = await Promise.all(milestones.map(async (milestone) => {
            const projectResponse = await fetch(`${apiUrl}/projects/${milestone.projectId}`);
            const projectData = projectResponse.ok ? await projectResponse.json() : null;
            
            const innovatorResponse = await fetch(`${apiUrl}/users/${projectData?.userId || 0}`);
            const innovatorData = innovatorResponse.ok ? await innovatorResponse.json() : null;
            
            return {
              ...milestone,
              projectTitle: projectData?.title || 'Unknown Project',
              innovatorName: innovatorData ? `${innovatorData.firstName} ${innovatorData.lastName}` : 'Unknown User',
              projectCategory: projectData?.category || 'Unknown'
            };
          }));
          
          setPendingVerifications(enhancedMilestones);
        }
      } else if (activeTab === 1) {
        // Fetch escrow transactions
        const transactionsResponse = await fetch(`${apiUrl}/escrowTransactions`);
        if (transactionsResponse.ok) {
          const transactions = await transactionsResponse.json();
          
          // Enhance transactions with project and user data
          const enhancedTransactions = await Promise.all(transactions.map(async (transaction) => {
            const projectResponse = await fetch(`${apiUrl}/projects/${transaction.projectId}`);
            const projectData = projectResponse.ok ? await projectResponse.json() : null;
            
            const milestoneResponse = transaction.milestoneId ? 
              await fetch(`${apiUrl}/milestones/${transaction.milestoneId}`) : null;
            const milestoneData = milestoneResponse && milestoneResponse.ok ? 
              await milestoneResponse.json() : null;
            
            return {
              ...transaction,
              projectTitle: projectData?.title || 'Unknown Project',
              milestoneName: milestoneData?.title || 'General Release'
            };
          }));
          
          setEscrowTransactions(enhancedTransactions);
        }
      } else if (activeTab === 2) {
        // Fetch active milestones (in progress)
        const activeMilestonesResponse = await fetch(`${apiUrl}/milestones?status=inProgress`);
        if (activeMilestonesResponse.ok) {
          const milestones = await activeMilestonesResponse.json();
          
          // Fetch additional project info for each milestone
          const enhancedMilestones = await Promise.all(milestones.map(async (milestone) => {
            const projectResponse = await fetch(`${apiUrl}/projects/${milestone.projectId}`);
            const projectData = projectResponse.ok ? await projectResponse.json() : null;
            
            const innovatorResponse = await fetch(`${apiUrl}/users/${projectData?.userId || 0}`);
            const innovatorData = innovatorResponse.ok ? await innovatorResponse.json() : null;
            
            return {
              ...milestone,
              projectTitle: projectData?.title || 'Unknown Project',
              innovatorName: innovatorData ? `${innovatorData.firstName} ${innovatorData.lastName}` : 'Unknown User',
              fundingGoal: projectData?.fundingGoal || 0,
              currentFunding: projectData?.currentFunding || 0
            };
          }));
          
          setActiveMilestones(enhancedMilestones);
        }
      }
      
    } catch (err) {
      console.error('Error fetching escrow data:', err);
      setError('Failed to load escrow data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  const handleOpenReleaseDialog = (milestone) => {
    setSelectedMilestone(milestone);
    setReleaseAmount(milestone.estimatedFunding || '');
    setReleasePercentage(100);
    setReleaseNote(`Milestone payment for: ${milestone.title}`);
    setFundReleaseDialog(true);
  };
  
  const handleOpenTransactionView = (transaction) => {
    setSelectedTransaction(transaction);
    setViewTransactionDialog(true);
  };
  
  const handleReleaseUpdate = (e) => {
    const percentage = parseFloat(e.target.value) || 0;
    setReleasePercentage(Math.min(100, Math.max(0, percentage)));
    
    if (selectedMilestone && selectedMilestone.estimatedFunding) {
      const amount = (selectedMilestone.estimatedFunding * percentage) / 100;
      setReleaseAmount(amount);
    }
  };
  
  const handleAmountUpdate = (e) => {
    const amount = parseFloat(e.target.value) || 0;
    setReleaseAmount(amount);
    
    if (selectedMilestone && selectedMilestone.estimatedFunding) {
      const percentage = (amount / selectedMilestone.estimatedFunding) * 100;
      setReleasePercentage(Math.min(100, Math.max(0, percentage)));
    }
  };
  
  const handleReleaseFunds = async () => {
    if (!selectedMilestone || !releaseAmount || releaseAmount <= 0) return;
    
    setIsSubmitting(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Create escrow release transaction
      const transactionData = {
        projectId: selectedMilestone.projectId,
        milestoneId: selectedMilestone.id,
        amount: parseFloat(releaseAmount),
        type: 'milestone_payment',
        status: 'completed',
        releasedBy: user.id,
        releasedAt: new Date().toISOString(),
        note: releaseNote,
        createdAt: new Date().toISOString()
      };
      
      const transactionResponse = await fetch(`${apiUrl}/escrowTransactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      });
      
      if (!transactionResponse.ok) {
        throw new Error('Failed to create transaction');
      }
      
      // Update project's current funding
      const projectResponse = await fetch(`${apiUrl}/projects/${selectedMilestone.projectId}`);
      if (projectResponse.ok) {
        const projectData = await projectResponse.json();
        
        const updatedCurrentFunding = (projectData.currentFunding || 0) + parseFloat(releaseAmount);
        
        await fetch(`${apiUrl}/projects/${selectedMilestone.projectId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ currentFunding: updatedCurrentFunding }),
        });
      }
      
      // If full funding released, mark milestone as verified
      if (releasePercentage >= 100) {
        await fetch(`${apiUrl}/milestones/${selectedMilestone.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            adminApproved: true,
            approvedBy: user.id,
            approvedDate: new Date().toISOString()
          }),
        });
      }
      
      setSuccessMessage('Funds released successfully');
      setFundReleaseDialog(false);
      
      // Refresh data after a short delay
      setTimeout(() => {
        fetchEscrowData();
      }, 1000);
      
    } catch (err) {
      console.error('Error releasing funds:', err);
      setError('Failed to release funds. Please try again.');
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
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Escrow Management
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}
      
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Pending Verifications" icon={<CheckCircleIcon />} iconPosition="start" />
          <Tab label="Escrow Transactions" icon={<AccountBalanceWalletIcon />} iconPosition="start" />
          <Tab label="Active Milestones" icon={<TimelineIcon />} iconPosition="start" />
        </Tabs>
        
        <Box sx={{ p: 3 }}>
          {activeTab === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Pending Milestone Verifications
              </Typography>
              
              {pendingVerifications.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No pending verifications found.
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Project</TableCell>
                        <TableCell>Milestone</TableCell>
                        <TableCell>Innovator</TableCell>
                        <TableCell>Submitted</TableCell>
                        <TableCell>Est. Funding</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pendingVerifications.map(verification => (
                        <TableRow key={verification.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {verification.projectTitle}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {verification.projectCategory}
                            </Typography>
                          </TableCell>
                          <TableCell>{verification.title}</TableCell>
                          <TableCell>{verification.innovatorName}</TableCell>
                          <TableCell>{formatDate(verification.verificationDate)}</TableCell>
                          <TableCell>{formatCurrency(verification.estimatedFunding)}</TableCell>
                          <TableCell>
                            <Button
                              variant="outlined"
                              size="small"
                              sx={{ mr: 1 }}
                              component={Link}
                              to={`/admin/projects/${verification.projectId}/milestones/${verification.id}/verification`}
                            >
                              Review
                            </Button>
                            <Button
                              variant="contained"
                              color="primary"
                              size="small"
                              onClick={() => handleOpenReleaseDialog(verification)}
                            >
                              Release Funds
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}
          
          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Escrow Transactions
              </Typography>
              
              {escrowTransactions.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No escrow transactions found.
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Transaction ID</TableCell>
                        <TableCell>Project</TableCell>
                        <TableCell>Milestone</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {escrowTransactions.map(transaction => (
                        <TableRow key={transaction.id}>
                          <TableCell>#{transaction.id}</TableCell>
                          <TableCell>{transaction.projectTitle}</TableCell>
                          <TableCell>{transaction.milestoneName}</TableCell>
                          <TableCell>
                            <Chip 
                              label={transaction.type === 'milestone_payment' ? 'Milestone Payment' : 
                                     transaction.type === 'refund' ? 'Refund' : 
                                     'Fund Transfer'}
                              color={transaction.type === 'milestone_payment' ? 'success' : 
                                     transaction.type === 'refund' ? 'error' : 
                                     'primary'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                          <TableCell>{formatDate(transaction.releasedAt || transaction.createdAt)}</TableCell>
                          <TableCell>
                            <IconButton
                              onClick={() => handleOpenTransactionView(transaction)}
                              size="small"
                              color="primary"
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}
          
          {activeTab === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Active Milestones
              </Typography>
              
              {activeMilestones.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No active milestones found.
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={3}>
                  {activeMilestones.map(milestone => (
                    <Grid item xs={12} md={6} key={milestone.id}>
                      <Card>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box>
                              <Typography variant="h6">{milestone.title}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {milestone.projectTitle}
                              </Typography>
                            </Box>
                            <Chip 
                              label="In Progress" 
                              color="primary" 
                              size="small" 
                              variant="outlined"
                            />
                          </Box>
                          
                          <Typography variant="body2" sx={{ mb: 2 }}>
                            {milestone.description}
                          </Typography>
                          
                          <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">Due Date</Typography>
                              <Typography variant="body1">{formatDate(milestone.dueDate)}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">Project Contribution</Typography>
                              <Typography variant="body1">{milestone.completionPercentage || 0}%</Typography>
                            </Grid>
                          </Grid>
                          
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Estimated Funding: {formatCurrency(milestone.estimatedFunding)}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                            <Button
                              variant="outlined"
                              size="small"
                              component={Link}
                              to={`/projects/${milestone.projectId}`}
                              sx={{ mr: 1 }}
                            >
                              View Project
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}
        </Box>
      </Paper>
      
      {/* Fund Release Dialog */}
      <Dialog open={fundReleaseDialog} onClose={() => setFundReleaseDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Release Funds</DialogTitle>
        <DialogContent>
          {selectedMilestone && (
            <>
              <DialogContentText gutterBottom>
                You are about to release funds for milestone "{selectedMilestone.title}" from project "{selectedMilestone.projectTitle}".
              </DialogContentText>
              
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Amount to Release"
                    type="number"
                    fullWidth
                    value={releaseAmount}
                    onChange={handleAmountUpdate}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Percentage of Milestone"
                    type="number"
                    fullWidth
                    value={releasePercentage}
                    onChange={handleReleaseUpdate}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    label="Release Note"
                    fullWidth
                    multiline
                    rows={2}
                    value={releaseNote}
                    onChange={(e) => setReleaseNote(e.target.value)}
                  />
                </Grid>
              </Grid>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFundReleaseDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleReleaseFunds}
            disabled={isSubmitting || !releaseAmount || releaseAmount <= 0}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : <SendIcon />}
          >
            {isSubmitting ? 'Processing...' : 'Release Funds'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* View Transaction Dialog */}
      <Dialog open={viewTransactionDialog} onClose={() => setViewTransactionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Transaction Details</DialogTitle>
        <DialogContent>
          {selectedTransaction && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Transaction ID</Typography>
                <Typography variant="body1">#{selectedTransaction.id}</Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Type</Typography>
                <Chip 
                  label={selectedTransaction.type === 'milestone_payment' ? 'Milestone Payment' : 
                         selectedTransaction.type === 'refund' ? 'Refund' : 
                         'Fund Transfer'}
                  color={selectedTransaction.type === 'milestone_payment' ? 'success' : 
                         selectedTransaction.type === 'refund' ? 'error' : 
                         'primary'}
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Amount</Typography>
                <Typography variant="body1" fontWeight="bold">{formatCurrency(selectedTransaction.amount)}</Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Date</Typography>
                <Typography variant="body1">{formatDate(selectedTransaction.releasedAt || selectedTransaction.createdAt)}</Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Project</Typography>
                <Typography variant="body1">{selectedTransaction.projectTitle}</Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Milestone</Typography>
                <Typography variant="body1">{selectedTransaction.milestoneName}</Typography>
              </Grid>
              
              {selectedTransaction.note && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Note</Typography>
                  <Typography variant="body1">{selectedTransaction.note}</Typography>
                </Grid>
              )}
              
              {selectedTransaction.releasedBy && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Released By</Typography>
                  <Typography variant="body1">Admin #{selectedTransaction.releasedBy}</Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewTransactionDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EscrowManagement;