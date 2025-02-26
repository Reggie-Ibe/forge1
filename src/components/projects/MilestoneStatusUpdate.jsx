// src/components/projects/MilestoneStatusUpdate.jsx
import { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  CircularProgress,
  Alert,
  Typography,
  Chip
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

const MilestoneStatusUpdate = ({ milestone, onStatusUpdate, projectOwnerId }) => {
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(milestone.status);
  const [completionDetails, setCompletionDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const statusOptions = [
    { value: 'pending', label: 'Pending', disabled: false },
    { value: 'inProgress', label: 'In Progress', disabled: false },
    { value: 'completed', label: 'Completed', disabled: milestone.status === 'pending' }
  ];
  
  // Only project owner or admin can change status
  const canUpdateStatus = user?.id === projectOwnerId || user?.role === 'admin';
  
  // Only project owner can mark as completed (pending admin approval)
  const canMarkCompleted = user?.id === projectOwnerId && milestone.status === 'inProgress';
  
  // Only admin can approve completion
  const canApproveCompletion = user?.role === 'admin' && milestone.status === 'completed' && !milestone.adminApproved;

  const handleOpenDialog = () => {
    setSelectedStatus(milestone.status);
    setCompletionDetails('');
    setError('');
    setSuccess('');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleStatusChange = (event) => {
    setSelectedStatus(event.target.value);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Prepare the update data
      const updateData = {
        status: selectedStatus,
      };
      
      // If marking as completed, add completion details
      if (selectedStatus === 'completed' && milestone.status !== 'completed') {
        updateData.completedDate = new Date().toISOString();
        updateData.completionDetails = completionDetails;
        updateData.adminApproved = false; // Not approved yet
      }
      
      // If admin is approving completion
      if (canApproveCompletion && selectedStatus === 'completed') {
        updateData.adminApproved = true;
        updateData.approvedBy = user.id;
        updateData.approvedDate = new Date().toISOString();
      }
      
      // Update milestone via API
      const response = await fetch(`${apiUrl}/milestones/${milestone.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update milestone status');
      }
      
      const updatedMilestone = await response.json();
      
      // Set success message based on action
      let successMessage = 'Milestone status updated successfully.';
      if (selectedStatus === 'completed' && !updatedMilestone.adminApproved) {
        successMessage = 'Milestone marked as completed. Awaiting admin approval.';
      } else if (canApproveCompletion && updatedMilestone.adminApproved) {
        successMessage = 'Milestone completion has been approved.';
      }
      
      setSuccess(successMessage);
      
      // Call the callback function to update parent component
      if (onStatusUpdate) {
        onStatusUpdate(updatedMilestone);
      }
      
      // Close dialog after a delay
      setTimeout(() => {
        setDialogOpen(false);
      }, 1500);
    } catch (err) {
      console.error('Error updating milestone status:', err);
      setError(err.message || 'Failed to update milestone status. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine the button text and color based on milestone status and user role
  const getButtonProps = () => {
    if (canApproveCompletion) {
      return {
        text: 'Approve Completion',
        color: 'success',
        onClick: handleOpenDialog,
        disabled: false
      };
    }
    
    if (milestone.status === 'pending') {
      return {
        text: 'Start Milestone',
        color: 'primary',
        onClick: handleOpenDialog,
        disabled: !canUpdateStatus
      };
    }
    
    if (milestone.status === 'inProgress') {
      return {
        text: 'Mark Completed',
        color: 'primary',
        onClick: handleOpenDialog,
        disabled: !canMarkCompleted
      };
    }
    
    if (milestone.status === 'completed' && !milestone.adminApproved) {
      return {
        text: 'Awaiting Approval',
        color: 'warning',
        onClick: null,
        disabled: true
      };
    }
    
    return {
      text: 'Update Status',
      color: 'primary',
      onClick: handleOpenDialog,
      disabled: !canUpdateStatus
    };
  };
  
  const buttonProps = getButtonProps();

  return (
    <>
      <Button
        variant="outlined"
        color={buttonProps.color}
        onClick={buttonProps.onClick}
        disabled={buttonProps.disabled}
        size="small"
      >
        {buttonProps.text}
      </Button>
      
      {/* Status Update Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Update Milestone Status
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}
          
          <DialogContentText sx={{ mb: 2 }}>
            {canApproveCompletion
              ? 'Review and approve this milestone completion.'
              : 'Update the status of this milestone.'}
          </DialogContentText>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Current Status:
            </Typography>
            <Chip
              label={milestone.status === 'inProgress' 
                ? 'In Progress' 
                : milestone.status.charAt(0).toUpperCase() + milestone.status.slice(1)}
              color={
                milestone.status === 'completed'
                  ? milestone.adminApproved ? 'success' : 'warning'
                  : milestone.status === 'inProgress'
                  ? 'primary'
                  : 'default'
              }
              variant={milestone.adminApproved ? 'filled' : 'outlined'}
            />
            {milestone.status === 'completed' && !milestone.adminApproved && (
              <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 1 }}>
                Awaiting admin approval
              </Typography>
            )}
          </Box>
          
          {!canApproveCompletion && (
            <FormControl fullWidth margin="normal">
              <InputLabel id="status-select-label">New Status</InputLabel>
              <Select
                labelId="status-select-label"
                id="status-select"
                value={selectedStatus}
                onChange={handleStatusChange}
                label="New Status"
              >
                {statusOptions.map((option) => (
                  <MenuItem
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                  >
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          
          {/* Completion details field - shown only when marking as completed */}
          {selectedStatus === 'completed' && milestone.status !== 'completed' && (
            <TextField
              margin="normal"
              label="Completion Details"
              fullWidth
              multiline
              rows={4}
              value={completionDetails}
              onChange={(e) => setCompletionDetails(e.target.value)}
              placeholder="Provide details about the milestone completion..."
              required
            />
          )}
          
          {/* For admin approval, show the completion details */}
          {canApproveCompletion && milestone.completionDetails && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Completion Details:
              </Typography>
              <Typography variant="body2">
                {milestone.completionDetails}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Completed on: {new Date(milestone.completedDate).toLocaleDateString()}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={isSubmitting || 
              (selectedStatus === 'completed' && 
              completionDetails === '' && 
              milestone.status !== 'completed')}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
          >
            {isSubmitting 
              ? 'Processing...' 
              : canApproveCompletion 
                ? 'Approve Completion' 
                : 'Update Status'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MilestoneStatusUpdate;