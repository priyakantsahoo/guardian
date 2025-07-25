import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Divider,
  Avatar,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Assignment as AssignmentIcon,
  MonitorHeart as HealthIcon,
  Security as SecurityIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const drawerWidth = 240;

const menuItems = [
  {
    text: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/dashboard',
    description: 'Overview & Statistics',
  },
  {
    text: 'Users',
    icon: <PeopleIcon />,
    path: '/users',
    description: 'User Management',
  },
  {
    text: 'Clients',
    icon: <BusinessIcon />,
    path: '/clients',
    description: 'Client Applications',
  },
  {
    text: 'Audit Logs',
    icon: <AssignmentIcon />,
    path: '/logs',
    description: 'Security & Activity Logs',
  },
  {
    text: 'System Health',
    icon: <HealthIcon />,
    path: '/health',
    description: 'Performance & Status',
  },
];

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, getAuthClient } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Get user email from token (if available)
  const getUserEmail = () => {
    try {
      const authClient = getAuthClient();
      const decoded = authClient.decodeToken();
      
      // Try different fields in the JWT token for email
      const email = decoded?.email || decoded?.username || decoded?.sub;
      
      // If we got a numeric value (user ID), fallback to a default
      if (email && !isNaN(email)) {
        return 'admin@guardian.com'; // Default admin email
      }
      
      return email || 'Admin User';
    } catch (error) {
      return 'Admin User';
    }
  };

  // Get user display name from the user object (first name + last name)
  const getUserDisplayName = () => {
    // Try to get name from user object first
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    
    if (user?.firstName) {
      return user.firstName;
    }
    
    // Fallback to email-based name extraction
    const email = getUserEmail();
    if (email === 'Admin User') return email;
    
    // Handle specific admin emails
    if (email === 'admin@guardian.com') return 'Admin Guardian';
    
    // Extract name from email (everything before @)
    const name = email.split('@')[0];
    
    // Handle special cases
    if (name === 'admin') return 'Administrator';
    
    // Capitalize first letter and replace dots/underscores with spaces
    return name.charAt(0).toUpperCase() + name.slice(1).replace(/[._]/g, ' ');
  };

  const handleProfileMenuOpen = (event) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };

  const handleThemeToggle = () => {
    toggleTheme();
    handleProfileMenuClose();
  };

  const handleProfileLogout = () => {
    handleProfileMenuClose();
    handleLogout();
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: isDarkMode ? '#1e1e1e' : '#263238',
          color: '#ffffff',
          borderRight: isDarkMode ? '1px solid #333' : 'none',
        },
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <SecurityIcon sx={{ fontSize: 40, color: '#42a5f5', mb: 1 }} />
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
          Guardian
        </Typography>
        <Typography variant="caption" sx={{ color: '#b0bec5' }}>
          Authentication Service
        </Typography>
      </Box>

      <Divider sx={{ borderColor: isDarkMode ? '#333' : '#37474f' }} />

      {/* Navigation Menu */}
      <List sx={{ pt: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              selected={location.pathname === item.path}
              sx={{
                mx: 1,
                borderRadius: 1,
                '&.Mui-selected': {
                  backgroundColor: '#1976d2',
                  '&:hover': {
                    backgroundColor: '#1565c0',
                  },
                },
                '&:hover': {
                  backgroundColor: isDarkMode ? '#333' : '#37474f',
                },
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                secondary={item.description}
                primaryTypographyProps={{
                  fontSize: '0.9rem',
                  fontWeight: location.pathname === item.path ? 600 : 400,
                }}
                secondaryTypographyProps={{
                  fontSize: '0.75rem',
                  color: '#90a4ae',
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* User Info & Logout */}
      <Box sx={{ mt: 'auto', p: 2 }}>
        <Divider sx={{ borderColor: isDarkMode ? '#333' : '#37474f', mb: 2 }} />
        
        {/* User Profile Section */}
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: 2,
            p: 1.5,
            backgroundColor: isDarkMode ? '#333' : '#37474f',
            borderRadius: 1,
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: isDarkMode ? '#404040' : '#455a64',
            },
          }}
          onClick={handleProfileMenuOpen}
        >
          <Avatar sx={{ width: 36, height: 36, bgcolor: '#1976d2', mr: 1.5 }}>
            <PersonIcon fontSize="small" />
          </Avatar>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {getUserDisplayName()}
            </Typography>
          </Box>
          <ExpandMoreIcon sx={{ color: '#90a4ae', fontSize: 20 }} />
        </Box>


        {/* Version Info */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: '#78909c' }}>
            Version 1.0.0
          </Typography>
          <br />
          <Typography variant="caption" sx={{ color: '#78909c' }}>
            Guardian Auth Service
          </Typography>
        </Box>
      </Box>

      {/* Profile Context Menu */}
      <Menu
        anchorEl={profileMenuAnchor}
        open={Boolean(profileMenuAnchor)}
        onClose={handleProfileMenuClose}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              minWidth: 200,
              '& .MuiMenuItem-root': {
                px: 2,
                py: 1,
              },
            },
          },
        }}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
      >
        <MenuItem disabled>
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {getUserDisplayName()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {getUserEmail()}
            </Typography>
          </Box>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleThemeToggle}>
          <ListItemIcon>
            {isDarkMode ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
          </ListItemIcon>
          <ListItemText primary={isDarkMode ? 'Light Mode' : 'Dark Mode'} />
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleProfileLogout} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" sx={{ color: 'error.main' }} />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </MenuItem>
      </Menu>
    </Drawer>
  );
}

export default Sidebar;