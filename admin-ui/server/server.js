const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8084';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin-secure-token-67890-change-in-production';

// Guardian Auth configuration for Admin UI
const GUARDIAN_CONFIG = {
  clientId: process.env.GUARDIAN_CLIENT_ID,
  clientKey: process.env.GUARDIAN_CLIENT_KEY,
};

// Validate required environment variables
if (!GUARDIAN_CONFIG.clientId || !GUARDIAN_CONFIG.clientKey) {
  console.error('ERROR: Missing required environment variables');
  console.error('Please set GUARDIAN_CLIENT_ID and GUARDIAN_CLIENT_KEY in your .env file');
  process.exit(1);
}

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", BACKEND_URL],
    },
  },
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Token', 'X-Client-Id', 'X-Client-Key'],
}));

app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'guardian-admin-proxy',
    version: '1.0.0',
    backend: BACKEND_URL,
  });
});

// Guardian Auth JWT validation middleware
const authenticateGuardianJWT = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'No valid authorization header',
    });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    // Validate token with Guardian Auth Service
    const response = await axios.post(`${BACKEND_URL}/api/auth/validate`, {
      token: token
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Id': GUARDIAN_CONFIG.clientId,
        'X-Client-Key': GUARDIAN_CONFIG.clientKey,
      },
      timeout: 10000,
    });

    if (response.data.valid) {
      // Store user info in request for later use
      req.user = {
        userId: response.data.userId,
        clientId: response.data.clientId,
        sessionId: response.data.sessionId,
      };
      next();
    } else {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Token validation failed',
      });
    }
  } catch (error) {
    console.error('Guardian JWT validation error:', error.message);
    
    if (error.response?.status === 429) {
      return res.status(429).json({
        error: 'Rate limited',
        message: 'Too many validation requests. Please try again later.',
        retryAfter: error.response.headers['retry-after'] || '60',
      });
    }
    
    return res.status(401).json({
      error: 'Token validation failed',
      message: 'Unable to validate authentication token',
    });
  }
};

// Legacy authentication middleware (for backward compatibility)
const authenticateAdmin = (req, res, next) => {
  const token = req.headers['x-admin-token'] || req.headers['authorization']?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'No admin token provided',
    });
  }

  if (token !== ADMIN_TOKEN) {
    return res.status(403).json({
      error: 'Authentication failed',
      message: 'Invalid admin token',
    });
  }

  next();
};

