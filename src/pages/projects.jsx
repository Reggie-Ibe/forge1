// src/pages/Projects.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Material UI components
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  LinearProgress,
  Divider,
  Alert,
  CircularProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Paper
} from '@mui/material';

// Material UI icons
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';

// SDG color mapping
const sdgColors = {
  1: '#E5243B', // No Poverty
  2: '#DDA63A', // Zero Hunger
  3: '#4C9F38', // Good Health
  4: '#C5192D', // Quality Education
  5: '#FF3A21', // Gender Equality
  6: '#26BDE2', // Clean Water
  7: '#FCC30B', // Affordable Energy
  8: '#A21942', // Decent Work
  9: '#FD6925', // Industry & Innovation
  10: '#DD1367', // Reduced Inequalities
  11: '#FD9D24', // Sustainable Cities
  12: '#BF8B2E', // Responsible Consumption
  13: '#3F7E44', // Climate Action
  14: '#0A97D9', // Life Below Water
  15: '#56C02B', // Life on Land
  16: '#00689D', // Peace & Justice
  17: '#19486A', // Partnerships
};

const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    setError('');
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Fetch all projects for investors, or just user's projects for innovators
      const endpoint = user?.role === 'investor' 
        ? `${apiUrl}/projects` 
        : `${apiUrl}/projects?userId=${user?.id}`;
        
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      
      const data = await response.json();
      setProjects(data);
      setFilteredProjects(data);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to load projects. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Extract unique categories from projects
  const categories = [...new Set(projects.map(project => project.category))];
  
  // Status options
  const statuses = ['active', 'pending', 'completed', 'canceled'];

  // Update filtered projects when filters change
  useEffect(() => {
    let result = [...projects];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        project => 
          project.title.toLowerCase().includes(term) || 
          project.description.toLowerCase().includes(term)
      );
    }
    
    // Apply category filter
    if (categoryFilter) {
      result = result.filter(project => project.category === categoryFilter);
    }
    
    // Apply status filter
    if (statusFilter) {
      result = result.filter(project => project.status === statusFilter);
    }
    
    // Apply sorting
    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === 'mostFunded') {
      result.sort((a, b) => b.currentFunding - a.currentFunding);
    } else if (sortBy === 'leastFunded') {
      result.sort((a, b) => a.currentFunding - b.currentFunding);
    } else if (sortBy === 'goalHighToLow') {
      result.sort((a, b) => b.fundingGoal - a.fundingGoal);
    } else if (sortBy === 'goalLowToHigh') {
      result.sort((a, b) => a.fundingGoal - b.fundingGoal);
    }
    
    setFilteredProjects(result);
  }, [projects, searchTerm, categoryFilter, statusFilter, sortBy]);

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setStatusFilter('');
    setSortBy('newest');
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

  if (loading) {
    return (
      <Container sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {user?.role === 'investor' ? 'Browse Projects' : 'My Projects'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {user?.role === 'investor' 
              ? 'Discover innovative projects to invest in' 
              : 'Manage your innovation projects'}
          </Typography>
        </Box>
        
        {user?.role === 'innovator' && (
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => setShowCreateModal(true)}
          >
            Create Project
          </Button>
        )}
      </Box>
      
      {/* Error alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Filters section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search projects"
              variant="outlined"
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
          
          <Grid item xs={12} sm={6} md={2.5}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="category-filter-label">Category</InputLabel>
              <Select
                labelId="category-filter-label"
                id="category-filter"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                label="Category"
                startAdornment={
                  <InputAdornment position="start">
                    <FilterListIcon />
                  </InputAdornment>
                }
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map(category => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2.5}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
                startAdornment={
                  <InputAdornment position="start">
                    <FilterListIcon />
                  </InputAdornment>
                }
              >
                <MenuItem value="">All Statuses</MenuItem>
                {statuses.map(status => (
                  <MenuItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="sort-by-label">Sort by</InputLabel>
              <Select
                labelId="sort-by-label"
                id="sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                label="Sort by"
                startAdornment={
                  <InputAdornment position="start">
                    <SortIcon />
                  </InputAdornment>
                }
              >
                <MenuItem value="newest">Newest First</MenuItem>
                <MenuItem value="oldest">Oldest First</MenuItem>
                <MenuItem value="mostFunded">Most Funded</MenuItem>
                <MenuItem value="leastFunded">Least Funded</MenuItem>
                <MenuItem value="goalHighToLow">Goal: High to Low</MenuItem>
                <MenuItem value="goalLowToHigh">Goal: Low to High</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Showing {filteredProjects.length} of {projects.length} projects
          </Typography>
          
          <Button
            variant="text"
            size="small"
            onClick={resetFilters}
            disabled={!searchTerm && !categoryFilter && !statusFilter && sortBy === 'newest'}
          >
            Reset Filters
          </Button>
        </Box>
      </Paper>
      
      {/* Results */}
      {filteredProjects.length === 0 ? (
        <Paper sx={{ p: 8, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No projects found
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Try adjusting your search or filter criteria.
          </Typography>
          <Button variant="contained" onClick={resetFilters}>
            Reset Filters
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredProjects.map((project) => {
            // Calculate funding progress
            const fundingProgress = (project.currentFunding / project.fundingGoal) * 100;
            
            return (
              <Grid item xs={12} sm={6} md={4} key={project.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="h2" gutterBottom>
                      {project.title}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {project.description.length > 120
                        ? `${project.description.substring(0, 120)}...`
                        : project.description}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                      <Chip 
                        label={project.category} 
                        color="primary" 
                        size="small" 
                      />
                      
                      {project.sdgs?.map((sdg) => (
                        <Chip
                          key={sdg}
                          label={`SDG ${sdg}`}
                          size="small"
                          sx={{
                            backgroundColor: sdgColors[sdg] || '#888888',
                            color: 'white',
                          }}
                        />
                      ))}
                      
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
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          Funding Progress
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatCurrency(project.currentFunding)} / {formatCurrency(project.fundingGoal)}
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={Math.min(fundingProgress, 100)} 
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                      <Typography variant="body2" color="text.secondary" align="right" sx={{ mt: 0.5 }}>
                        {fundingProgress.toFixed(1)}% funded
                      </Typography>
                    </Box>
                  </CardContent>
                  
                  <Divider />
                  
                  <CardActions>
                    <Button 
                      fullWidth 
                      startIcon={<VisibilityIcon />}
                      href={`/projects/${project.id}`}
                    >
                      View Details
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
      
      {/* Create project modal - to be implemented */}
      <Dialog open={showCreateModal} onClose={() => setShowCreateModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Project</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Project creation form will be implemented in the next phase. This is a placeholder for the upcoming functionality.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="project-title"
            label="Project Title"
            type="text"
            fullWidth
            variant="outlined"
            disabled
          />
          <TextField
            margin="dense"
            id="project-description"
            label="Project Description"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={4}
            disabled
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setShowCreateModal(false)} disabled>
            Create Project
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Projects;