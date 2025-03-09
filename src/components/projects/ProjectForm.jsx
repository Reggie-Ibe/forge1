// src/components/projects/ProjectForm.jsx - Unified approach
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Material UI components
import {
  Box,
  TextField,
  Button,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Chip,
  Autocomplete,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Divider
} from '@mui/material';

// Material UI icons
import SaveIcon from '@mui/icons-material/Save';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CategoryIcon from '@mui/icons-material/Category';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

// SDG data
const sdgOptions = [
  { id: 1, name: 'No Poverty', color: '#E5243B' },
  { id: 2, name: 'Zero Hunger', color: '#DDA63A' },
  { id: 3, name: 'Good Health and Well-being', color: '#4C9F38' },
  { id: 4, name: 'Quality Education', color: '#C5192D' },
  { id: 5, name: 'Gender Equality', color: '#FF3A21' },
  { id: 6, name: 'Clean Water and Sanitation', color: '#26BDE2' },
  { id: 7, name: 'Affordable and Clean Energy', color: '#FCC30B' },
  { id: 8, name: 'Decent Work and Economic Growth', color: '#A21942' },
  { id: 9, name: 'Industry, Innovation, and Infrastructure', color: '#FD6925' },
  { id: 10, name: 'Reduced Inequalities', color: '#DD1367' },
  { id: 11, name: 'Sustainable Cities and Communities', color: '#FD9D24' },
  { id: 12, name: 'Responsible Consumption and Production', color: '#BF8B2E' },
  { id: 13, name: 'Climate Action', color: '#3F7E44' },
  { id: 14, name: 'Life Below Water', color: '#0A97D9' },
  { id: 15, name: 'Life on Land', color: '#56C02B' },
  { id: 16, name: 'Peace, Justice, and Strong Institutions', color: '#00689D' },
  { id: 17, name: 'Partnerships for the Goals', color: '#19486A' },
];

// Category options
const categoryOptions = [
  'CleanTech',
  'EdTech',
  'HealthTech',
  'AgTech',
  'FinTech',
  'Recycling',
  'Renewable Energy',
  'Sustainable Transport',
  'Social Enterprise',
  'Water Solutions',
  'Circular Economy',
];

