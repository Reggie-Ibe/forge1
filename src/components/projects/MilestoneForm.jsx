// src/components/projects/MilestoneForm.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Material UI components
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Grid,
  Typography,
  Chip,
  Paper
} from '@mui/material';

// Material UI icons
import SaveIcon from '@mui/icons-material/Save';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

const MilestoneForm = ({ projectId, milestone = null, onSuccess }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [projectData, setProjectData] = useState(null);
  const [formData, setFormData] = useState({
    title: milestone?.title || '',
    description: milestone?.description || '',
    dueDate: milestone?.dueDate ? new Date(milestone.dueDate).toISOString().split('T')[0] : '',
    status: milestone?.status || 'pending',
    completionDetails: milestone?.completionDetails || '',
  });
  
  // Form validation
  const [errors, setErrors] = useState({});

  // Fetch project data to verify ownership
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const response = await fetch(`${apiUrl}/projects/${projectId}`);
        
        if (!response.ok) {
          throw new Error('Project not found');
        }
        
        const project = await response.json();
        setProjectData(project);
        
        // Verify project ownership
        if (project.userId !== user.id && user.role !== 'admin') {
          setError('You do not have permission to manage milestones for this project');
          setTimeout(() => {
            navigate(`/projects/${projectId}`);
          }, 3000);
        }
      } catch (err) {
        console.error('Error fetching project:', err);
        setError('Failed to load project data');
      }
    };
    
    fetchProject();
  }, [projectId, user, navigate]);
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.dueDate) newErrors.dueDate = 'Due date is required';
    if (!formData.status) newErrors.status = 'Status is required';
    
    // If status is completed, require completion details
    if (formData.status === 'completed' && !formData.completionDetails.trim()) {
      newErrors.completionDetails = 'Completion details are required when marking a milestone as completed';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is updated
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Prepare data for API
      const milestoneData = {
        projectId: parseInt(projectId),
        title: formData.title,
        description: formData.description,
        dueDate: new Date(formData.dueDate).toISOString(),
        status: formData.status,
      };
      
      // Add completion details and date if the status is completed
      if (formData.status === 'completed') {
        milestoneData.completionDetails = formData.completionDetails;
        milestoneData.completedDate = new Date().toISOString();
        milestoneData.adminApproved = false; // Needs admin approval
      }
      
      // If the admin is updating and the status was already completed
      if (user.role === 'admin' && milestone?.status === 'completed') {
        milestoneData.adminApproved = true;
        milestoneData.approvedBy = user.id;
        milestoneData.approvedDate = new Date().toISOString();
      }
      
      // Update existing milestone or create new one
      const url = milestone 
        ? `${apiUrl}/milestones/${milestone.id}` 
        : `${apiUrl}/milestones`;
      
      const method = milestone ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(milestoneData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save milestone');
      }
      
      const savedMilestone = await response.json();
      
      // Show success message
      setSuccess('Milestone saved successfully.' + 
        (formData.status === 'completed' && !user.role === 'admin' 
          ? ' Awaiting admin approval for completion.' 
          : ''));
      
      // Clear form if it's a new milestone
      if (!milestone) {
        setFormData({
          title: '',
          description: '',
          dueDate: '',
          status: 'pending',
          completionDetails: '',
        });
      }
      
      if (onSuccess) {
        // Wait a moment to show the success message
        setTimeout(() => {
          onSuccess(savedMilestone);
        }, 1500);
      }
    } catch (err) {
      console.error('Error saving milestone:', err);
      setError('Failed to save milestone. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Status options depend on user role and current status
  const getStatusOptions = () => {
    if (user.role === 'admin') {
      // Admin can set any status
      return [
        { value: 'pending', label: 'Pending' },
        { value: 'inProgress', label: 'In Progress' },
        { value: 'completed', label: 'Completed' }
      ];
    } else {
      // Project owner cannot directly mark as completed if it's not at least in progress
      if (milestone?.status === 'pending') {
        return [
          { value: 'pending', label: 'Pending' },
          { value: 'inProgress', label: 'In Progress' }
        ];
      } else if (milestone?.status === 'inProgress') {
        return [
          { value: 'pending', label: 'Pending' },
          { value: 'inProgress', label: 'In Progress' },
          { value: 'completed', label: 'Completed' }
        ];
      } else if (milestone?.status === 'completed') {
        // If already marked as completed, only admin can change
        return [
          { value: 'completed', label: 'Completed' }
        ];
      } else {
        // For new milestones
        return [
          { value: 'pending', label: 'Pending' },
          { value: 'inProgress', label: 'In Progress' }
        ];
      }
    }
  };
  
  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      
      {milestone && milestone.status === 'completed' && !milestone.adminApproved && (
        <Alert severity="info" sx={{ mb: 3 }}>
          This milestone is marked as completed but is awaiting admin approval.
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            label="Milestone Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            error={!!errors.title}
            helperText={errors.title}
            disabled={isSubmitting || (milestone?.status === 'completed' && !user.role === 'admin')}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            label="Description"
            name="description"
            multiline
            rows={3}
            value={formData.description}
            onChange={handleChange}
            error={!!errors.description}
            helperText={errors.description}
            disabled={isSubmitting || (milestone?.status === 'completed' && !user.role === 'admin')}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            required
            fullWidth
            label="Due Date"
            name="dueDate"
            type="date"
            value={formData.dueDate}
            onChange={handleChange}
            error={!!errors.dueDate}
            helperText={errors.dueDate}
            disabled={isSubmitting || (milestone?.status === 'completed' && !user.role === 'admin')}
            InputLabelProps={{
              shrink: true,
            }}
            InputProps={{
              startAdornment: (
                <CalendarTodayIcon sx={{ mr: 1, color: 'action.active' }} />
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth required error={!!errors.status}>
            <InputLabel id="status-label">Status</InputLabel>
            <Select
              labelId="status-label"
              name="status"
              value={formData.status}
              onChange={handleChange}
              label="Status"
              disabled={isSubmitting || (milestone?.status === 'completed' && !milestone.adminApproved && user.role !== 'admin')}
            >
              {getStatusOptions().map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        {/* Completion Details - shown only when status is completed */}
        {formData.status === 'completed' && (
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              label="Completion Details"
              name="completionDetails"
              multiline
              rows={4}
              value={formData.completionDetails}
              onChange={handleChange}
              error={!!errors.completionDetails}
              helperText={errors.completionDetails || "Provide details about what was accomplished and how the milestone was completed"}
              disabled={isSubmitting || (milestone?.status === 'completed' && !user.role === 'admin')}
            />
          </Grid>
        )}
        
        {/* Admin approval section */}
        {user.role === 'admin' && milestone?.status === 'completed' && !milestone.adminApproved && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2, bgcolor: 'warning.light', mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Admin Approval Required
              </Typography>
              <Typography variant="body2">
                This milestone has been marked as completed by the project owner and requires your approval.
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Chip 
                  label="Approve Completion" 
                  color="success" 
                  onClick={handleSubmit}
                  sx={{ mr: 1 }}
                />
                <Chip 
                  label="Back to Project" 
                  color="primary" 
                  onClick={() => navigate(`/projects/${projectId}`)}
                />
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          variant="outlined"
          onClick={() => navigate(`/projects/${projectId}`)}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          type="submit"
          disabled={isSubmitting || (milestone?.status === 'completed' && !milestone.adminApproved && user.role !== 'admin')}
          startIcon={isSubmitting ? <CircularProgress size={20} /> : <SaveIcon />}
        >
          {isSubmitting 
            ? 'Saving...' 
            : milestone 
              ? user.role === 'admin' && milestone.status === 'completed' && !milestone.adminApproved 
                ? 'Approve Completion' 
                : 'Update Milestone' 
              : 'Add Milestone'
          }
        </Button>
      </Box>
    </Box>
  );
};

export default MilestoneForm;