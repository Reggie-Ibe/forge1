// src/components/projects/MilestoneSubmission.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Material UI components
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Chip,
  LinearProgress,
  Alert,
  Divider,
  Card,
  CardContent,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';

// Material UI icons
import FileUploadIcon from '@mui/icons-material/FileUpload';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import EventIcon from '@mui/icons-material/Event';
import DescriptionIcon from '@mui/icons-material/Description';
import SendIcon from '@mui/icons-material/Send';

const MilestoneSubmission = () => {
  const { projectId, milestoneId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [milestone, setMilestone] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  
  // Form state
  const [completionDetails, setCompletionDetails] = useState('');
  const [actualCompletionDate, setActualCompletionDate] = useState(new Date().toISOString().split('T')[0]);
  const [completionPercentage, setCompletionPercentage] = useState(100);
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [additionalNotes, setAdditionalNotes] = useState('');
  
  // Steps for the stepper
  const steps = ['Milestone Details', 'Upload Verification', 'Review & Submit'];
  
  useEffect(() => {
    fetchData();
  }, [projectId, milestoneId]);
  
  const fetchData = async () => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Fetch milestone
      const milestoneResponse = await fetch(`${apiUrl}/milestones/${milestoneId}`);
      if (!milestoneResponse.ok) {
        throw new Error('Milestone not found');
      }
      
      const milestoneData = await milestoneResponse.json();
      setMilestone(milestoneData);
      
      // Verify milestone belongs to correct project
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
      
      // Verify user is project owner
      if (projectData.userId !== user.id) {
        throw new Error('You do not have permission to submit this milestone');
      }
      
      // Verify milestone is in progress
      if (milestoneData.status !== 'inProgress') {
        throw new Error('This milestone is not currently in progress');
      }
      
      // Pre-fill completion percentage with the milestone's configured percentage
      if (milestoneData.completionPercentage) {
        setCompletionPercentage(milestoneData.completionPercentage);
      }
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load milestone data');
    } finally {
      setLoading(false);
    }
  };
  
  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles(prevFiles => [...prevFiles, ...newFiles]);
  };
  
  const handleRemoveFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };
  
  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };
  
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };
  
  const validateStep = (step) => {
    switch (step) {
      case 0: // Milestone details
        return completionDetails.trim().length > 0;
      case 1: // Upload documents
        return files.length > 0;
      case 2: // Review submission
        return true;
      default:
        return false;
    }
  };
  
  const handleSubmit = async () => {
    if (!validateStep(activeStep)) return;
    
    setSubmitting(true);
    setError('');
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Simulate file upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        if (progress >= 100) clearInterval(interval);
      }, 300);
      
      // In a real implementation, you would upload the files to your server/storage here
      // For this example, we'll simulate successful uploads and create file metadata
      
      // Prepare verification data
      const verificationData = {
        completionDetails,
        actualCompletionDate,
        completedDate: new Date().toISOString(),
        status: 'completed',
        adminApproved: false,
        verificationSubmitted: true,
        verificationDate: new Date().toISOString(),
        verificationDocuments: files.map((file, index) => ({
          id: Date.now() + index,
          name: file.name,
          size: file.size,
          type: file.type,
          fileUrl: `/uploads/milestones/${projectId}-${milestoneId}-${file.name.replace(/\s+/g, '-')}`,
          uploadedAt: new Date().toISOString()
        })),
        additionalNotes
      };
      
      // Update milestone via API
      const response = await fetch(`${apiUrl}/milestones/${milestoneId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(verificationData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit milestone verification');
      }
      
      clearInterval(interval);
      setUploadProgress(100);
      setSuccess(true);
      
      // Redirect after a delay
      setTimeout(() => {
        navigate(`/projects/${projectId}`, {
          state: { message: 'Milestone submitted for verification successfully!' }
        });
      }, 2000);
      
    } catch (err) {
      console.error('Error submitting milestone:', err);
      setError(err.message || 'Failed to submit milestone. Please try again.');
      setUploadProgress(0);
    } finally {
      setSubmitting(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Render step content
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Milestone Completion Details
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  label="Completion Details"
                  multiline
                  rows={4}
                  fullWidth
                  value={completionDetails}
                  onChange={(e) => setCompletionDetails(e.target.value)}
                  required
                  error={completionDetails.trim() === '' && submitting}
                  helperText={completionDetails.trim() === '' && submitting ? 'Please describe how this milestone was completed' : 'Describe in detail how you achieved this milestone and what outcomes were produced'}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Actual Completion Date"
                  type="date"
                  fullWidth
                  value={actualCompletionDate}
                  onChange={(e) => setActualCompletionDate(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Project Contribution Percentage"
                  type="number"
                  fullWidth
                  value={completionPercentage}
                  onChange={(e) => setCompletionPercentage(e.target.value)}
                  InputProps={{
                    readOnly: true,
                    endAdornment: <div>%</div>,
                  }}
                  helperText="This milestone's contribution to overall project completion"
                />
              </Grid>
            </Grid>
          </Box>
        );
      case 1:
        return (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Upload Verification Documents
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              Please upload relevant documents to verify milestone completion such as reports, screenshots, deliverables, or other evidence.
            </Alert>
            
            <Box sx={{ mb: 3 }}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<FileUploadIcon />}
              >
                Select Files
                <input
                  type="file"
                  multiple
                  hidden
                  onChange={handleFileChange}
                />
              </Button>
            </Box>
            
            {files.length > 0 ? (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Selected Files:
                </Typography>
                <List dense>
                  {files.map((file, index) => (
                    <ListItem 
                      key={index}
                      secondaryAction={
                        <IconButton edge="end" onClick={() => handleRemoveFile(index)}>
                          <DeleteIcon />
                        </IconButton>
                      }
                    >
                      <ListItemIcon>
                        <InsertDriveFileIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={file.name}
                        secondary={`${(file.size / 1024).toFixed(2)} KB`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            ) : (
              <Alert severity="warning" sx={{ mb: 3 }}>
                No files selected. Please upload at least one document to verify your milestone completion.
              </Alert>
            )}
            
            <TextField
              label="Additional Notes"
              multiline
              rows={3}
              fullWidth
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Any additional information about the uploaded documents or completion status"
            />
          </Box>
        );
      case 2:
        return (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Review Submission
            </Typography>
            
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">Milestone</Typography>
                    <Typography variant="body1">{milestone?.title}</Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">Project</Typography>
                    <Typography variant="body1">{project?.title}</Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Completion Details</Typography>
                    <Typography variant="body2">{completionDetails}</Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">Actual Completion Date</Typography>
                    <Typography variant="body2">{formatDate(actualCompletionDate)}</Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">Contribution to Project</Typography>
                    <Typography variant="body2">{completionPercentage}%</Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Uploaded Documents ({files.length})</Typography>
                    <List dense>
                      {files.map((file, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <InsertDriveFileIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary={file.name}
                            secondary={`${(file.size / 1024).toFixed(2)} KB`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                  
                  {additionalNotes && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2">Additional Notes</Typography>
                      <Typography variant="body2">{additionalNotes}</Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
            
            <Alert severity="info">
              After submission, an admin will review your milestone verification. You'll be notified once it's approved.
            </Alert>
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button
          variant="outlined"
          onClick={() => navigate(`/projects/${projectId}`)}
        >
          Back to Project
        </Button>
      </Box>
    );
  }
  
  return (
    <Box>
      <Typography variant="h5" component="h1" gutterBottom>
        Submit Milestone for Verification
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={8}>
            <Typography variant="h6">{milestone?.title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {milestone?.description}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'right' }}>
              <Chip 
                icon={<EventIcon />} 
                label={`Due: ${formatDate(milestone?.dueDate)}`}
                color="primary"
                sx={{ mb: 1 }}
              />
              <Typography variant="body2">
                Milestone Weight: {milestone?.completionPercentage || 0}% of project
              </Typography>
            </Box>
          </Grid>
        </Grid>
        
        <Divider sx={{ mb: 3 }} />
        
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {success ? (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Milestone Submitted Successfully!
            </Typography>
            <Typography variant="body1" paragraph>
              Your milestone verification has been submitted and is awaiting approval.
            </Typography>
            <LinearProgress variant="determinate" value={100} sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Redirecting to project...
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ mb: 4 }}>
              {getStepContent(activeStep)}
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button
                disabled={activeStep === 0 || submitting}
                onClick={handleBack}
              >
                Back
              </Button>
              
              <Box>
                {activeStep === steps.length - 1 ? (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSubmit}
                    disabled={submitting || !validateStep(activeStep)}
                    startIcon={submitting ? <CircularProgress size={20} /> : <SendIcon />}
                  >
                    {submitting ? 'Submitting...' : 'Submit for Verification'}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={!validateStep(activeStep)}
                  >
                    Next
                  </Button>
                )}
              </Box>
            </Box>
            
            {submitting && (
              <Box sx={{ width: '100%', mt: 3 }}>
                <Typography variant="body2" align="center" gutterBottom>
                  Uploading files and submitting verification...
                </Typography>
                <LinearProgress variant="determinate" value={uploadProgress} />
              </Box>
            )}
          </>
        )}
      </Paper>
    </Box>
  );
};

export default MilestoneSubmission;