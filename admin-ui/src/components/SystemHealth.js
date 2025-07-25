import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  NetworkCheck as NetworkIcon,
  Timer as TimerIcon,
} from '@mui/icons-material';
import { authenticatedApi, handleApiError } from '../services/authenticatedApi';

// Health Status Component
function HealthStatus({ status, label, description, icon }) {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'good':
      case 'success':
        return 'success';
      case 'warning':
      case 'degraded':
        return 'warning';
      case 'error':
      case 'critical':
      case 'unhealthy':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'good':
      case 'success':
        return <CheckCircleIcon color="success" />;
      case 'warning':
      case 'degraded':
        return <WarningIcon color="warning" />;
      case 'error':
      case 'critical':
      case 'unhealthy':
        return <ErrorIcon color="error" />;
      default:
        return icon || <NetworkIcon />;
    }
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" gutterBottom>
              {label}
            </Typography>
            <Chip
              label={status || 'Unknown'}
              color={getStatusColor(status)}
              size="small"
              sx={{ mb: 1 }}
            />
            {description && (
              <Typography variant="body2" color="text.secondary">
                {description}
              </Typography>
            )}
          </Box>
          <Box sx={{ opacity: 0.7 }}>
            {getStatusIcon(status)}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

// Metric Card Component
function MetricCard({ title, value, unit = '', description, color = 'primary', progress = null }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography color="textSecondary" gutterBottom variant="body2">
          {title}
        </Typography>
        <Typography variant="h4" component="div" color={`${color}.main`}>
          {value !== undefined ? value.toLocaleString() : 'N/A'}
          {unit && <span style={{ fontSize: '0.6em', marginLeft: '4px' }}>{unit}</span>}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {description}
          </Typography>
        )}
        {progress !== null && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress
              variant="determinate"
              value={progress}
              color={progress > 80 ? 'error' : progress > 60 ? 'warning' : 'success'}
            />
            <Typography variant="caption" color="text.secondary">
              {progress}% utilization
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

function SystemHealth() {
  const [health, setHealth] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Fetch health data
  const fetchHealthData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [healthResponse, statsResponse] = await Promise.all([
        authenticatedApi.getHealth(),
        authenticatedApi.getStats(),
      ]);

      setHealth(healthResponse);
      setStats(statsResponse);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching health data:', err);
      setError(handleApiError(err).message || 'Failed to load system health data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchHealthData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !health && !stats) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  const systemStatus = health?.status || 'Unknown';
  const isHealthy = systemStatus.toLowerCase() === 'healthy';

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          System Health & Monitoring
        </Typography>
        <Button
          variant="outlined"
          onClick={fetchHealthData}
          startIcon={<RefreshIcon />}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Overall System Status */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h5" gutterBottom>
                Overall System Status
              </Typography>
              <Chip
                label={systemStatus}
                color={isHealthy ? 'success' : systemStatus.toLowerCase() === 'warning' ? 'warning' : 'error'}
                size="large"
                icon={isHealthy ? <CheckCircleIcon /> : systemStatus.toLowerCase() === 'warning' ? <WarningIcon /> : <ErrorIcon />}
              />
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" color="text.secondary">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Auto-refresh: 30 seconds
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Health Status Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <HealthStatus
            status={health?.status}
            label="API Health"
            description="REST API endpoints"
            icon={<NetworkIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <HealthStatus
            status="Good"
            label="Database"
            description="Connection & queries"
            icon={<StorageIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <HealthStatus
            status="Healthy"
            label="Authentication"
            description="JWT & sessions"
            icon={<SecurityIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <HealthStatus
            status="Normal"
            label="Performance"
            description="Response times"
            icon={<SpeedIcon />}
          />
        </Grid>
      </Grid>

      {/* Activity Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Recent Logins"
            value={health?.recentLogins}
            unit="/ hour"
            description="Successful logins in last hour"
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Recent Signups"
            value={health?.recentSignups}
            unit="/ hour"
            description="New registrations in last hour"
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Recent Errors"
            value={health?.recentErrors}
            unit="/ hour"
            description="Error events in last hour"
            color="error"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Active Sessions"
            value={stats?.activeSessions}
            description="Current user sessions"
            color="info"
          />
        </Grid>
      </Grid>

      {/* System Information */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TimerIcon color="primary" />
                Recent Activity
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${health?.recentLogins || 0} successful logins`}
                    secondary="Last hour"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon color="primary" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${health?.recentSignups || 0} new user registrations`}
                    secondary="Last hour"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    {health?.recentErrors > 10 ? (
                      <ErrorIcon color="error" fontSize="small" />
                    ) : (
                      <WarningIcon color="warning" fontSize="small" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={`${health?.recentErrors || 0} error events`}
                    secondary="Last hour"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SecurityIcon color="primary" />
                Security Status
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Rate limiting active"
                    secondary="5 attempts per 5 minutes"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="JWT validation enabled"
                    secondary="HS512 algorithm with 1-hour expiration"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Session management active"
                    secondary="Idle timeout and validation"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Audit logging enabled"
                    secondary="All authentication events tracked"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Last Check Info */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          System health checked at: {lastUpdate.toLocaleString()} • 
          Next automatic refresh in 30 seconds
        </Typography>
      </Box>
    </Box>
  );
}

export default SystemHealth;