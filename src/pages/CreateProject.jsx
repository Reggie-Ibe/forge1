// src/pages/CreateProject.jsx
import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Paper, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ProjectForm from '../components/projects/ProjectForm';

const CreateProject = () => {
  const navigate = useNavigate();
  
  const handleSuccess = (project) => {
    navigate(`/projects/${project.id}`, { state: { message: 'Project created successfully!' } });
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
            Fill in the details below to create your new innovation project.
          </Typography>
        </Box>
        
        <ProjectForm onSuccess={handleSuccess} />
      </Paper>
    </Container>
  );
};

export default CreateProject;