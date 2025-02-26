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
  Paper
} from '@mui/material';

// Material UI icons
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import ScheduleIcon from '@mui/icons-material/Schedule';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';

// Custom components
import MilestoneStatusUpdate from './MilestoneStatusUpdate';

const MilestoneList = ({ milestones = [], projectId, projectOwnerId, onMilestoneUpdate }) => {
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
    
    // Calculate completion percentage
    const completionPercentage = total > 0 ? (completed / total) * 100 : 0;
    
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
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Milestone Progress
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">
              {stats.completed} of {stats.total} completed
            </Typography>
            <Typography variant="body2">
              {stats.completionPercentage.toFixed(0)}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={stats.completionPercentage} 
            sx={{ height: 8, borderRadius: 4 }}
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
              label={`${stats.awaitingApproval} Awaiting Approval`}
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
      </Paper>
      
      {/* Status update message */}
      {updateMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {updateMessage}
        </Alert>
      )}
      
      {/* Milestones List */}
      {updatedMilestones.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            No milestones have been added to this project yet.
          </Typography>
          
          {isOwner && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              component={Link}
              to={`/projects/${projectId}/milestones/add`}
            >
              Add First Milestone
            </Button>
          )}
        </Paper>
      ) : (
        <Box>
          {/* Add Milestone button for owner */}
          {isOwner && (
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                component={Link}
                to={`/projects/${projectId}/milestones/add`}
              >
                Add Milestone
              </Button>
            </Box>
          )}
          
          {/* Awaiting Approval Section */}
          {organizedMilestones.awaitingApproval.length > 0 && (
            <>
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, color: 'warning.main' }}>
                Awaiting Admin Approval
              </Typography>
              <Paper sx={{ mb: 3 }}>
                <List disablePadding>
                  {organizedMilestones.awaitingApproval.map((milestone, index) => (
                    <ListItem
                      key={milestone.id}
                      divider={index < organizedMilestones.awaitingApproval.length - 1}
                      sx={{ 
                        bgcolor: 'warning.light', 
                        p: 2, 
                        borderLeft: 4, 
                        borderColor: 'warning.main' 
                      }}
                      secondaryAction={
                        <Box>
                          <MilestoneStatusUpdate
                            milestone={milestone}
                            onStatusUpdate={handleStatusUpdate}
                            projectOwnerId={projectOwnerId}
                          />
                          {isOwner && (
                            <Tooltip title="Edit Milestone">
                              <IconButton 
                                edge="end" 
                                component={Link} 
                                to={`/projects/${projectId}/milestones/${milestone.id}/edit`}
                                sx={{ ml: 1 }}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      }
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="subtitle1">{milestone.title}</Typography>
                            <Chip
                              label="Awaiting Approval"
                              color="warning"
                              size="small"
                              sx={{ ml: 2 }}
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2">{milestone.description}</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
                              <Typography variant="caption" color="text.secondary">
                                Due: {formatDate(milestone.dueDate)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Completed: {formatDate(milestone.completedDate)}
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </>
          )}
          
          {/* In Progress Section */}
          {organizedMilestones.inProgress.length > 0 && (
            <>
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, color: 'primary.main' }}>
                In Progress
              </Typography>
              <Paper sx={{ mb: 3 }}>
                <List disablePadding>
                  {organizedMilestones.inProgress.map((milestone, index) => (
                    <ListItem
                      key={milestone.id}
                      divider={index < organizedMilestones.inProgress.length - 1}
                      sx={{ 
                        p: 2, 
                        borderLeft: 4, 
                        borderColor: 'primary.main' 
                      }}
                      secondaryAction={
                        <Box>
                          <MilestoneStatusUpdate
                            milestone={milestone}
                            onStatusUpdate={handleStatusUpdate}
                            projectOwnerId={projectOwnerId}
                          />
                          {isOwner && (
                            <Tooltip title="Edit Milestone">
                              <IconButton 
                                edge="end" 
                                component={Link} 
                                to={`/projects/${projectId}/milestones/${milestone.id}/edit`}
                                sx={{ ml: 1 }}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      }
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="subtitle1">{milestone.title}</Typography>
                            <Chip
                              label="In Progress"
                              color="primary"
                              size="small"
                              sx={{ ml: 2 }}
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2">{milestone.description}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                              Due: {formatDate(milestone.dueDate)}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </>
          )}
          
          {/* Pending Section */}
          {organizedMilestones.pending.length > 0 && (
            <>
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, color: 'text.secondary' }}>
                Pending
              </Typography>
              <Paper sx={{ mb: 3 }}>
                <List disablePadding>
                  {organizedMilestones.pending.map((milestone, index) => (
                    <ListItem
                      key={milestone.id}
                      divider={index < organizedMilestones.pending.length - 1}
                      sx={{ 
                        p: 2, 
                        borderLeft: 4, 
                        borderColor: 'grey.400' 
                      }}
                      secondaryAction={
                        <Box>
                          <MilestoneStatusUpdate
                            milestone={milestone}
                            onStatusUpdate={handleStatusUpdate}
                            projectOwnerId={projectOwnerId}
                          />
                          {isOwner && (
                            <Tooltip title="Edit Milestone">
                            <IconButton 
                              edge="end" 
                              component={Link} 
                              to={`/projects/${projectId}/milestones/${milestone.id}/edit`}
                              sx={{ ml: 1 }}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          )}
                        </Box>
                      }
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="subtitle1">{milestone.title}</Typography>
                            <Chip
                              label="Pending"
                              color="default"
                              size="small"
                              sx={{ ml: 2 }}
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2">{milestone.description}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                              Due: {formatDate(milestone.dueDate)}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </>
          )}
          
          {/* Completed Section */}
          {organizedMilestones.completed.length > 0 && (
            <>
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, color: 'success.main' }}>
                Completed
              </Typography>
              <Paper sx={{ mb: 3 }}>
                <List disablePadding>
                  {organizedMilestones.completed.map((milestone, index) => (
                    <ListItem
                      key={milestone.id}
                      divider={index < organizedMilestones.completed.length - 1}
                      sx={{ 
                        p: 2, 
                        borderLeft: 4, 
                        borderColor: 'success.main' 
                      }}
                      secondaryAction={
                        isOwner && (
                          <Tooltip title="Edit Milestone">
                            <IconButton 
                              edge="end" 
                              component={Link} 
                              to={`/projects/${projectId}/milestones/${milestone.id}/edit`}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                        )
                      }
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="subtitle1">{milestone.title}</Typography>
                            <Chip
                              label="Completed"
                              color="success"
                              size="small"
                              sx={{ ml: 2 }}
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2">{milestone.description}</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
                              <Typography variant="caption" color="text.secondary">
                                Due: {formatDate(milestone.dueDate)}
                              </Typography>
                              <Typography variant="caption" color="success.main">
                                Completed: {formatDate(milestone.completedDate)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Approved by Admin: {formatDate(milestone.approvedDate)}
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </>
          )}
        </Box>
      )}
    </Box>
  );
};

export default MilestoneList;