const ProjectForm = ({ project = null, onSuccess, onActiveStepChange }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: project?.title || '',
    description: project?.description || '',
    category: project?.category || '',
    fundingGoal: project?.fundingGoal || '',
    sdgs: project?.sdgs ? sdgOptions.filter(sdg => project.sdgs.includes(sdg.id)) : [],
    timeline: project?.timeline || '',
    impact: project?.impact || '',
    milestones: project?.milestones || []
  });
  
  // Milestone dialog state
  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false);
  const [editingMilestoneIndex, setEditingMilestoneIndex] = useState(-1);
  const [milestoneData, setMilestoneData] = useState({
    title: '',
    description: '',
    startDate: '',
    dueDate: '',
    completionPercentage: 25,
    estimatedFunding: 0
  });
  
  // Submission confirmation dialog
  const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [createdProject, setCreatedProject] = useState(null);
  
  // Form validation
  const [errors, setErrors] = useState({});
  const [milestoneErrors, setMilestoneErrors] = useState({});
  
  // Validate each step
  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 0) {
      if (!formData.title.trim()) newErrors.title = 'Title is required';
      if (!formData.description.trim()) newErrors.description = 'Description is required';
      if (formData.description.trim().length < 50) newErrors.description = 'Description must be at least 50 characters';
      if (!formData.category) newErrors.category = 'Category is required';
    } else if (step === 1) {
      if (!formData.fundingGoal) newErrors.fundingGoal = 'Funding goal is required';
      if (formData.fundingGoal <= 0) newErrors.fundingGoal = 'Funding goal must be greater than 0';
      if (formData.sdgs.length === 0) newErrors.sdgs = 'Select at least one SDG';
    } else if (step === 2) {
      if (!formData.timeline.trim()) newErrors.timeline = 'Timeline is required';
      if (!formData.impact.trim()) newErrors.impact = 'Impact description is required';
      if (formData.milestones.length === 0) newErrors.milestones = 'At least one milestone is required';
      
      // Check if milestone percentages add up to 100%
      const totalPercentage = formData.milestones.reduce((sum, milestone) => 
        sum + parseFloat(milestone.completionPercentage || 0), 0);
        
      if (Math.abs(totalPercentage - 100) > 0.1) {
        newErrors.milestones = `Milestone completion percentages must add up to 100%. Current total: ${totalPercentage}%`;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Validate milestone data
  const validateMilestone = () => {
    const newErrors = {};
    
    if (!milestoneData.title.trim()) newErrors.title = 'Title is required';
    if (!milestoneData.description.trim()) newErrors.description = 'Description is required';
    if (!milestoneData.startDate) newErrors.startDate = 'Start date is required';
    if (!milestoneData.dueDate) newErrors.dueDate = 'Due date is required';
    if (milestoneData.startDate && milestoneData.dueDate && 
        new Date(milestoneData.startDate) > new Date(milestoneData.dueDate)) {
      newErrors.dueDate = 'Due date must be after start date';
    }
    if (!milestoneData.completionPercentage) newErrors.completionPercentage = 'Completion percentage is required';
    if (milestoneData.completionPercentage <= 0) newErrors.completionPercentage = 'Completion percentage must be greater than 0';
    if (!milestoneData.estimatedFunding && milestoneData.estimatedFunding !== 0) {
      newErrors.estimatedFunding = 'Estimated funding is required';
    }
    if (milestoneData.estimatedFunding < 0) {
      newErrors.estimatedFunding = 'Estimated funding cannot be negative';
    }
    
    // Check if total percentages (excluding the current milestone if editing) exceed 100%
    let currentTotal = 0;
    formData.milestones.forEach((milestone, index) => {
      if (editingMilestoneIndex === -1 || index !== editingMilestoneIndex) {
        currentTotal += parseFloat(milestone.completionPercentage || 0);
      }
    });
    
    const newTotal = currentTotal + parseFloat(milestoneData.completionPercentage || 0);
    if (newTotal > 100) {
      newErrors.completionPercentage = `Total completion percentage cannot exceed 100%. Current total with this milestone: ${newTotal}%`;
    }
    
    setMilestoneErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle next step
  const handleNext = () => {
    if (validateStep(activeStep)) {
      const newStep = activeStep + 1;
      setActiveStep(newStep);
      if (onActiveStepChange) {
        onActiveStepChange(newStep);
      }
    }
  };
  
  // Handle back step
  const handleBack = () => {
    const newStep = activeStep - 1;
    setActiveStep(newStep);
    if (onActiveStepChange) {
      onActiveStepChange(newStep);
    }
  };
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is updated
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  // Handle milestone input changes
  const handleMilestoneChange = (e) => {
    const { name, value } = e.target;
    setMilestoneData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is updated
    if (milestoneErrors[name]) {
      setMilestoneErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  // Handle SDG selection
  const handleSDGChange = (event, newValue) => {
    setFormData(prev => ({ ...prev, sdgs: newValue }));
    if (errors.sdgs) {
      setErrors(prev => ({ ...prev, sdgs: '' }));
    }
  };
  
  // Open milestone dialog
  const handleOpenMilestoneDialog = (index = -1) => {
    if (index >= 0) {
      // Edit existing milestone
      setEditingMilestoneIndex(index);
      setMilestoneData(formData.milestones[index]);
    } else {
      // Add new milestone
      setEditingMilestoneIndex(-1);
      
      // Calculate reasonable defaults
      const estimatedFunding = formData.fundingGoal ? Math.round(formData.fundingGoal / 4) : 0;
      const remainingPercentage = 100 - formData.milestones.reduce((sum, m) => 
        sum + parseFloat(m.completionPercentage || 0), 0);
      
      setMilestoneData({
        title: '',
        description: '',
        startDate: '',
        dueDate: '',
        completionPercentage: Math.max(Math.min(remainingPercentage, 25), 0), // Default 25% or remaining percentage
        estimatedFunding: estimatedFunding
      });
    }
    setMilestoneDialogOpen(true);
  };
  
  // Save milestone
  const handleSaveMilestone = () => {
    if (!validateMilestone()) return;
    
    const updatedMilestones = [...formData.milestones];
    
    if (editingMilestoneIndex >= 0) {
      // Update existing milestone
      updatedMilestones[editingMilestoneIndex] = milestoneData;
    } else {
      // Add new milestone
      updatedMilestones.push(milestoneData);
    }
    
    // Sort milestones by due date
    updatedMilestones.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    
    setFormData(prev => ({ ...prev, milestones: updatedMilestones }));
    setMilestoneDialogOpen(false);
    
    // Clear any milestone errors in the main form
    if (errors.milestones) {
      setErrors(prev => ({ ...prev, milestones: '' }));
    }
  };
  
  // Delete milestone
  const handleDeleteMilestone = (index) => {
    const updatedMilestones = formData.milestones.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, milestones: updatedMilestones }));
  };
  
  // Open submission dialog
  const handleOpenConfirmDialog = (e) => {
    e.preventDefault();
    if (!validateStep(activeStep)) return;
    
    setSubmissionDialogOpen(true);
  };
  
  // Submit the project
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Prepare data for API
      const projectData = {
        userId: user.id,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        fundingGoal: Number(formData.fundingGoal),
        currentFunding: project?.currentFunding || 0,
        status: project ? project.status : 'pending_approval',
        createdAt: project?.createdAt || new Date().toISOString(),
        sdgs: formData.sdgs.map(sdg => sdg.id),
        timeline: formData.timeline,
        impact: formData.impact,
        projectProgress: project?.projectProgress || 0,
      };
      
      // Update existing project or create new one
      const url = project 
        ? `${apiUrl}/projects/${project.id}` 
        : `${apiUrl}/projects`;
      
      const method = project ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save project');
      }
      
      const savedProject = await response.json();
      
      // Now save the milestones
      if (formData.milestones.length > 0) {
        const milestonePromises = formData.milestones.map(milestone => {
          const milestoneData = {
            ...milestone,
            projectId: savedProject.id,
            status: 'pending'
          };
          
          return fetch(`${apiUrl}/milestones`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(milestoneData),
          });
        });
        
        await Promise.all(milestonePromises);
      }
      
      setCreatedProject(savedProject);
      
      // Show success dialog for new projects
      if (!project) {
        setSubmissionSuccess(true);
      } else {
        // For updates, call the success callback directly
        if (onSuccess) {
          onSuccess(savedProject);
        } else {
          navigate(`/projects/${savedProject.id}`);
        }
      }
    } catch (err) {
      console.error('Error saving project:', err);
      setError('Failed to save project. Please try again later.');
      setSubmissionDialogOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle close of confirmation dialog
  const handleConfirmationClose = () => {
    setSubmissionDialogOpen(false);
    
    if (submissionSuccess) {
      if (onSuccess) {
        onSuccess(createdProject);
      } else {
        navigate(`/projects`, {
          state: { message: 'Project submitted successfully and is awaiting admin approval.' }
        });
      }
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
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Step content
  const getStepContent = (step) => {
    switch (step) {
      case 0: // Basic Information
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Project Title"
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
                rows={4}
                value={formData.description}
                onChange={handleChange}
                error={!!errors.description}
                helperText={errors.description || 'Provide a detailed description of your project (min 50 characters)'}
                disabled={isSubmitting}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required error={!!errors.category}>
                <InputLabel id="category-label">Category</InputLabel>
                <Select
                  labelId="category-label"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  label="Category"
                  disabled={isSubmitting}
                  startAdornment={
                    <InputAdornment position="start">
                      <CategoryIcon />
                    </InputAdornment>
                  }
                >
                  {categoryOptions.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
                {errors.category && (
                  <Typography variant="caption" color="error">
                    {errors.category}
                  </Typography>
                )}
              </FormControl>
            </Grid>
          </Grid>
        );
      case 1: // Funding & Goals
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Funding Goal"
                name="fundingGoal"
                type="number"
                value={formData.fundingGoal}
                onChange={handleChange}
                error={!!errors.fundingGoal}
                helperText={errors.fundingGoal}
                disabled={isSubmitting}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoneyIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                id="sdgs"
                options={sdgOptions}
                getOptionLabel={(option) => option.name}
                value={formData.sdgs}
                onChange={handleSDGChange}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option.name}
                      {...getTagProps({ index })}
                      key={option.id}
                      style={{ backgroundColor: option.color, color: 'white' }}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Sustainable Development Goals (SDGs)"
                    placeholder="Select SDGs"
                    helperText={errors.sdgs || 'Select the SDGs your project contributes to'}
                    error={!!errors.sdgs}
                    required
                  />
                )}
                disabled={isSubmitting}
              />
            </Grid>
          </Grid>
        );
      case 2: // Timeline & Impact
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Project Timeline"
                name="timeline"
                multiline
                rows={3}
                value={formData.timeline}
                onChange={handleChange}
                error={!!errors.timeline}
                helperText={errors.timeline || 'Describe your project timeline and key milestones'}
                disabled={isSubmitting}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Impact Description"
                name="impact"
                multiline
                rows={3}
                value={formData.impact}
                onChange={handleChange}
                error={!!errors.impact}
                helperText={errors.impact || 'Describe the expected impact of your project'}
                disabled={isSubmitting}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Milestones</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenMilestoneDialog()}
                  disabled={isSubmitting}
                >
                  Add Milestone
                </Button>
              </Box>
              
              {errors.milestones && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {errors.milestones}
                </Alert>
              )}
              
              {formData.milestones.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Milestone</TableCell>
                        <TableCell>Due Date</TableCell>
                        <TableCell align="right">Completion %</TableCell>
                        <TableCell align="right">Est. Funding</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {formData.milestones.map((milestone, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {milestone.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {milestone.description.substring(0, 50)}
                              {milestone.description.length > 50 ? '...' : ''}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {formatDate(milestone.dueDate)}
                          </TableCell>
                          <TableCell align="right">
                            {milestone.completionPercentage}%
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(milestone.estimatedFunding)}
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenMilestoneDialog(index)}
                              disabled={isSubmitting}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteMilestone(index)}
                              disabled={isSubmitting}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">
                  No milestones added yet. Click "Add Milestone" to define project milestones.
                </Alert>
              )}
            </Grid>
          </Grid>
        );
      default:
        return 'Unknown step';
    }
  };
  
  const steps = ['Basic Information', 'Funding & Goals', 'Timeline & Impact'];
  
  return (
    <Box sx={{ width: '100%' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      <form onSubmit={activeStep === steps.length - 1 ? handleOpenConfirmDialog : handleNext}>
        <Box sx={{ mt: 2, mb: 4 }}>
          {getStepContent(activeStep)}
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            onClick={activeStep === 0 ? () => navigate('/projects') : handleBack}
            disabled={isSubmitting}
          >
            {activeStep === 0 ? 'Cancel' : 'Back'}
          </Button>
          <Button
            variant="contained"
            type={activeStep === steps.length - 1 ? 'submit' : 'button'}
            onClick={activeStep === steps.length - 1 ? undefined : handleNext}
            disabled={isSubmitting}
            startIcon={activeStep === steps.length - 1 ? (isSubmitting ? <CircularProgress size={20} /> : <SaveIcon />) : null}
          >
            {activeStep === steps.length - 1 ? (project ? 'Update Project' : 'Submit Project') : 'Next'}
          </Button>
        </Box>
      </form>

      {/* Milestone Dialog */}
      <Dialog
        open={milestoneDialogOpen}
        onClose={() => setMilestoneDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingMilestoneIndex >= 0 ? 'Edit Milestone' : 'Add Milestone'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Milestone Title"
                name="title"
                value={milestoneData.title}
                onChange={handleMilestoneChange}
                error={!!milestoneErrors.title}
                helperText={milestoneErrors.title}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Description"
                name="description"
                multiline
                rows={2}
                value={milestoneData.description}
                onChange={handleMilestoneChange}
                error={!!milestoneErrors.description}
                helperText={milestoneErrors.description}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="Start Date"
                name="startDate"
                type="date"
                value={milestoneData.startDate}
                onChange={handleMilestoneChange}
                error={!!milestoneErrors.startDate}
                helperText={milestoneErrors.startDate}
                InputLabelProps={{
                  shrink: true,
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarTodayIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="Due Date"
                name="dueDate"
                type="date"
                value={milestoneData.dueDate}
                onChange={handleMilestoneChange}
                error={!!milestoneErrors.dueDate}
                helperText={milestoneErrors.dueDate}
                InputLabelProps={{
                  shrink: true,
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarTodayIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="Completion Percentage"
                name="completionPercentage"
                type="number"
                value={milestoneData.completionPercentage}
                onChange={handleMilestoneChange}
                error={!!milestoneErrors.completionPercentage}
                helperText={milestoneErrors.completionPercentage || 'Percentage this milestone contributes to overall project completion'}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="Estimated Funding"
                name="estimatedFunding"
                type="number"
                value={milestoneData.estimatedFunding}
                onChange={handleMilestoneChange}
                error={!!milestoneErrors.estimatedFunding}
                helperText={milestoneErrors.estimatedFunding || 'Estimated funding to be released upon completion'}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoneyIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
        <Button onClick={() => setMilestoneDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleSaveMilestone}
          >
            Save Milestone
          </Button>
        </DialogActions>
      </Dialog>

      {/* Submission Confirmation Dialog */}
      <Dialog
        open={submissionDialogOpen}
        onClose={isSubmitting ? undefined : handleConfirmationClose}
        aria-labelledby="project-submission-dialog-title"
      >
        <DialogTitle id="project-submission-dialog-title">
          {submissionSuccess ? "Project Submitted Successfully" : "Confirm Project Submission"}
        </DialogTitle>
        <DialogContent>
          {!submissionSuccess ? (
            <>
              <DialogContentText>
                Are you ready to submit your project for review? Once submitted, your project will be reviewed by our administration team before becoming visible to investors.
              </DialogContentText>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2">Project Details:</Typography>
                <Typography variant="body2"><strong>Title:</strong> {formData.title}</Typography>
                <Typography variant="body2"><strong>Category:</strong> {formData.category}</Typography>
                <Typography variant="body2"><strong>Funding Goal:</strong> ${Number(formData.fundingGoal).toLocaleString()}</Typography>
                <Typography variant="body2"><strong>SDGs:</strong> {formData.sdgs.map(sdg => sdg.name).join(', ')}</Typography>
                <Typography variant="body2"><strong>Milestones:</strong> {formData.milestones.length}</Typography>
              </Box>
            </>
          ) : (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CheckCircleIcon color="success" sx={{ fontSize: 40, mr: 1.5 }} />
                <Typography variant="h6">
                  Your project has been submitted!
                </Typography>
              </Box>
              <DialogContentText>
                Your project "{formData.title}" has been submitted successfully and is now pending approval. You will be notified once it has been reviewed by our team. You can track the status of your submission in your projects dashboard.
              </DialogContentText>
              <Alert severity="info" sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <HourglassEmptyIcon sx={{ mr: 1 }} />
                  <Typography variant="body2">
                    Current Status: <strong>Pending Approval</strong>
                  </Typography>
                </Box>
              </Alert>
            </>
          )}
        </DialogContent>
        <DialogActions>
          {!submissionSuccess ? (
            <>
              <Button onClick={handleConfirmationClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                variant="contained"
                color="primary"
                disabled={isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Project'}
              </Button>
            </>
          ) : (
            <Button onClick={handleConfirmationClose} variant="contained" color="primary">
              Go to Projects
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectForm;