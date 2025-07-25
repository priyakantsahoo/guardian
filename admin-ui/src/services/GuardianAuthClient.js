/**
 * Guardian Authentication Client for Admin UI
 * Handles authentication with the Guardian Auth Service
 */
class GuardianAuthClient {
  constructor({ baseUrl, clientId, clientKey }) {
    this.baseUrl = baseUrl.replace(/\/+$/, ''); // Remove trailing slashes
    this.clientId = clientId;
    this.clientKey = clientKey;
    this.token = localStorage.getItem('guardianAuthToken');
    this.user = null;
    
    // Check if we have a valid token on initialization
    if (this.token) {
      this.validateTokenSilently();
    }
  }

  /**
   * Get headers for Guardian Auth API requests
   */
  getHeaders(skipAuth = false) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (!skipAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Make authenticated request to Guardian Auth API
   */
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(options.skipAuth),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || '60';
        throw new Error(`Rate limited. Please try again in ${retryAfter} seconds.`);
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      // Handle text responses (like JWT tokens)
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text();
      }
    } catch (error) {
      console.error(`Guardian Auth API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  /**
   * Create admin user account
   */
  async signup(email, password, firstName, lastName) {
    try {
      const response = await this.makeRequest('/api/auth/signup', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
        }),
      });

      // Extract token from response
      const token = response.token || response;
      this.setToken(token);
      await this.loadUserInfo();
      return token;
    } catch (error) {
      throw new Error(`Signup failed: ${error.message}`);
    }
  }

  /**
   * Login admin user
   */
  async login(email, password) {
    try {
      const response = await this.makeRequest('/api/auth/login', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({
          email,
          password,
        }),
      });

      // Extract token from response
      const token = response.token || response;
      this.setToken(token);
      await this.loadUserInfo();
      return token;
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  /**
   * Validate current token
   */
  async validateToken(token = null) {
    const tokenToValidate = token || this.token;
    if (!tokenToValidate) {
      throw new Error('No token to validate');
    }

    try {
      const response = await this.makeRequest('/api/auth/validate', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({
          token: tokenToValidate,
        }),
      });

      return response;
    } catch (error) {
      // If token validation fails, clear stored token
      if (!token) {
        this.logout();
      }
      throw new Error(`Token validation failed: ${error.message}`);
    }
  }

  /**
   * Validate token silently (for initialization)
   */
  async validateTokenSilently() {
    try {
      const validation = await this.validateToken();
      if (validation.valid) {
        this.user = {
          userId: validation.userId,
          clientId: validation.clientId,
          sessionId: validation.sessionId,
        };
        return true;
      }
    } catch (error) {
      console.warn('Silent token validation failed:', error.message);
      this.logout();
    }
    return false;
  }

  /**
   * Load user information from token validation
   */
  async loadUserInfo() {
    try {
      const validation = await this.validateToken();
      if (validation.valid) {
        this.user = {
          userId: validation.userId,
          clientId: validation.clientId,
          sessionId: validation.sessionId,
        };
      }
    } catch (error) {
      console.error('Failed to load user info:', error);
      this.logout();
    }
  }

  /**
   * Set and store authentication token
   */
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('guardianAuthToken', token);
    } else {
      localStorage.removeItem('guardianAuthToken');
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!(this.token && this.user);
  }

  /**
   * Get current user information
   */
  getCurrentUser() {
    return this.user;
  }

  /**
   * Get current JWT token
   */
  getToken() {
    return this.token;
  }

  /**
   * Logout and clear session
   */
  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('guardianAuthToken');
  }

  /**
   * Decode JWT payload (for debugging - don't use for security decisions)
   */
  decodeToken(token = null) {
    const tokenToDecode = token || this.token;
    if (!tokenToDecode) return null;

    try {
      const parts = tokenToDecode.split('.');
      if (parts.length !== 3) return null;

      const payload = JSON.parse(atob(parts[1]));
      return {
        ...payload,
        exp: new Date(payload.exp * 1000),
        iat: new Date(payload.iat * 1000),
      };
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  /**
   * Check if token is expired (client-side check only)
   */
  isTokenExpired(token = null) {
    const decoded = this.decodeToken(token);
    if (!decoded) return true;

    return decoded.exp < new Date();
  }

  /**
   * Auto-refresh token validation (call periodically)
   */
  async refreshValidation() {
    if (!this.token) return false;

    try {
      return await this.validateTokenSilently();
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }
}

export default GuardianAuthClient;