// src/pages/Wallet.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Material UI components
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Tabs,
  Tab,
  Card,
  CardContent,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
} from '@mui/material';

// Material UI icons
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import HistoryIcon from '@mui/icons-material/History';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import CurrencyBitcoinIcon from '@mui/icons-material/CurrencyBitcoin';
import DownloadIcon from '@mui/icons-material/Download';
import InfoIcon from '@mui/icons-material/Info';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const Wallet = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [systemSettings, setSystemSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  
  // Dialog states
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositMethod, setDepositMethod] = useState('bank_transfer');
  const [depositNote, setDepositNote] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [depositError, setDepositError] = useState('');
  const [depositSuccess, setDepositSuccess] = useState(false);
  
  // File upload for payment proof
  const [paymentProof, setPaymentProof] = useState(null);
  
  // Dialog for payment details
  const [showPaymentDetailsDialog, setShowPaymentDetailsDialog] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, [user]);

  const fetchWalletData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Fetch wallet transactions
      const transactionsResponse = await fetch(`${apiUrl}/walletTransactions?userId=${user.id}`);
      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        setTransactions(transactionsData);
        
        // Calculate wallet balance
        const balance = transactionsData.reduce((total, transaction) => total + transaction.amount, 0);
        setWalletBalance(balance);
      }
      
      // Fetch system settings for payment methods
      const settingsResponse = await fetch(`${apiUrl}/systemSettings`);
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        setSystemSettings(settingsData);
      }
    } catch (err) {
      console.error('Error fetching wallet data:', err);
      setError('Failed to load wallet data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleDepositSubmit = async () => {
    setDepositError('');
    
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setDepositError('Please enter a valid deposit amount');
      return;
    }
    
    setIsDepositing(true);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Create deposit transaction
      const transactionData = {
        userId: user.id,
        type: 'deposit',
        amount: parseFloat(depositAmount),
        status: 'pending',
        paymentMethod: depositMethod,
        paymentProof: paymentProof ? `/uploads/payments/proof-${Date.now()}.pdf` : '',
        createdAt: new Date().toISOString(),
        notes: depositNote
      };
      
      const response = await fetch(`${apiUrl}/walletTransactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create deposit request');
      }
      
      // Reset form and show success
      setDepositSuccess(true);
      setDepositAmount('');
      setDepositMethod('bank_transfer');
      setDepositNote('');
      setPaymentProof(null);
      
      // Fetch updated transactions
      fetchWalletData();
    } catch (err) {
      console.error('Error creating deposit:', err);
      setDepositError('Failed to create deposit request. Please try again later.');
    } finally {
      setIsDepositing(false);
    }
  };
  
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setPaymentProof(file);
    }
  };
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
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
  
  // Get status color for transaction
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };
  
  // Get icon for transaction type
  const getTransactionIcon = (type, status) => {
    if (type === 'deposit') {
      return <ArrowUpwardIcon color={status === 'rejected' ? 'error' : 'success'} />;
    } else if (type === 'investment') {
      return <ArrowDownwardIcon color="error" />;
    } else {
      return <HistoryIcon />;
    }
  };
  
  // Get bank transfer payment details
  const getBankTransferDetails = () => {
    if (!systemSettings?.paymentMethods?.bankTransfer) return null;
    
    const bt = systemSettings.paymentMethods.bankTransfer;
    return (
      <List>
        <ListItem>
          <ListItemText primary="Bank Name" secondary={bt.bankName} />
          <IconButton edge="end" onClick={() => copyToClipboard(bt.bankName)}>
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </ListItem>
        <ListItem>
          <ListItemText primary="Account Name" secondary={bt.accountName} />
          <IconButton edge="end" onClick={() => copyToClipboard(bt.accountName)}>
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </ListItem>
        <ListItem>
          <ListItemText primary="Account Number" secondary={bt.accountNumber} />
          <IconButton edge="end" onClick={() => copyToClipboard(bt.accountNumber)}>
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </ListItem>
        <ListItem>
          <ListItemText primary="SWIFT Code" secondary={bt.swiftCode} />
          <IconButton edge="end" onClick={() => copyToClipboard(bt.swiftCode)}>
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </ListItem>
        <ListItem>
          <ListItemText primary="Reference" secondary={`User ID: ${user.id}`} />
          <IconButton edge="end" onClick={() => copyToClipboard(`User ID: ${user.id}`)}>
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </ListItem>
      </List>
    );
  };
  
  // Get crypto payment details
  const getCryptoDetails = () => {
    if (!systemSettings?.paymentMethods?.crypto) return null;
    
    const crypto = systemSettings.paymentMethods.crypto;
    return (
      <List>
        {crypto.acceptedCurrencies.map((currency) => (
          <ListItem key={currency}>
            <ListItemText 
              primary={`${currency} Address`} 
              secondary={crypto.walletAddresses[currency] || 'Not available'} 
            />
            <IconButton 
              edge="end" 
              onClick={() => copyToClipboard(crypto.walletAddresses[currency])}
              disabled={!crypto.walletAddresses[currency]}
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </ListItem>
        ))}
        <ListItem>
          <ListItemText primary="Reference" secondary={`User ID: ${user.id}`} />
          <IconButton edge="end" onClick={() => copyToClipboard(`User ID: ${user.id}`)}>
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </ListItem>
      </List>
    );
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
      {/* Wallet summary */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AccountBalanceWalletIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
              <Typography variant="h5">
                Available Balance
              </Typography>
            </Box>
            <Typography variant="h3" color="primary" gutterBottom>
              {formatCurrency(walletBalance)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Funds available for investment
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<AddIcon />}
                  onClick={() => setShowDepositDialog(true)}
                >
                  Deposit
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<AttachMoneyIcon />}
                  onClick={() => navigate('/projects')}
                >
                  Invest
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="text"
                  fullWidth
                  startIcon={<HistoryIcon />}
                  onClick={() => setActiveTab(1)}
                >
                  View Transaction History
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Tabs section */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Overview" />
            <Tab label="Transaction History" />
            <Tab label="Deposit Methods" />
          </Tabs>
        </Box>
        
        {/* Overview Tab */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>
                Recent Transactions
              </Typography>
              {transactions.length === 0 ? (
                <Typography variant="body1" color="text.secondary">
                  No transactions yet.
                </Typography>
              ) : (
                <List>
                  {transactions.slice(0, 5).map((transaction) => (
                    <ListItem
                      key={transaction.id}
                      divider
                      secondaryAction={
                        <Chip
                          label={transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                          color={getStatusColor(transaction.status)}
                          size="small"
                        />
                      }
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {getTransactionIcon(transaction.type, transaction.status)}
                            <Typography variant="body1" sx={{ ml: 1 }}>
                              {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                              {transaction.projectId ? ` - Project #${transaction.projectId}` : ''}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(transaction.createdAt)}
                            </Typography>
                            <Typography
                              variant="body2"
                              color={transaction.amount > 0 ? 'success.main' : 'error.main'}
                              sx={{ fontWeight: 'bold' }}
                            >
                              {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
              
              {transactions.length > 5 && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Button
                    variant="text"
                    onClick={() => setActiveTab(1)}
                  >
                    View All Transactions
                  </Button>
                </Box>
              )}
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Wallet Statistics
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Total Deposits
                    </Typography>
                    <Typography variant="h6">
                      {formatCurrency(
                        transactions
                          .filter(t => t.type === 'deposit' && t.status === 'completed')
                          .reduce((sum, t) => sum + t.amount, 0)
                      )}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Total Investments
                    </Typography>
                    <Typography variant="h6">
                      {formatCurrency(
                        Math.abs(
                          transactions
                            .filter(t => t.type === 'investment')
                            .reduce((sum, t) => sum + t.amount, 0)
                        )
                      )}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Pending Deposits
                    </Typography>
                    <Typography variant="h6">
                      {formatCurrency(
                        transactions
                          .filter(t => t.type === 'deposit' && t.status === 'pending')
                          .reduce((sum, t) => sum + t.amount, 0)
                      )}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Transaction History Tab */}
        <TabPanel value={activeTab} index={1}>
          <Typography variant="h6" gutterBottom>
            Transaction History
          </Typography>
          
          {transactions.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                No transactions yet.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowDepositDialog(true)}
                sx={{ mt: 2 }}
              >
                Add Funds
              </Button>
            </Box>
          ) : (
            <Paper variant="outlined">
              <List>
                {transactions.map((transaction) => (
                  <ListItem
                    key={transaction.id}
                    divider
                    secondaryAction={
                      <Chip
                        label={transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        color={getStatusColor(transaction.status)}
                        size="small"
                      />
                    }
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {getTransactionIcon(transaction.type, transaction.status)}
                          <Box sx={{ ml: 1 }}>
                            <Typography variant="body1">
                              {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                              {transaction.projectId ? ` - Project #${transaction.projectId}` : ''}
                            </Typography>
                            {transaction.paymentMethod && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                Method: {transaction.paymentMethod.replace('_', ' ').toUpperCase()}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(transaction.createdAt)}
                            {transaction.approvedAt && ` • Processed: ${formatDate(transaction.approvedAt)}`}
                          </Typography>
                          <Typography
                            variant="body2"
                            color={transaction.amount > 0 ? 'success.main' : 'error.main'}
                            sx={{ fontWeight: 'bold' }}
                          >
                            {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}
        </TabPanel>
        
        {/* Deposit Methods Tab */}
        <TabPanel value={activeTab} index={2}>
          <Typography variant="h6" gutterBottom>
            Deposit Methods
          </Typography>
          
          <Grid container spacing={3}>
            {systemSettings?.paymentMethods?.bankTransfer?.enabled && (
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <CreditCardIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6">
                        Bank Transfer
                      </Typography>
                    </Box>
                    <Typography variant="body2" paragraph>
                      Deposit funds using bank transfer. Processing time: 1-2 business days.
                    </Typography>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setDepositMethod('bank_transfer');
                        setShowPaymentDetailsDialog(true);
                      }}
                    >
                      View Bank Details
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            )}
            
            {systemSettings?.paymentMethods?.crypto?.enabled && (
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <CurrencyBitcoinIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6">
                        Cryptocurrency
                      </Typography>
                    </Box>
                    <Typography variant="body2" paragraph>
                      Deposit funds using cryptocurrency. Processing time: 1-3 hours after confirmation.
                    </Typography>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setDepositMethod('crypto');
                        setShowPaymentDetailsDialog(true);
                      }}
                    >
                      View Crypto Details
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
          
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowDepositDialog(true)}
            >
              Add Funds Now
            </Button>
          </Box>
        </TabPanel>
      </Paper>
      
      {/* Deposit Dialog */}
      <Dialog 
        open={showDepositDialog} 
        onClose={() => {
          if (!isDepositing) {
            setShowDepositDialog(false);
            setDepositSuccess(false);
          }
        }} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>Add Funds to Your Wallet</DialogTitle>
        <DialogContent>
          {depositSuccess ? (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Deposit Request Submitted
              </Typography>
              <Typography variant="body1" paragraph>
                Your deposit request has been submitted and is pending approval. You will be notified once it's processed.
              </Typography>
              <Button
                variant="contained"
                onClick={() => {
                  setShowDepositDialog(false);
                  setDepositSuccess(false);
                }}
              >
                Done
              </Button>
            </Box>
          ) : (
            <>
              <DialogContentText sx={{ mb: 2 }}>
                Please enter the amount you wish to deposit into your wallet and select your preferred payment method.
              </DialogContentText>
              
              {depositError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {depositError}
                </Alert>
              )}
              
              <TextField
                autoFocus
                margin="dense"
                label="Deposit Amount"
                type="number"
                fullWidth
                variant="outlined"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoneyIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="payment-method-label">Payment Method</InputLabel>
                <Select
                  labelId="payment-method-label"
                  value={depositMethod}
                  onChange={(e) => setDepositMethod(e.target.value)}
                  label="Payment Method"
                >
                  {systemSettings?.paymentMethods?.bankTransfer?.enabled && (
                    <MenuItem value="bank_transfer">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CreditCardIcon sx={{ mr: 1 }} />
                        Bank Transfer
                      </Box>
                    </MenuItem>
                  )}
                  {systemSettings?.paymentMethods?.crypto?.enabled && (
                    <MenuItem value="crypto">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CurrencyBitcoinIcon sx={{ mr: 1 }} />
                        Cryptocurrency
                      </Box>
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
              
              <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Payment Instructions
                </Typography>
                {depositMethod === 'bank_transfer' ? (
                  <Typography variant="body2">
                    {systemSettings?.paymentMethods?.bankTransfer?.instructions || 
                      'Please transfer the funds to our bank account and upload the proof of payment below.'}
                  </Typography>
                ) : (
                  <Typography variant="body2">
                    {systemSettings?.paymentMethods?.crypto?.instructions || 
                      'Please transfer the cryptocurrency to our wallet address and upload the transaction screenshot below.'}
                  </Typography>
                )}
                
                <Button
                  variant="outlined"
                  size="small"
                  sx={{ mt: 1 }}
                  onClick={() => {
                    setShowPaymentDetailsDialog(true);
                  }}
                >
                  View Payment Details
                </Button>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Upload Payment Proof
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<DownloadIcon />}
                  fullWidth
                >
                  {paymentProof ? paymentProof.name : 'Select File'}
                  <input
                    type="file"
                    hidden
                    onChange={handleFileUpload}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                </Button>
                <Typography variant="caption" color="text.secondary">
                  Accepted formats: PDF, JPG, JPEG, PNG
                </Typography>
              </Box>
              
              <TextField
                margin="dense"
                label="Additional Notes (Optional)"
                type="text"
                fullWidth
                multiline
                rows={3}
                variant="outlined"
                value={depositNote}
                onChange={(e) => setDepositNote(e.target.value)}
              />
            </>
          )}
        </DialogContent>
        
        {!depositSuccess && (
          <DialogActions>
            <Button onClick={() => setShowDepositDialog(false)} disabled={isDepositing}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleDepositSubmit}
              disabled={isDepositing || !depositAmount}
              startIcon={isDepositing ? <CircularProgress size={20} /> : null}
            >
              {isDepositing ? 'Processing...' : 'Submit Deposit Request'}
            </Button>
          </DialogActions>
        )}
      </Dialog>
      
      {/* Payment Details Dialog */}
      <Dialog
        open={showPaymentDetailsDialog}
        onClose={() => setShowPaymentDetailsDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {depositMethod === 'bank_transfer' ? 'Bank Transfer Details' : 'Cryptocurrency Details'}
        </DialogTitle>
        <DialogContent>
          {depositMethod === 'bank_transfer' ? (
            getBankTransferDetails()
          ) : (
            getCryptoDetails()
          )}
          
          <Box sx={{ mt: 2, bgcolor: 'info.light', color: 'info.contrastText', p: 2, borderRadius: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <InfoIcon sx={{ mr: 1 }} />
              <Typography variant="subtitle2">
                Important Information
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {depositMethod === 'bank_transfer'
                ? 'Please include your User ID in the payment reference to expedite processing. After completing the transfer, submit your deposit request with proof of payment.'
                : 'Please ensure you send the exact amount from your own wallet. After completing the transaction, submit your deposit request with the transaction hash or screenshot.'}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPaymentDetailsDialog(false)}>
            Close
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setShowPaymentDetailsDialog(false);
              setShowDepositDialog(true);
            }}
          >
            Continue to Deposit
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

// Tab Panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default Wallet;