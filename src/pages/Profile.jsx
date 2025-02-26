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
    address: user?.address || '', // New field
    dateOfBirth: user?.dateOfBirth || '', // New field
  });
  const [profileImage, setProfileImage] = useState(null); // Profile image state
  const [previewUrl, setPreviewUrl] = useState(user?.profileImage || ''); // Preview URL for profile image
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

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setProfileImage(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
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
    if (formData.newPassword && formData.newPassword.length < 8)
      newErrors.newPassword = 'Password must be at least 8 characters';
    if (formData.newPassword !== formData.confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match';

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
        address: formData.address, // Include address
        dateOfBirth: formData.dateOfBirth, // Include date of birth
        profileImage: previewUrl, // Include profile image URL
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
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      {/* Profile Summary */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3}>
          {/* Profile Picture Upload Section */}
          <Grid item xs={12} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 150,
                height: 150,
                borderRadius: '50%',
                border: '1px dashed #ccc',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden',
                mb: 2,
                position: 'relative',
              }}
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Profile"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No Image
                </Typography>
              )}
            </Box>

            <Button
              variant="outlined"
              component="label"
              size="small"
            >
              Upload Photo
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleImageUpload}
              />
            </Button>
          </Grid>

          {/* Address Field */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              disabled={loading}
              margin="normal"
            />
          </Grid>

          {/* Date of Birth Field */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Date of Birth"
              name="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={handleChange}
              disabled={loading}
              margin="normal"
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>

          {/* Basic Info Fields */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              disabled={loading}
              margin="normal"
              error={!!errors.firstName}
              helperText={errors.firstName}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              disabled={loading}
              margin="normal"
              error={!!errors.lastName}
              helperText={errors.lastName}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              margin="normal"
              error={!!errors.email}
              helperText={errors.email}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              disabled={loading}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Bio"
              name="bio"
              multiline
              rows={4}
              value={formData.bio}
              onChange={handleChange}
              disabled={loading}
              margin="normal"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Tabs value={activeTab} onChange={handleTabChange} centered>
          <Tab icon={<AccountCircleIcon />} label="Profile" />
          <Tab icon={<SecurityIcon />} label="Security" />
        </Tabs>

        {/* Profile Tab */}
        {activeTab === 0 && (
          <>
            <Typography variant="h6" sx={{ mt: 2 }}>
              Profile Information
            </Typography>
            {success && (
              <Alert severity="success" sx={{ mt: 2 }}>
                {success}
              </Alert>
            )}
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleProfileUpdate}
              disabled={loading}
              sx={{ mt: 2 }}
            >
              Save Changes
            </Button>
          </>
        )}

        {/* Security Tab */}
        {activeTab === 1 && (
          <>
            <Typography variant="h6" sx={{ mt: 2 }}>
              Change Password
            </Typography>
            {success && (
              <Alert severity="success" sx={{ mt: 2 }}>
                {success}
              </Alert>
            )}
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
            <TextField
              fullWidth
              label="Current Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              margin="normal"
              error={!!errors.password}
              helperText={errors.password}
            />
            <TextField
              fullWidth
              label="New Password"
              name="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={handleChange}
              disabled={loading}
              margin="normal"
              error={!!errors.newPassword}
              helperText={errors.newPassword}
            />
            <TextField
              fullWidth
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={loading}
              margin="normal"
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
            />
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handlePasswordUpdate}
              disabled={loading}
              sx={{ mt: 2 }}
            >
              Update Password
            </Button>
          </>
        )}
      </Paper>

      {/* Activity Section */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {user?.role === 'innovator' ? 'My Projects' : 'My Investments'}
        </Typography>
        {user?.role === 'innovator' ? (
          // Innovator Projects
          projects.length === 0 ? (
            <Typography variant="body1">You haven't created any projects yet.</Typography>
          ) : (
            projects.map((project) => (
              <Card key={project.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6">{project.title}</Typography>
                  <Typography variant="body2">
                    Funding Progress: {formatCurrency(project.currentFunding)} /{' '}
                    {formatCurrency(project.fundingGoal)}
                  </Typography>
                  <Button variant="outlined" size="small" sx={{ mt: 1 }}>
                    View Project
                  </Button>
                </CardContent>
              </Card>
            ))
          )
        ) : (
          // Investor Investments
          investments.length === 0 ? (
            <Typography variant="body1">You haven't made any investments yet.</Typography>
          ) : (
            investments.map((investment) => (
              <Card key={investment.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6">{investment.project?.title}</Typography>
                  <Typography variant="body2">
                    Amount Invested: {formatCurrency(investment.amount)}
                  </Typography>
                  <Typography variant="body2">
                    Invested on: {new Date(investment.createdAt).toLocaleDateString()}
                  </Typography>
                  {investment.project && (
                    <Button variant="outlined" size="small" sx={{ mt: 1 }}>
                      View Project
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          )
        )}
      </Paper>
    </Container>
  );
};

export default Profile;