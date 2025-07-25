import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  CircularProgress,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  Block as BlockIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { authenticatedApi, handleApiError } from '../services/authenticatedApi';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userSessions, setUserSessions] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      if (searchTerm.trim()) {
        response = await authenticatedApi.searchUsers(searchTerm, 50);
        setUsers(response || []);
        setTotalUsers(response?.length || 0);
      } else {
        response = await authenticatedApi.getUsers({ page, size: rowsPerPage, sortBy: 'createdAt', clientId: selectedClient || undefined });
        setUsers(response.content || []);
        setTotalUsers(response.totalElements || 0);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(handleApiError(err).message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Fetch user details and sessions
  const fetchUserDetails = async (userId) => {
    try {
      setActionLoading(true);
      const [userResponse, sessionsResponse] = await Promise.all([
        authenticatedApi.getUserById(userId),
        authenticatedApi.getUserSessions(userId),
      ]);
      
      setSelectedUser(userResponse);
      setUserSessions(sessionsResponse);
      setDialogOpen(true);
    } catch (err) {
      console.error('Error fetching user details:', err);
      setError(handleApiError(err).message || 'Failed to load user details');
    } finally {
      setActionLoading(false);
    }
  };

  // Deactivate user sessions
  const deactivateUserSessions = async (userId) => {
    try {
      setActionLoading(true);
      await authenticatedApi.deactivateUserSessions(userId);
      
      // Refresh user sessions
      const sessionsResponse = await authenticatedApi.getUserSessions(userId);
      setUserSessions(sessionsResponse);
      
      // Show success message
      setError(null);
    } catch (err) {
      console.error('Error deactivating sessions:', err);
      setError(handleApiError(err).message || 'Failed to deactivate sessions');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, rowsPerPage, selectedClient]);

  // Handle search
  const handleSearch = () => {
    setPage(0);
    fetchUsers();
  };

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedUser(null);
    setUserSessions([]);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        User Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Search and Filter Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              placeholder="Search users by email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ flexGrow: 1, minWidth: 300 }}
            />
            
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Client Filter</InputLabel>
              <Select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                label="Client Filter"
              >
                <MenuItem value="">All Clients</MenuItem>
                {/* Add client options dynamically based on available clients */}
              </Select>
            </FormControl>
            
            <Button
              variant="contained"
              onClick={handleSearch}
              startIcon={<SearchIcon />}
            >
              Search
            </Button>
            
            <Button
              variant="outlined"
              onClick={fetchUsers}
              startIcon={<RefreshIcon />}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell>User ID</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Client ID</TableCell>
                  <TableCell>Active Sessions</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                      <Typography color="text.secondary">
                        {searchTerm ? 'No users found matching your search' : 'No users found'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>{user.id}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {user.firstName && user.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.clientId}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.activeSessions || 0}
                          size="small"
                          color={user.activeSessions > 0 ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() => fetchUserDetails(user.id)}
                          disabled={actionLoading}
                          size="small"
                          color="primary"
                        >
                          <ViewIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {!loading && users.length > 0 && (
            <TablePagination
              rowsPerPageOptions={[10, 20, 50]}
              component="div"
              count={totalUsers}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          )}
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          User Details
          {selectedUser && ` - ${selectedUser.email}`}
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                User Information
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
                <TextField
                  label="User ID"
                  value={selectedUser.id}
                  InputProps={{ readOnly: true }}
                  variant="outlined"
                  size="small"
                />
                <TextField
                  label="Email"
                  value={selectedUser.email}
                  InputProps={{ readOnly: true }}
                  variant="outlined"
                  size="small"
                />
                <TextField
                  label="First Name"
                  value={selectedUser.firstName || 'N/A'}
                  InputProps={{ readOnly: true }}
                  variant="outlined"
                  size="small"
                />
                <TextField
                  label="Last Name"
                  value={selectedUser.lastName || 'N/A'}
                  InputProps={{ readOnly: true }}
                  variant="outlined"
                  size="small"
                />
                <TextField
                  label="Client ID"
                  value={selectedUser.clientId}
                  InputProps={{ readOnly: true }}
                  variant="outlined"
                  size="small"
                />
                <TextField
                  label="Active Sessions"
                  value={selectedUser.activeSessions || 0}
                  InputProps={{ readOnly: true }}
                  variant="outlined"
                  size="small"
                />
              </Box>

              <Typography variant="h6" gutterBottom>
                Active Sessions ({userSessions.length})
              </Typography>
              {userSessions.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Session ID</TableCell>
                        <TableCell>IP Address</TableCell>
                        <TableCell>User Agent</TableCell>
                        <TableCell>Created At</TableCell>
                        <TableCell>Last Accessed</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {userSessions.map((session) => (
                        <TableRow key={session.sessionId}>
                          <TableCell>
                            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                              {session.sessionId.substring(0, 8)}...
                            </Typography>
                          </TableCell>
                          <TableCell>{session.ipAddress}</TableCell>
                          <TableCell>
                            <Typography variant="caption">
                              {session.userAgent ? session.userAgent.substring(0, 50) + '...' : 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {session.createdAt ? new Date(session.createdAt).toLocaleString() : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {session.lastAccessedAt ? new Date(session.lastAccessedAt).toLocaleString() : 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary">No active sessions</Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {selectedUser && userSessions.length > 0 && (
            <Button
              onClick={() => deactivateUserSessions(selectedUser.id)}
              disabled={actionLoading}
              startIcon={<BlockIcon />}
              color="error"
              variant="outlined"
            >
              {actionLoading ? 'Deactivating...' : 'Deactivate All Sessions'}
            </Button>
          )}
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default UserManagement;