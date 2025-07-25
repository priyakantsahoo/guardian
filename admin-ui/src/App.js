import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import { Toaster } from 'sonner';

// Authentication and Theme
import { AuthProvider } from './contexts/AuthContext';
import { ThemeContextProvider, useTheme } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';

// Components
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import UserManagement from './components/UserManagement';
import ClientManagement from './components/ClientManagement';
import AuditLogs from './components/AuditLogs';
import SystemHealth from './components/SystemHealth';


// Main App Layout Component
const AppLayout = () => {
  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          minHeight: '100vh',
          marginLeft: '240px', // Width of sidebar
          p: 3, // Uniform padding
        }}
      >
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/clients" element={<ClientManagement />} />
          <Route path="/logs" element={<AuditLogs />} />
          <Route path="/health" element={<SystemHealth />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Box>
    </Box>
  );
};

// App component with theme integration
const AppWithTheme = () => {
  const { theme } = useTheme();
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        </Router>
        {/* Toast notifications */}
        <Toaster
          position="top-center"
          richColors
          expand={true}
          duration={4000}
          closeButton
        />
      </AuthProvider>
    </ThemeProvider>
  );
};

function App() {
  return (
    <ThemeContextProvider>
      <AppWithTheme />
    </ThemeContextProvider>
  );
}

export default App;