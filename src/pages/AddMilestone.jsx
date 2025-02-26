// src/pages/AddMilestone.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Paper, Button, Alert, CircularProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MilestoneForm from '../components/projects/MilestoneForm';
import { useAuth } from '../contexts/AuthContext';

const AddMilestone = () => {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    // Verify that the user has permission to add milestones to this project
    fetchProject();
  }, [projectId]);
  
  const fetchProject = async () => {
    setLoading(true);
    setError('');
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${apiUrl}/projects/${projectId}`);
      if (!response.ok) {
        throw new Error('Project not found');
      }
      
      const projectData = await response.json();
      
      // Check if user is the owner of the project
      if (projectData.userId !== user?.id) {
        throw new Error('You do not have permission to add milestones to this project');
      }
      
      setProject(projectData);
    } catch (err) {
      console.error('Error fetching project:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSuccess = () => {
    navigate(`/projects/${projectId}`, { state: { message: 'Milestone added successfully!' } });
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
          onClick={() => navigate(`/projects/${projectId}`)}
        >
          Back to Project
        </Button>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button
        variant="text"
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(`/projects/${projectId}`)}
        sx={{ mb: 2 }}
      >
        Back to Project
      </Button>
      
      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Add Milestone
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Add a new milestone for {project?.title}.
          </Typography>
        </Box>
        
        <MilestoneForm projectId={projectId} onSuccess={handleSuccess} />
      </Paper>
    </Container>
  );
};

export default AddMilestone;