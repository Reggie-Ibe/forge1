// src/pages/Register.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// Material UI components
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  Divider,
  Grid,
  Checkbox,
  FormControlLabel,
  FormHelperText,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';

// Material UI icons
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LoginIcon from '@mui/icons-material/Login';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'innovator', // Default role
    acceptTerms: false
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Valid email required';
    if (!formData.password || formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!formData.acceptTerms) newErrors.acceptTerms = 'You must accept the terms and conditions';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!validateForm()) return;
    setIsSubmitting(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, this would make an actual API call
      navigate('/login', { state: { message: 'Registration successful! Check your email for verification instructions.' } });
    } catch (error) {
      console.error('Registration error:', error);
      setSubmitError('Registration failed. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          marginBottom: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%', borderRadius: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <PersonAddIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography component="h1" variant="h5">
              Create your account
            </Typography>
          </Box>
          
          {submitError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {submitError}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  autoComplete="given-name"
                  name="firstName"
                  required
                  fullWidth
                  id="firstName"
                  label="First Name"
                  autoFocus
                  value={formData.firstName}
                  onChange={handleChange}
                  error={!!errors.firstName}
                  helperText={errors.firstName}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="lastName"
                  label="Last Name"
                  name="lastName"
                  autoComplete="family-name"
                  value={formData.lastName}
                  onChange={handleChange}
                  error={!!errors.lastName}
                  helperText={errors.lastName}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={!!errors.email}
                  helperText={errors.email}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  error={!!errors.password}
                  helperText={errors.password}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  name="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="role-label">I am a(n)</InputLabel>
                  <Select
                    labelId="role-label"
                    id="role"
                    name="role"
                    value={formData.role}
                    label="I am a(n)"
                    onChange={handleChange}
                  >
                    <MenuItem value="innovator">Innovator</MenuItem>
                    <MenuItem value="investor">Investor</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="acceptTerms"
                      checked={formData.acceptTerms}
                      onChange={handleChange}
                      color="primary"
                    />
                  }
                  label="I accept the Terms and Conditions"
                />
                {errors.acceptTerms && (
                  <FormHelperText error>{errors.acceptTerms}</FormHelperText>
                )}
              </Grid>
            </Grid>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <PersonAddIcon />}
              disabled={isSubmitting}
              sx={{ mt: 3, mb: 2 }}
            >
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </Button>
            
            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                or
              </Typography>
            </Divider>
            
            <Grid container justifyContent="center">
              <Grid item>
                <Link to="/login" style={{ textDecoration: 'none' }}>
                  <Button
                    variant="outlined"
                    startIcon={<LoginIcon />}
                  >
                    Already have an account? Sign in
                  </Button>
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Paper>
        
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 5 }}>
          {'© '}
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            InnoCap Forge
          </Link>{' '}
          {new Date().getFullYear()}
        </Typography>
      </Box>
    </Container>
  );
};

export default Register;