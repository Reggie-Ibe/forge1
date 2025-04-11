// src/pages/CreateProject.jsx
import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Typography,
  MenuItem,
  Snackbar,
  Alert
} from '@mui/material';

const categories = [
  'Healthcare', 'Education', 'Infrastructure', 'Technology', 'Finance'
];

const CreateProject = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    fundingGoal: '',
  });
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // submit logic here (API call)
    console.log('Submitted:', formData);
    setSuccess(true);
    setFormData({ title: '', description: '', category: '', fundingGoal: '' });
  };

  return (
    <Box className="flex justify-center py-10">
      <Card className="w-full max-w-2xl bg-paper">
        <CardContent>
          <Typography variant="h5" className="mb-4 font-semibold text-primary">
            Create a New Project
          </Typography>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  name="title"
                  label="Project Title"
                  fullWidth
                  required
                  value={formData.title}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="description"
                  label="Description"
                  fullWidth
                  multiline
                  rows={4}
                  required
                  value={formData.description}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  name="category"
                  label="Category"
                  select
                  fullWidth
                  required
                  value={formData.category}
                  onChange={handleChange}
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  name="fundingGoal"
                  label="Funding Goal (USD)"
                  type="number"
                  fullWidth
                  required
                  value={formData.fundingGoal}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <Box className="flex justify-end">
                  <Button type="submit" variant="contained" color="primary">
                    Submit Project
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
      <Snackbar
        open={success}
        autoHideDuration={4000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccess(false)} severity="success" sx={{ width: '100%' }}>
          Project submitted successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CreateProject;