// src/components/projects/MilestoneList.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Material UI components
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Typography,
  Chip,
  Divider,
  Button,
  LinearProgress,
  IconButton,
  Tooltip,
  Alert,
  Paper,
  Grid,
  Card,
  CardContent,
  Stack
} from '@mui/material';

// Material UI icons
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import ScheduleIcon from '@mui/icons-material/Schedule';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import EventIcon from '@mui/icons-material/Event';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PercentIcon from '@mui/icons-material/Percent';

const MilestoneList = ({ 
  milestones = [], 
  projectId, 
  projectOwnerId, 
  onMilestoneUpdate, 
  projectStatus
}) => {
  const { user } = useAuth();
  const [updatedMilestones, setUpdatedMilestones] = useState(milestones);
  const [updateMessage, setUpdateMessage] = useState('');
  
  // Calculate milestone statistics
  const getStats = () => {
    const total = updatedMilestones.length;
    const completed = updatedMilestones.filter(m => m.status === 'completed' && m.adminApproved).length;
    const inProgress = updatedMilestones.filter(m => m.status === 'inProgress').length;
    const pending = updatedMilestones.filter(m => m.status === 'pending').length;
    const awaitingApproval = updatedMilestones.filter(m => m.status === 'completed' && !m.adminApproved).length;
    
    // Calculate completion percentage based on milestone weights
    const completionPercentage = updatedMilestones
      .filter(m => m.status === 'completed' && m.adminApproved)
      .reduce((sum, m) => sum + (m.completionPercentage || 0), 0);
    
    return {
      total,
      completed,
      inProgress,
      pending,
      awaitingApproval,
      completionPercentage
    };
  };
  
  const stats = getStats();
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Calculate days remaining
  const getDaysRemaining = (dateString) => {
    if (!dateString) return null;
    
    const dueDate = new Date(dateString);
    const today = new Date();
    
    // Clear time portion for accurate day calculation
    dueDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };
  
  // Generate status text
  const getStatusText = (milestone) => {
    const daysRemaining = getDaysRemaining(milestone.dueDate);
    
    if (milestone.status === 'completed' && milestone.adminApproved) {
      return `Completed on ${formatDate(milestone.completedDate)}`;
    } else if (milestone.status === 'completed' && !milestone.adminApproved) {
      return 'Pending verification';
    } else if (milestone.status === 'inProgress') {
      return daysRemaining !== null
        ? daysRemaining > 0
          ? `${daysRemaining} days remaining`
          : 'Past due'
        : 'In progress';
    } else {
      return 'Not started';
    }
  };
  
  // Handle milestone status update
  const handleStatusUpdate = (updatedMilestone) => {
    const updatedList = updatedMilestones.map(milestone => 
      milestone.id === updatedMilestone.id ? updatedMilestone : milestone
    );
    
    setUpdatedMilestones(updatedList);
    
    if (onMilestoneUpdate) {
      onMilestoneUpdate(updatedList);
    }
    
    // Set update message based on the status change
    const statusMessages = {
      pending: 'Milestone status set to Pending.',
      inProgress: 'Milestone is now In Progress.',
      completed: updatedMilestone.adminApproved 
        ? 'Milestone marked as Completed and approved.' 
        : 'Milestone marked as Completed, awaiting admin approval.'
    };
    
    setUpdateMessage(statusMessages[updatedMilestone.status] || 'Milestone updated successfully.');
    
    // Clear message after 5 seconds
    setTimeout(() => {
      setUpdateMessage('');
    }, 5000);
  };
  
  const isOwner = user?.id === projectOwnerId;
  const isAdmin = user?.role === 'admin';
  const projectActive = projectStatus === 'active';
  
  // Group milestones by status for better organization
  const organizedMilestones = {
    completed: updatedMilestones.filter(m => m.status === 'completed' && m.adminApproved),
    awaitingApproval: updatedMilestones.filter(m => m.status === 'completed' && !m.adminApproved),
    inProgress: updatedMilestones.filter(m => m.status === 'inProgress'),
    pending: updatedMilestones.filter(m => m.status === 'pending')
  };

  return (
    <Box>
      {/* Milestone Progress Overview */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>Project Timeline & Progress</Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">
                  Overall Progress: {stats.completionPercentage.toFixed(0)}%
                </Typography>
                <Typography variant="body2">
                  {stats.completed} of {stats.total} milestones completed
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={stats.completionPercentage} 
                sx={{ height: 10, borderRadius: 5 }}
              />
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip
                icon={<CheckCircleIcon />}
                label={`${stats.completed} Completed`}
                color="success"
                variant="outlined"
              />
              
              {stats.awaitingApproval > 0 && (
                <Chip
                  icon={<PendingIcon />}
                  label={`${stats.awaitingApproval} Awaiting Verification`}
                  color="warning"
                  variant="outlined"
                />
              )}
              
              <Chip
                icon={<ScheduleIcon />}
                label={`${stats.inProgress} In Progress`}
                color="primary"
                variant="outlined"
              />
              
              <Chip
                icon={<PendingIcon />}
                label={`${stats.pending} Pending`}
                color="default"
                variant="outlined"
              />
            </Box>
          </Grid>
          
          <Grid item xs={12} md={5}>
            {isOwner && projectActive && (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  component={Link}
                  to={`/projects/${projectId}/milestones/add`}
                  sx={{ mr: 2 }}
                >
                  Add Milestone
                </Button>
                
                {stats.inProgress > 0 && (
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<CheckCircleIcon />}
                    component={Link}
                    to={`/projects/${projectId}/milestones/current`}
                  >
                    Update Progress
                  </Button>
                )}
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>
      
      {/* Status update message */}
      {updateMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {updateMessage}
        </Alert>
      )}
      
      {/* Timeline visualization */}
      <Box sx={{ position: 'relative', mb: 4 }}>
        <Typography variant="h6" gutterBottom>Project Timeline</Typography>
        
        {/* Vertical line for timeline */}
        <Box sx={{ 
          position: 'absolute', 
          left: '15px', 
          top: '40px', 
          bottom: '0', 
          width: '2px', 
          bgcolor: 'divider',
          zIndex: 0
        }} />
        
        {updatedMilestones.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1">
              No milestones have been added to this project yet.
            </Typography>
          </Paper>
        ) : (
          <Box sx={{ pl: 4 }}>
            {[...updatedMilestones]
              .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
              .map((milestone, index) => {
                const isCompleted = milestone.status === 'completed' && milestone.adminApproved;
                const isInProgress = milestone.status === 'inProgress';
                const isPending = milestone.status === 'pending';
                const isAwaiting = milestone.status === 'completed' && !milestone.adminApproved;
                
                const dotColor = isCompleted ? 'success.main' : 
                                isInProgress ? 'primary.main' : 
                                isAwaiting ? 'warning.main' : 'grey.400';
                
                return (
                  <Box key={milestone.id} sx={{ position: 'relative', mb: 3 }}>
                    {/* Timeline dot */}
                    <Box sx={{ 
                      position: 'absolute', 
                      left: '-12px', 
                      top: '20px', 
                      width: '20px', 
                      height: '20px', 
                      borderRadius: '50%', 
                      bgcolor: dotColor,
                      border: '3px solid white',
                      zIndex: 1
                    }} />
                    
                    {/* Milestone card */}
                    <Card 
                      sx={{ 
                        mb: 2,
                        borderLeft: 5,
                        borderColor: dotColor
                      }}
                    >
                      <CardContent>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={8}>
                            <Typography variant="h6">{milestone.title}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              {milestone.description}
                            </Typography>
                            
                            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                              <Chip 
                                icon={<CalendarTodayIcon />} 
                                label={`Start: ${formatDate(milestone.startDate)}`}
                                size="small"
                                variant="outlined"
                              />
                              <Chip 
                                icon={<EventIcon />} 
                                label={`Due: ${formatDate(milestone.dueDate)}`} 
                                size="small"
                                variant="outlined"
                              />
                            </Stack>
                            
                            <Stack direction="row" spacing={1}>
                              <Chip 
                                icon={<AttachMoneyIcon />} 
                                label={`$${milestone.estimatedFunding?.toLocaleString() || 0}`}
                                size="small"
                                variant="outlined"
                              />
                              <Chip 
                                icon={<PercentIcon />} 
                                label={`${milestone.completionPercentage || 0}% of project`}
                                size="small"
                                variant="outlined"
                              />
                            </Stack>
                          </Grid>
                          
                          <Grid item xs={12} md={4}>
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography variant="body2" fontWeight="bold">
                                {getStatusText(milestone)}
                              </Typography>
                              
                              {/* Status chip */}
                              <Chip
                                label={milestone.status === 'completed' && milestone.adminApproved ? 'Completed' :
                                       milestone.status === 'completed' && !milestone.adminApproved ? 'Awaiting Verification' :
                                       milestone.status === 'inProgress' ? 'In Progress' : 'Pending'}
                                color={milestone.status === 'completed' && milestone.adminApproved ? 'success' :
                                       milestone.status === 'completed' && !milestone.adminApproved ? 'warning' :
                                       milestone.status === 'inProgress' ? 'primary' : 'default'}
                                size="small"
                                sx={{ mt: 1, mb: 2 }}
                              />
                              
                              {/* Action buttons */}
                              <Box sx={{ mt: 2 }}>
                                {isOwner && milestone.status === 'inProgress' && (
                                  <Button
                                    variant="outlined"
                                    color="primary"
                                    size="small"
                                    startIcon={<FileUploadIcon />}
                                    component={Link}
                                    to={`/projects/${projectId}/milestones/${milestone.id}/submit`}
                                    sx={{ mr: 1 }}
                                  >
                                    Submit
                                  </Button>
                                )}
                                
                                {isOwner && milestone.status === 'pending' && (
                                  <Button
                                    variant="outlined"
                                    color="primary"
                                    size="small"
                                    component={Link}
                                    to={`/projects/${projectId}/milestones/${milestone.id}/start`}
                                    sx={{ mr: 1 }}
                                  >
                                    Start
                                  </Button>
                                )}
                                
                                {isOwner && (
                                  <IconButton
                                    color="primary"
                                    size="small"
                                    component={Link}
                                    to={`/projects/${projectId}/milestones/${milestone.id}/edit`}
                                  >
                                    <EditIcon />
                                  </IconButton>
                                )}
                              </Box>
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Box>
                );
              })}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default MilestoneList;