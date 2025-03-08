// src/pages/AdminPaymentMethods.jsx
import { Container, Typography } from '@mui/material';
import AdminPaymentSettings from '../components/admin/AdminPaymentSettings';

const AdminPaymentMethods = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <AdminPaymentSettings />
    </Container>
  );
};

export default AdminPaymentMethods;