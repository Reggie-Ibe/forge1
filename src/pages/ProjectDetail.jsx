// src/pages/ProjectDetail.jsx - Updated with milestone management
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Material UI components
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Chip,
  Button,
  Divider,
  LinearProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  IconButton,
  Tooltip,
} from '@mui/material';

// Material UI icons
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CategoryIcon from '@mui/icons-material/Category';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EmailIcon from '@mui/icons-material/Email';

// Custom components
import MilestoneList from '../components/projects/MilestoneList';

// SDG color mapping
const sdgColors = {
  1: '#E5243B', // No Poverty
  2: '#DDA63A', // Zero Hunger
  3: '#4C9F38', // Good Health
  4: '#C5192D', // Quality Education
  5: '#FF3A21', // Gender Equality
  6: '#26BDE2', // Clean Water
  7: '#FCC30B', // Affordable Energy
  8: '#A21942', // Decent Work
  9: '#FD6925', // Industry & Innovation
  10: '#DD1367', // Reduced Inequalities
  11: '#FD9D24', // Sustainable Cities
  12: '#BF8B2E', // Responsible Consumption
  13: '#3F7E44', // Climate Action
  14: '#0A97D9', // Life Below Water
  15: '#56C02B', // Life on Land
  16: '#00689D', // Peace & Justice
  17: '#19486A', // Partnerships
};

// SDG names
const sdgNames = {
  1: 'No Poverty',
  2: 'Zero Hunger',
  3: 'Good Health and Well-being',
  4: 'Quality Education',
  5: 'Gender Equality',
  6: 'Clean Water and Sanitation',
  7: 'Affordable and Clean Energy',
  8: 'Decent Work and Economic Growth',
  9: 'Industry, Innovation, and Infrastructure',
  10: 'Reduced Inequalities',
  11: 'Sustainable Cities and Communities',
  12: 'Responsible Consumption and Production',
  13: 'Climate Action',
  14: 'Life Below Water',
  15: 'Life on Land',
  16: 'Peace, Justice, and Strong Institutions',
  17: 'Partnerships for the Goals',
};

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [projectOwner, setProjectOwner] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  
  // Dialogs
  const [showInvestDialog, setShowInvestDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showContactDialog, setShowContactDialog] = useState(false);
  
  // Investment form
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [investmentNote, setInvestmentNote] = useState('');
  const [investmentError, setInvestmentError] = useState('');
  const [isInvesting, setIsInvesting] = useState(false);
  
  // Contact form
  const [messageContent, setMessageContent] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [messageError, setMessageError] = useState('');
  
  // Delete project
  const [isDeleting, setIsDeleting] = useState(false);

  // Success message
  const [successMessage, setSuccessMessage] = useState('');
  
  useEffect(() => {
    fetchProjectData();
  }, [id]);
  
  const fetchProjectData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Fetch project
      const projectResponse = await fetch(`${apiUrl}/projects/${id}`);
      if (!projectResponse.ok) {
        throw new Error('Project not found');
      }
      const projectData = await projectResponse.json();
      setProject(projectData);
      
      // Fetch project owner
      const ownerResponse = await fetch(`${apiUrl}/users/${projectData.userId}`);
      if (ownerResponse.ok) {
        const ownerData = await ownerResponse.json();
        setProjectOwner(ownerData);
      }
      
      // Fetch milestones
      const milestonesResponse = await fetch(`${apiUrl}/milestones?projectId=${id}`);
      if (milestonesResponse.ok) {
        const milestonesData = await milestonesResponse.json();
        setMilestones(milestonesData);
      }
      
      // Fetch investments
      const investmentsResponse = await fetch(`${apiUrl}/investments?projectId=${id}`);
      if (investmentsResponse.ok) {
        const investmentsData = await investmentsResponse.json();
        setInvestments(investmentsData);
      }
    } catch (err) {
      console.error('Error fetching project data:', err);
      setError('Failed to load project. ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  const handleInvestSubmit = async () => {
    setInvestmentError('');
    
    if (!investmentAmount || parseFloat(investmentAmount) <= 0) {
      setInvestmentError('Please enter a valid investment amount');
      return;
    }
    
    setIsInvesting(true);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Create investment record
      const investmentData = {
        userId: user.id,
        projectId: parseInt(id),
        amount: parseFloat(investmentAmount),
        note: investmentNote,
        status: 'completed',
        createdAt: new Date().toISOString()
      };
      
      const investmentResponse = await fetch(`${apiUrl}/investments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(investmentData),
      });
      
      if (!investmentResponse.ok) {
        throw new Error('Failed to process investment');
      }
      
      // Update project funding
      const updatedProject = {
        ...project,
        currentFunding: project.currentFunding + parseFloat(investmentAmount)
      };
      
      const projectResponse = await fetch(`${apiUrl}/projects/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentFunding: updatedProject.currentFunding }),
      });
      
      if (!projectResponse.ok) {
        throw new Error('Failed to update project funding');
      }
      
      // Add wallet transaction
      const walletTransactionData = {
        userId: user.id,
        type: 'investment',
        amount: -parseFloat(investmentAmount),
        projectId: parseInt(id),
        status: 'completed',
        createdAt: new Date().toISOString()
      };
      
      const walletResponse = await fetch(`${apiUrl}/walletTransactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(walletTransactionData),
      });
      
      if (!walletResponse.ok) {
        console.warn('Failed to record wallet transaction');
      }
      
      // Update state
      setProject(updatedProject);
      setInvestments([...investments, investmentData]);
      setShowInvestDialog(false);
      setInvestmentAmount('');
      setInvestmentNote('');
      setSuccessMessage('Investment successfully processed!');
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (err) {
      console.error('Error processing investment:', err);
      setInvestmentError('Failed to process investment. Please try again later.');
    } finally {
      setIsInvesting(false);
    }
  };
  
  const handleSendMessage = async () => {
    setMessageError('');
    
    if (!messageContent.trim()) {
      setMessageError('Please enter a message');
      return;
    }
    
    setIsSendingMessage(true);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Create message
      const messageData = {
        senderId: user.id,
        receiverId: projectOwner.id,
        content: messageContent,
        createdAt: new Date().toISOString(),
        read: false
      };
      
      const response = await fetch(`${apiUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      setShowContactDialog(false);
      setMessageContent('');
      setSuccessMessage('Message sent successfully!');
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (err) {
      console.error('Error sending message:', err);
      setMessageError('Failed to send message. Please try again later.');
    } finally {
      setIsSendingMessage(false);
    }
  };
  
  const handleDeleteProject = async () => {
    setIsDeleting(true);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${apiUrl}/projects/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete project');
      }
      
      // Navigate back to projects list
      navigate('/projects', { state: { message: 'Project deleted successfully' } });
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Failed to delete project. Please try again later.');
      setShowDeleteDialog(false);
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Handle milestone updates
  const handleMilestoneUpdate = (updatedMilestones) => {
    setMilestones(updatedMilestones);
  };
  
  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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
          onClick={() => navigate('/projects')}
        >
          Back to Projects
        </Button>
      </Container>
    );
  }
  
  if (!project) return null;
  
  // Calculate funding progress
  const fundingProgress = (project.currentFunding / project.fundingGoal) * 100;
  const isOwner = user?.id === project.userId;
  const isInvestor = user?.role === 'investor';
  const isAdmin = user?.role === 'admin';
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Back button */}
      <Button
        variant="text"
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/projects')}
        sx={{ mb: 2 }}
      >
        Back to Projects
      </Button>

      {/* Success Message */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}
      
      {/* Project header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="h4" component="h1" gutterBottom>
                  {project.title}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  <Chip
                    icon={<CategoryIcon />}
                    label={project.category}
                    color="primary"
                  />
                  <Chip
                    icon={<CalendarTodayIcon />}
                    label={`Created ${formatDate(project.createdAt)}`}
                    variant="outlined"
                  />
                  <Chip
                    label={project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                    color={
                      project.status === 'active'
                        ? 'success'
                        : project.status === 'pending'
                        ? 'warning'
                        : 'default'
                    }
                  />
                </Box>
              </Box>
              
              {isOwner && (
                <Box>
                  <Tooltip title="Edit Project">
                    <IconButton
                      color="primary"
                      onClick={() => navigate(`/projects/${id}/edit`)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Project">
                    <IconButton
                      color="error"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
            </Box>
            
            <Typography variant="body1" paragraph>
              {project.description}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Funding Progress
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      {formatCurrency(project.currentFunding)} raised
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatCurrency(project.fundingGoal)} goal
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(fundingProgress, 100)}
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                  <Typography variant="body2" align="right" sx={{ mt: 0.5 }}>
                    {fundingProgress.toFixed(1)}% funded
                  </Typography>
                </Box>
                
                {projectOwner && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ mr: 2 }}>
                      {projectOwner.firstName?.[0]}{projectOwner.lastName?.[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2">
                        {projectOwner.firstName} {projectOwner.lastName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Project Owner
                      </Typography>
                    </Box>
                  </Box>
                )}
                
                {isInvestor && !isOwner && (
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<AttachMoneyIcon />}
                    onClick={() => setShowInvestDialog(true)}
                  >
                    Invest in Project
                  </Button>
                )}
                
                {!isOwner && (
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<EmailIcon />}
                    onClick={() => setShowContactDialog(true)}
                    sx={{ mt: 1 }}
                  >
                    Contact Owner
                  </Button>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  SDG Contributions
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {project.sdgs?.map((sdgId) => (
                    <Chip
                      key={sdgId}
                      label={sdgNames[sdgId] || `SDG ${sdgId}`}
                      sx={{
                        backgroundColor: sdgColors[sdgId] || '#888888',
                        color: 'white',
                      }}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Tabs section */}
      <Box sx={{ width: '100%', mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="project tabs">
            <Tab label="Overview" id="tab-0" />
            <Tab label="Timeline" id="tab-1" />
            <Tab label={`Investments (${investments.length})`} id="tab-2" />
          </Tabs>
        </Box>
        
        {/* Overview tab */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>
                Project Impact
              </Typography>
              <Typography variant="body1" paragraph>
                {project.impact || 'No impact description provided.'}
              </Typography>
              
              <Divider sx={{ my: 3 }} />
              
              <Typography variant="h6" gutterBottom>
                Key Features
              </Typography>
              <ul>
                <li>
                  <Typography variant="body1">
                    Category: {project.category}
                  </Typography>
                </li>
                <li>
                  <Typography variant="body1">
                    Funding Goal: {formatCurrency(project.fundingGoal)}
                  </Typography>
                </li>
                <li>
                  <Typography variant="body1">
                    Current Funding: {formatCurrency(project.currentFunding)}
                  </Typography>
                </li>
                <li>
                  <Typography variant="body1">
                    Created: {formatDate(project.createdAt)}
                  </Typography>
                </li>
              </ul>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Project Statistics
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Total Investments
                    </Typography>
                    <Typography variant="h5" sx={{ mb: 1 }}>
                      {investments.length}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary">
                      Funding Progress
                    </Typography>
                    <Typography variant="h5" sx={{ mb: 1 }}>
                      {fundingProgress.toFixed(1)}%
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary">
                      Remaining to Goal
                    </Typography>
                    <Typography variant="h5">
                      {formatCurrency(Math.max(0, project.fundingGoal - project.currentFunding))}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Timeline tab */}
        <TabPanel value={activeTab} index={1}>
          <MilestoneList 
            milestones={milestones}
            projectId={id}
            projectOwnerId={project.userId}
            onMilestoneUpdate={handleMilestoneUpdate}
          />
        </TabPanel>
        
        {/* Investments tab */}
        <TabPanel value={activeTab} index={2}>
          {investments.length === 0 ? (
            <Typography variant="body1" color="text.secondary">
              No investments have been made to this project yet.
            </Typography>
          ) : (
            <List>
              {investments.map((investment) => (
                <ListItem
                  key={investment.id}
                  divider
                  secondaryAction={
                    <Chip
                      icon={<CheckCircleIcon />}
                      label="Completed"
                      color="success"
                      variant="outlined"
                    />
                  }
                >
                  <ListItemText
                    primary={
                      <>
                        <Typography variant="subtitle1" component="span">
                          {formatCurrency(investment.amount)}
                        </Typography>
                        {investment.note && (
                          <Typography variant="body2" component="p" sx={{ mt: 1 }}>
                            "{investment.note}"
                          </Typography>
                        )}
                      </>
                    }
                    secondary={
                      <Typography variant="caption">
                        Invested on {formatDate(investment.createdAt)}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
          
          {isInvestor && !isOwner && (
            <Box sx={{ mt: 3 }}>
              <Button
                variant="contained"
                startIcon={<AttachMoneyIcon />}
                onClick={() => setShowInvestDialog(true)}
              >
                Invest in Project
              </Button>
            </Box>
          )}
        </TabPanel>
      </Box>
      
      {/* Investment Dialog */}
      <Dialog open={showInvestDialog} onClose={() => setShowInvestDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Invest in {project.title}</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Your investment will help this project reach its funding goal of {formatCurrency(project.fundingGoal)}.
          </DialogContentText>
          
          {investmentError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {investmentError}
            </Alert>
          )}
          
          <TextField
            autoFocus
            margin="dense"
            label="Investment Amount"
            type="number"
            fullWidth
            variant="outlined"
            value={investmentAmount}
            onChange={(e) => setInvestmentAmount(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AttachMoneyIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            label="Note (Optional)"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={investmentNote}
            onChange={(e) => setInvestmentNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowInvestDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleInvestSubmit}
            disabled={isInvesting}
            startIcon={isInvesting ? <CircularProgress size={20} /> : null}
          >
            {isInvesting ? 'Processing...' : 'Invest'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Contact Dialog */}
      <Dialog open={showContactDialog} onClose={() => setShowContactDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Contact Project Owner</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Send a message to {projectOwner?.firstName} {projectOwner?.lastName} about their project.
          </DialogContentText>
          
          {messageError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {messageError}
            </Alert>
          )}
          
          <TextField
            autoFocus
            margin="dense"
            label="Message"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={4}
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowContactDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSendMessage}
            disabled={isSendingMessage}
            startIcon={isSendingMessage ? <CircularProgress size={20} /> : <EmailIcon />}
          >
            {isSendingMessage ? 'Sending...' : 'Send Message'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
        <DialogTitle>Delete Project</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this project? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteProject}
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

// Tab Panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box>
          {children}
        </Box>
      )}
    </div>
  );
}

export default ProjectDetail;