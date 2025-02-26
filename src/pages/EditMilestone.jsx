// src/pages/EditMilestone.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Paper, Button, Alert, CircularProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MilestoneForm from '../components/projects/MilestoneForm';
import { useAuth } from '../contexts/AuthContext';

const EditMilestone = () => {
  const { projectId, milestoneId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [milestone, setMilestone] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    // Fetch milestone and project data
    fetchData();
  }, [projectId, milestoneId]);
  
  const fetchData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Fetch milestone
      const milestoneResponse = await fetch(`${apiUrl}/milestones/${milestoneId}`);
      if (!milestoneResponse.ok) {
        throw new Error('Milestone not found');
      }
      
      const milestoneData = await milestoneResponse.json();
      setMilestone(milestoneData);
      
      // Verify milestone belongs to the correct project
      if (milestoneData.projectId.toString() !== projectId) {
        throw new Error('Milestone does not belong to this project');
      }
      
      // Fetch project
      const projectResponse = await fetch(`${apiUrl}/projects/${projectId}`);
      if (!projectResponse.ok) {
        throw new Error('Project not found');
      }
      
      const projectData = await projectResponse.json();
      setProject(projectData);
      
      // Check permissions - only project owner or admin can edit
      if (projectData.userId !== user.id && user.role !== 'admin') {
        throw new Error('You do not have permission to edit this milestone');
      }
      
      // Additional check for completed milestones
      if (milestoneData.status === 'completed' && milestoneData.adminApproved && user.role !== 'admin') {
        throw new Error('This milestone has been approved and can no longer be edited');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSuccess = (updatedMilestone) => {
    navigate(`/projects/${projectId}`, { 
      state: { 
        message: 'Milestone updated successfully!',
        tab: 1  // Ensure the Timeline tab is selected when returning
      }
    });
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
            Edit Milestone
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Edit milestone for {project?.title}
          </Typography>
          
          {milestone?.status === 'completed' && !milestone.adminApproved && (
            <Alert severity="info" sx={{ mt: 2 }}>
              This milestone is marked as completed and is awaiting admin approval.
            </Alert>
          )}
          
          {milestone?.status === 'completed' && milestone.adminApproved && (
            <Alert severity="success" sx={{ mt: 2 }}>
              This milestone has been completed and approved.
              {user.role !== 'admin' && ' Only admins can make further changes.'}
            </Alert>
          )}
        </Box>
        
        <MilestoneForm 
          projectId={projectId} 
          milestone={milestone} 
          onSuccess={handleSuccess} 
        />
      </Paper>
    </Container>
  );
};

export default EditMilestone;