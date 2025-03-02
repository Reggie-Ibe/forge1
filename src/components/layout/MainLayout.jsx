// src/components/layout/MainLayout.jsx
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Material UI components
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Button,
  Avatar,
  Menu,
  MenuItem
} from '@mui/material';

// Material UI icons
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import EmailIcon from '@mui/icons-material/Email';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

const drawerWidth = 240;

const MainLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  // Define base navigation items with roles
  const baseNavigation = [
    { name: 'Dashboard', path: '/dashboard', icon: <DashboardIcon />, roles: ['investor', 'innovator'] },
    { name: 'Projects', path: '/projects', icon: <BusinessCenterIcon />, roles: ['investor', 'innovator'] },
    { name: 'Wallet', path: '/wallet', icon: <AccountBalanceWalletIcon />, roles: ['investor'] },
    { name: 'Investments', path: '/investments', icon: <AccountBalanceWalletIcon />, roles: ['investor'] },
    { name: 'Messages', path: '/messages', icon: <EmailIcon />, roles: ['investor', 'innovator', 'admin'] },
    { name: 'Admin', path: '/admin', icon: <AdminPanelSettingsIcon />, roles: ['admin'] },
  ];

  // Filter navigation based on user role
  const filteredNavigation = baseNavigation.filter((item) => 
    item.roles.includes(user?.role)
  );
  
  // Helper to check if a path matches the current location
  const isPathActive = (path) => {
    // For admin routes, match any path that starts with /admin
    if (path === '/admin' && location.pathname.startsWith('/admin')) {
      return true;
    }
    
    return location.pathname === path;
  };

  const drawer = (
    <div>
      <Toolbar sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
        <Typography variant="h6" component={Link} to="/" sx={{ color: 'primary.main', textDecoration: 'none', fontWeight: 'bold' }}>
          InnoCap Forge
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {filteredNavigation.map((item) => (
          <ListItem key={item.name} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={isPathActive(item.path)}
              onClick={() => setMobileOpen(false)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.name} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }}
          >
            {location.pathname.startsWith('/admin') 
              ? location.pathname === '/admin' 
                ? 'Admin Dashboard' 
                : location.pathname.includes('/admin/projects') 
                  ? 'Project Management'
                  : location.pathname.includes('/admin/wallet') 
                    ? 'Payment Methods'
                    : location.pathname.includes('/admin/users')
                      ? 'User Management'
                      : location.pathname.includes('/admin/settings')
                        ? 'System Settings'
                        : 'Admin Dashboard'
              : filteredNavigation.find(item => item.path === location.pathname)?.name || 'Dashboard'
            }
          </Typography>
          
          {/* User profile button */}
          <Button 
            color="inherit" 
            startIcon={
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </Avatar>
            }
            onClick={handleProfileMenuOpen}
            endIcon={<AccountCircleIcon />}
          >
            {user?.firstName} {user?.lastName}
          </Button>
          
          {/* Profile menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem component={Link} to="/profile" onClick={handleProfileMenuClose}>
              <ListItemIcon>
                <AccountCircleIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Profile</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => { handleProfileMenuClose(); handleLogout(); }}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Logout</ListItemText>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      
      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="navigation menu"
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      {/* Main content */}
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}
      >
        <Toolbar /> {/* This adds space at the top for the fixed AppBar */}
        {children}
      </Box>
    </Box>
  );
};

export default MainLayout;