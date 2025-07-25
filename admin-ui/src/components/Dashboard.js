import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import {
  People as PeopleIcon,
  Business as BusinessIcon,
  VpnKey as SessionIcon,
  Assignment as LogsIcon,
  TrendingUp as TrendingUpIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { authenticatedApi, handleApiError } from '../services/authenticatedApi';
import { useAuth } from '../contexts/AuthContext';

// Stat Card Component
function StatCard({ title, value, icon, color = 'primary', subtitle = null, trend = null }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div" color={`${color}.main`}>
              {value?.toLocaleString() || '0'}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
                <Typography variant="caption" color="success.main">
                  {trend}
                </Typography>
              </Box>
            )}
          </Box>
          <Box sx={{ color: `${color}.main`, opacity: 0.7 }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

// Chart Component
function ActivityChart({ data, title }) {
  if (!data || data.length === 0) {
    return (
      <Card sx={{ height: 300 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <Typography color="text.secondary">No data available</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: 300 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#1976d2" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Event Types Chart Component
function EventTypesChart({ data }) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <Card sx={{ height: 300 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Events
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <Typography color="text.secondary">No events recorded</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const chartData = Object.entries(data).map(([event, count]) => ({
    event: event.replace('_', ' '),
    count,
  }));

  return (
    <Card sx={{ height: 300 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Recent Events (Last 7 Days)
        </Typography>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="event" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#1976d2" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!isAuthenticated) return;
      
      try {
        setLoading(true);
        setError(null);

        const [statsResponse, healthResponse] = await Promise.all([
          authenticatedApi.getStats(),
          authenticatedApi.getHealth(),
        ]);

        setStats(statsResponse);
        setHealth(healthResponse);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(handleApiError(err, 'Failed to load dashboard data'));
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Refresh data every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  // Transform data for charts
  const loginData = stats?.loginsByDay ? Object.entries(stats.loginsByDay).map(([date, count]) => ({
    date,
    count,
  })) : [];

  const signupData = stats?.signupsByDay ? Object.entries(stats.signupsByDay).map(([date, count]) => ({
    date,
    count,
  })) : [];

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Dashboard Overview
      </Typography>

      {/* System Health Status */}
      {health && (
        <Box sx={{ mb: 3 }}>
          <Chip
            icon={<SecurityIcon />}
            label={`System Status: ${health.status || 'Unknown'}`}
            color={health.status === 'HEALTHY' ? 'success' : health.status === 'WARNING' ? 'warning' : 'error'}
            sx={{ mr: 2 }}
          />
          <Chip
            label={`Recent Errors: ${health.recentErrors || 0}`}
            color={health.recentErrors > 10 ? 'error' : 'default'}
          />
        </Box>
      )}

      {/* Main Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={stats?.totalUsers}
            icon={<PeopleIcon sx={{ fontSize: 40 }} />}
            color="primary"
            subtitle="Registered users"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Clients"
            value={stats?.totalClients}
            icon={<BusinessIcon sx={{ fontSize: 40 }} />}
            color="secondary"
            subtitle="Client applications"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Sessions"
            value={stats?.activeSessions}
            icon={<SessionIcon sx={{ fontSize: 40 }} />}
            color="success"
            subtitle="Current user sessions"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Audit Logs"
            value={stats?.totalAuditLogs}
            icon={<LogsIcon sx={{ fontSize: 40 }} />}
            color="warning"
            subtitle="Total log entries"
          />
        </Grid>
      </Grid>

      {/* Activity Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <ActivityChart data={loginData} title="Login Activity (Last 7 Days)" />
        </Grid>
        <Grid item xs={12} md={6}>
          <ActivityChart data={signupData} title="Signup Activity (Last 7 Days)" />
        </Grid>
      </Grid>

      {/* Event Types and Users by Client */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <EventTypesChart data={stats?.auditEventTypes} />
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: 300 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Users by Client
              </Typography>
              {stats?.usersByClient && Object.keys(stats.usersByClient).length > 0 ? (
                <Box sx={{ mt: 2 }}>
                  {Object.entries(stats.usersByClient).map(([clientId, count]) => (
                    <Box key={clientId} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="body2">{clientId}</Typography>
                      <Typography variant="body2" fontWeight="bold" color="primary.main">
                        {count} users
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                  <Typography color="text.secondary">No client data available</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Refresh Info */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Data refreshes every 30 seconds • Last updated: {new Date().toLocaleTimeString()}
        </Typography>
      </Box>
    </Box>
  );
}

export default Dashboard;