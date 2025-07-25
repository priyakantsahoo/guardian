/**
 * Authenticated API service for Guardian Admin UI
 * Handles API calls with JWT authentication
 */

import { toast } from 'sonner';
import { isTokenExpired } from '../utils/tokenUtils';

// Base configuration
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';

// Flag to prevent multiple logout notifications
let isLoggingOut = false;

/**
 * Make authenticated API request
 */
/**
 * Handle token expiration and logout
 */
function handleTokenExpiration() {
  if (isLoggingOut) return;
  
  isLoggingOut = true;
  
  // Clear token
  localStorage.removeItem('guardianAuthToken');
  
  // Show notification
  toast.error('Your session has expired. Please log in again.', {
    duration: 5000,
    position: 'top-center'
  });
  
  // Redirect to login after a short delay to let the toast show
  setTimeout(() => {
    window.location.href = '/login';
    isLoggingOut = false;
  }, 1000);
}

async function makeAuthenticatedRequest(endpoint, options = {}) {
  const token = localStorage.getItem('guardianAuthToken');
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  // Check if token is expired before making request
  if (isTokenExpired(token)) {
    handleTokenExpiration();
    throw new Error('Token expired');
  }

  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || '60';
      throw new Error(`Rate limited. Please try again in ${retryAfter} seconds.`);
    }

    // Handle authentication errors
    if (response.status === 401) {
      // Token is invalid or expired
      handleTokenExpiration();
      throw new Error('Authentication expired. Please log in again.');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    // Handle text responses
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return await response.json();
    } else {
      return await response.text();
    }
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

/**
 * API endpoints using JWT authentication
 */
export const authenticatedApi = {
  // Dashboard stats
  async getStats() {
    return makeAuthenticatedRequest('/api/admin/stats');
  },

  // System health
  async getHealth() {
    return makeAuthenticatedRequest('/api/admin/health');
  },

  // User management
  async getUsers(params = {}) {
    // Filter out undefined values
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== undefined && value !== null && value !== '')
    );
    const queryString = new URLSearchParams(filteredParams).toString();
    return makeAuthenticatedRequest(`/api/admin/users${queryString ? '?' + queryString : ''}`);
  },

  async getUserById(userId) {
    return makeAuthenticatedRequest(`/api/admin/users/${userId}`);
  },

  async getUserSessions(userId) {
    return makeAuthenticatedRequest(`/api/admin/users/${userId}/sessions`);
  },

  async getCurrentUserProfile() {
    return makeAuthenticatedRequest('/api/auth/me');
  },

  async deactivateUserSessions(userId) {
    return makeAuthenticatedRequest(`/api/admin/users/${userId}/sessions`, {
      method: 'DELETE',
    });
  },

  async searchUsers(query, limit = 10) {
    return makeAuthenticatedRequest(`/api/admin/users/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  },

  // Client management
  async getClients(params = {}) {
    // Filter out undefined values
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== undefined && value !== null && value !== '')
    );
    const queryString = new URLSearchParams(filteredParams).toString();
    return makeAuthenticatedRequest(`/api/admin/clients${queryString ? '?' + queryString : ''}`);
  },

  async getClientById(clientId) {
    return makeAuthenticatedRequest(`/api/admin/clients/${clientId}`);
  },

  async updateClient(clientId, data) {
    return makeAuthenticatedRequest(`/api/admin/clients/${clientId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async rotateClientKey(clientId) {
    return makeAuthenticatedRequest(`/api/admin/clients/${clientId}/rotate-key`, {
      method: 'POST',
    });
  },

  // Audit logs
  async getAuditLogs(params = {}) {
    // Filter out undefined values
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== undefined && value !== null && value !== '')
    );
    const queryString = new URLSearchParams(filteredParams).toString();
    return makeAuthenticatedRequest(`/api/admin/logs${queryString ? '?' + queryString : ''}`);
  },

  // Client registration (still uses legacy auth for now)
  async registerClient(clientData) {
    const token = localStorage.getItem('adminToken'); // Legacy token
    
    if (!token) {
      throw new Error('Admin authentication required');
    }

    const response = await fetch(`${BASE_URL}/api/clients/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Token': token,
      },
      body: JSON.stringify(clientData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to register client');
    }

    return await response.json();
  },
};

/**
 * Error handler for API calls
 */
export function handleApiError(error) {
  console.error('API Error:', error);
  
  if (error.message.includes('Rate limited')) {
    return {
      type: 'warning',
      message: error.message,
    };
  }
  
  if (error.message.includes('Authentication expired')) {
    return {
      type: 'error',
      message: 'Your session has expired. Please log in again.',
    };
  }
  
  if (error.message.includes('Network')) {
    return {
      type: 'error',
      message: 'Network error. Please check your connection and try again.',
    };
  }
  
  return {
    type: 'error',
    message: error.message || 'An unexpected error occurred. Please try again.',
  };
}

/**
 * Legacy API with token-based auth (for backward compatibility)
 */
export const legacyApi = {
  async makeRequest(endpoint, options = {}) {
    const token = localStorage.getItem('adminToken');
    
    if (!token) {
      throw new Error('Admin authentication required');
    }

    const url = `${BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Token': token,
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return await response.json();
    } else {
      return await response.text();
    }
  },
};

export default authenticatedApi;