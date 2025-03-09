// src/pages/MilestoneVerification.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import VerificationForm from '../components/verification/VerificationForm';

// Material UI Components
import {
  Container,
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Grid,
  Divider,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Stack
} from '@mui/material';

// Material UI Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EventIcon from '@mui/icons-material/Event';
import PersonIcon from '@mui/icons-material/Person';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

const MilestoneVerification = () => {
  const { projectId, milestoneId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [milestone, setMilestone] = useState(null);
  const [project, setProject] = useState(null);
  const [innovator, setInnovator] = useState(null);
  const [existingVerifications, setExistingVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchMilestoneData();
  }, [projectId, milestoneId]);

  const fetchMilestoneData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Fetch milestone data
      const milestoneResponse = await fetch(`${apiUrl}/milestones/${milestoneId}`);
      if (!milestoneResponse.ok) {
        throw new Error('Milestone not found');
      }
      
      const milestoneData = await milestoneResponse.json();
      
      // Verify milestone belongs to specified project
      if (milestoneData.projectId.toString() !== projectId) {
        throw new Error('Milestone does not belong to this project');
      }
      
      setMilestone(milestoneData);
      
      // Fetch project data
      const projectResponse = await fetch(`${apiUrl}/projects/${projectId}`);
      if (!projectResponse.ok) {
        throw new Error('Project not found');
      }
      
      const projectData = await projectResponse.json();
      setProject(projectData);
      
      // Fetch innovator data
      if (projectData.userId) {
        const innovatorResponse = await fetch(`${apiUrl}/users/${projectData.userId}`);
        if (innovatorResponse.ok) {
          const innovatorData = await innovatorResponse.json();
          setInnovator(innovatorData);
        }
      }
      
      // Verify permission to submit verification
      // Only admin, investor, or independent verifier role can verify
      if (!['admin', 'investor'].includes(user.role)) {
        throw new Error('You do not have permission to verify this milestone');
      }
      
      // Verify milestone status
      if (milestoneData.status !== 'completed' || milestoneData.adminApproved) {
        throw new Error('This milestone is not available for verification');
      }
      
      // Fetch existing verifications
      const verificationsResponse = await fetch(`${apiUrl}/verifications?milestoneId=${milestoneId}`);
      if (verificationsResponse.ok) {
        const verificationsData = await verificationsResponse.json();
        
        // Check if user has already submitted a verification
        const userVerification = verificationsData.find(v => v.verifierId === user.id);
        if (userVerification) {
          throw new Error('You have already submitted a verification for this milestone');
        }
        
        setExistingVerifications(verificationsData);
      }
      
    } catch (err) {
      console.error('Error fetching milestone data:', err);
      setError(err.message || 'Failed to load milestone data');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSubmit = async (verification) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Add required fields to verification data
      const verificationData = {
        ...verification,
        milestoneId: parseInt(milestoneId),
        projectId: parseInt(projectId),
        verifierId: user.id,
        verifierRole: user.role,
        verificationDate: new Date().toISOString(),
        status: 'approved'
      };
      
      // Submit verification to API
      const response = await fetch(`${apiUrl}/verifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(verificationData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit verification');
      }
      
      // Set success message
      setSuccessMessage('Verification submitted successfully');
      
      // Navigate back to project detail page after 2 seconds
      setTimeout(() => {
        navigate(`/projects/${projectId}`, {
          state: { message: 'Verification submitted successfully', tab: 1 }
        });
      }, 2000);
      
    } catch (err) {
      console.error('Error submitting verification:', err);
      setError(err.message || 'Failed to submit verification');
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button
        variant="text"
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(`/projects/${projectId}`)}
        sx={{ mb: 3 }}
      >
        Back to Project
      </Button>
      
      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}
      
      <Typography variant="h4" component="h1" gutterBottom>
        Milestone Verification
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Project: <strong>{project?.title}</strong>
      </Typography>
      
      <Grid container spacing={4}>
        <Grid item xs={12} md={5}>
          {/* Milestone Details */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Milestone Details
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6" color="primary">{milestone?.title}</Typography>
                <Typography variant="body2" paragraph>
                  {milestone?.description}
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Due Date</Typography>
                <Typography variant="body1">{formatDate(milestone?.dueDate)}</Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Completion Date</Typography>
                <Typography variant="body1">{formatDate(milestone?.completedDate)}</Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Status</Typography>
                <Chip 
                  label="Awaiting Verification" 
                  color="warning" 
                  size="small"
                />
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Project Contribution</Typography>
                <Typography variant="body1">{milestone?.completionPercentage || 0}%</Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Completion Details
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Typography variant="body2">
                    {milestone?.completionDetails}
                  </Typography>
                </Paper>
              </Grid>
              
              {milestone?.additionalNotes && (
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Additional Notes
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                    <Typography variant="body2">
                      {milestone?.additionalNotes}
                    </Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </Paper>
          
          {/* Verification Documents */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Verification Documents
            </Typography>
            
            {milestone?.verificationDocuments && milestone.verificationDocuments.length > 0 ? (
              <List>
                {milestone.verificationDocuments.map((doc, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <InsertDriveFileIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary={doc.name}
                      secondary={`Uploaded on ${formatDate(doc.uploadedAt)}`}
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<AttachFileIcon />}
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View
                    </Button>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert severity="warning">
                No verification documents were uploaded.
              </Alert>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={7}>
          {/* Innovator Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                  {innovator?.firstName?.[0] || 'U'}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {innovator 
                      ? `${innovator.firstName} ${innovator.lastName}` 
                      : 'Unknown Innovator'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Project Innovator
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
          
          {/* Verification Form */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Verification Assessment
            </Typography>
            
            <Typography variant="body2" color="text.secondary" paragraph>
              As a verifier, your assessment helps ensure the quality and transparency of this project.
              Please review the milestone details and supporting documents before submitting your verification.
            </Typography>
            
            {existingVerifications.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Alert severity="info">
                  <Typography variant="body2">
                    This milestone has {existingVerifications.length} previous {existingVerifications.length === 1 ? 'verification' : 'verifications'}.
                  </Typography>
                </Alert>
              </Box>
            )}
            
            <VerificationForm 
              milestone={milestone} 
              onVerificationSubmit={handleVerificationSubmit} 
            />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default MilestoneVerification;