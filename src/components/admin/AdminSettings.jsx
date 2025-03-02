// src/components/admin/AdminSettings.jsx
import { useState, useEffect } from 'react';

// Material UI components
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  FormGroup,
  Divider,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardHeader,
  InputAdornment,
  Tooltip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';

// Material UI icons
import SaveIcon from '@mui/icons-material/Save';
import InfoIcon from '@mui/icons-material/Info';
import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsIcon from '@mui/icons-material/Settings';
import DoneIcon from '@mui/icons-material/Done';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import SecurityIcon from '@mui/icons-material/Security';
import BarChartIcon from '@mui/icons-material/BarChart';
import EmailIcon from '@mui/icons-material/Email';

const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [settings, setSettings] = useState({
    platformName: 'InnoCap Forge',
    platformFee: 5,
    emailNotifications: true,
    automaticApprovals: false,
    maintenanceMode: false,
    privacyPolicy: '',
    termsOfService: '',
    contactEmail: 'support@innocapforge.com',
    securitySettings: {
      twoFactorEnabled: false,
      passwordExpiration: 90,
      loginAttempts: 5
    }
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // In a real app, this would be a dedicated endpoint for admin settings
      const response = await fetch(`${apiUrl}/systemSettings`);
      if (response.ok) {
        const data = await response.json();
        
        // Merge with defaults if the settings exist
        if (data) {
          setSettings({
            ...settings,
            ...data.adminSettings
          });
        }
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveSettings = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Get existing system settings first
      const getResponse = await fetch(`${apiUrl}/systemSettings`);
      const existingSettings = getResponse.ok ? await getResponse.json() : {};
      
      // Prepare updated settings
      const updatedSettings = {
        ...existingSettings,
        adminSettings: settings
      };
      
      const response = await fetch(`${apiUrl}/systemSettings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedSettings),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save settings');
      }
      
      setSuccess('Settings saved successfully');
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess('');
      }, 5000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };
  
  const handleChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    
    setSettings({
      ...settings,
      [field]: value
    });
  };
  
  const handleSecurityChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    
    setSettings({
      ...settings,
      securitySettings: {
        ...settings.securitySettings,
        [field]: value
      }
    });
  };
  
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
          System Settings
        </Typography>
        <Button 
          startIcon={<RefreshIcon />} 
          variant="outlined"
          onClick={fetchSettings}
        >
          Refresh
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* General Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="General Settings"
              avatar={<SettingsIcon color="primary" />}
            />
            <Divider />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Platform Name"
                    value={settings.platformName}
                    onChange={handleChange('platformName')}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Contact Email"
                    value={settings.contactEmail}
                    onChange={handleChange('contactEmail')}
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Platform Fee (%)"
                    value={settings.platformFee}
                    onChange={handleChange('platformFee')}
                    type="number"
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CreditCardIcon />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">%</InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.emailNotifications}
                          onChange={handleChange('emailNotifications')}
                        />
                      }
                      label="Email Notifications"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.automaticApprovals}
                          onChange={handleChange('automaticApprovals')}
                        />
                      }
                      label="Automatic Project Approvals"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.maintenanceMode}
                          onChange={handleChange('maintenanceMode')}
                        />
                      }
                      label="Maintenance Mode"
                    />
                  </FormGroup>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Security Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="Security Settings"
              avatar={<SecurityIcon color="primary" />}
            />
            <Divider />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.securitySettings.twoFactorEnabled}
                          onChange={handleSecurityChange('twoFactorEnabled')}
                        />
                      }
                      label="Require Two Factor Authentication"
                    />
                  </FormGroup>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Password Expiration (days)"
                    value={settings.securitySettings.passwordExpiration}
                    onChange={handleSecurityChange('passwordExpiration')}
                    type="number"
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Failed Login Attempts"
                    value={settings.securitySettings.loginAttempts}
                    onChange={handleSecurityChange('loginAttempts')}
                    type="number"
                    fullWidth
                  />
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Current Security Status
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Two Factor Authentication"
                      secondary={settings.securitySettings.twoFactorEnabled ? "Enabled" : "Disabled"}
                    />
                    <ListItemSecondaryAction>
                      {settings.securitySettings.twoFactorEnabled ? (
                        <Tooltip title="Enabled">
                          <DoneIcon color="success" />
                        </Tooltip>
                      ) : (
                        <Tooltip title="Disabled">
                          <InfoIcon color="warning" />
                        </Tooltip>
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Password Security"
                      secondary={`Passwords expire after ${settings.securitySettings.passwordExpiration} days`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Account Lockout"
                      secondary={`Accounts lock after ${settings.securitySettings.loginAttempts} failed attempts`}
                    />
                  </ListItem>
                </List>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Legal Documents */}
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title="Legal Documents"
              avatar={<BarChartIcon color="primary" />}
            />
            <Divider />
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Privacy Policy"
                    multiline
                    rows={6}
                    value={settings.privacyPolicy}
                    onChange={handleChange('privacyPolicy')}
                    fullWidth
                    placeholder="Enter your privacy policy text here..."
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Terms of Service"
                    multiline
                    rows={6}
                    value={settings.termsOfService}
                    onChange={handleChange('termsOfService')}
                    fullWidth
                    placeholder="Enter your terms of service text here..."
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={saving ? <CircularProgress size={24} /> : <SaveIcon />}
          onClick={handleSaveSettings}
          disabled={saving}
          size="large"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </Box>
    </Box>
  );
};

export default AdminSettings;