// src/pages/Profile.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Material UI components
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  TextField,
  Button,
  Avatar,
  Divider,
  Alert,
  Chip,
  CircularProgress,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
} from '@mui/material';

// Material UI icons
import SaveIcon from '@mui/icons-material/Save';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SecurityIcon from '@mui/icons-material/Security';

const Profile = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    password: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [projects, setProjects] = useState([]);
  const [investments, setInvestments] = useState([]);
  
  useEffect(() => {
    fetchUserData();
  }, [user]);
  
  const fetchUserData = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Fetch projects if user is an innovator
      if (user.role === 'innovator') {
        const projectsResponse = await fetch(`${apiUrl}/projects?userId=${user.id}`);
        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          setProjects(projectsData);
        }
      }
      
      // Fetch investments if user is an investor
      if (user.role === 'investor') {
        const investmentsResponse = await fetch(`${apiUrl}/investments?userId=${user.id}`);
        if (investmentsResponse.ok) {
          const investmentsData = await investmentsResponse.json();
          
          // Fetch project details for each investment
          const investmentsWithProjects = await Promise.all(
            investmentsData.map(async (investment) => {
              const projectResponse = await fetch(`${apiUrl}/projects/${investment.projectId}`);
              if (projectResponse.ok) {
                const projectData = await projectResponse.json();
                return { ...investment, project: projectData };
              }
              return investment;
            })
          );
          
          setInvestments(investmentsWithProjects);
        }
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  };
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear any errors for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };
  
  const validateProfileForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const validatePasswordForm = () => {
    const newErrors = {};
    
    if (!formData.password) newErrors.password = 'Current password is required';
    if (!formData.newPassword) newErrors.newPassword = 'New password is required';
    if (formData.newPassword && formData.newPassword.length < 8) newErrors.newPassword = 'Password must be at least 8 characters';
    if (formData.newPassword !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleProfileUpdate = async () => {
    if (!validateProfileForm()) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      const userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        bio: formData.bio,
      };
      
      const response = await fetch(`${apiUrl}/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      // Update user in auth context
      // Note: In a real application, you would update the user in the auth context
      // For now, we'll just show a success message
      setSuccess('Profile updated successfully');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handlePasswordUpdate = async () => {
    if (!validatePasswordForm()) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // In a real application, you would validate the current password
      // and update the password securely
      // For now, we'll simulate it with a mock API call
      
      const response = await fetch(`${apiUrl}/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: formData.newPassword,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update password');
      }
      
      setSuccess('Password updated successfully');
      
      // Clear password fields
      setFormData((prev) => ({
        ...prev,
        password: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (err) {
      console.error('Error updating password:', err);
      setError('Failed to update password: ' + err.message);
    } finally {
      setLoading(false);
    }
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
  
  // Calculate total investment amount
  const totalInvestment = investments.reduce((total, investment) => total + investment.amount, 0);
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={4}>
        {/* Profile Summary */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <Avatar sx={{ width: 100, height: 100, mb: 2, bgcolor: 'primary.main', fontSize: '2rem' }}>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </Avatar>
              <Typography variant="h5" gutterBottom>
                {user?.firstName} {user?.lastName}
              </Typography>
              <Chip
                label={user?.role === 'innovator' ? 'Innovator' : 'Investor'}
                color="primary"
                variant="outlined"
              />
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Email
              </Typography>
              <Typography variant="body1" gutterBottom>
                {user?.email}
              </Typography>
              
              {user?.phone && (
                <>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
                    Phone
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {user.phone}
                  </Typography>
                </>
              )}
              
              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
                Member Since
              </Typography>
              <Typography variant="body1" gutterBottom>
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </Typography>
            </Box>
          </Paper>
          
          {/* Stats Card */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Activity Summary
            </Typography>
            
            {user?.role === 'innovator' ? (
              <List dense>
                <ListItem divider>
                  <ListItemText primary="Total Projects" />
                  <Typography variant="body1" fontWeight="bold">
                    {projects.length}
                  </Typography>
                </ListItem>
                <ListItem divider>
                  <ListItemText primary="Active Projects" />
                  <Typography variant="body1" fontWeight="bold">
                    {projects.filter(p => p.status === 'active').length}
                  </Typography>
                </ListItem>
                <ListItem>
                  <ListItemText primary="Total Funding Raised" />
                  <Typography variant="body1" fontWeight="bold">
                    {formatCurrency(projects.reduce((total, project) => total + project.currentFunding, 0))}
                  </Typography>
                </ListItem>
              </List>
            ) : (
              <List dense>
                <ListItem divider>
                  <ListItemText primary="Total Investments" />
                  <Typography variant="body1" fontWeight="bold">
                    {investments.length}
                  </Typography>
                </ListItem>
                <ListItem>
                  <ListItemText primary="Total Amount Invested" />
                  <Typography variant="body1" fontWeight="bold">
                    {formatCurrency(totalInvestment)}
                  </Typography>
                </ListItem>
              </List>
            )}
          </Paper>
        </Grid>
        
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 0 }}>
            <Tabs value={activeTab} onChange={handleTabChange}>
              <Tab 
                label="Account Settings" 
                icon={<AccountCircleIcon />} 
                iconPosition="start"
              />
              <Tab 
                label="Security" 
                icon={<SecurityIcon />} 
                iconPosition="start"
              />
            </Tabs>
            
            <Box sx={{ p: 3 }}>
              {/* Profile Tab */}
              {activeTab === 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Profile Information
                  </Typography>
                  
                  {success && (
                    <Alert severity="success" sx={{ mb: 3 }}>
                      {success}
                    </Alert>
                  )}
                  
                  {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                      {error}
                    </Alert>
                  )}
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}></Grid>
                    <TextField
                        fullWidth
                        label="First Name"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        error={!!errors.firstName}
                        helperText={errors.firstName}
                        disabled={loading}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Last Name"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        error={!!errors.lastName}
                        helperText={errors.lastName}
                        disabled={loading}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Email Address"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        error={!!errors.email}
                        helperText={errors.email}
                        disabled={loading}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Phone Number"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        error={!!errors.phone}
                        helperText={errors.phone}
                        disabled={loading}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Bio"
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        error={!!errors.bio}
                        helperText={errors.bio}
                        disabled={loading}
                        margin="normal"
                        multiline
                        rows={4}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={loading ? <CircularProgress size={24} /> : <SaveIcon />}
                        onClick={handleProfileUpdate}
                        disabled={loading}
                      >
                        Save Changes
                      </Button>
                    </Grid>
                </Box>
              )}
              
              {/* Security Tab */}
              {activeTab === 1 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Change Password
                  </Typography>
                  
                  {success && (
                    <Alert severity="success" sx={{ mb: 3 }}>
                      {success}
                    </Alert>
                  )}
                  
                  {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                      {error}
                    </Alert>
                  )}
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Current Password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        error={!!errors.password}
                        helperText={errors.password}
                        disabled={loading}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="New Password"
                        name="newPassword"
                        type="password"
                        value={formData.newPassword}
                        onChange={handleChange}
                        error={!!errors.newPassword}
                        helperText={errors.newPassword}
                        disabled={loading}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Confirm New Password"
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        error={!!errors.confirmPassword}
                        helperText={errors.confirmPassword}
                        disabled={loading}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={loading ? <CircularProgress size={24} /> : <SaveIcon />}
                        onClick={handlePasswordUpdate}
                        disabled={loading}
                      >
                        Update Password
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Box>
          </Paper>
          
          {/* Activity section */}
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              {user?.role === 'innovator' ? 'My Projects' : 'My Investments'}
            </Typography>
            
            {user?.role === 'innovator' ? (
              // Innovator projects
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {projects.length === 0 ? (
                  <Grid item xs={12}>
                    <Typography variant="body1" color="text.secondary">
                      You haven't created any projects yet.
                    </Typography>
                  </Grid>
                ) : (
                  projects.map(project => (
                    <Grid item xs={12} sm={6} key={project.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            {project.title}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Chip
                              label={project.category}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                            <Chip
                              label={project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                              size="small"
                              color={
                                project.status === 'active'
                                  ? 'success'
                                  : project.status === 'pending'
                                  ? 'warning'
                                  : 'default'
                              }
                            />
                          </Box>
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                              Funding Progress
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2">
                                {formatCurrency(project.currentFunding)}
                              </Typography>
                              <Typography variant="body2">
                                {formatCurrency(project.fundingGoal)}
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                height: 8,
                                width: '100%',
                                bgcolor: 'grey.200',
                                borderRadius: 1,
                                mt: 0.5,
                              }}
                            >
                              <Box
                                sx={{
                                  height: '100%',
                                  width: `${Math.min((project.currentFunding / project.fundingGoal) * 100, 100)}%`,
                                  bgcolor: 'primary.main',
                                  borderRadius: 1,
                                }}
                              />
                            </Box>
                          </Box>
                          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                              size="small"
                              href={`/projects/${project.id}`}
                            >
                              View Project
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))
                )}
              </Grid>
            ) : (
              // Investor investments
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {investments.length === 0 ? (
                  <Grid item xs={12}>
                    <Typography variant="body1" color="text.secondary">
                      You haven't made any investments yet.
                    </Typography>
                  </Grid>
                ) : (
                  investments.map(investment => (
                    <Grid item xs={12} sm={6} key={investment.id}>
                      <Card variant="outlined">
                        <CardContent>
                          {investment.project && (
                            <Typography variant="h6" gutterBottom>
                              {investment.project.title}
                            </Typography>
                          )}
                          <Typography variant="h5" color="primary" gutterBottom>
                            {formatCurrency(investment.amount)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Invested on {new Date(investment.createdAt).toLocaleDateString()}
                          </Typography>
                          <Chip
                            label={investment.status.charAt(0).toUpperCase() + investment.status.slice(1)}
                            size="small"
                            color="success"
                            sx={{ mt: 1 }}
                          />
                          {investment.project && (
                            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                              <Button
                                size="small"
                                href={`/projects/${investment.projectId}`}
                              >
                                View Project
                              </Button>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))
                )}
              </Grid>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Profile;