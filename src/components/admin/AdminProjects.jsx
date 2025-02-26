// src/components/admin/AdminProjects.jsx
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
  Grid
} from '@mui/material';

// Material UI icons
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import PublishedWithChangesIcon from '@mui/icons-material/PublishedWithChanges';
import PersonIcon from '@mui/icons-material/Person';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';

const AdminProjects = () => {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [projectCreators, setProjectCreators] = useState([]);
  const [categories, setCategories] = useState([]);

  // Fetch all projects and related data
  const fetchData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Fetch all projects
      const projectsResponse = await fetch(`${apiUrl}/projects`);
      if (!projectsResponse.ok) throw new Error('Failed to fetch projects');
      
      const projectsData = await projectsResponse.json();
      setProjects(projectsData);
      
      // Extract unique user IDs and categories
      const userIds = [...new Set(projectsData.map(project => project.userId))];
      const uniqueCategories = [...new Set(projectsData.map(project => project.category))];
      setCategories(uniqueCategories);
      
      // Fetch user details for project creators
      const usersData = {};
      const fetchPromises = userIds.map(async (userId) => {
        const userResponse = await fetch(`${apiUrl}/users/${userId}`);
        if (userResponse.ok) {
          const userData = await userResponse.json();
          usersData[userId] = userData;
        }
      });
      
      await Promise.all(fetchPromises);
      setUsers(usersData);
      setProjectCreators(Object.values(usersData));
      
    } catch (err) {
      console.error('Error fetching admin projects data:', err);
      setError('Failed to load projects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter projects based on search, status, and category
  const getFilteredProjects = () => {
    return projects.filter(project => {
      // Search filter
      const matchesSearch = 
        searchTerm === '' || 
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (users[project.userId]?.firstName + ' ' + users[project.userId]?.lastName)
          .toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      const matchesStatus = statusFilter === '' || project.status === statusFilter;
      
      // Category filter
      const matchesCategory = categoryFilter === '' || project.category === categoryFilter;
      
      return matchesSearch && matchesStatus && matchesCategory;
    });
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
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredProjects = getFilteredProjects();

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
          All Platform Projects
        </Typography>
        <Button 
          startIcon={<RefreshIcon />} 
          variant="outlined"
          onClick={fetchData}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search projects, creators..."
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
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
                startAdornment={
                  <InputAdornment position="start">
                    <FilterListIcon />
                  </InputAdornment>
                }
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="canceled">Canceled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel id="category-filter-label">Category</InputLabel>
              <Select
                labelId="category-filter-label"
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value)}
                startAdornment={
                  <InputAdornment position="start">
                    <FilterListIcon />
                  </InputAdornment>
                }
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map(category => (
                  <MenuItem key={category} value={category}>{category}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="text" 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('');
                  setCategoryFilter('');
                }}
                disabled={!searchTerm && !statusFilter && !categoryFilter}
              >
                Reset Filters
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Projects Table */}
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell>Project</TableCell>
              <TableCell>Creator</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Funding</TableCell>
              <TableCell align="right">Created</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body1" sx={{ py: 2 }}>
                    No projects found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredProjects.map((project) => {
                const creator = users[project.userId];
                const fundingPercentage = (project.currentFunding / project.fundingGoal) * 100;
                
                return (
                  <TableRow key={project.id}>
                    <TableCell>
                      <Typography variant="body1" fontWeight="medium">
                        {project.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="body2">
                          {creator 
                            ? `${creator.firstName} ${creator.lastName}` 
                            : `User #${project.userId}`}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{project.category}</TableCell>
                    <TableCell>
                      <Chip 
                        label={project.status.charAt(0).toUpperCase() + project.status.slice(1)} 
                        color={
                          project.status === 'active' ? 'success' :
                          project.status === 'pending' ? 'warning' :
                          project.status === 'completed' ? 'info' : 'default'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box>
                        <Typography variant="body2">
                          {formatCurrency(project.currentFunding)} / {formatCurrency(project.fundingGoal)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {fundingPercentage.toFixed(1)}% funded
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      {formatDate(project.createdAt)}
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Tooltip title="View Project">
                          <IconButton 
                            component={Link} 
                            to={`/projects/${project.id}`}
                            size="small"
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Investment Details">
                          <IconButton 
                            component={Link}
                            to={`/admin/projects/${project.id}/investments`}
                            size="small" 
                            color="primary"
                          >
                            <MonetizationOnIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Release Funds">
                          <IconButton 
                            component={Link}
                            to={`/admin/projects/${project.id}/escrow`}
                            size="small" 
                            color="success"
                          >
                            <PublishedWithChangesIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default AdminProjects;