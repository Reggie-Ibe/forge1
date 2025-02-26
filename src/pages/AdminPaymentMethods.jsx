// src/pages/AdminPaymentMethods.jsx
import { useState, useEffect } from 'react';

// Material UI components
import {
  Box,
  Typography,
  Paper,
  Container,
  Button,
  Divider,
  Grid,
  TextField,
  Switch,
  FormControlLabel,
  FormGroup,
  IconButton,
  CircularProgress,
  Alert,
  Chip,
  Card,
  CardContent,
  CardActions,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Tooltip,
  ListItemSecondaryAction
} from '@mui/material';

// Material UI icons
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import CurrencyBitcoinIcon from '@mui/icons-material/CurrencyBitcoin';
import RefreshIcon from '@mui/icons-material/Refresh';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const AdminPaymentMethods = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [systemSettings, setSystemSettings] = useState({
    paymentMethods: {
      bankTransfer: {
        enabled: true,
        accountName: '',
        accountNumber: '',
        bankName: '',
        swiftCode: '',
        instructions: ''
      },
      crypto: {
        enabled: true,
        acceptedCurrencies: ['BTC', 'ETH', 'USDC'],
        walletAddresses: {},
        instructions: ''
      }
    }
  });
  
  // Dialog state for currency management
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCurrency, setNewCurrency] = useState('');
  const [newWalletAddress, setNewWalletAddress] = useState('');
  const [editingCurrency, setEditingCurrency] = useState(null);
  
  useEffect(() => {
    fetchSystemSettings();
  }, []);
  
  const fetchSystemSettings = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${apiUrl}/systemSettings`);
      if (response.ok) {
        const data = await response.json();
        
        // Set system settings with defaults for missing fields
        setSystemSettings({
          paymentMethods: {
            bankTransfer: {
              enabled: data.paymentMethods?.bankTransfer?.enabled ?? true,
              accountName: data.paymentMethods?.bankTransfer?.accountName || '',
              accountNumber: data.paymentMethods?.bankTransfer?.accountNumber || '',
              bankName: data.paymentMethods?.bankTransfer?.bankName || '',
              swiftCode: data.paymentMethods?.bankTransfer?.swiftCode || '',
              instructions: data.paymentMethods?.bankTransfer?.instructions || ''
            },
            crypto: {
              enabled: data.paymentMethods?.crypto?.enabled ?? true,
              acceptedCurrencies: data.paymentMethods?.crypto?.acceptedCurrencies || ['BTC', 'ETH', 'USDC'],
              walletAddresses: data.paymentMethods?.crypto?.walletAddresses || {},
              instructions: data.paymentMethods?.crypto?.instructions || ''
            }
          }
        });
      }
    } catch (err) {
      console.error('Error fetching system settings:', err);
      setError('Failed to load payment method settings');
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
      
      const response = await fetch(`${apiUrl}/systemSettings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(systemSettings),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save settings');
      }
      
      setSuccess('Payment method settings saved successfully');
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess('');
      }, 5000);
    } catch (err) {
      console.error('Error saving system settings:', err);
      setError('Failed to save settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };
  
  const handleBankTransferChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    
    setSystemSettings({
      ...systemSettings,
      paymentMethods: {
        ...systemSettings.paymentMethods,
        bankTransfer: {
          ...systemSettings.paymentMethods.bankTransfer,
          [field]: value
        }
      }
    });
  };
  
  const handleCryptoChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    
    setSystemSettings({
      ...systemSettings,
      paymentMethods: {
        ...systemSettings.paymentMethods,
        crypto: {
          ...systemSettings.paymentMethods.crypto,
          [field]: value
        }
      }
    });
  };
  
  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
    
    // Clear success message after 2 seconds
    setTimeout(() => {
      setSuccess('');
    }, 2000);
  };
  
  // Dialog handlers for cryptocurrency management
  const handleAddCurrency = () => {
    setNewCurrency('');
    setNewWalletAddress('');
    setEditingCurrency(null);
    setDialogOpen(true);
  };
  
  const handleEditCurrency = (currency) => {
    setNewCurrency(currency);
    setNewWalletAddress(systemSettings.paymentMethods.crypto.walletAddresses[currency] || '');
    setEditingCurrency(currency);
    setDialogOpen(true);
  };
  
  const handleDeleteCurrency = (currency) => {
    const updatedCurrencies = systemSettings.paymentMethods.crypto.acceptedCurrencies.filter(
      c => c !== currency
    );
    
    const updatedWalletAddresses = { ...systemSettings.paymentMethods.crypto.walletAddresses };
    delete updatedWalletAddresses[currency];
    
    setSystemSettings({
      ...systemSettings,
      paymentMethods: {
        ...systemSettings.paymentMethods,
        crypto: {
          ...systemSettings.paymentMethods.crypto,
          acceptedCurrencies: updatedCurrencies,
          walletAddresses: updatedWalletAddresses
        }
      }
    });
  };
  
  const handleSaveCurrency = () => {
    if (!newCurrency.trim()) {
      setError('Currency code cannot be empty');
      return;
    }
    
    // Get current settings
    const currentSettings = { ...systemSettings };
    const { acceptedCurrencies, walletAddresses } = currentSettings.paymentMethods.crypto;
    
    if (editingCurrency) {
      // Editing existing currency
      const updatedWalletAddresses = { ...walletAddresses };
      
      // If the currency code changed, delete the old one
      if (editingCurrency !== newCurrency) {
        delete updatedWalletAddresses[editingCurrency];
        
        // Update the accepted currencies list
        const updatedCurrencies = acceptedCurrencies.map(c => 
          c === editingCurrency ? newCurrency : c
        );
        
        currentSettings.paymentMethods.crypto.acceptedCurrencies = updatedCurrencies;
      }
      
      // Update the wallet address
      updatedWalletAddresses[newCurrency] = newWalletAddress;
      currentSettings.paymentMethods.crypto.walletAddresses = updatedWalletAddresses;
    } else {
      // Adding new currency
      // Check if currency already exists
      if (acceptedCurrencies.includes(newCurrency)) {
        setError(`Currency ${newCurrency} already exists`);
        return;
      }
      
      // Add new currency and wallet address
      currentSettings.paymentMethods.crypto.acceptedCurrencies = [
        ...acceptedCurrencies,
        newCurrency
      ];
      
      currentSettings.paymentMethods.crypto.walletAddresses = {
        ...walletAddresses,
        [newCurrency]: newWalletAddress
      };
    }
    
    // Update state
    setSystemSettings(currentSettings);
    setDialogOpen(false);
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Payment Method Settings
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<RefreshIcon />}
          onClick={fetchSystemSettings}
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
      
      <Grid container spacing={4}>
        {/* Bank Transfer Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CreditCardIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Bank Transfer</Typography>
            </Box>
            
            <FormGroup sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={systemSettings.paymentMethods.bankTransfer.enabled}
                    onChange={handleBankTransferChange('enabled')}
                  />
                }
                label={systemSettings.paymentMethods.bankTransfer.enabled ? "Enabled" : "Disabled"}
              />
            </FormGroup>
            
            <Divider sx={{ my: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Bank Name"
                  value={systemSettings.paymentMethods.bankTransfer.bankName}
                  onChange={handleBankTransferChange('bankName')}
                  variant="outlined"
                  fullWidth
                  disabled={!systemSettings.paymentMethods.bankTransfer.enabled}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton 
                          onClick={() => handleCopyToClipboard(systemSettings.paymentMethods.bankTransfer.bankName)}
                          disabled={!systemSettings.paymentMethods.bankTransfer.bankName}
                          size="small"
                        >
                          <ContentCopyIcon />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Account Name"
                  value={systemSettings.paymentMethods.bankTransfer.accountName}
                  onChange={handleBankTransferChange('accountName')}
                  variant="outlined"
                  fullWidth
                  disabled={!systemSettings.paymentMethods.bankTransfer.enabled}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton 
                          onClick={() => handleCopyToClipboard(systemSettings.paymentMethods.bankTransfer.accountName)}
                          disabled={!systemSettings.paymentMethods.bankTransfer.accountName}
                          size="small"
                        >
                          <ContentCopyIcon />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Account Number"
                  value={systemSettings.paymentMethods.bankTransfer.accountNumber}
                  onChange={handleBankTransferChange('accountNumber')}
                  variant="outlined"
                  fullWidth
                  disabled={!systemSettings.paymentMethods.bankTransfer.enabled}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton 
                          onClick={() => handleCopyToClipboard(systemSettings.paymentMethods.bankTransfer.accountNumber)}
                          disabled={!systemSettings.paymentMethods.bankTransfer.accountNumber}
                          size="small"
                        >
                          <ContentCopyIcon />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="SWIFT Code"
                  value={systemSettings.paymentMethods.bankTransfer.swiftCode}
                  onChange={handleBankTransferChange('swiftCode')}
                  variant="outlined"
                  fullWidth
                  disabled={!systemSettings.paymentMethods.bankTransfer.enabled}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton 
                          onClick={() => handleCopyToClipboard(systemSettings.paymentMethods.bankTransfer.swiftCode)}
                          disabled={!systemSettings.paymentMethods.bankTransfer.swiftCode}
                          size="small"
                        >
                          <ContentCopyIcon />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Instructions for Users"
                  value={systemSettings.paymentMethods.bankTransfer.instructions}
                  onChange={handleBankTransferChange('instructions')}
                  variant="outlined"
                  fullWidth
                  multiline
                  rows={4}
                  disabled={!systemSettings.paymentMethods.bankTransfer.enabled}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Cryptocurrency Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CurrencyBitcoinIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Cryptocurrency</Typography>
            </Box>
            
            <FormGroup sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={systemSettings.paymentMethods.crypto.enabled}
                    onChange={handleCryptoChange('enabled')}
                  />
                }
                label={systemSettings.paymentMethods.crypto.enabled ? "Enabled" : "Disabled"}
              />
            </FormGroup>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Accepted Cryptocurrencies
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {systemSettings.paymentMethods.crypto.acceptedCurrencies.map((currency) => (
                  <Chip
                    key={currency}
                    label={currency}
                    color="primary"
                    disabled={!systemSettings.paymentMethods.crypto.enabled}
                    onDelete={() => handleDeleteCurrency(currency)}
                    onClick={() => handleEditCurrency(currency)}
                  />
                ))}
              </Box>
              
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddCurrency}
                disabled={!systemSettings.paymentMethods.crypto.enabled}
                size="small"
              >
                Add Currency
              </Button>
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Wallet Addresses
              </Typography>
              
              <List dense>
                {systemSettings.paymentMethods.crypto.acceptedCurrencies.map((currency) => (
                  <ListItem key={currency}>
                    <ListItemText
                      primary={currency}
                      secondary={systemSettings.paymentMethods.crypto.walletAddresses[currency] || 'No address set'}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => handleCopyToClipboard(systemSettings.paymentMethods.crypto.walletAddresses[currency])}
                        disabled={!systemSettings.paymentMethods.crypto.walletAddresses[currency]}
                        size="small"
                      >
                        <ContentCopyIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        onClick={() => handleEditCurrency(currency)}
                        disabled={!systemSettings.paymentMethods.crypto.enabled}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Box>
            
            <TextField
              label="Instructions for Users"
              value={systemSettings.paymentMethods.crypto.instructions}
              onChange={handleCryptoChange('instructions')}
              variant="outlined"
              fullWidth
              multiline
              rows={4}
              disabled={!systemSettings.paymentMethods.crypto.enabled}
            />
          </Paper>
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
      
      {/* Dialog for adding/editing cryptocurrency */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>
          {editingCurrency ? `Edit ${editingCurrency}` : 'Add New Cryptocurrency'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {editingCurrency 
              ? 'Edit the cryptocurrency details below.'
              : 'Enter the details for the new cryptocurrency.'
            }
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Currency Code"
            fullWidth
            value={newCurrency}
            onChange={(e) => setNewCurrency(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Wallet Address"
            fullWidth
            value={newWalletAddress}
            onChange={(e) => setNewWalletAddress(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveCurrency} variant="contained" color="primary">
            {editingCurrency ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminPaymentMethods;