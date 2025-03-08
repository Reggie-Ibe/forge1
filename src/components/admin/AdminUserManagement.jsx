// src/components/admin/AdminUserManagement.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

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
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Grid,
  Tabs,
  Tab
} from '@mui/material';

// Material UI icons
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import PersonIcon from '@mui/icons-material/Person';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import BlockIcon from '@mui/icons-material/Block';
import DocumentScannerIcon from '@mui/icons-material/DocumentScanner';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

const AdminUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  
  // User edit
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    verificationStatus: 'pending'
  });
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');
  
  // User delete
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Verification dialogs
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [documentRequest, setDocumentRequest] = useState({
    idDocument: true,
    proofOfAddress: true,
    otherDocuments: false,
    otherDocumentsDescription: ''
  });
  
  // Success message
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);
  
  useEffect(() => {
    // Filter users when filters change
    filterUsers();
  }, [users, searchTerm, roleFilter, verificationFilter, activeTab]);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${apiUrl}/users`);
      if (!response.ok) throw new Error('Failed to fetch users');
      
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const filterUsers = () => {
    let result = [...users];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        user => 
          user.firstName?.toLowerCase().includes(term) || 
          user.lastName?.toLowerCase().includes(term) ||
          user.email?.toLowerCase().includes(term)
      );
    }
    
    // Apply role filter
    if (roleFilter) {
      result = result.filter(user => user.role === roleFilter);
    }
    
    // Apply verification filter
    if (verificationFilter !== 'all') {
      result = result.filter(user => user.verificationStatus === verificationFilter);
    }
    
    // Apply tab filter
    if (activeTab === 1) { // Pending
      result = result.filter(user => user.verificationStatus === 'pending');
    } else if (activeTab === 2) { // Verification Requested
      result = result.filter(user => user.verificationStatus === 'documents_requested');
    } else if (activeTab === 3) { // Verified
      result = result.filter(user => user.verificationStatus === 'approved');
    } else if (activeTab === 4) { // Rejected
      result = result.filter(user => user.verificationStatus === 'rejected');
    }
    
    setFilteredUsers(result);
  };
  
  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setRoleFilter('');
    setVerificationFilter('all');
  };
  
  // Edit user handlers
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      role: user.role || '',
      verificationStatus: user.verificationStatus || 'pending'
    });
    setEditError('');
    setEditDialogOpen(true);
  };
  
  const handleEditSubmit = async () => {
    if (!selectedUser) return;
    
    setIsEditSubmitting(true);
    setEditError('');
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${apiUrl}/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update user');
      }
      
      const updatedUser = await response.json();
      
      // Update users list
      setUsers(users.map(user => 
        user.id === updatedUser.id ? updatedUser : user
      ));
      
      setSuccessMessage('User updated successfully');
      setEditDialogOpen(false);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (err) {
      console.error('Error updating user:', err);
      setEditError('Failed to update user: ' + err.message);
    } finally {
      setIsEditSubmitting(false);
    }
  };
  
  // Delete user handlers
  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    setIsDeleting(true);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${apiUrl}/users/${userToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete user');
      }
      
      // Update users list
      setUsers(users.filter(user => user.id !== userToDelete.id));
      
      setSuccessMessage('User deleted successfully');
      setDeleteDialogOpen(false);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Verification handlers
  const handleOpenVerifyDialog = (user) => {
    setSelectedUser(user);
    setVerifyDialogOpen(true);
  };
  
  const handleOpenRejectDialog = (user) => {
    setSelectedUser(user);
    setRejectReason('');
    setRejectDialogOpen(true);
  };
  
  const handleOpenDocumentDialog = (user) => {
    setSelectedUser(user);
    setDocumentRequest({
      idDocument: true,
      proofOfAddress: true,
      otherDocuments: false,
      otherDocumentsDescription: ''
    });
    setDocumentDialogOpen(true);
  };
  
  const handleCloseDialogs = () => {
    setVerifyDialogOpen(false);
    setRejectDialogOpen(false);
    setDocumentDialogOpen(false);
  };
  
  const handleVerifyUser = async () => {
    if (!selectedUser) return;
    setIsEditSubmitting(true);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${apiUrl}/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          verificationStatus: 'approved',
          verifiedBy: 'admin', // In a real app, use the actual admin ID
          verifiedAt: new Date().toISOString()
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to verify user');
      }
      
      // Update local state
      setUsers(users.map(user => 
        user.id === selectedUser.id 
          ? { ...user, verificationStatus: 'approved', verifiedAt: new Date().toISOString() } 
          : user
      ));
      
      setSuccessMessage(`User ${selectedUser.firstName} ${selectedUser.lastName} has been verified successfully.`);
      handleCloseDialogs();
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (err) {
      console.error('Error verifying user:', err);
      setError('Failed to verify user. Please try again.');
    } finally {
      setIsEditSubmitting(false);
    }
  };
  
  const handleRejectUser = async () => {
    if (!selectedUser || !rejectReason.trim()) return;
    setIsEditSubmitting(true);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${apiUrl}/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          verificationStatus: 'rejected',
          rejectionReason: rejectReason,
          rejectedBy: 'admin', // In a real app, use the actual admin ID
          rejectedAt: new Date().toISOString()
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to reject user');
      }
      
      // Update local state
      setUsers(users.map(user => 
        user.id === selectedUser.id 
          ? { 
              ...user, 
              verificationStatus: 'rejected',
              rejectionReason: rejectReason,
              rejectedAt: new Date().toISOString() 
            } 
          : user
      ));
      
      setSuccessMessage(`User ${selectedUser.firstName} ${selectedUser.lastName} has been rejected.`);
      handleCloseDialogs();
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (err) {
      console.error('Error rejecting user:', err);
      setError('Failed to reject user. Please try again.');
    } finally {
      setIsEditSubmitting(false);
    }
  };
  
  const handleRequestDocuments = async () => {
    if (!selectedUser) return;
    
    if (!documentRequest.idDocument && !documentRequest.proofOfAddress && 
        !(documentRequest.otherDocuments && documentRequest.otherDocumentsDescription.trim())) {
      setError('Please select at least one document to request');
      return;
    }
    
    setIsEditSubmitting(true);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Prepare requested documents array
      const requestedDocs = [];
      if (documentRequest.idDocument) requestedDocs.push('ID Document');
      if (documentRequest.proofOfAddress) requestedDocs.push('Proof of Address');
      if (documentRequest.otherDocuments && documentRequest.otherDocumentsDescription.trim()) {
        requestedDocs.push(documentRequest.otherDocumentsDescription);
      }
      
      const response = await fetch(`${apiUrl}/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          verificationStatus: 'documents_requested',
          documentVerification: {
            documentsRequested: true,
            requestedDocuments: requestedDocs,
            requestedAt: new Date().toISOString(),
            requestedBy: 'admin', // In a real app, use the actual admin ID
            idVerified: false,
            addressVerified: false
          }
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to request documents');
      }
      
      // Update local state
      setUsers(users.map(user => 
        user.id === selectedUser.id 
          ? { 
              ...user, 
              verificationStatus: 'documents_requested',
              documentVerification: {
                documentsRequested: true,
                requestedDocuments: requestedDocs,
                requestedAt: new Date().toISOString(),
                requestedBy: 'admin',
                idVerified: false,
                addressVerified: false
              }
            } 
          : user
      ));
      
      setSuccessMessage(`Document request sent to ${selectedUser.firstName} ${selectedUser.lastName}.`);
      handleCloseDialogs();
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (err) {
      console.error('Error requesting documents:', err);
      setError('Failed to request documents. Please try again.');
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'approved':
        return <Chip icon={<VerifiedUserIcon />} label="Verified" color="success" size="small" />;
      case 'rejected':
        return <Chip icon={<BlockIcon />} label="Rejected" color="error" size="small" />;
      case 'documents_requested':
        return <Chip icon={<DocumentScannerIcon />} label="Documents Requested" color="info" size="small" />;
      case 'pending':
      default:
        return <Chip icon={<HourglassEmptyIcon />} label="Pending" color="warning" size="small" />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          User Management
        </Typography>
        <Button 
          startIcon={<RefreshIcon />} 
          variant="outlined"
          onClick={fetchUsers}
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

      {/* Tabs for different verification statuses */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="All Users" />
          <Tab label="Pending Verification" />
          <Tab label="Documents Requested" />
          <Tab label="Verified Users" />
          <Tab label="Rejected Users" />
        </Tabs>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel id="role-filter-label">Role</InputLabel>
              <Select
                labelId="role-filter-label"
                value={roleFilter}
                label="Role"
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <MenuItem value="">All Roles</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="innovator">Innovator</MenuItem>
                <MenuItem value="investor">Investor</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel id="verification-filter-label">Verification Status</InputLabel>
              <Select
                labelId="verification-filter-label"
                value={verificationFilter}
                label="Verification Status"
                onChange={(e) => setVerificationFilter(e.target.value)}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="documents_requested">Documents Requested</MenuItem>
                <MenuItem value="approved">Verified</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="text" 
                onClick={resetFilters}
                disabled={!searchTerm && !roleFilter && verificationFilter === 'all'}
              >
                Reset Filters
              </Button>
            </Box>
          </Grid>
        </Grid>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Showing {filteredUsers.length} of {users.length} users
          </Typography>
        </Box>
      </Paper>

      {/* Users Table */}
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Verification Status</TableCell>
              <TableCell align="right">Created</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body1" sx={{ py: 2 }}>
                    No users found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="body1" fontWeight="medium">
                        {user.firstName} {user.lastName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip 
                      label={user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Unknown'} 
                      color={
                        user.role === 'admin' ? 'error' :
                        user.role === 'investor' ? 'info' : 'success'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {getStatusChip(user.verificationStatus || 'pending')}
                  </TableCell>
                  <TableCell align="right">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      {(user.verificationStatus === 'pending' || user.verificationStatus === 'documents_requested') && (
                        <>
                          <Tooltip title="Request Documents">
                            <IconButton 
                              onClick={() => handleOpenDocumentDialog(user)}
                              size="small" 
                              color="info"
                            >
                              <DocumentScannerIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Verify User">
                            <IconButton 
                              onClick={() => handleOpenVerifyDialog(user)}
                              size="small" 
                              color="success"
                            >
                              <VerifiedUserIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject User">
                            <IconButton 
                              onClick={() => handleOpenRejectDialog(user)}
                              size="small" 
                              color="error"
                            >
                              <BlockIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      
                      <Tooltip title="Edit User">
                        <IconButton 
                          onClick={() => handleEditUser(user)}
                          size="small" 
                          color="primary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Delete User">
                        <IconButton 
                          onClick={() => handleDeleteClick(user)}
                          size="small" 
                          color="error"
                          disabled={user.role === 'admin'} // Prevent deleting admins
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          {editError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {editError}
            </Alert>
          )}
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="First Name"
                fullWidth
                value={editFormData.firstName}
                onChange={(e) => setEditFormData({...editFormData, firstName: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Last Name"
                fullWidth
                value={editFormData.lastName}
                onChange={(e) => setEditFormData({...editFormData, lastName: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Email"
                fullWidth
                value={editFormData.email}
                onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={editFormData.role}
                  label="Role"
                  onChange={(e) => setEditFormData({...editFormData, role: e.target.value})}
                >
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="innovator">Innovator</MenuItem>
                  <MenuItem value="investor">Investor</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Verification Status</InputLabel>
                <Select
                  value={editFormData.verificationStatus || 'pending'}
                  label="Verification Status"
                  onChange={(e) => setEditFormData({...editFormData, verificationStatus: e.target.value})}
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="documents_requested">Documents Requested</MenuItem>
                  <MenuItem value="approved">Verified</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleEditSubmit}
            disabled={isEditSubmitting}
            startIcon={isEditSubmitting ? <CircularProgress size={20} /> : null}
          >
            {isEditSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete User Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the user "{userToDelete?.firstName} {userToDelete?.lastName}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={handleDeleteUser}
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={20} /> : null}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Verify User Dialog */}
      <Dialog open={verifyDialogOpen} onClose={handleCloseDialogs}>
        <DialogTitle>Verify User</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to verify {selectedUser?.firstName} {selectedUser?.lastName}?
            This will grant the user full access to the platform.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>Cancel</Button>
          <Button 
            onClick={handleVerifyUser} 
            variant="contained" 
            color="success"
            disabled={isEditSubmitting}
            startIcon={isEditSubmitting ? <CircularProgress size={20} /> : <VerifiedUserIcon />}
          >
            {isEditSubmitting ? 'Verifying...' : 'Verify User'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Reject User Dialog */}
      <Dialog open={rejectDialogOpen} onClose={handleCloseDialogs}>
        <DialogTitle>Reject User</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please provide a reason for rejecting {selectedUser?.firstName} {selectedUser?.lastName}.
            This information will be shared with the user.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="rejection-reason"
            label="Rejection Reason"
            type="text"
            fullWidth
            multiline
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            required
            error={rejectReason.trim() === ''}
            helperText={rejectReason.trim() === '' ? 'Rejection reason is required' : ''}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>Cancel</Button>
          <Button 
            onClick={handleRejectUser} 
            variant="contained" 
            color="error"
            disabled={isEditSubmitting || rejectReason.trim() === ''}
            startIcon={isEditSubmitting ? <CircularProgress size={20} /> : <BlockIcon />}
          >
            {isEditSubmitting ? 'Rejecting...' : 'Reject User'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Request Documents Dialog */}
      <Dialog open={documentDialogOpen} onClose={handleCloseDialogs}>
        <DialogTitle>Request Verification Documents</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Select the documents you want to request from {selectedUser?.firstName} {selectedUser?.lastName}.
            The user will be notified to submit these documents.
          </DialogContentText>
          
          <Box sx={{ mt: 2 }}>
          <FormControlLabel
              control={
                <Checkbox
                  checked={documentRequest.idDocument}
                  onChange={(e) => setDocumentRequest({
                    ...documentRequest,
                    idDocument: e.target.checked
                  })}
                />
              }
              label="Government-issued ID (passport, driver's license)"
            />
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={documentRequest.proofOfAddress}
                  onChange={(e) => setDocumentRequest({
                    ...documentRequest,
                    proofOfAddress: e.target.checked
                  })}
                />
              }
              label="Proof of address (utility bills or bank statements)"
            />
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={documentRequest.otherDocuments}
                  onChange={(e) => setDocumentRequest({
                    ...documentRequest,
                    otherDocuments: e.target.checked
                  })}
                />
              }
              label="Other documents"
            />
            
            {documentRequest.otherDocuments && (
              <TextField
                margin="dense"
                id="other-documents"
                label="Specify other documents"
                type="text"
                fullWidth
                value={documentRequest.otherDocumentsDescription}
                onChange={(e) => setDocumentRequest({
                  ...documentRequest,
                  otherDocumentsDescription: e.target.value
                })}
                required={documentRequest.otherDocuments}
                error={documentRequest.otherDocuments && documentRequest.otherDocumentsDescription.trim() === ''}
                helperText={documentRequest.otherDocuments && documentRequest.otherDocumentsDescription.trim() === '' ? 'Please specify the documents' : ''}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>Cancel</Button>
          <Button 
            onClick={handleRequestDocuments} 
            variant="contained" 
            color="primary"
            disabled={isEditSubmitting || 
              (!documentRequest.idDocument && 
               !documentRequest.proofOfAddress && 
               !(documentRequest.otherDocuments && documentRequest.otherDocumentsDescription.trim()))}
            startIcon={isEditSubmitting ? <CircularProgress size={20} /> : <DocumentScannerIcon />}
          >
            {isEditSubmitting ? 'Sending Request...' : 'Send Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminUserManagement;