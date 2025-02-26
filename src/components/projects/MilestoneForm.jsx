// src/components/projects/MilestoneForm.jsx
import { useState } from 'react';
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
} from '@mui/material';

// Material UI icons
import SaveIcon from '@mui/icons-material/Save';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

const MilestoneForm = ({ projectId, milestone = null, onSuccess }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: milestone?.title || '',
    description: milestone?.description || '',
    dueDate: milestone?.dueDate ? new Date(milestone.dueDate).toISOString().split('T')[0] : '',
    status: milestone?.status || 'pending',
  });
  
  // Form validation
  const [errors, setErrors] = useState({});
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.dueDate) newErrors.dueDate = 'Due date is required';
    if (!formData.status) newErrors.status = 'Status is required';
    
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
      
      if (onSuccess) {
        onSuccess(savedMilestone);
      } else {
        navigate(`/projects/${projectId}`);
      }
    } catch (err) {
      console.error('Error saving milestone:', err);
      setError('Failed to save milestone. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
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
            disabled={isSubmitting}
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
            disabled={isSubmitting}
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
            disabled={isSubmitting}
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
              disabled={isSubmitting}
            >
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="inProgress">In Progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </Select>
          </FormControl>
        </Grid>
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
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={20} /> : <SaveIcon />}
        >
          {isSubmitting ? 'Saving...' : milestone ? 'Update Milestone' : 'Add Milestone'}
        </Button>
      </Box>
    </Box>
  );
};

export default MilestoneForm;