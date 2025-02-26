// src/components/projects/ProjectForm.jsx
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
} from '@mui/material';

// Material UI icons
import SaveIcon from '@mui/icons-material/Save';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CategoryIcon from '@mui/icons-material/Category';

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

const ProjectForm = ({ project = null, onSuccess }) => {
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
  });
  
  // Form validation
  const [errors, setErrors] = useState({});
  
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
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };
  
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is updated
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const handleSDGChange = (event, newValue) => {
    setFormData(prev => ({ ...prev, sdgs: newValue }));
    if (errors.sdgs) {
      setErrors(prev => ({ ...prev, sdgs: '' }));
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(activeStep)) return;
    
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
        status: 'pending',
        createdAt: project?.createdAt || new Date().toISOString(),
        sdgs: formData.sdgs.map(sdg => sdg.id),
        timeline: formData.timeline,
        impact: formData.impact,
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
      
      if (onSuccess) {
        onSuccess(savedProject);
      } else {
        navigate(`/projects/${savedProject.id}`);
      }
    } catch (err) {
      console.error('Error saving project:', err);
      setError('Failed to save project. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Step content
  const getStepContent = (step) => {
    switch (step) {
      case 0:
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
      case 1:
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
      case 2:
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
      
      <form onSubmit={activeStep === steps.length - 1 ? handleSubmit : handleNext}>
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
            {activeStep === steps.length - 1 ? (project ? 'Update Project' : 'Create Project') : 'Next'}
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default ProjectForm;