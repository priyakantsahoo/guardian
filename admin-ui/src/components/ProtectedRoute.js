import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import LoginPage from './LoginPage';

/**
 * ProtectedRoute component that checks authentication status
 * and renders appropriate content based on auth state
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        gap={2}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Verifying authentication...
        </Typography>
      </Box>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Render protected content if authenticated
  return (
    <>
      {children}
    </>
  );
};

/**
 * Alternative ProtectedRoute that accepts onLoginSuccess callback
 */
export const ProtectedRouteWithCallback = ({ children, onLoginSuccess }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        gap={2}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Verifying authentication...
        </Typography>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={onLoginSuccess} />;
  }

  return children;
};

export default ProtectedRoute;