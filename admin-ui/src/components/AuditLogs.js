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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { authenticatedApi, handleApiError } from '../services/authenticatedApi';

const EVENT_TYPES = [
  'LOGIN_SUCCESS',
  'LOGIN_FAILURE',
  'SIGNUP_SUCCESS',
  'SIGNUP_FAILURE',
  'TOKEN_VALIDATION',
  'CLIENT_REGISTRATION',
];

const STATUS_COLORS = {
  200: 'success',
  201: 'success',
  400: 'warning',
  401: 'error',
  403: 'error',
  404: 'warning',
  429: 'warning',
  500: 'error',
};

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [selectedEventType, setSelectedEventType] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch audit logs
  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await authenticatedApi.getAuditLogs({
        page,
        size: rowsPerPage,
        eventType: selectedEventType || undefined,
        clientId: selectedClientId || undefined
      });
      
      setLogs(response.content || []);
      setTotalLogs(response.totalElements || 0);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError(handleApiError(err).message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, rowsPerPage, selectedEventType, selectedClientId]);

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Clear filters
  const clearFilters = () => {
    setSelectedEventType('');
    setSelectedClientId('');
    setPage(0);
  };

  // Show log details
  const showLogDetails = (log) => {
    setSelectedLog(log);
    setDialogOpen(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedLog(null);
  };

  // Get status chip color
  const getStatusColor = (status) => {
    return STATUS_COLORS[status] || 'default';
  };

  // Format event type for display
  const formatEventType = (eventType) => {
    return eventType.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Audit Logs
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filter Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Event Type</InputLabel>
                <Select
                  value={selectedEventType}
                  onChange={(e) => setSelectedEventType(e.target.value)}
                  label="Event Type"
                >
                  <MenuItem value="">All Events</MenuItem>
                  {EVENT_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>
                      {formatEventType(type)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                label="Client ID"
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                size="small"
                fullWidth
                placeholder="Filter by client ID..."
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  onClick={fetchLogs}
                  startIcon={<RefreshIcon />}
                  disabled={loading}
                  size="small"
                >
                  Refresh
                </Button>
                <Button
                  variant="outlined"
                  onClick={clearFilters}
                  startIcon={<ClearIcon />}
                  size="small"
                >
                  Clear Filters
                </Button>
              </Box>
            </Grid>
          </Grid>
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Total logs: {totalLogs.toLocaleString()}
            {(selectedEventType || selectedClientId) && ' (filtered)'}
          </Typography>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Event</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell>IP Address</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Location</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                      <Typography color="text.secondary">
                        {selectedEventType || selectedClientId ? 'No logs found matching filters' : 'No audit logs found'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow
                      key={log.id}
                      hover
                      onClick={() => showLogDetails(log)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={formatEventType(log.eventType)}
                          size="small"
                          color={log.eventType.includes('SUCCESS') ? 'success' : 'error'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {log.userEmail || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.clientId || 'N/A'}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {log.ipAddress || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.responseStatus || 'N/A'}
                          size="small"
                          color={getStatusColor(log.responseStatus)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                          {log.geoCity && log.geoCountry
                            ? `${log.geoCity}, ${log.geoCountry}`
                            : 'Unknown'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {!loading && logs.length > 0 && (
            <TablePagination
              rowsPerPageOptions={[25, 50, 100]}
              component="div"
              count={totalLogs}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          )}
        </CardContent>
      </Card>

      {/* Log Details Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Audit Log Details
        </DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Event Type"
                    value={formatEventType(selectedLog.eventType)}
                    InputProps={{ readOnly: true }}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Timestamp"
                    value={selectedLog.timestamp ? new Date(selectedLog.timestamp).toLocaleString() : 'N/A'}
                    InputProps={{ readOnly: true }}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="User Email"
                    value={selectedLog.userEmail || 'N/A'}
                    InputProps={{ readOnly: true }}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Client ID"
                    value={selectedLog.clientId || 'N/A'}
                    InputProps={{ readOnly: true }}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="IP Address"
                    value={selectedLog.ipAddress || 'N/A'}
                    InputProps={{ readOnly: true }}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Response Status"
                    value={selectedLog.responseStatus || 'N/A'}
                    InputProps={{ readOnly: true }}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Request Method"
                    value={selectedLog.requestMethod || 'N/A'}
                    InputProps={{ readOnly: true }}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Endpoint"
                    value={selectedLog.endpoint || 'N/A'}
                    InputProps={{ readOnly: true }}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Location"
                    value={
                      selectedLog.geoCity && selectedLog.geoCountry
                        ? `${selectedLog.geoCity}, ${selectedLog.geoCountry}`
                        : 'Unknown'
                    }
                    InputProps={{ readOnly: true }}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Session ID"
                    value={selectedLog.sessionId || 'N/A'}
                    InputProps={{ readOnly: true }}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Request ID"
                    value={selectedLog.requestId || 'N/A'}
                    InputProps={{ readOnly: true }}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Error Code"
                    value={selectedLog.errorCode || 'N/A'}
                    InputProps={{ readOnly: true }}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="User Agent"
                    value={selectedLog.userAgent || 'N/A'}
                    InputProps={{ readOnly: true }}
                    fullWidth
                    size="small"
                    multiline
                    rows={2}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AuditLogs;