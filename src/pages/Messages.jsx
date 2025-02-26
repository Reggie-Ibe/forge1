// src/pages/Messages.jsx
import { Container, Typography, Paper, Box } from '@mui/material';
import MessagesList from '../components/messaging/MessagesList';

const Messages = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Messages
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Communicate with project owners and investors.
        </Typography>
      </Box>
      
      <Paper elevation={2}>
        <MessagesList />
      </Paper>
    </Container>
  );
};

export default Messages;