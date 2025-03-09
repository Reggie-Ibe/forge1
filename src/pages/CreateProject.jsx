// src/pages/CreateProject.jsx - Simplified to use the unified ProjectForm
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Paper, Button, Alert } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ProjectForm from '../components/projects/ProjectForm';

const CreateProject = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  
  const handleSuccess = (project) => {
    // The ProjectForm component handles success notifications and redirects
    navigate('/projects', { 
      state: { message: 'Project submitted successfully and is awaiting admin approval.' } 
    });
  };
  
  const handleActiveStepChange = (step) => {
    setActiveStep(step);
  };
  
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button
        variant="text"
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/projects')}
        sx={{ mb: 2 }}
      >
        Back to Projects
      </Button>
      
      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Create New Project
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Fill in the details below to create your new innovation project. Your project will be reviewed by our team before becoming visible to investors.
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Box>
        
        <ProjectForm 
          onSuccess={handleSuccess} 
          onActiveStepChange={handleActiveStepChange}
        />
      </Paper>
    </Container>
  );
};

export default CreateProject;