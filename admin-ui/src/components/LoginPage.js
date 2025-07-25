import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Divider,
  Link,
  Container,
  Avatar,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = ({ onLoginSuccess }) => {
  const { login, signup, isLoading, error } = useAuth();
  const [isSignupMode, setIsSignupMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    confirmPassword: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  // Clear errors when switching modes
  useEffect(() => {
    setFormErrors({});
    setSubmitError('');
  }, [isSignupMode]);

  /**
   * Handle form input changes
   */
  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  /**
   * Validate form data
   */
  const validateForm = () => {
    const errors = {};

    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (isSignupMode && formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    }

    // Signup-specific validation
    if (isSignupMode) {
      if (!formData.firstName.trim()) {
        errors.firstName = 'First name is required';
      }
      
      if (!formData.lastName.trim()) {
        errors.lastName = 'Last name is required';
      }
      
      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError('');

    if (!validateForm()) {
      return;
    }

    try {
      let result;
      
      if (isSignupMode) {
        result = await signup(
          formData.email,
          formData.password,
          formData.firstName,
          formData.lastName
        );
      } else {
        result = await login(formData.email, formData.password);
      }

      if (result.success) {
        onLoginSuccess?.();
      } else {
        setSubmitError(result.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setSubmitError('An unexpected error occurred. Please try again.');
    }
  };

  /**
   * Toggle between login and signup modes
   */
  const toggleMode = () => {
    setIsSignupMode(!isSignupMode);
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      confirmPassword: '',
    });
  };

  /**
   * Toggle password visibility
   */
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          py: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            maxWidth: 450,
          }}
        >
          {/* Header */}
          <Avatar sx={{ m: 1, bgcolor: 'primary.main', width: 56, height: 56 }}>
            <SecurityIcon fontSize="large" />
          </Avatar>
          
          <Typography component="h1" variant="h4" gutterBottom>
            Guardian
          </Typography>
          
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {isSignupMode ? 'Security Beyond Doubt' : 'Security Beyond Doubt'}
          </Typography>

          {/* Error Display */}
          {(submitError || error) && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {submitError || error}
            </Alert>
          )}

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
            {/* Signup Fields */}
            {isSignupMode && (
              <>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    required
                    fullWidth
                    id="firstName"
                    label="First Name"
                    name="firstName"
                    autoComplete="given-name"
                    value={formData.firstName}
                    onChange={handleInputChange('firstName')}
                    error={!!formErrors.firstName}
                    helperText={formErrors.firstName}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    required
                    fullWidth
                    id="lastName"
                    label="Last Name"
                    name="lastName"
                    autoComplete="family-name"
                    value={formData.lastName}
                    onChange={handleInputChange('lastName')}
                    error={!!formErrors.lastName}
                    helperText={formErrors.lastName}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
              </>
            )}

            {/* Email Field */}
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus={!isSignupMode}
              value={formData.email}
              onChange={handleInputChange('email')}
              error={!!formErrors.email}
              helperText={formErrors.email}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />

            {/* Password Field */}
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete={isSignupMode ? 'new-password' : 'current-password'}
              value={formData.password}
              onChange={handleInputChange('password')}
              error={!!formErrors.password}
              helperText={formErrors.password}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={togglePasswordVisibility}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Confirm Password Field */}
            {isSignupMode && (
              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                id="confirmPassword"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleInputChange('confirmPassword')}
                error={!!formErrors.confirmPassword}
                helperText={formErrors.confirmPassword}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={isLoading}
              startIcon={isLoading && <CircularProgress size={20} />}
            >
              {isLoading 
                ? (isSignupMode ? 'Creating Account...' : 'Signing In...') 
                : (isSignupMode ? 'Create Account' : 'Sign In')
              }
            </Button>

            {/* Mode Toggle */}
            <Divider sx={{ my: 2 }} />
            
            <Box textAlign="center">
              <Typography variant="body2" color="text.secondary">
                {isSignupMode 
                  ? 'Already have an account? ' 
                  : "Don't have an account? "
                }
                <Link
                  component="button"
                  variant="body2"
                  onClick={toggleMode}
                  sx={{ cursor: 'pointer' }}
                >
                  {isSignupMode ? 'Sign in' : 'Create one'}
                </Link>
              </Typography>
            </Box>
          </Box>

          {/* Footer Info */}
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Powered by Guardian Authentication Service
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginPage;