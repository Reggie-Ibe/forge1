// src/pages/PendingVerification.jsx
import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Alert,
  Divider,
  CircularProgress
} from '@mui/material';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import EmailIcon from '@mui/icons-material/Email';

const PendingVerification = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // If no state is provided, redirect to login
  useEffect(() => {
    if (!location.state) {
      navigate('/login');
    }
  }, [location, navigate]);

  if (!location.state) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const { message, email } = location.state;

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
            <HourglassEmptyIcon color="primary" sx={{ fontSize: 64, mb: 2 }} />
            <Typography component="h1" variant="h5" textAlign="center">
              Account Pending Verification
            </Typography>
          </Box>
          
          <Alert severity="info" sx={{ mb: 4 }}>
            {message || 'Your account is pending admin verification. You will be notified once your account is approved.'}
          </Alert>
          
          <Box sx={{ mb: 4 }}>
            <Typography variant="body1" paragraph>
              Our admin team will review your registration shortly. You may be asked to provide the following documents:
            </Typography>
            
            <ul style={{ paddingLeft: '20px' }}>
              <li>
                <Typography variant="body1">Government-issued ID (passport, driver's license)</Typography>
              </li>
              <li>
                <Typography variant="body1">Proof of address (utility bills or bank statements from the last 3 months)</Typography>
              </li>
            </ul>
            
            <Typography variant="body1" paragraph sx={{ mt: 2 }}>
              Please check your email <strong>{email}</strong> regularly for verification instructions.
            </Typography>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<EmailIcon />}
              component={Link}
              to="/login"
            >
              Go to Login Page
            </Button>
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

export default PendingVerification;