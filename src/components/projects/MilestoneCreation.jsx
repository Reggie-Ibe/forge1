// components/projects/MilestoneCreation.jsx
import { useState } from 'react';
import { 
  Box, Typography, TextField, Button, Grid, 
  Paper, FormControl, InputLabel, Select, MenuItem,
  InputAdornment, DatePicker, LocalizationProvider,
  AdapterDateFns
} from '@mui/material';

const MilestoneCreation = ({ projectId, onAddMilestone }) => {
  const [milestone, setMilestone] = useState({
    title: '',
    description: '',
    startDate: null,
    estimatedCompletionDate: null,
    estimatedFunding: '',
    completionPercentage: '',
    deliverables: []
  });
  
  // Add form handling logic
  
  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>Add Project Milestone</Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            label="Milestone Title"
            fullWidth
            value={milestone.title}
            onChange={(e) => setMilestone({...milestone, title: e.target.value})}
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={milestone.description}
            onChange={(e) => setMilestone({...milestone, description: e.target.value})}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Start Date"
              value={milestone.startDate}
              onChange={(date) => setMilestone({...milestone, startDate: date})}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </LocalizationProvider>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Estimated Completion Date"
              value={milestone.estimatedCompletionDate}
              onChange={(date) => setMilestone({...milestone, estimatedCompletionDate: date})}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </LocalizationProvider>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            label="Estimated Funding Required"
            fullWidth
            value={milestone.estimatedFunding}
            onChange={(e) => setMilestone({...milestone, estimatedFunding: e.target.value})}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            label="Project Completion Percentage"
            fullWidth
            value={milestone.completionPercentage}
            onChange={(e) => setMilestone({...milestone, completionPercentage: e.target.value})}
            InputProps={{
              endAdornment: <InputAdornment position="end">%</InputAdornment>,
            }}
          />
        </Grid>
        
        <Grid item xs={12}>
          <Button variant="contained" color="primary" onClick={handleAddMilestone}>
            Add Milestone
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};