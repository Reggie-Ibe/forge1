// src/components/admin/AdminMilestoneVerification.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Material UI Components
import {
  Container,
  Box,
  Grid,
  Paper,
  Typography,
  Divider,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Rating,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Avatar
} from '@mui/material';

// Material UI Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonIcon from '@mui/icons-material/Person';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import DescriptionIcon from '@mui/icons-material/Description';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import StarIcon from '@mui/icons-material/Star';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import TimelineIcon from '@mui/icons-material/Timeline';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import InfoIcon from '@mui/icons-material/Info';

const AdminMilestoneVerification = () => {
  const { projectId, milestoneId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [project, setProject] = useState(null);
  const [milestone, setMilestone] = useState(null);
  const [innovator, setInnovator] = useState(null);
  const [verifications, setVerifications] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Verification and fund release
  const [activeStep, setActiveStep] = useState(0);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [fundReleaseNotes, setFundReleaseNotes] = useState('');
  const [fundAmount, setFundAmount] = useState(0);
  
  // Approval dialog
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [releaseDialogOpen, setReleaseDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    fetchMilestoneData();
  }, [projectId, milestoneId]);
  
  const fetchMilestoneData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Fetch milestone
      const milestoneResponse = await fetch(`${apiUrl}/milestones/${milestoneId}`);
      if (!milestoneResponse.ok) {
        throw new Error('Milestone not found');
      }
      
      const milestoneData = await milestoneResponse.json();
      
      if (milestoneData.projectId.toString() !== projectId) {
        throw new Error('Milestone does not belong to this project');
      }
      
      setMilestone(milestoneData);
      setFundAmount(milestoneData.estimatedFunding || 0);
      
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
      
      // Fetch verifications for this milestone
      const verificationsResponse = await fetch(`${apiUrl}/verifications?milestoneId=${milestoneId}`);
      if (verificationsResponse.ok) {
        const verificationsData = await verificationsResponse.json();
        setVerifications(verificationsData);
      }
      
      // Fetch investments for this project
      const investmentsResponse = await fetch(`${apiUrl}/investments?projectId=${projectId}`);
      if (investmentsResponse.ok) {
        const investmentsData = await investmentsResponse.json();
        setInvestments(investmentsData);
      }
      
    } catch (err) {
      console.error('Error fetching milestone data:', err);
      setError(err.message || 'Failed to load milestone data');
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate average ratings
  const calculateAverageRatings = () => {
    if (!verifications.length) return { completion: 0, documentation: 0, quality: 0, average: 0 };
    
    let totals = { completion: 0, documentation: 0, quality: 0, average: 0 };
    let counts = { completion: 0, documentation: 0, quality: 0, average: 0 };
    
    verifications.forEach(verification => {
      if (verification.ratings) {
        if (verification.ratings.completion) {
          totals.completion += verification.ratings.completion;
          counts.completion++;
        }
        if (verification.ratings.documentation) {
          totals.documentation += verification.ratings.documentation;
          counts.documentation++;
        }
        if (verification.ratings.quality) {
          totals.quality += verification.ratings.quality;
          counts.quality++;
        }
        if (verification.ratings.average) {
          totals.average += verification.ratings.average;
          counts.average++;
        }
      }
    });
    
    const averages = {
      completion: counts.completion ? Math.round(totals.completion / counts.completion) : 0,
      documentation: counts.documentation ? Math.round(totals.documentation / counts.documentation) : 0,
      quality: counts.quality ? Math.round(totals.quality / counts.quality) : 0,
      average: counts.average ? Math.round(totals.average / counts.average) : 0
    };
    
    return averages;
  };
  
  // Handle step change
  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };
  
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
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
  
  // Handle milestone verification
  const handleApproveMilestone = async () => {
    setIsSubmitting(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Update milestone status
      const updateResponse = await fetch(`${apiUrl}/milestones/${milestoneId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminApproved: true,
          approvedBy: user.id,
          approvedDate: new Date().toISOString(),
          verificationNotes: verificationNotes
        }),
      });
      
      if (!updateResponse.ok) {
        throw new Error('Failed to approve milestone');
      }
      
      // Close dialog and show success message
      setApproveDialogOpen(false);
      setSuccessMessage('Milestone has been approved successfully.');
      
      // Update local state
      setMilestone(prev => ({
        ...prev,
        adminApproved: true,
        approvedBy: user.id,
        approvedDate: new Date().toISOString(),
        verificationNotes: verificationNotes
      }));
      
      // Move to next step (fund release)
      handleNext();
      
    } catch (err) {
      console.error('Error approving milestone:', err);
      setError(err.message || 'Failed to approve milestone');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle milestone rejection
  const handleRejectMilestone = async () => {
    if (!rejectReason.trim()) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Update milestone status
      const updateResponse = await fetch(`${apiUrl}/milestones/${milestoneId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'inProgress', // Reset to in-progress
          adminApproved: false,
          rejectionReason: rejectReason,
          rejectedBy: user.id,
          rejectedAt: new Date().toISOString()
        }),
      });
      
      if (!updateResponse.ok) {
        throw new Error('Failed to reject milestone');
      }
      
      // Close dialog
      setRejectDialogOpen(false);
      
      // Show success message and redirect
      setSuccessMessage('Milestone has been returned to in-progress status.');
      setTimeout(() => {
        navigate(`/admin/projects/${projectId}`, {
          state: { message: 'Milestone verification rejected' }
        });
      }, 2000);
      
    } catch (err) {
      console.error('Error rejecting milestone:', err);
      setError(err.message || 'Failed to reject milestone');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle fund release
  const handleReleaseFunds = async () => {
    setIsSubmitting(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Create escrow transaction
      const escrowResponse = await fetch(`${apiUrl}/escrowTransactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: parseInt(projectId),
          milestoneId: parseInt(milestoneId),
          amount: parseFloat(fundAmount),
          type: 'milestone_payment',
          status: 'completed',
          releasedBy: user.id,
          releasedAt: new Date().toISOString(),
          note: fundReleaseNotes || `Milestone payment for: ${milestone.title}`,
          createdAt: new Date().toISOString()
        }),
      });
      
      if (!escrowResponse.ok) {
        throw new Error('Failed to release funds');
      }
      
      // Update project's currentFunding if needed
      // ...
      
      // Close dialog
      setReleaseDialogOpen(false);
      
      // Show success message and redirect
      setSuccessMessage('Funds have been released successfully.');
      setTimeout(() => {
        navigate(`/admin/projects/${projectId}`, {
          state: { message: 'Milestone payment processed successfully' }
        });
      }, 2000);
      
    } catch (err) {
      console.error('Error releasing funds:', err);
      setError(err.message || 'Failed to release funds');
    } finally {
      setIsSubmitting(false);
    }
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
          onClick={() => navigate(`/admin/projects/${projectId}`)}
        >
          Back to Project
        </Button>
      </Container>
    );
  }
  
  const averageRatings = calculateAverageRatings();
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/admin/projects/${projectId}`)}
        >
          Back to Project
        </Button>
        
        <Box>
          <Button
            variant="outlined"
            color="error"
            startIcon={<CancelIcon />}
            onClick={() => setRejectDialogOpen(true)}
            sx={{ mr: 2 }}
          >
            Reject Verification
          </Button>
          
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircleIcon />}
            onClick={() => setApproveDialogOpen(true)}
          >
            Approve Milestone
          </Button>
        </Box>
      </Box>
      
      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}
      
      <Typography variant="h4" component="h1" gutterBottom>
        Milestone Verification
      </Typography>
      
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Project: <strong>{project?.title}</strong> | Milestone: <strong>{milestone?.title}</strong>
      </Typography>
      
      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          {/* Main Verification Information */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
              <Typography variant="h5" gutterBottom>
                Verification Details
              </Typography>
              
              <Chip 
                icon={<TimelineIcon />} 
                label="Awaiting Verification" 
                color="warning"
              />
            </Box>
            
            <Stepper activeStep={activeStep} orientation="vertical" sx={{ mb: 3 }}>
              <Step>
                <StepLabel>Review Milestone Submission</StepLabel>
                <StepContent>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body1" paragraph>
                      {milestone?.description}
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2">
                          Due Date:
                        </Typography>
                        <Typography variant="body2" paragraph>
                          {formatDate(milestone?.dueDate)}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2">
                          Completion Date:
                        </Typography>
                        <Typography variant="body2" paragraph>
                          {formatDate(milestone?.completedDate)}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Typography variant="subtitle2">
                          Completion Details:
                        </Typography>
                        <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'background.default' }}>
                          <Typography variant="body2">
                            {milestone?.completionDetails}
                          </Typography>
                        </Paper>
                      </Grid>
                      
                      {milestone?.additionalNotes && (
                        <Grid item xs={12}>
                          <Typography variant="subtitle2">
                            Additional Notes:
                          </Typography>
                          <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'background.default' }}>
                            <Typography variant="body2">
                              {milestone?.additionalNotes}
                            </Typography>
                          </Paper>
                        </Grid>
                      )}
                    </Grid>
                    
                    <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
                      Verification Documents:
                    </Typography>
                    
                    {milestone?.verificationDocuments?.length > 0 ? (
                      <List>
                        {milestone.verificationDocuments.map((doc, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <InsertDriveFileIcon />
                            </ListItemIcon>
                            <ListItemText
                              primary={doc.name}
                              secondary={`Uploaded on ${formatDate(doc.uploadedAt)} • ${Math.round(doc.size / 1024)} KB`}
                            />
                            <Button 
                              startIcon={<AttachFileIcon />}
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View
                            </Button>
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Alert severity="warning">
                        No verification documents were provided.
                      </Alert>
                    )}
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      sx={{ mt: 1, mr: 1 }}
                    >
                      Continue
                    </Button>
                  </Box>
                </StepContent>
              </Step>
              
              <Step>
                <StepLabel>Review Investor Verifications</StepLabel>
                <StepContent>
                  <Box sx={{ mb: 2 }}>
                    {verifications.length > 0 ? (
                      <>
                        <Typography variant="body2" paragraph>
                          {verifications.length} investor{verifications.length !== 1 ? 's have' : ' has'} verified this milestone.
                        </Typography>
                        
                        <Grid container spacing={2}>
                          {verifications.map((verification, index) => (
                            <Grid item xs={12} key={index}>
                              <Card variant="outlined">
                                <CardContent>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                    <Typography variant="subtitle1">
                                      Verification #{index + 1}
                                    </Typography>
                                    <Chip 
                                      icon={<CheckCircleIcon />} 
                                      label="Approved" 
                                      color="success" 
                                      size="small"
                                    />
                                  </Box>
                                  
                                  <Typography variant="body2" paragraph>
                                    <strong>Comment:</strong> {verification.comment}
                                  </Typography>
                                  
                                  <Typography variant="subtitle2" gutterBottom>
                                    Ratings:
                                  </Typography>
                                  
                                  <Grid container spacing={2}>
                                    <Grid item xs={12} md={4}>
                                      <Typography variant="body2">Completion:</Typography>
                                      <Rating 
                                        value={verification.ratings?.completion || 0} 
                                        readOnly
                                      />
                                    </Grid>
                                    
                                    <Grid item xs={12} md={4}>
                                      <Typography variant="body2">Documentation:</Typography>
                                      <Rating 
                                        value={verification.ratings?.documentation || 0} 
                                        readOnly
                                      />
                                    </Grid>
                                    
                                    <Grid item xs={12} md={4}>
                                      <Typography variant="body2">Quality:</Typography>
                                      <Rating 
                                        value={verification.ratings?.quality || 0} 
                                        readOnly
                                      />
                                    </Grid>
                                  </Grid>
                                  
                                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                                    Verified on {formatDate(verification.verificationDate)} by Investor #{verification.verifierId}
                                  </Typography>
                                </CardContent>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>
                        
                        <Box sx={{ mt: 3 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Average Ratings:
                          </Typography>
                          
                          <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
                              <Typography variant="body2">Completion:</Typography>
                              <Rating 
                                value={averageRatings.completion} 
                                readOnly
                              />
                            </Grid>
                            
                            <Grid item xs={12} md={4}>
                              <Typography variant="body2">Documentation:</Typography>
                              <Rating 
                                value={averageRatings.documentation} 
                                readOnly
                              />
                            </Grid>
                            
                            <Grid item xs={12} md={4}>
                              <Typography variant="body2">Quality:</Typography>
                              <Rating 
                                value={averageRatings.quality} 
                                readOnly
                              />
                            </Grid>
                          </Grid>
                        </Box>
                      </>
                    ) : (
                      <Alert severity="info">
                        No investor verifications have been submitted yet. You can still approve this milestone based on your own verification.
                      </Alert>
                    )}
                    
                    <TextField
                      label="Admin Verification Notes"
                      multiline
                      rows={4}
                      fullWidth
                      value={verificationNotes}
                      onChange={(e) => setVerificationNotes(e.target.value)}
                      placeholder="Enter any notes about your verification of this milestone"
                      sx={{ mt: 3 }}
                    />
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      sx={{ mt: 1, mr: 1 }}
                    >
                      Continue
                    </Button>
                    <Button
                      onClick={handleBack}
                      sx={{ mt: 1, mr: 1 }}
                    >
                      Back
                    </Button>
                  </Box>
                </StepContent>
              </Step>
              
              <Step>
                <StepLabel>Release Funds</StepLabel>
                <StepContent>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" paragraph>
                      The milestone has been verified and approved. You can now release the associated funds to the project innovator.
                    </Typography>
                    
                    <Alert severity="info" sx={{ mb: 3 }}>
                      <Typography variant="body2">
                        <strong>Note:</strong> This will release {formatCurrency(fundAmount)} from the escrow account to the project's funding balance.
                      </Typography>
                    </Alert>
                    
                    <TextField
                      label="Fund Amount"
                      type="number"
                      fullWidth
                      value={fundAmount}
                      onChange={(e) => setFundAmount(e.target.value)}
                      InputProps={{
                        startAdornment: <Box sx={{ mr: 1 }}>$</Box>,
                      }}
                      sx={{ mb: 3 }}
                    />
                    
                    <TextField
                      label="Fund Release Notes"
                      multiline
                      rows={3}
                      fullWidth
                      value={fundReleaseNotes}
                      onChange={(e) => setFundReleaseNotes(e.target.value)}
                      placeholder="Enter any notes about this fund release"
                    />
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={() => setReleaseDialogOpen(true)}
                      sx={{ mt: 1, mr: 1 }}
                      startIcon={<AccountBalanceIcon />}
                    >
                      Release Funds
                    </Button>
                    <Button
                      onClick={handleBack}
                      sx={{ mt: 1, mr: 1 }}
                    >
                      Back
                    </Button>
                  </Box>
                </StepContent>
              </Step>
            </Stepper>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          {/* Sidebar */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Project Details
            </Typography>
            
            <Typography variant="body2" paragraph>
              <strong>Innovator:</strong> {innovator ? `${innovator.firstName} ${innovator.lastName}` : `User #${project?.userId}`}
            </Typography>
            
            <Typography variant="body2" paragraph>
              <strong>Project:</strong> {project?.title}
            </Typography>
            
            <Typography variant="body2" paragraph>
              <strong>Category:</strong> {project?.category}
            </Typography>
            
            <Typography variant="body2">
              <strong>Funding:</strong> {formatCurrency(project?.currentFunding)} / {formatCurrency(project?.fundingGoal)}
            </Typography>
            
            <Box sx={{ mt: 2, mb: 2 }}>
              <LinearProgress 
                variant="determinate" 
                value={(project?.currentFunding / project?.fundingGoal) * 100} 
                sx={{ height: 8, borderRadius: 5 }}
              />
            </Box>
            
            <Typography variant="body2">
              <strong>Project Progress:</strong> {project?.projectProgress || 0}%
            </Typography>
            
            <Box sx={{ mt: 1, mb: 2 }}>
              <LinearProgress 
                variant="determinate" 
                value={project?.projectProgress || 0} 
                color="success"
                sx={{ height: 8, borderRadius: 5 }}
              />
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle1" gutterBottom>
              Milestone Information
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                <strong>Milestone:</strong> {milestone?.title}
              </Typography>
              
              <Typography variant="body2" gutterBottom>
                <strong>Status:</strong> {milestone?.status === 'completed' ? 'Completed, Awaiting Verification' : milestone?.status}
              </Typography>
              
              <Typography variant="body2" gutterBottom>
                <strong>Due Date:</strong> {formatDate(milestone?.dueDate)}
              </Typography>
              
              <Typography variant="body2" gutterBottom>
                <strong>Completion Date:</strong> {formatDate(milestone?.completedDate)}
              </Typography>
              
              <Typography variant="body2" gutterBottom>
                <strong>Project Contribution:</strong> {milestone?.completionPercentage || 0}%
              </Typography>
              
              <Typography variant="body2" gutterBottom>
                <strong>Estimated Funding:</strong> {formatCurrency(milestone?.estimatedFunding || 0)}
              </Typography>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle1" gutterBottom>
              Verification Status
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                <strong>Investor Verifications:</strong> {verifications.length} submitted
              </Typography>
              
              <Typography variant="body2" gutterBottom>
                <strong>Average Rating:</strong> {averageRatings.average}/5
              </Typography>
              
              <Typography variant="body2" gutterBottom>
                <strong>Verification Submitted:</strong> {formatDate(milestone?.verificationDate)}
              </Typography>
            </Box>
          </Paper>
          
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Actions
            </Typography>
            
            <Button
              fullWidth
              variant="contained"
              color="success"
              startIcon={<CheckCircleIcon />}
              onClick={() => setApproveDialogOpen(true)}
              sx={{ mb: 2 }}
            >
              Approve Milestone
            </Button>
            
            <Button
              fullWidth
              variant="outlined"
              color="error"
              startIcon={<CancelIcon />}
              onClick={() => setRejectDialogOpen(true)}
            >
              Reject Verification
            </Button>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Approve Dialog */}
      <Dialog
        open={approveDialogOpen}
        onClose={() => setApproveDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Approve Milestone</DialogTitle>
        <DialogContent>
          <DialogContentText paragraph>
            Are you sure you want to approve this milestone? This will verify that the milestone has been successfully completed.
          </DialogContentText>
          
          <DialogContentText>
            After approval, you will be able to release the associated funds.
          </DialogContentText>
          
          <TextField
            label="Verification Notes"
            fullWidth
            multiline
            rows={4}
            margin="normal"
            variant="outlined"
            value={verificationNotes}
            onChange={(e) => setVerificationNotes(e.target.value)}
            placeholder="Enter any notes or comments about your verification of this milestone"
            />
            </DialogContent>
            <DialogActions>
            <Button onClick={() => setApproveDialogOpen(false)}>Cancel</Button>
            <Button 
            variant="contained" 
            color="success" 
            onClick={handleApproveMilestone}
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : <CheckCircleIcon />}
            >
            {isSubmitting ? 'Processing...' : 'Approve Milestone'}
            </Button>
            </DialogActions>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog
            open={rejectDialogOpen}
            onClose={() => setRejectDialogOpen(false)}
            maxWidth="sm"
            fullWidth
            >
            <DialogTitle>Reject Milestone Verification</DialogTitle>
            <DialogContent>
            <DialogContentText paragraph>
            Are you sure you want to reject this milestone verification? This will return the milestone to "In Progress" status.
            </DialogContentText>

            <DialogContentText paragraph>
            Please provide a reason for rejection. This will be shared with the project innovator.
            </DialogContentText>

            <TextField
            label="Rejection Reason"
            fullWidth
            multiline
            rows={4}
            margin="normal"
            variant="outlined"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Explain why this milestone does not meet the verification criteria"
            required
            error={rejectReason.trim() === ''}
            helperText={rejectReason.trim() === '' ? 'Rejection reason is required' : ''}
            />
            </DialogContent>
            <DialogActions>
            <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
            <Button 
            variant="contained" 
            color="error" 
            onClick={handleRejectMilestone}
            disabled={isSubmitting || !rejectReason.trim()}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : <CancelIcon />}
            >
            {isSubmitting ? 'Processing...' : 'Reject Verification'}
            </Button>
            </DialogActions>
            </Dialog>

            {/* Fund Release Dialog */}
            <Dialog
            open={releaseDialogOpen}
            onClose={() => setReleaseDialogOpen(false)}
            maxWidth="sm"
            fullWidth
            >
            <DialogTitle>Release Milestone Funds</DialogTitle>
            <DialogContent>
            <DialogContentText paragraph>
            You are about to release {formatCurrency(fundAmount)} to the project's funding balance. This action cannot be undone.
            </DialogContentText>

            <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              This amount will be released from the escrow account to the project's available funds.
            </Typography>
            </Alert>

            <TextField
            label="Fund Release Notes"
            fullWidth
            multiline
            rows={3}
            margin="normal"
            variant="outlined"
            value={fundReleaseNotes}
            onChange={(e) => setFundReleaseNotes(e.target.value)}
            placeholder="Enter any notes about this fund release"
            />
            </DialogContent>
            <DialogActions>
            <Button onClick={() => setReleaseDialogOpen(false)}>Cancel</Button>
            <Button 
            variant="contained" 
            color="primary" 
            onClick={handleReleaseFunds}
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : <AccountBalanceIcon />}
            >
            {isSubmitting ? 'Processing...' : 'Release Funds'}
            </Button>
            </DialogActions>
            </Dialog>
            </Container>
            );
            };

    export default AdminMilestoneVerification;