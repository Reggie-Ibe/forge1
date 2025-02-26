// src/pages/EditProject.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Paper, Button, Alert, CircularProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ProjectForm from '../components/projects/ProjectForm';
import { useAuth } from '../contexts/AuthContext';

const EditProject = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    fetchProject();
  }, [id]);
  
  const fetchProject = async () => {
    setLoading(true);
    setError('');
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${apiUrl}/projects/${id}`);
      if (!response.ok) {
        throw new Error('Project not found');
      }
      
      const projectData = await response.json();
      
      // Check if user is the owner of the project
      if (projectData.userId !== user.id) {
        throw new Error('You do not have permission to edit this project');
      }
      
      setProject(projectData);
    } catch (err) {
      console.error('Error fetching project:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSuccess = (updatedProject) => {
    navigate(`/projects/${updatedProject.id}`, { state: { message: 'Project updated successfully!' } });
  };
  
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/projects')}
        >
          Back to Projects
        </Button>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button
        variant="text"
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(`/projects/${id}`)}
        sx={{ mb: 2 }}
      >
        Back to Project
      </Button>
      
      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Edit Project
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Update your project details below.
          </Typography>
        </Box>
        
        {project && <ProjectForm project={project} onSuccess={handleSuccess} />}
      </Paper>
    </Container>
  );
};

export default EditProject;