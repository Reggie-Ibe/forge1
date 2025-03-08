// src/App.jsx with escrow management routes
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Material UI components
import { Box, CircularProgress, Container, Paper, Typography, Button } from '@mui/material';

// Layout
import MainLayout from './components/layout/MainLayout';

// Pages
import PendingVerification from './pages/PendingVerification';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import CreateProject from './pages/CreateProject';
import EditProject from './pages/EditProject';
import ProjectDetail from './pages/ProjectDetail';
import AddMilestone from './pages/AddMilestone';
import EditMilestone from './pages/EditMilestone';
import MilestoneVerification from './pages/MilestoneVerification';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import Wallet from './pages/Wallet';
import RoleBasedRedirect from './components/auth/RoleBasedRedirect';


// Admin pages
import AdminDashboard from './components/dashboard/AdminDashboard';
import AdminEscrowManagement from './pages/AdminEscrowManagement';
import RuleConfiguration from './components/admin/RuleConfiguration';
import AdminPaymentMethods from './pages/AdminPaymentMethods';
import UserVerification from './components/admin/UserVerification';


// Protected route component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Check role restrictions if applicable
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};

const HomePage = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: 'background.default' }}>
    <Paper elevation={3} sx={{ p: 4, maxWidth: 400, width: '100%', textAlign: 'center' }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        InnoCap Forge
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Connecting Innovation with Capital
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Button variant="contained" color="primary" href="/login" fullWidth>
          Login
        </Button>
        <Button variant="outlined" color="primary" href="/register" fullWidth>
          Register
        </Button>
      </Box>
    </Paper>
  </Box>
);

const NotFound = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: 'background.default' }}>
    <Paper elevation={3} sx={{ p: 4, maxWidth: 400, width: '100%', textAlign: 'center' }}>
      <Typography variant="h2" component="h1" gutterBottom>
        404
      </Typography>
      <Typography variant="h5" gutterBottom>
        Page Not Found
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        The page you are looking for doesn't exist or has been moved.
      </Typography>
      <Button variant="contained" color="primary" href="/">
        Go Home
      </Button>
    </Paper>
  </Box>
);

const Unauthorized = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: 'background.default' }}>
    <Paper elevation={3} sx={{ p: 4, maxWidth: 400, width: '100%', textAlign: 'center' }}>
      <Typography variant="h2" component="h1" gutterBottom>
        403
      </Typography>
      <Typography variant="h5" gutterBottom>
        Unauthorized
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        You don't have permission to access this page.
      </Typography>
      <Button variant="contained" color="primary" href="/dashboard">
        Back to Dashboard
      </Button>
    </Paper>
  </Box>
);

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/pending-verification" element={<PendingVerification />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/redirect" element={<RoleBasedRedirect />} />

        {/* Protected routes with layout */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute>
            <MainLayout>
              <Profile />
            </MainLayout>
          </ProtectedRoute>
        } />

        {/* Projects routes */}
        <Route path="/projects" element={
          <ProtectedRoute>
            <MainLayout>
              <Projects />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/projects/create" element={
          <ProtectedRoute allowedRoles={['innovator']}>
            <MainLayout>
              <CreateProject />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/projects/:id" element={
          <ProtectedRoute>
            <MainLayout>
              <ProjectDetail />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/projects/:id/edit" element={
          <ProtectedRoute allowedRoles={['innovator']}>
            <MainLayout>
              <EditProject />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/projects/:projectId/milestones/add" element={
          <ProtectedRoute allowedRoles={['innovator']}>
            <MainLayout>
              <AddMilestone />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/projects/:projectId/milestones/:milestoneId/edit" element={
          <ProtectedRoute allowedRoles={['innovator', 'admin']}>
            <MainLayout>
              <EditMilestone />
            </MainLayout>
          </ProtectedRoute>
        } />

        {/* New milestone verification route */}
        <Route path="/projects/:projectId/milestones/:milestoneId/verify" element={
          <ProtectedRoute allowedRoles={['investor', 'admin']}>
            <MainLayout>
              <MilestoneVerification />
            </MainLayout>
          </ProtectedRoute>
        } />

        {/* Messages route */}
        <Route path="/messages" element={
          <ProtectedRoute>
            <MainLayout>
              <Messages />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/investments" element={
          <ProtectedRoute allowedRoles={['investor']}>
            <MainLayout>
              <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                  Investments
                </Typography>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="body1">
                    View your investments in your profile page.
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary"
                    href="/profile"
                    sx={{ mt: 2 }}
                  >
                    Go to Profile
                  </Button>
                </Paper>
              </Container>
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/wallet" element={
          <ProtectedRoute allowedRoles={['investor']}>
            <MainLayout>
              <Wallet />
            </MainLayout>
          </ProtectedRoute>
        } />

        {/* Admin Dashboard and related routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MainLayout>
              <AdminDashboard />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/admin/projects" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MainLayout>
              <AdminDashboard />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/admin/projects/:projectId/investments" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MainLayout>
              <AdminEscrowManagement />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/admin/projects/:projectId/escrow" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MainLayout>
              <AdminEscrowManagement />
            </MainLayout>
          </ProtectedRoute>
        } />

        {/* New project rules management route */}
        <Route path="/admin/projects/:projectId/rules" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MainLayout>
              <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                  Release Rules Configuration
                </Typography>
                <Box sx={{ mt: 3 }}>
                  {/* RuleConfiguration will be rendered with the projectId from params */}
                  {({ params }) => (
                    <RuleConfiguration projectId={params.projectId} />
                  )}
                </Box>
              </Container>
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/admin/wallet" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MainLayout>
              <AdminPaymentMethods />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/admin/wallet/transactions" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MainLayout>
              <AdminDashboard />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/admin/users" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MainLayout>
              <UserVerification />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/admin/settings" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MainLayout>
              <AdminDashboard />
            </MainLayout>
          </ProtectedRoute>
        } />

        {/* Catch-all route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;