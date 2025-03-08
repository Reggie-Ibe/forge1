// src/components/admin/UserVerification.jsx
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  CircularProgress
} from '@mui/material';

// Icons
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PendingIcon from '@mui/icons-material/Pending';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import DocumentScannerIcon from '@mui/icons-material/DocumentScanner';
import BadgeIcon from '@mui/icons-material/Badge';
import HomeIcon from '@mui/icons-material/Home';
import SendIcon from '@mui/icons-material/Send';

const UserVerification = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  
  // Dialog states
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [documentRequest, setDocumentRequest] = useState({
    idDocument: true,
    proofOfAddress: true,
    otherDocuments: false,
    otherDocumentsDescription: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  useEffect(() => {
    fetchUsers();
  }, []);
  
  useEffect(() => {
    if (users.length > 0) {
      filterUsers();
    }
  }, [users, statusFilter]);
  
  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/users`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
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
    let filtered = [...users];
    
    if (statusFilter === 'pending') {
      filtered = filtered.filter(user => user.verificationStatus === 'pending');
    } else if (statusFilter === 'approved') {
      filtered = filtered.filter(user => user.verificationStatus === 'approved');
    } else if (statusFilter === 'rejected') {
      filtered = filtered.filter(user => user.verificationStatus === 'rejected');
    } else if (statusFilter === 'documents_requested') {
      filtered = filtered.filter(user => 
        user.documentVerification && user.documentVerification.documentsRequested === true
      );
    }
    
    setFilteredUsers(filtered);
  };
  
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
    setIsSubmitting(true);
    
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
      setIsSubmitting(false);
    }
  };
  
  const handleRejectUser = async () => {
    if (!selectedUser || !rejectReason.trim()) return;
    setIsSubmitting(true);
    
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
      setIsSubmitting(false);
    }
  };
  
  const handleRequestDocuments = async () => {
    if (!selectedUser) return;
    
    if (!documentRequest.idDocument && !documentRequest.proofOfAddress && 
        !(documentRequest.otherDocuments && documentRequest.otherDocumentsDescription.trim())) {
      setError('Please select at least one document to request');
      return;
    }
    
    setIsSubmitting(true);
    
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
      setIsSubmitting(false);
    }
  };
  
  const getStatusChip = (status) => {
    switch (status) {
      case 'approved':
        return <Chip icon={<CheckCircleIcon />} label="Approved" color="success" />;
      case 'rejected':
        return <Chip icon={<CancelIcon />} label="Rejected" color="error" />;
      case 'documents_requested':
        return <Chip icon={<DocumentScannerIcon />} label="Documents Requested" color="info" />;
      case 'pending':
      default:
        return <Chip icon={<PendingIcon />} label="Pending" color="warning" />;
    }
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
          User Verification
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="status-filter-label">Status</InputLabel>
            <Select
              labelId="status-filter-label"
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All Users</MenuItem>
              <MenuItem value="pending">Pending Verification</MenuItem>
              <MenuItem value="documents_requested">Documents Requested</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </Select>
          </FormControl>
          
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />}
            onClick={fetchUsers}
          >
            Refresh
          </Button>
        </Box>
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
      
      {filteredUsers.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1">
            No users found with the selected filter.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredUsers.map((user) => (
            <Grid item xs={12} md={6} lg={4} key={user.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" component="div">
                      {user.firstName} {user.lastName}
                    </Typography>
                    {getStatusChip(user.verificationStatus)}
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <EmailIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">{user.email}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PersonIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">Role: {user.role.charAt(0).toUpperCase() + user.role.slice(1)}</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Registered: {new Date(user.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                  
                  {user.documentVerification && user.documentVerification.documentsRequested && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Requested Documents:
                      </Typography>
                      <List dense disablePadding>
                        {user.documentVerification.requestedDocuments.map((doc, index) => (
                          <ListItem key={index} disablePadding sx={{ py: 0.5 }}>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              {doc.includes('ID') ? 
                                <BadgeIcon fontSize="small" color="primary" /> : 
                                doc.includes('Address') ? 
                                  <HomeIcon fontSize="small" color="primary" /> : 
                                  <DocumentScannerIcon fontSize="small" color="primary" />
                              }
                            </ListItemIcon>
                            <ListItemText primary={doc} />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                  
                  {user.verificationStatus === 'rejected' && user.rejectionReason && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" color="error" gutterBottom>
                        Rejection Reason:
                      </Typography>
                      <Typography variant="body2">
                        {user.rejectionReason}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
                
                <Divider />
                
                <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                  {user.verificationStatus === 'pending' && (
                    <>
                      <Button 
                        size="small" 
                        color="primary"
                        onClick={() => handleOpenDocumentDialog(user)}
                      >
                        Request Documents
                      </Button>
                      <Button 
                        size="small" 
                        color="error"
                        onClick={() => handleOpenRejectDialog(user)}
                      >
                        Reject
                      </Button>
                      <Button 
                        size="small" 
                        color="error"
                        onClick={() => handleOpenRejectDialog(user)}
                      >
                        Reject
                      </Button>
                      <Button 
                        size="small" 
                        variant="contained" 
                        color="success"
                        onClick={() => handleOpenVerifyDialog(user)}
                      >
                        Verify
                      </Button>
                    </>
                  )}
                  
                  {user.verificationStatus === 'documents_requested' && (
                    <>
                      <Button 
                        size="small" 
                        color="error"
                        onClick={() => handleOpenRejectDialog(user)}
                      >
                        Reject
                      </Button>
                      <Button 
                        size="small" 
                        variant="contained" 
                        color="success"
                        onClick={() => handleOpenVerifyDialog(user)}
                      >
                        Verify
                      </Button>
                    </>
                  )}
                  
                  {(user.verificationStatus === 'approved' || user.verificationStatus === 'rejected') && (
                    <Button 
                      size="small" 
                      color="primary"
                      onClick={() => handleOpenDocumentDialog(user)}
                    >
                      Request Documents
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
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
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : <VerifiedUserIcon />}
          >
            {isSubmitting ? 'Verifying...' : 'Verify User'}
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
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>Cancel</Button>
          <Button 
            onClick={handleRejectUser} 
            variant="contained" 
            color="error"
            disabled={isSubmitting || rejectReason.trim() === ''}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : <CancelIcon />}
          >
            {isSubmitting ? 'Rejecting...' : 'Reject User'}
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
            disabled={isSubmitting || 
              (!documentRequest.idDocument && 
               !documentRequest.proofOfAddress && 
               !(documentRequest.otherDocuments && documentRequest.otherDocumentsDescription.trim()))}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : <SendIcon />}
          >
            {isSubmitting ? 'Sending Request...' : 'Send Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserVerification;