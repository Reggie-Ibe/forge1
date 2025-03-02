// src/components/auth/RoleBasedRedirect.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';

const RoleBasedRedirect = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!user) {
      // If no user is found, redirect to login
      navigate('/login');
      return;
    }
    
    // Redirect based on user role
    switch (user.role) {
      case 'admin':
        navigate('/admin');
        break;
      case 'investor':
        navigate('/dashboard');
        break;
      case 'innovator':
        navigate('/projects');
        break;
      default:
        // Default fallback for any other role
        navigate('/dashboard');
    }
  }, [user, navigate]);
  
  // Show loading spinner while redirecting
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <CircularProgress size={60} />
      <Typography variant="body1" sx={{ mt: 2 }}>
        Redirecting to your dashboard...
      </Typography>
    </Box>
  );
};

export default RoleBasedRedirect;