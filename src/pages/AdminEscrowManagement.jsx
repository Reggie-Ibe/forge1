// src/pages/AdminEscrowManagement.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Material UI components
import {
  Box,
  Typography,
  Paper,
  Container,
  Button,
  Chip,
  Divider,
  Grid,
  Card,
  CardContent,
  CardActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Alert,
  AlertTitle,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  Tooltip
} from '@mui/material';

// Material UI icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PublishedWithChangesIcon from '@mui/icons-material/PublishedWithChanges';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const AdminEscrowManagement = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [projectOwner, setProjectOwner] = useState(null);
  const [investments, setInvestments] = useState([]);
  const [investors, setInvestors] = useState({});
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Release funds dialog
  const [openReleaseDialog, setOpenReleaseDialog] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState(null);
  const [selectedPhase, setSelectedPhase] = useState(null);
  const [releaseNote, setReleaseNote] = useState('');
  const [releasing, setReleasing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const fetchProjectData = async () => {
    setLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Fetch project details
      const projectResponse = await fetch(`${apiUrl}/projects/${projectId}`);
      if (!projectResponse.ok) throw new Error('Project not found');
      
      const projectData = await projectResponse.json();
      setProject(projectData);
      
      // Fetch project owner details
      const ownerResponse = await fetch(`${apiUrl}/users/${projectData.userId}`);
      if (ownerResponse.ok) {
        const ownerData = await ownerResponse.json();
        setProjectOwner(ownerData);
      }
      
      // Fetch investments for this project
      const investmentsResponse = await fetch(`${apiUrl}/investments?projectId=${projectId}`);
      if (investmentsResponse.ok) {
        const investmentsData = await investmentsResponse.json();
        setInvestments(investmentsData);
        
        // Fetch investor details
        const investorIds = [...new Set(investmentsData.map(inv => inv.userId))];
        const investorsData = {};
        
        for (const investorId of investorIds) {
          const investorResponse = await fetch(`${apiUrl}/users/${investorId}`);
          if (investorResponse.ok) {
            const investorData = await investorResponse.json();
            investorsData[investorId] = investorData;
          }
        }
        
        setInvestors(investorsData);
      }
      
      // Fetch milestones
      const milestonesResponse = await fetch(`${apiUrl}/milestones?projectId=${projectId}`);
      if (milestonesResponse.ok) {
        const milestonesData = await milestonesResponse.json();
        setMilestones(milestonesData);
      }
      
    } catch (err) {
      console.error('Error fetching project data:', err);
      setError(err.message || 'Failed to load project data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReleaseDialog = (investment, phase) => {
    setSelectedInvestment(investment);
    setSelectedPhase(phase);
    setReleaseNote('');
    setOpenReleaseDialog(true);
  };

  const handleCloseReleaseDialog = () => {
    setOpenReleaseDialog(false);
  };

  const handleReleaseFunds = async () => {
    if (!selectedInvestment || !selectedPhase) return;
    
    setReleasing(true);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Clone the investment and update the disbursement schedule
      const updatedInvestment = { ...selectedInvestment };
      const phaseIndex = updatedInvestment.disbursementSchedule.findIndex(
        p => p.phase === selectedPhase.phase
      );
      
      if (phaseIndex === -1) throw new Error('Phase not found');
      
      // Update the phase to released
      updatedInvestment.disbursementSchedule[phaseIndex] = {
        ...updatedInvestment.disbursementSchedule[phaseIndex],
        released: true,
        releaseDate: new Date().toISOString(),
        releaseNote: releaseNote,
      };
      
      // Update the investment
      const investmentResponse = await fetch(`${apiUrl}/investments/${selectedInvestment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedInvestment),
      });
      
      if (!investmentResponse.ok) throw new Error('Failed to update investment');
      
      // Create wallet transaction for the project owner
      const walletTransactionData = {
        userId: project.userId,
        type: 'milestone_payment',
        amount: selectedPhase.amount,
        projectId: parseInt(projectId),
        status: 'completed',
        createdAt: new Date().toISOString(),
        description: `Milestone payment: ${selectedPhase.phase} for project ${project.title}`,
      };
      
      const walletResponse = await fetch(`${apiUrl}/walletTransactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(walletTransactionData),
      });
      
      if (!walletResponse.ok) {
        console.warn('Failed to record wallet transaction');
      }
      
      // Update local state
      const updatedInvestments = investments.map(inv => 
        inv.id === selectedInvestment.id ? updatedInvestment : inv
      );
      setInvestments(updatedInvestments);
      
      // Show success message
      setSuccessMessage(`Successfully released ${formatCurrency(selectedPhase.amount)} to project owner.`);
      
      // Close dialog
      handleCloseReleaseDialog();
      
    } catch (err) {
      console.error('Error releasing funds:', err);
      setError('Failed to release funds: ' + (err.message || 'Unknown error'));
    } finally {
      setReleasing(false);
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

  // Calculate milestone completion status for progress bar
  const getMilestoneProgress = () => {
    if (!milestones.length) return 0;
    
    const completedCount = milestones.filter(m => 
      m.status === 'completed' && m.adminApproved
    ).length;
    
    return (completedCount / milestones.length) * 100;
  };

  // Calculate which disbursement phases are eligible for release
  const getEligiblePhases = (investment) => {
    if (!investment || !investment.disbursementSchedule) return [];
    
    const milestoneProgress = getMilestoneProgress();
    const totalMilestones = milestones.length;
    const completedMilestones = milestones.filter(m => 
      m.status === 'completed' && m.adminApproved
    ).length;
    
    // Initial release is always available if not already released
    const eligiblePhases = [];
    const phases = investment.disbursementSchedule;
    
    // First phase (initial release)
    if (phases[0] && !phases[0].released) {
      eligiblePhases.push(phases[0]);
    }
    
    // First milestone (usually 25%)
    if (phases[1] && !phases[1].released && completedMilestones >= 1) {
      eligiblePhases.push(phases[1]);
    }
    
    // 50% milestone
    if (phases[2] && !phases[2].released && 
        (completedMilestones >= Math.ceil(totalMilestones / 2) || milestoneProgress >= 50)) {
      eligiblePhases.push(phases[2]);
    }
    
    // Final release
    if (phases[3] && !phases[3].released && 
        (completedMilestones === totalMilestones || milestoneProgress === 100)) {
      eligiblePhases.push(phases[3]);
    }
    
    return eligiblePhases;
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

  if (!project) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          Project not found
        </Alert>
        <Button 
          variant="contained" 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/admin/projects')}
          sx={{ mt: 2 }}
        >
          Back to Projects
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/admin/projects')}
        sx={{ mb: 3 }}
      >
        Back to Projects
      </Button>
      
      <Typography variant="h4" component="h1" gutterBottom>
        Project Escrow Management
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
      
      {/* Project Summary */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Typography variant="h5">{project.title}</Typography>
            <Box sx={{ display: 'flex', gap: 1, my: 1 }}>
              <Chip 
                label={project.category} 
                color="primary" 
                variant="outlined" 
                size="small" 
              />
              <Chip 
                label={project.status.charAt(0).toUpperCase() + project.status.slice(1)} 
                color={
                  project.status === 'active' ? 'success' :
                  project.status === 'pending' ? 'warning' : 'default'
                }
                size="small"
              />
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {project.description}
            </Typography>
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2">Project Creator:</Typography>
              <Typography variant="body2">
                {projectOwner ? `${projectOwner.firstName} ${projectOwner.lastName}` : `User #${project.userId}`}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box>
              <Typography variant="subtitle1" gutterBottom>Funding Progress</Typography>
              <Typography variant="h5">
                {formatCurrency(project.currentFunding)} / {formatCurrency(project.fundingGoal)}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={Math.min((project.currentFunding / project.fundingGoal) * 100, 100)} 
                sx={{ height: 10, borderRadius: 5, my: 1 }}
              />
              <Typography variant="body2" align="right">
                {((project.currentFunding / project.fundingGoal) * 100).toFixed(1)}% funded
              </Typography>
            </Box>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>Milestone Progress</Typography>
              <LinearProgress 
                variant="determinate" 
                value={getMilestoneProgress()} 
                sx={{ height: 10, borderRadius: 5, my: 1 }}
              />
              <Typography variant="body2" align="right">
                {milestones.filter(m => m.status === 'completed' && m.adminApproved).length} of {milestones.length} milestones completed
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Milestone Status */}
      <Typography variant="h5" gutterBottom>Milestone Status</Typography>
      <Paper sx={{ p: 3, mb: 4 }}>
        {milestones.length === 0 ? (
          <Typography variant="body1">No milestones have been added to this project.</Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Milestone</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Completed Date</TableCell>
                  <TableCell>Approved</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {milestones.map((milestone) => (
                  <TableRow key={milestone.id}>
                    <TableCell>{milestone.title}</TableCell>
                    <TableCell>{formatDate(milestone.dueDate)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={
                          milestone.status === 'inProgress' 
                            ? 'In Progress' 
                            : milestone.status.charAt(0).toUpperCase() + milestone.status.slice(1)
                        }
                        color={
                          milestone.status === 'completed' 
                            ? milestone.adminApproved ? 'success' : 'warning'
                            : milestone.status === 'inProgress' ? 'primary' : 'default'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {milestone.completedDate ? formatDate(milestone.completedDate) : 'Not completed'}
                    </TableCell>
                    <TableCell>
                      {milestone.status === 'completed' ? (
                        milestone.adminApproved ? (
                          <Chip 
                            icon={<CheckCircleIcon />} 
                            label="Approved" 
                            color="success" 
                            size="small" 
                          />
                        ) : (
                          <Button 
                            variant="contained" 
                            color="warning" 
                            size="small"
                            component="a"
                            href={`/projects/${projectId}/milestones/${milestone.id}/edit`}
                          >
                            Needs Approval
                          </Button>
                        )
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
      
      {/* Investment Disbursement */}
      <Typography variant="h5" gutterBottom>Investment Disbursement Schedule</Typography>
      <Box sx={{ mb: 4 }}>
        {investments.length === 0 ? (
          <Paper sx={{ p: 3 }}>
            <Typography variant="body1">No investments have been made to this project yet.</Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {investments.map((investment) => {
              const investor = investors[investment.userId] || { firstName: 'Investor', lastName: `#${investment.userId}` };
              const eligiblePhases = getEligiblePhases(investment);
              
              return (
                <Grid item xs={12} key={investment.id}>
                  <Paper sx={{ p: 3 }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h6">
                        {investor.firstName} {investor.lastName} - {formatCurrency(investment.amount)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Invested on {formatDate(investment.createdAt)}
                      </Typography>
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Typography variant="subtitle1" gutterBottom>Funding Disbursement Schedule</Typography>
                    
                    {!investment.disbursementSchedule ? (
                      <Typography variant="body2">No disbursement schedule defined for this investment.</Typography>
                    ) : (
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Phase</TableCell>
                              <TableCell>Condition</TableCell>
                              <TableCell align="right">Amount</TableCell>
                              <TableCell>Status</TableCell>
                              <TableCell align="right">Actions</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {investment.disbursementSchedule.map((phase, index) => {
                              const isEligible = eligiblePhases.some(p => p.phase === phase.phase);
                              
                              return (
                                <TableRow key={index}>
                                  <TableCell>
                                    <Typography variant="body2" fontWeight="medium">
                                      {phase.phase}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {phase.percentage}% of total
                                    </Typography>
                                  </TableCell>
                                  <TableCell>{phase.condition}</TableCell>
                                  <TableCell align="right">{formatCurrency(phase.amount)}</TableCell>
                                  <TableCell>
                                    {phase.released ? (
                                      <Chip 
                                        icon={<CheckCircleOutlineIcon />} 
                                        label={`Released: ${formatDate(phase.releaseDate)}`} 
                                        color="success" 
                                        size="small" 
                                      />
                                    ) : (
                                      <Chip 
                                        label="Pending" 
                                        color="warning" 
                                        variant="outlined" 
                                        size="small" 
                                      />
                                    )}
                                  </TableCell>
                                  <TableCell align="right">
                                    {!phase.released && (
                                      <Button
                                        variant="contained"
                                        color="primary"
                                        size="small"
                                        startIcon={<PublishedWithChangesIcon />}
                                        onClick={() => handleOpenReleaseDialog(investment, phase)}
                                        disabled={!isEligible}
                                      >
                                        Release Funds
                                      </Button>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>
      
      {/* Release Funds Dialog */}
      <Dialog open={openReleaseDialog} onClose={handleCloseReleaseDialog}>
        <DialogTitle>Release Escrow Funds</DialogTitle>
        <DialogContent>
          {selectedInvestment && selectedPhase && (
            <>
              <DialogContentText>
                You are about to release {formatCurrency(selectedPhase.amount)} to the project owner for the {selectedPhase.phase} phase.
              </DialogContentText>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2">Project:</Typography>
                <Typography variant="body2">{project.title}</Typography>
              </Box>
              
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2">Investor:</Typography>
                <Typography variant="body2">
                  {investors[selectedInvestment.userId]?.firstName} {investors[selectedInvestment.userId]?.lastName}
                </Typography>
              </Box>
              
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2">Project Owner:</Typography>
                <Typography variant="body2">
                  {projectOwner?.firstName} {projectOwner?.lastName}
                </Typography>
              </Box>
              
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2">Phase:</Typography>
                <Typography variant="body2">{selectedPhase.phase}</Typography>
              </Box>
              
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2">Amount:</Typography>
                <Typography variant="body2">{formatCurrency(selectedPhase.amount)}</Typography>
              </Box>
              
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2">Condition:</Typography>
                <Typography variant="body2">{selectedPhase.condition}</Typography>
              </Box>
              
              <TextField
                margin="dense"
                label="Release Note (Optional)"
                fullWidth
                multiline
                rows={3}
                value={releaseNote}
                onChange={(e) => setReleaseNote(e.target.value)}
                sx={{ mt: 2 }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReleaseDialog} disabled={releasing}>
            Cancel
          </Button>
          <Button 
            onClick={handleReleaseFunds} 
            color="primary" 
            variant="contained"
            disabled={releasing}
            startIcon={releasing ? <CircularProgress size={24} /> : <PublishedWithChangesIcon />}
          >
            {releasing ? 'Processing...' : 'Release Funds'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminEscrowManagement;