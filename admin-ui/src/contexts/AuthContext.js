import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import GuardianAuthClient from '../services/GuardianAuthClient';
import { authenticatedApi } from '../services/authenticatedApi';
import { isTokenExpired, getTimeUntilExpiration } from '../utils/tokenUtils';

// Create the auth context
const AuthContext = createContext();

// Guardian Auth configuration (use proxy server)
const GUARDIAN_CONFIG = {
  baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3002',
  clientId: process.env.REACT_APP_GUARDIAN_CLIENT_ID,
  clientKey: process.env.REACT_APP_GUARDIAN_CLIENT_KEY,
};

// Validate required environment variables
if (!GUARDIAN_CONFIG.clientId || !GUARDIAN_CONFIG.clientKey) {
  console.error('Missing required environment variables: REACT_APP_GUARDIAN_CLIENT_ID and/or REACT_APP_GUARDIAN_CLIENT_KEY');
  console.error('Please check your .env file');
}

// Create Guardian Auth client instance
const guardianAuth = new GuardianAuthClient(GUARDIAN_CONFIG);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);
  const [tokenExpirationTimer, setTokenExpirationTimer] = useState(null);

  // Handle token expiration with notification
  const handleTokenExpiration = () => {
    toast.error('Your session has expired. Please log in again.', {
      duration: 5000,
      position: 'top-center'
    });
    
    handleLogout();
  };

  // Fetch user profile information
  const fetchUserProfile = async () => {
    try {
      // First try the /api/auth/me endpoint
      try {
        const profile = await authenticatedApi.getCurrentUserProfile();
        return profile;
      } catch (meError) {
        // If /api/auth/me doesn't exist, try getting user by ID
        const currentUser = guardianAuth.getCurrentUser();
        if (currentUser?.userId) {
          const profile = await authenticatedApi.getUserById(currentUser.userId);
          return profile;
        }
      }
      return null;
    } catch (error) {
      console.warn('Failed to fetch user profile:', error);
      return null;
    }
  };

  // Set up token expiration monitoring
  const setupTokenMonitoring = (token) => {
    // Clear existing timer
    if (tokenExpirationTimer) {
      clearTimeout(tokenExpirationTimer);
    }

    if (!token || isTokenExpired(token)) {
      return;
    }

    const timeUntilExpiration = getTimeUntilExpiration(token);
    
    // Set up timer to handle expiration
    const timer = setTimeout(() => {
      handleTokenExpiration();
    }, timeUntilExpiration);

    setTokenExpirationTimer(timer);

    // Also set up a warning 5 minutes before expiration
    const warningTime = Math.max(0, timeUntilExpiration - 5 * 60 * 1000);
    if (warningTime > 0) {
      setTimeout(() => {
        toast.warning('Your session will expire in 5 minutes. Please save your work.', {
          duration: 10000,
          position: 'top-center'
        });
      }, warningTime);
    }
  };

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
    
    // Set up periodic token validation (every 30 seconds)
    const validationInterval = setInterval(async () => {
      const token = guardianAuth.getToken();
      if (token && isTokenExpired(token)) {
        handleTokenExpiration();
      } else if (guardianAuth.isAuthenticated()) {
        const isValid = await guardianAuth.refreshValidation();
        if (!isValid) {
          handleLogout();
        }
      }
    }, 30 * 1000); // 30 seconds

    return () => {
      clearInterval(validationInterval);
      if (tokenExpirationTimer) {
        clearTimeout(tokenExpirationTimer);
      }
    };
  }, [tokenExpirationTimer]);

  /**
   * Check current authentication status
   */
  const checkAuthStatus = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (guardianAuth.getToken()) {
        const isValid = await guardianAuth.validateTokenSilently();
        if (isValid) {
          const currentUser = guardianAuth.getCurrentUser();
          // Fetch user profile to get first name and last name
          const userProfile = await fetchUserProfile();
          
          const enrichedUser = {
            ...currentUser,
            ...userProfile
          };
          
          setUser(enrichedUser);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth status check failed:', error);
      setError('Failed to verify authentication status');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Login with email and password
   */
  const login = async (email, password) => {
    setIsLoading(true);
    setError(null);

    try {
      await guardianAuth.login(email, password);
      const currentUser = guardianAuth.getCurrentUser();
      const token = guardianAuth.getToken();
      
      // Fetch user profile to get first name and last name
      const userProfile = await fetchUserProfile();
      
      const enrichedUser = {
        ...currentUser,
        ...userProfile
      };
      
      setUser(enrichedUser);
      setIsAuthenticated(true);
      
      // Set up token expiration monitoring
      if (token) {
        setupTokenMonitoring(token);
        
        // Show success notification
        toast.success('Successfully logged in!', {
          duration: 3000,
          position: 'top-center'
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      setError(error.message);
      setUser(null);
      setIsAuthenticated(false);
      
      // Show error notification
      toast.error(`Login failed: ${error.message}`, {
        duration: 5000,
        position: 'top-center'
      });
      
      return { 
        success: false, 
        error: error.message 
      };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign up new admin user
   */
  const signup = async (email, password, firstName, lastName) => {
    setIsLoading(true);
    setError(null);

    try {
      await guardianAuth.signup(email, password, firstName, lastName);
      const currentUser = guardianAuth.getCurrentUser();
      
      setUser(currentUser);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      console.error('Signup failed:', error);
      setError(error.message);
      setUser(null);
      setIsAuthenticated(false);
      
      return { 
        success: false, 
        error: error.message 
      };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Internal logout handler
   */
  const handleLogout = () => {
    // Clear token expiration timer
    if (tokenExpirationTimer) {
      clearTimeout(tokenExpirationTimer);
      setTokenExpirationTimer(null);
    }
    
    guardianAuth.logout();
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
  };

  /**
   * Manual logout with notification
   */
  const logout = () => {
    handleLogout();
    
    toast.info('You have been logged out successfully.', {
      duration: 3000,
      position: 'top-center'
    });
  };

  /**
   * Get current JWT token
   */
  const getToken = () => {
    return guardianAuth.getToken();
  };

  /**
   * Validate current token
   */
  const validateToken = async () => {
    try {
      const validation = await guardianAuth.validateToken();
      return validation;
    } catch (error) {
      console.error('Token validation failed:', error);
      handleLogout();
      throw error;
    }
  };

  /**
   * Get Guardian Auth client for advanced operations
   */
  const getAuthClient = () => {
    return guardianAuth;
  };

  // Context value
  const value = {
    // State
    user,
    isLoading,
    isAuthenticated,
    error,
    
    // Actions
    login,
    signup,
    logout,
    checkAuthStatus,
    validateToken,
    getToken,
    getAuthClient,
    
    // Configuration
    config: GUARDIAN_CONFIG,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use the auth context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Higher-order component for protected routes
 */
export const withAuth = (WrappedComponent) => {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated, isLoading } = useAuth();
    
    if (isLoading) {
      return <div>Loading...</div>; // Or your loading component
    }
    
    if (!isAuthenticated) {
      return null; // Will be handled by routing
    }
    
    return <WrappedComponent {...props} />;
  };
};

export default AuthContext;