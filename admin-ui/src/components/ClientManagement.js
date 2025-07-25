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
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  CircularProgress,
  Paper,
  Snackbar,
} from '@mui/material';
import {
  Edit as EditIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  VpnKey as KeyIcon,
  Add as AddIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { authenticatedApi, handleApiError } from '../services/authenticatedApi';

function ClientManagement() {
  const [clients, setClients] = useState([]);
  const [totalClients, setTotalClients] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [selectedClient, setSelectedClient] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [actionLoading, setActionLoading] = useState(false);
  
  // New client registration states
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [newClientData, setNewClientData] = useState({
    name: '',
    description: '',
    idleTimeoutMinutes: 30,
  });
  const [registeredClient, setRegisteredClient] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  // Fetch clients
  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await authenticatedApi.getClients({ page, size: rowsPerPage });
      setClients(response.content || []);
      setTotalClients(response.totalElements || 0);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError(handleApiError(err).message || 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  // Fetch client details
  const fetchClientDetails = async (clientId) => {
    try {
      setActionLoading(true);
      const response = await authenticatedApi.getClientById(clientId);
      setSelectedClient(response);
      setEditData({
        description: response.description || '',
        idleTimeoutMinutes: response.idleTimeOut || 30,
      });
      setDialogOpen(true);
    } catch (err) {
      console.error('Error fetching client details:', err);
      setError(handleApiError(err).message || 'Failed to load client details');
    } finally {
      setActionLoading(false);
    }
  };

  // Update client
  const updateClient = async () => {
    try {
      setActionLoading(true);
      setError(null);

      await authenticatedApi.updateClient(selectedClient.clientId, {
        description: editData.description,
        idleTimeoutMinutes: parseInt(editData.idleTimeoutMinutes) || 30,
      });

      // Refresh client details
      const response = await authenticatedApi.getClientById(selectedClient.clientId);
      setSelectedClient(response);
      setEditMode(false);
      setSuccess('Client updated successfully');
      
      // Refresh clients list
      fetchClients();
    } catch (err) {
      console.error('Error updating client:', err);
      setError(handleApiError(err).message || 'Failed to update client');
    } finally {
      setActionLoading(false);
    }
  };

  // Rotate client key
  const rotateClientKey = async (clientId) => {
    if (!window.confirm('Are you sure you want to rotate the client key? This will invalidate the current key immediately.')) {
      return;
    }

    try {
      setActionLoading(true);
      setError(null);

      const response = await authenticatedApi.rotateClientKey(clientId);
      
      // Update selected client with new key if dialog is open
      if (selectedClient && selectedClient.clientId === clientId) {
        setSelectedClient(prev => ({
          ...prev,
          clientKey: response.newClientKey,
          updatedAt: response.timestamp
        }));
      }
      
      setSuccess(`Client key rotated successfully! New key: ${response.newClientKey.substring(0, 12)}...`);
      
      // Refresh clients list
      fetchClients();
    } catch (err) {
      console.error('Error rotating client key:', err);
      setError(handleApiError(err).message || 'Failed to rotate client key');
    } finally {
      setActionLoading(false);
    }
  };

  // Register new client
  const registerClient = async () => {
    try {
      setActionLoading(true);
      setError(null);

      const response = await authenticatedApi.registerClient({
        name: newClientData.name,
        description: newClientData.description,
        idleTimeoutMinutes: parseInt(newClientData.idleTimeoutMinutes) || 30,
      });

      setRegisteredClient(response);
      setSuccess('Client registered successfully!');
      
      // Don't close dialog to show credentials
      // Reset form for next registration
      setNewClientData({
        name: '',
        description: '',
        idleTimeoutMinutes: 30,
      });
      
      // Refresh clients list
      fetchClients();
    } catch (err) {
      console.error('Error registering client:', err);
      setError(handleApiError(err).message || 'Failed to register client');
    } finally {
      setActionLoading(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [page, rowsPerPage]);

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
    setSelectedClient(null);
    setEditMode(false);
    setEditData({});
    setSuccess(null);
  };

  // Handle edit data change
  const handleEditChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Client Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Button
                variant="outlined"
                onClick={fetchClients}
                startIcon={<RefreshIcon />}
                disabled={loading}
              >
                Refresh
              </Button>
              <Typography variant="body2" color="text.secondary">
                Total clients: {totalClients}
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setRegisterDialogOpen(true)}
              startIcon={<AddIcon />}
              disabled={loading}
            >
              Add New Client
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell>Client ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Idle Timeout</TableCell>
                  <TableCell>Created At</TableCell>
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
                ) : clients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                      <Typography color="text.secondary">No clients found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  clients.map((client) => (
                    <TableRow key={client.id} hover>
                      <TableCell>
                        <Chip
                          label={client.clientId}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ fontFamily: 'monospace' }}
                        />
                      </TableCell>
                      <TableCell>{client.name || 'N/A'}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {client.description || 'No description'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${client.idleTimeOut || 30} min`}
                          size="small"
                          color="default"
                        />
                      </TableCell>
                      <TableCell>
                        {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() => fetchClientDetails(client.clientId)}
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

          {!loading && clients.length > 0 && (
            <TablePagination
              rowsPerPageOptions={[10, 20, 50]}
              component="div"
              count={totalClients}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          )}
        </CardContent>
      </Card>

      {/* Client Details Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Client Details
          {selectedClient && ` - ${selectedClient.clientId}`}
          {!editMode && (
            <IconButton
              onClick={() => setEditMode(true)}
              sx={{ ml: 1 }}
              size="small"
              color="primary"
            >
              <EditIcon />
            </IconButton>
          )}
        </DialogTitle>
        <DialogContent>
          {selectedClient && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
                <TextField
                  label="Client ID"
                  value={selectedClient.clientId}
                  InputProps={{ readOnly: true }}
                  variant="outlined"
                  size="small"
                />
                <TextField
                  label="Name"
                  value={selectedClient.name || 'N/A'}
                  InputProps={{ readOnly: true }}
                  variant="outlined"
                  size="small"
                />
                <TextField
                  label="Client Key"
                  value={selectedClient.clientKey ? '••••••••••••••••' : 'N/A'}
                  InputProps={{ readOnly: true }}
                  variant="outlined"
                  size="small"
                  type="password"
                />
                <TextField
                  label="Created At"
                  value={selectedClient.createdAt ? new Date(selectedClient.createdAt).toLocaleString() : 'N/A'}
                  InputProps={{ readOnly: true }}
                  variant="outlined"
                  size="small"
                />
              </Box>

              <TextField
                label="Description"
                value={editMode ? editData.description : (selectedClient.description || 'No description')}
                onChange={(e) => handleEditChange('description', e.target.value)}
                InputProps={{ readOnly: !editMode }}
                variant="outlined"
                size="small"
                fullWidth
                multiline
                rows={3}
                sx={{ mb: 2 }}
              />

              <TextField
                label="Idle Timeout (minutes)"
                value={editMode ? editData.idleTimeoutMinutes : (selectedClient.idleTimeOut || 30)}
                onChange={(e) => handleEditChange('idleTimeoutMinutes', e.target.value)}
                InputProps={{ readOnly: !editMode }}
                variant="outlined"
                size="small"
                type="number"
                fullWidth
                helperText="Session idle timeout in minutes"
              />

              {/* Security Information Panel */}
              <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <KeyIcon color="primary" />
                  Security Information
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField
                    label="Key Strength"
                    value="256-bit Base64 Encoded"
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                    size="small"
                  />
                  <TextField
                    label="Key Length"
                    value={`${selectedClient.clientKey ? selectedClient.clientKey.length : 0} characters`}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                    size="small"
                  />
                  <TextField
                    label="Encryption Algorithm"
                    value="SecureRandom + Base64"
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                    size="small"
                  />
                  <TextField
                    label="Last Updated"
                    value={selectedClient.updatedAt ? new Date(selectedClient.updatedAt).toLocaleString() : 'Never'}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                    size="small"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  This client key uses 256 bits of cryptographically secure random data, URL-safe Base64 encoded without padding. 
                  Regular key rotation is recommended for enhanced security.
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {editMode ? (
            <>
              <Button
                onClick={() => setEditMode(false)}
                startIcon={<CancelIcon />}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={updateClient}
                startIcon={<SaveIcon />}
                variant="contained"
                disabled={actionLoading}
              >
                {actionLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => rotateClientKey(selectedClient.clientId)}
                startIcon={<KeyIcon />}
                variant="outlined"
                color="warning"
                disabled={actionLoading}
                sx={{ mr: 1 }}
              >
                {actionLoading ? 'Rotating...' : 'Rotate Key'}
              </Button>
              <Button onClick={handleCloseDialog}>Close</Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Client Registration Dialog */}
      <Dialog 
        open={registerDialogOpen} 
        onClose={() => {
          setRegisterDialogOpen(false);
          setRegisteredClient(null);
          setNewClientData({
            name: '',
            description: '',
            idleTimeoutMinutes: 30,
          });
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {registeredClient ? 'Client Registered Successfully' : 'Register New Client'}
        </DialogTitle>
        <DialogContent>
          {registeredClient ? (
            <Box sx={{ mt: 2 }}>
              <Alert severity="success" sx={{ mb: 3 }}>
                Client registered successfully! Please save these credentials securely. 
                The client key cannot be retrieved again.
              </Alert>
              
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Client ID</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace', flex: 1 }}>
                    {registeredClient.clientId}
                  </Typography>
                  <IconButton 
                    size="small" 
                    onClick={() => copyToClipboard(registeredClient.clientId, 'clientId')}
                    color={copiedField === 'clientId' ? 'success' : 'default'}
                  >
                    <CopyIcon />
                  </IconButton>
                </Box>
              </Paper>
              
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Client Key</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontFamily: 'monospace', 
                      flex: 1,
                      wordBreak: 'break-all',
                      fontSize: '0.875rem',
                    }}
                  >
                    {registeredClient.clientKey}
                  </Typography>
                  <IconButton 
                    size="small" 
                    onClick={() => copyToClipboard(registeredClient.clientKey, 'clientKey')}
                    color={copiedField === 'clientKey' ? 'success' : 'default'}
                  >
                    <CopyIcon />
                  </IconButton>
                </Box>
              </Paper>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Key Strength: {registeredClient.keyStrength}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Client Name"
                value={newClientData.name}
                onChange={(e) => setNewClientData(prev => ({ ...prev, name: e.target.value }))}
                required
                margin="normal"
                helperText="A unique name for the client application"
              />
              
              <TextField
                fullWidth
                label="Description"
                value={newClientData.description}
                onChange={(e) => setNewClientData(prev => ({ ...prev, description: e.target.value }))}
                margin="normal"
                multiline
                rows={2}
                helperText="Optional description of the client application"
              />
              
              <TextField
                fullWidth
                label="Idle Timeout (minutes)"
                type="number"
                value={newClientData.idleTimeoutMinutes}
                onChange={(e) => setNewClientData(prev => ({ ...prev, idleTimeoutMinutes: e.target.value }))}
                margin="normal"
                helperText="Session idle timeout in minutes (default: 30)"
                InputProps={{ inputProps: { min: 1, max: 1440 } }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {registeredClient ? (
            <>
              <Button 
                onClick={() => {
                  setRegisteredClient(null);
                  setNewClientData({
                    name: '',
                    description: '',
                    idleTimeoutMinutes: 30,
                  });
                }}
                startIcon={<AddIcon />}
              >
                Register Another
              </Button>
              <Button 
                onClick={() => {
                  setRegisterDialogOpen(false);
                  setRegisteredClient(null);
                }}
                variant="contained"
              >
                Done
              </Button>
            </>
          ) : (
            <>
              <Button 
                onClick={() => {
                  setRegisterDialogOpen(false);
                  setNewClientData({
                    name: '',
                    description: '',
                    idleTimeoutMinutes: 30,
                  });
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={registerClient}
                variant="contained"
                disabled={!newClientData.name || actionLoading}
                startIcon={actionLoading ? <CircularProgress size={20} /> : null}
              >
                Register Client
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar for copy feedback */}
      <Snackbar
        open={copiedField !== null}
        autoHideDuration={2000}
        onClose={() => setCopiedField(null)}
        message={`Copied ${copiedField === 'clientId' ? 'Client ID' : 'Client Key'} to clipboard`}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}

export default ClientManagement;