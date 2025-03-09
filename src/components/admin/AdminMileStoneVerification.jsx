// src/components/admin/AdminMilestoneVerification.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Material UI components
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Chip,
  Divider,
  TextField,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControlLabel,
  Checkbox
} from '@mui/material';

// Material UI icons
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DownloadIcon from '@mui/icons-material/Download';
import EventIcon from '@mui/icons-material/Event';
import PersonIcon from '@mui/icons-material/Person';
import DescriptionIcon from '@mui/icons-material/Description';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';

const AdminMilestoneVerification = () => {
  const { projectId, milestoneId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [milestone, setMilestone] = useState(null);
  const [project, setProject] = useState(null);
  const [innovator, setInnovator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Verification state
  const [verificationNote, setVerificationNote] = useState('');
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Funding release
  const [releaseFunding, setReleaseFunding] = useState(true);
  const [fundingPercentage, setFundingPercentage] = useState(100);
  
  useEffect(() => {
    fetchData();
  }, [projectId, milestoneId]);
  
  const fetchData = async () => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Fetch milestone
      const milestoneResponse = await fetch(`${apiUrl}/milestones/${milestoneId}`);
      if (!milestoneResponse.ok) {
        throw new Error('Milestone not found');
      }
      
      const milestoneData = await milestoneResponse.json();
      setMilestone(milestoneData);
      
      // Verify milestone belongs to correct project
      if (milestoneData.projectId.toString() !== projectId) {
        throw new Error('Milestone does not belong to this project');
      }
      
      // Verify milestone is awaiting verification
      if (milestoneData.status !== 'completed' || milestoneData.adminApproved) {
        throw new Error('This milestone is not awaiting verification');
      }
      
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
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load milestone data');
    } finally {
      setLoading(false);
    }
  };
  
  const handleApproveOpen = () => {
    setApproveDialogOpen(true);
  };
  
  const handleRejectOpen = () => {
    setRejectDialogOpen(true);
  };
  
  const handleDialogClose = () => {
    setApproveDialogOpen(false);
    setRejectDialogOpen(false);
  };
  
  const handleApproveMilestone = async () => {
    setIsSubmitting(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Update milestone
      const milestoneUpdateData = {
        adminApproved: true,
        approvedBy: user.id,
        approvedDate: new Date().toISOString(),
        verificationNote
      };
      
      const milestoneResponse = await fetch(`${apiUrl}/milestones/${milestoneId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(milestoneUpdateData),
      });
      
      if (!milestoneResponse.ok) {
        throw new Error('Failed to approve milestone');
      }
      
      // Update project progress based on milestone completion percentage
      if (milestone.completionPercentage) {
        const projectProgress = Math.min(
          (project.projectProgress || 0) + milestone.completionPercentage,
          100
        );
        
        await fetch(`${apiUrl}/projects/${projectId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ projectProgress }),
        });
      }
      
      // Handle funding release if selected
      if (releaseFunding && milestone.estimatedFunding) {
        const releaseAmount = (milestone.estimatedFunding * fundingPercentage) / 100;
        
        // Create escrow release transaction
        const transactionData = {
          projectId: parseInt(projectId),
          milestoneId: parseInt(milestoneId),
          amount: releaseAmount,
          type: 'milestone_payment',
          status: 'completed',
          releasedBy: user.id,
          releasedAt: new Date().toISOString(),
          note: `Milestone payment for: ${milestone.title}`,
          createdAt: new Date().toISOString()
        };
        
        await fetch(`${apiUrl}/escrowTransactions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(transactionData),
        });
      }
      
      setSuccessMessage('Milestone verified successfully');
      setSuccess(true);
      setApproveDialogOpen(false);
      
      // Redirect after delay
      setTimeout(() => {
        navigate(`/admin/projects/${projectId}`, {
          state: { message: 'Milestone verified successfully' }
        });
      }, 2000);
      
    } catch (err) {
      console.error('Error approving milestone:', err);
      setError(err.message || 'Failed to approve milestone');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleRejectMilestone = async () => {
    if (!rejectionReason.trim()) return;
    
    setIsSubmitting(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Update milestone
      const milestoneUpdateData = {
        status: 'inProgress',
        rejectionReason,
        rejectedBy: user.id,
        rejectedAt: new Date().toISOString()
      };
      
      const response = await fetch(`${apiUrl}/milestones/${milestoneId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(milestoneUpdateData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to reject milestone');
      }
      
      setSuccessMessage('Milestone verification rejected');
      setSuccess(true);
      setRejectDialogOpen(false);
      
      // Redirect after delay
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
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Format currency
  const formatCurrency = (value) => {
    if (!value) return '$0';
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
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
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button
          variant="outlined"
          onClick={() => navigate(`/admin/projects/${projectId}`)}
        >
          Back to Project
        </Button>
      </Box>
    );
  }
  
  return (
    <Box>
      <Typography variant="h5" component="h1" gutterBottom>
        Verify Milestone
      </Typography>
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Typography variant="h6">{project?.title}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {innovator?.firstName} {innovator?.lastName}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body1" gutterBottom>
                Project Progress: {project?.projectProgress || 0}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={project?.projectProgress || 0} 
                sx={{ height: 8, borderRadius: 5, mb: 1 }}
              />
              
              <Chip 
                label={`Funding: ${formatCurrency(project?.currentFunding)} / ${formatCurrency(project?.fundingGoal)}`}
                color="primary"
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Milestone Details
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle1">{milestone?.title}</Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {milestone?.description}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Start Date</Typography>
                <Typography variant="body1">
                  {formatDate(milestone?.startDate)}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Due Date</Typography>
                <Typography variant="body1">
                  {formatDate(milestone?.dueDate)}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Actual Completion</Typography>
                <Typography variant="body1">
                  {formatDate(milestone?.completedDate)}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Project Contribution</Typography>
                <Typography variant="body1">
                  {milestone?.completionPercentage || 0}%
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Estimated Funding</Typography>
                <Typography variant="body1">
                  {formatCurrency(milestone?.estimatedFunding)}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Milestone Status</Typography>
                <Chip
                  label="Awaiting Verification"
                  color="warning"
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle1">Completion Details</Typography>
                <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'background.default' }}>
                  <Typography variant="body2">
                    {milestone?.completionDetails}
                  </Typography>
                </Paper>
              </Grid>
              
              {milestone?.additionalNotes && (
                <Grid item xs={12}>
                  <Typography variant="subtitle1">Additional Notes</Typography>
                  <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'background.default' }}>
                    <Typography variant="body2">
                      {milestone?.additionalNotes}
                    </Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Verification Documents
            </Typography>
            
            {milestone?.verificationDocuments?.length > 0 ? (
              <List>
                {milestone.verificationDocuments.map((doc, index) => (
                  <ListItem 
                    key={index}
                    sx={{ 
                      border: 1, 
                      borderColor: 'divider', 
                      borderRadius: 1, 
                      mb: 1
                    }}
                  >
                    <ListItemIcon>
                      <InsertDriveFileIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={doc.name}
                      secondary={formatDate(doc.uploadedAt)}
                    />
                    <Button
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={() => window.open(doc.fileUrl, '_blank')}
                    >
                      View
                    </Button>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert severity="warning">
                No verification documents were uploaded.
              </Alert>
            )}
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="h6" gutterBottom>
              Verification Decision
            </Typography>
            
            <TextField
              label="Verification Notes"
              multiline
              rows={3}
              fullWidth
              value={verificationNote}
              onChange={(e) => setVerificationNote(e.target.value)}
              placeholder="Add notes about the verification decision"
              sx={{ mb: 3 }}
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button
                variant="outlined"
                color="error"
                onClick={handleRejectOpen}
                startIcon={<CancelIcon />}
              >
                Reject
              </Button>
              
              <Button
                variant="contained"
                color="success"
                onClick={handleApproveOpen}
                startIcon={<CheckCircleIcon />}
              >
                Approve
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onClose={handleDialogClose}>
        <DialogTitle>Approve Milestone</DialogTitle>
        <DialogContent>
          <DialogContentText gutterBottom>
            Are you sure you want to approve this milestone? This will update the project progress and mark the milestone as completed.
          </DialogContentText>
          
          <FormControlLabel
            control={
              <Checkbox
                checked={releaseFunding}
                onChange={(e) => setReleaseFunding(e.target.checked)}
              />
            }
            label="Release funds for this milestone"
          />
          
          {releaseFunding && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Release Amount: {formatCurrency((milestone?.estimatedFunding * fundingPercentage) / 100)}
              </Typography>
              <TextField
                type="number"
                label="Percentage to Release"
                value={fundingPercentage}
                onChange={(e) => setFundingPercentage(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                fullWidth
                InputProps={{
                  endAdornment: <div>%</div>,
                }}
                helperText={`${formatCurrency(milestone?.estimatedFunding)} × ${fundingPercentage}%`}
                sx={{ mb: 2 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button 
            onClick={handleApproveMilestone}
            variant="contained" 
            color="success"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : <VerifiedUserIcon />}
          >
            {isSubmitting ? 'Processing...' : 'Approve Milestone'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={handleDialogClose}>
        <DialogTitle>Reject Milestone</DialogTitle>
        <DialogContent>
          <DialogContentText gutterBottom>
            Please provide a reason for rejecting this milestone. This will return the milestone to "In Progress" status.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Rejection Reason"
            fullWidth
            multiline
            rows={4}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            required
            error={!rejectionReason.trim()}
            helperText={!rejectionReason.trim() ? 'Rejection reason is required' : ''}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button 
            onClick={handleRejectMilestone}
            variant="contained" 
            color="error"
            disabled={isSubmitting || !rejectionReason.trim()}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : <CancelIcon />}
          >
            {isSubmitting ? 'Processing...' : 'Reject Milestone'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminMilestoneVerification;