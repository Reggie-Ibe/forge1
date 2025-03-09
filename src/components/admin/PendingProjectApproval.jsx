// src/components/admin/PendingProjectApproval.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Material UI components
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';

// Material UI icons
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonIcon from '@mui/icons-material/Person';
import CategoryIcon from '@mui/icons-material/Category';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LanguageIcon from '@mui/icons-material/Language';
import DescriptionIcon from '@mui/icons-material/Description';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const PendingProjectApproval = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pendingProjects, setPendingProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Selected project and dialogs
  const [selectedProject, setSelectedProject] = useState(null);
  const [innovator, setInnovator] = useState(null);
  const [projectMilestones, setProjectMilestones] = useState([]);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch pending projects on component mount
  useEffect(() => {
    fetchPendingProjects();
  }, []);

  const fetchPendingProjects = async () => {
    setLoading(true);
    setError('');
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Fetch projects with pending_approval status
      const response = await fetch(`${apiUrl}/projects?status=pending_approval`);
      if (!response.ok) {
        throw new Error('Failed to fetch pending projects');
      }
      
      const projects = await response.json();
      
      // Enhance projects with innovator names
      const enhancedProjects = await Promise.all(projects.map(async (project) => {
        const innovatorResponse = await fetch(`${apiUrl}/users/${project.userId}`);
        if (innovatorResponse.ok) {
          const innovator = await innovatorResponse.json();
          return {
            ...project,
            innovatorName: `${innovator.firstName} ${innovator.lastName}`
          };
        }
        return project;
      }));
      
      setPendingProjects(enhancedProjects);
      
    } catch (err) {
      console.error('Error fetching pending projects:', err);
      setError('Failed to load pending projects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewProject = async (project) => {
    setSelectedProject(project);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Fetch innovator details
      const innovatorResponse = await fetch(`${apiUrl}/users/${project.userId}`);
      if (innovatorResponse.ok) {
        const innovatorData = await innovatorResponse.json();
        setInnovator(innovatorData);
      }
      
      // Fetch project milestones
      const milestonesResponse = await fetch(`${apiUrl}/milestones?projectId=${project.id}`);
      if (milestonesResponse.ok) {
        const milestonesData = await milestonesResponse.json();
        setProjectMilestones(milestonesData);
      } else {
        setProjectMilestones([]);
      }
      
      setViewDialogOpen(true);
      
    } catch (err) {
      console.error('Error fetching project details:', err);
      setError('Failed to load project details');
    }
  };

  const handleApproveProjectOpen = (project) => {
    setSelectedProject(project);
    setApproveDialogOpen(true);
  };

  const handleRejectProjectOpen = (project) => {
    setSelectedProject(project);
    setRejectDialogOpen(true);
    setRejectReason('');
  };

  const handleApproveProject = async () => {
    if (!selectedProject) return;
    
    setIsSubmitting(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Update project status to active
      const response = await fetch(`${apiUrl}/projects/${selectedProject.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'active',
          approvedBy: user.id,
          approvedAt: new Date().toISOString()
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to approve project');
      }
      
      // Update local state
      setPendingProjects(pendingProjects.filter(p => p.id !== selectedProject.id));
      setSuccessMessage(`Project "${selectedProject.title}" has been approved successfully.`);
      
      // Close dialog
      setApproveDialogOpen(false);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      
    } catch (err) {
      console.error('Error approving project:', err);
      setError('Failed to approve project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectProject = async () => {
    if (!selectedProject || !rejectReason.trim()) return;
    
    setIsSubmitting(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Update project status to rejected
      const response = await fetch(`${apiUrl}/projects/${selectedProject.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'rejected',
          rejectionReason: rejectReason,
          rejectedBy: user.id,
          rejectedAt: new Date().toISOString()
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to reject project');
      }
      
      // Update local state
      setPendingProjects(pendingProjects.filter(p => p.id !== selectedProject.id));
      setSuccessMessage(`Project "${selectedProject.title}" has been rejected.`);
      
      // Close dialog
      setRejectDialogOpen(false);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      
    } catch (err) {
      console.error('Error rejecting project:', err);
      setError('Failed to reject project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Pending Project Approvals
        </Typography>
        <Button 
          startIcon={<AccessTimeIcon />} 
          variant="outlined"
          onClick={fetchPendingProjects}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      {pendingProjects.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No pending projects
          </Typography>
          <Typography variant="body1" color="text.secondary">
            There are currently no projects pending approval.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Project</TableCell>
                <TableCell>Innovator</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Funding Goal</TableCell>
                <TableCell>Submitted</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingProjects.map(project => (
                <TableRow key={project.id}>
                  <TableCell>
                    <Typography variant="body1" fontWeight="medium">
                      {project.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {project.description.substring(0, 60)}...
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="body2">
                        {project.innovatorName || `User #${project.userId}`}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{project.category}</TableCell>
                  <TableCell>{formatCurrency(project.fundingGoal)}</TableCell>
                  <TableCell>{formatDate(project.createdAt)}</TableCell>
                  <TableCell>
                    <IconButton 
                      color="primary"
                      onClick={() => handleViewProject(project)}
                      title="View Details"
                    >
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton 
                      color="success"
                      onClick={() => handleApproveProjectOpen(project)}
                      title="Approve Project"
                    >
                      <CheckCircleIcon />
                    </IconButton>
                    <IconButton 
                      color="error"
                      onClick={() => handleRejectProjectOpen(project)}
                      title="Reject Project"
                    >
                      <CancelIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* View Project Dialog */}
      <Dialog 
        open={viewDialogOpen} 
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Project Details
        </DialogTitle>
        <DialogContent>
          {selectedProject && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h5">{selectedProject.title}</Typography>
                {innovator && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Submitted by: {innovator.firstName} {innovator.lastName}
                    </Typography>
                  </Box>
                )}
              </Grid>
              
              <Grid item xs={12}>
                <Divider />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>Project Description</Typography>
                <Typography variant="body2" paragraph>
                  {selectedProject.description}
                </Typography>
                
                <Typography variant="subtitle1" gutterBottom>Impact</Typography>
                <Typography variant="body2" paragraph>
                  {selectedProject.impact}
                </Typography>
                
                <Typography variant="subtitle1" gutterBottom>Timeline</Typography>
                <Typography variant="body2">
                  {selectedProject.timeline}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>Project Details</Typography>
                    
                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          <CategoryIcon />
                        </ListItemIcon>
                        <ListItemText primary="Category" secondary={selectedProject.category} />
                      </ListItem>
                      
                      <ListItem>
                        <ListItemIcon>
                          <AttachMoneyIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Funding Goal" 
                          secondary={formatCurrency(selectedProject.fundingGoal)} 
                        />
                      </ListItem>
                      
                      <ListItem>
                        <ListItemIcon>
                          <CalendarTodayIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Submission Date" 
                          secondary={formatDate(selectedProject.createdAt)} 
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>Sustainable Development Goals</Typography>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {selectedProject.sdgs?.map(sdg => (
                        <Chip
                          key={sdg}
                          label={`SDG ${sdg}`}
                          sx={{
                            bgcolor: sdgColors[sdg] || '#888888',
                            color: 'white',
                          }}
                        />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Divider />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Project Milestones
                </Typography>
                
                {projectMilestones.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No milestones defined for this project.
                  </Typography>
                ) : (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Milestone</TableCell>
                          <TableCell>Start Date</TableCell>
                          <TableCell>Due Date</TableCell>
                          <TableCell>Completion %</TableCell>
                          <TableCell>Est. Funding</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {projectMilestones.map(milestone => (
                          <TableRow key={milestone.id}>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {milestone.title}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {milestone.description.substring(0, 50)}
                                {milestone.description.length > 50 ? '...' : ''}
                              </Typography>
                            </TableCell>
                            <TableCell>{formatDate(milestone.startDate)}</TableCell>
                            <TableCell>{formatDate(milestone.dueDate)}</TableCell>
                            <TableCell>{milestone.completionPercentage || 0}%</TableCell>
                            <TableCell>{formatCurrency(milestone.estimatedFunding)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          <Button 
            variant="contained" 
            color="success"
            onClick={() => {
              setViewDialogOpen(false);
              handleApproveProjectOpen(selectedProject);
            }}
          >
            Approve
          </Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={() => {
              setViewDialogOpen(false);
              handleRejectProjectOpen(selectedProject);
            }}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>

      {/* Approve Project Dialog */}
      <Dialog open={approveDialogOpen} onClose={() => setApproveDialogOpen(false)}>
        <DialogTitle>Approve Project</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to approve "{selectedProject?.title}"? 
            This project will become active and visible to investors.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            color="success"
            onClick={handleApproveProject}
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : <CheckCircleIcon />}
          >
            {isSubmitting ? 'Processing...' : 'Approve Project'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Project Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)}>
        <DialogTitle>Reject Project</DialogTitle>
        <DialogContent>
          <DialogContentText gutterBottom>
            Please provide a reason for rejecting "{selectedProject?.title}".
            This feedback will be shared with the project owner.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Rejection Reason"
            fullWidth
            multiline
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            required
            error={rejectReason.trim() === ''}
            helperText={rejectReason.trim() === '' ? 'Rejection reason is required' : ''}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={handleRejectProject}
            disabled={isSubmitting || !rejectReason.trim()}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : <CancelIcon />}
          >
            {isSubmitting ? 'Processing...' : 'Reject Project'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PendingProjectApproval;