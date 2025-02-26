// src/pages/Investments.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Material UI components
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  LinearProgress,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';

const Investments = () => {
  const { user } = useAuth();
  const [investments, setInvestments] = useState([]);
  const [projects, setProjects] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInvestments();
  }, [user]);

  const fetchInvestments = async () => {
    setLoading(true);
    setError('');
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Fetch user investments
      const investmentsResponse = await fetch(`${apiUrl}/investments?userId=${user.id}`);
      if (!investmentsResponse.ok) throw new Error('Failed to fetch investments');
      const investmentsData = await investmentsResponse.json();
      setInvestments(investmentsData);
      
      // Fetch projects for each investment
      const projectIds = [...new Set(investmentsData.map(inv => inv.projectId))];
      const projectsData = {};
      
      for (const projectId of projectIds) {
        const projectResponse = await fetch(`${apiUrl}/projects/${projectId}`);
        if (projectResponse.ok) {
          const projectData = await projectResponse.json();
          projectsData[projectId] = projectData;
        }
      }
      
      setProjects(projectsData);
    } catch (err) {
      console.error('Error fetching investments:', err);
      setError('Failed to load investments. Please try again later.');
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
  
  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        My Investment Portfolio
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Portfolio summary */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Total Invested
              </Typography>
              <Typography variant="h3" color="primary">
                {formatCurrency(investments.reduce((sum, inv) => sum + inv.amount, 0))}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Number of Investments
              </Typography>
              <Typography variant="h3" color="primary">
                {investments.length}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Active Projects
              </Typography>
              <Typography variant="h3" color="primary">
                {Object.values(projects).filter(p => p.status === 'active').length}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Investments list */}
      <Typography variant="h5" gutterBottom>
        My Investments
      </Typography>
      
      {investments.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" paragraph>
            You haven't made any investments yet.
          </Typography>
          <Button 
            variant="contained" 
            component={Link} 
            to="/projects"
          >
            Browse Projects
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {investments.map(investment => {
            const project = projects[investment.projectId];
            
            return (
              <Grid item xs={12} md={6} key={investment.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {project?.title || `Project #${investment.projectId}`}
                    </Typography>
                    
                    <Typography variant="h5" color="primary" gutterBottom>
                      {formatCurrency(investment.amount)}
                    </Typography>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Investment Date
                        </Typography>
                        <Typography variant="body1">
                          {formatDate(investment.createdAt)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Status
                        </Typography>
                        <Chip 
                          label={investment.status.charAt(0).toUpperCase() + investment.status.slice(1)} 
                          color="success" 
                          size="small"
                        />
                      </Grid>
                    </Grid>
                    
                    {project && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Project Progress
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={Math.min((project.currentFunding / project.fundingGoal) * 100, 100)} 
                          sx={{ height: 8, borderRadius: 4, mb: 1 }}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="text.secondary">
                            {formatCurrency(project.currentFunding)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatCurrency(project.fundingGoal)}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                  
                  <CardActions>
                    <Button 
                      size="small" 
                      component={Link} 
                      to={`/projects/${investment.projectId}`}
                    >
                      View Project
                    </Button>
                    {project && (
                      <Button 
                        size="small" 
                        component={Link}
                        to={`/messages`}
                        state={{ contactId: project.userId }}
                      >
                        Contact Owner
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Container>
  );
};

export default Investments;