// Admin API proxy with authentication
const adminApiProxy = createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/admin': '/api/admin',
  },
  onProxyReq: (proxyReq, req, res) => {
    // Add admin token to backend request
    proxyReq.setHeader('X-Admin-Token', ADMIN_TOKEN);
    
    // Forward original headers
    if (req.headers['content-type']) {
      proxyReq.setHeader('Content-Type', req.headers['content-type']);
    }
    
    // Log the proxied request
    console.log(`[PROXY] ${req.method} ${req.path} -> ${BACKEND_URL}${req.path}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    // Add CORS headers
    proxyRes.headers['Access-Control-Allow-Origin'] = req.headers.origin || '*';
    proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
    
    // Log the response
    console.log(`[PROXY] Response: ${proxyRes.statusCode} for ${req.method} ${req.path}`);
  },
  onError: (err, req, res) => {
    console.error(`[PROXY ERROR] ${req.method} ${req.path}:`, err.message);
    res.status(502).json({
      error: 'Proxy Error',
      message: 'Failed to connect to backend service',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  },
});

// Guardian Auth endpoints (for login/signup)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        message: 'Email and password are required',
      });
    }
    
    console.log(`[AUTH] Login attempt for: ${email}`);
    
    const response = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      email,
      password,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Id': GUARDIAN_CONFIG.clientId,
        'X-Client-Key': GUARDIAN_CONFIG.clientKey,
      },
      timeout: 10000,
    });
    
    console.log(`[AUTH] Login successful for: ${email}`);
    res.json({ token: response.data });
  } catch (error) {
    console.error(`[AUTH ERROR] Login failed:`, error.response?.data || error.message);
    
    if (error.response?.status === 429) {
      return res.status(429).json({
        error: 'Rate limited',
        message: 'Too many login attempts. Please try again later.',
        retryAfter: error.response.headers['retry-after'] || '60',
      });
    }
    
    if (error.response?.status === 401) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect',
      });
    }
    
    res.status(500).json({
      error: 'Login failed',
      message: 'An error occurred during login',
    });
  }
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Email, password, first name, and last name are required',
      });
    }
    
    console.log(`[AUTH] Signup attempt for: ${email}`);
    
    const response = await axios.post(`${BACKEND_URL}/api/auth/signup`, {
      email,
      password,
      firstName,
      lastName,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Id': GUARDIAN_CONFIG.clientId,
        'X-Client-Key': GUARDIAN_CONFIG.clientKey,
      },
      timeout: 10000,
    });
    
    console.log(`[AUTH] Signup successful for: ${email}`);
    res.json({ token: response.data });
  } catch (error) {
    console.error(`[AUTH ERROR] Signup failed:`, error.response?.data || error.message);
    
    if (error.response?.status === 429) {
      return res.status(429).json({
        error: 'Rate limited',
        message: 'Too many signup attempts. Please try again later.',
        retryAfter: error.response.headers['retry-after'] || '60',
      });
    }
    
    if (error.response?.status === 409) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'An account with this email already exists',
      });
    }
    
    res.status(500).json({
      error: 'Signup failed',
      message: 'An error occurred during signup',
    });
  }
});

app.post('/api/auth/validate', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        error: 'Missing token',
        message: 'Token is required for validation',
      });
    }
    
    const response = await axios.post(`${BACKEND_URL}/api/auth/validate`, {
      token,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Id': GUARDIAN_CONFIG.clientId,
        'X-Client-Key': GUARDIAN_CONFIG.clientKey,
      },
      timeout: 10000,
    });
    
    res.json(response.data);
  } catch (error) {
    console.error(`[AUTH ERROR] Token validation failed:`, error.response?.data || error.message);
    
    if (error.response?.status === 429) {
      return res.status(429).json({
        error: 'Rate limited',
        message: 'Too many validation requests. Please try again later.',
        retryAfter: error.response.headers['retry-after'] || '60',
      });
    }
    
    res.status(401).json({
      error: 'Token validation failed',
      message: 'Invalid or expired token',
    });
  }
});

// All admin routes use JWT authentication (consistent with Guardian Auth service)
app.use('/api/admin', authenticateGuardianJWT, adminApiProxy);

// Public client registration endpoint proxy (admin can register clients)
app.post('/api/clients/register', authenticateAdmin, async (req, res) => {
  try {
    console.log(`[PROXY] Forwarding client registration to ${BACKEND_URL}/api/clients/register`);
    
    const response = await axios.post(`${BACKEND_URL}/api/clients/register`, req.body, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
    
    console.log(`[PROXY] Client registration successful: ${response.data.clientId}`);
    res.json(response.data);
  } catch (error) {
    console.error('[PROXY ERROR] Client registration failed:', error.response?.data || error.message);
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(502).json({
        error: 'Proxy Error',
        message: 'Failed to register client',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
});

// Direct backend health check (no auth required)
app.get('/api/health', async (req, res) => {
  try {
    const response = await axios.get(`${BACKEND_URL}/actuator/health`, {
      timeout: 5000,
    });
    res.json({
      proxy: 'healthy',
      backend: response.data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[HEALTH CHECK ERROR]', error.message);
    res.status(503).json({
      proxy: 'healthy',
      backend: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Guardian Admin Proxy Server started on port ${PORT}`);
  console.log(`🔗 Backend URL: ${BACKEND_URL}`);
  console.log(`🛡️  Admin authentication: ${ADMIN_TOKEN ? 'Enabled' : 'Disabled'}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;