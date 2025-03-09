// src/components/verification/VerificationForm.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

// Material UI components
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Paper,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  Chip,
  Rating,
  FormHelperText,
  Stack
} from '@mui/material';

// Material UI icons
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VerifiedIcon from '@mui/icons-material/Verified';
import SendIcon from '@mui/icons-material/Send';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

const VerificationForm = ({ milestone, onVerificationSubmit }) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [verificationData, setVerificationData] = useState({
    comment: '',
    criteria: [],
    completionRating: 3,
    documentationRating: 3,
    qualityRating: 3,
    verified: false
  });
  
  // Initialize criteria from milestone
  useEffect(() => {
    if (milestone && milestone.criteria) {
      setVerificationData({
        ...verificationData,
        criteria: milestone.criteria.map(criterion => ({
          id: criterion.id,
          description: criterion.description,
          required: criterion.required,
          verified: false,
          comment: ''
        }))
      });
    } else {
      // If no criteria defined, create default criteria
      setVerificationData({
        ...verificationData,
        criteria: [
          {
            id: 1,
            description: 'The milestone deliverables are complete as described',
            required: true,
            verified: false,
            comment: ''
          },
          {
            id: 2,
            description: 'The documentation provided is sufficient to verify completion',
            required: true,
            verified: false,
            comment: ''
          },
          {
            id: 3,
            description: 'The quality of work meets project standards',
            required: true,
            verified: false,
            comment: ''
          }
        ]
      });
    }
  }, [milestone]);
  
  const handleCriterionVerification = (criterionId, verified) => {
    setVerificationData({
      ...verificationData,
      criteria: verificationData.criteria.map(c => 
        c.id === criterionId ? { ...c, verified } : c
      )
    });
  };
  
  const handleCriterionComment = (criterionId, comment) => {
    setVerificationData({
      ...verificationData,
      criteria: verificationData.criteria.map(c => 
        c.id === criterionId ? { ...c, comment } : c
      )
    });
  };
  
  const handleCommentChange = (e) => {
    setVerificationData({
      ...verificationData,
      comment: e.target.value
    });
  };
  
  const handleRatingChange = (name, value) => {
    setVerificationData({
      ...verificationData,
      [name]: value
    });
  };
  
  const handleVerifiedChange = (e) => {
    setVerificationData({
      ...verificationData,
      verified: e.target.checked
    });
  };
  
  const isFormValid = () => {
    // Check if all required criteria are verified
    const requiredCriteria = verificationData.criteria.filter(c => c.required);
    const allRequiredVerified = requiredCriteria.every(c => c.verified);
    
    // Check if verification checkbox is checked
    return allRequiredVerified && verificationData.verified;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      setError('Please verify all required criteria and confirm your verification');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      // Calculate average rating
      const averageRating = Math.round(
        (verificationData.completionRating + 
         verificationData.documentationRating + 
         verificationData.qualityRating) / 3
      );
      
      // Prepare verification data for submission
      const verification = {
        status: 'approved',
        comment: verificationData.comment,
        criteriaVerified: verificationData.criteria.map(c => ({
          criterionId: c.id,
          verified: c.verified,
          comment: c.comment
        })),
        ratings: {
          completion: verificationData.completionRating,
          documentation: verificationData.documentationRating,
          quality: verificationData.qualityRating,
          average: averageRating
        }
      };
      
      // Call the onVerificationSubmit callback
      if (onVerificationSubmit) {
        await onVerificationSubmit(verification);
      }
      
      setSuccess('Verification submitted successfully');
      
    } catch (err) {
      console.error('Error submitting verification:', err);
      setError(err.message || 'Failed to submit verification');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!milestone) {
    return <Alert severity="error">No milestone selected for verification</Alert>;
  }
  
  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
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
      
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Verification Criteria
        </Typography>
        
        <List>
          {verificationData.criteria.map((criterion) => (
            <ListItem key={criterion.id} disablePadding sx={{ mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} display="flex" alignItems="center">
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={criterion.verified}
                        onChange={(e) => handleCriterionVerification(criterion.id, e.target.checked)}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body1">
                          {criterion.description}
                          {criterion.required && (
                            <Chip
                              label="Required"
                              color="error"
                              size="small"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Typography>
                      </Box>
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Comments on this criterion (optional)"
                    value={criterion.comment}
                    onChange={(e) => handleCriterionComment(criterion.id, e.target.value)}
                    disabled={isSubmitting}
                  />
                </Grid>
              </Grid>
            </ListItem>
          ))}
        </List>
      </Paper>
      
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Quality Assessment
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" gutterBottom>
              Completion Level
            </Typography>
            <Rating
              name="completionRating"
              value={verificationData.completionRating}
              onChange={(e, newValue) => handleRatingChange('completionRating', newValue)}
              disabled={isSubmitting}
            />
            <FormHelperText>
              How fully was the milestone completed?
            </FormHelperText>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Typography variant="body2" gutterBottom>
              Documentation Quality
            </Typography>
            <Rating
              name="documentationRating"
              value={verificationData.documentationRating}
              onChange={(e, newValue) => handleRatingChange('documentationRating', newValue)}
              disabled={isSubmitting}
            />
            <FormHelperText>
              How well is the completion documented?
            </FormHelperText>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Typography variant="body2" gutterBottom>
              Overall Quality
            </Typography>
            <Rating
              name="qualityRating"
              value={verificationData.qualityRating}
              onChange={(e, newValue) => handleRatingChange('qualityRating', newValue)}
              disabled={isSubmitting}
            />
            <FormHelperText>
              How would you rate the quality of work?
            </FormHelperText>
          </Grid>
        </Grid>
      </Paper>
      
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Additional Comments
        </Typography>
        
        <TextField
          fullWidth
          multiline
          rows={4}
          placeholder="Add any overall comments or feedback about this milestone verification"
          value={verificationData.comment}
          onChange={handleCommentChange}
          disabled={isSubmitting}
        />
      </Paper>
      
      <Box sx={{ mb: 3 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={verificationData.verified}
              onChange={handleVerifiedChange}
              color="primary"
              disabled={isSubmitting}
            />
          }
          label={
            <Typography variant="body2">
              I confirm that I have reviewed the milestone details and supporting documents,
              and my verification assessment is accurate to the best of my knowledge.
            </Typography>
          }
        />
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={isSubmitting || !isFormValid()}
          startIcon={isSubmitting ? <CircularProgress size={20} /> : <VerifiedIcon />}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Verification'}
        </Button>
      </Box>
    </Box>
  );
};

export default VerificationForm;