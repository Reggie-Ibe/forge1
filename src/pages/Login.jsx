// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

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
  CircularProgress
} from '@mui/material';

// Material UI icons
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      const result = await login(email, password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%', borderRadius: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Box sx={{ m: 1, bgcolor: 'primary.main', p: 1, borderRadius: '50%' }}>
              <LockOutlinedIcon sx={{ color: 'white' }} />
            </Box>
            <Typography component="h1" variant="h5">
              Sign in
            </Typography>
          </Box>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
              disabled={isSubmitting}
              sx={{ mt: 3, mb: 2 }}
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </Button>
            
            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                or
              </Typography>
            </Divider>
            
            <Grid container>
              <Grid item xs>
                <Link to="#" style={{ textDecoration: 'none' }}>
                  <Typography variant="body2" color="primary">
                    Forgot password?
                  </Typography>
                </Link>
              </Grid>
              <Grid item>
                <Link to="/register" style={{ textDecoration: 'none' }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<PersonAddIcon />}
                  >
                    Create an account
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
}

export default Login;