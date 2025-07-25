# Guardian Authentication Service - API Documentation

**Version**: 1.0.0  
**Base URL**: `http://localhost:8084`  
**Production URL**: `https://your-auth-domain.com`

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Rate Limiting](#rate-limiting)
4. [Error Responses](#error-responses)
5. [Client Registration](#client-registration)
6. [User Authentication Endpoints](#user-authentication-endpoints)
7. [Admin Management Endpoints](#admin-management-endpoints)
8. [Data Models](#data-models)
9. [Security Considerations](#security-considerations)
10. [Code Examples](#code-examples)

---

## Overview

The Guardian Authentication Service provides secure multi-tenant user authentication with JWT tokens, comprehensive audit logging, and administrative capabilities. The service is designed for enterprise applications requiring robust authentication infrastructure.

### Key Features
- **Multi-tenant architecture**: Isolated user spaces per client application
- **JWT-based authentication**: Stateless token management with session tracking
- **Rate limiting**: Protection against brute force attacks (5 attempts/5 minutes)
- **Comprehensive audit logging**: Full forensic data capture with geolocation
- **Admin dashboard**: Complete user and system management capabilities
- **High security**: BCrypt password hashing, secure API keys, session management

---

## Authentication

The Guardian Auth Service uses a dual authentication system:

### 1. Client Authentication (Required for all user operations)
All user-related endpoints require client credentials in headers:

```http
X-Client-Id: YOUR_CLIENT_ID
X-Client-Key: YOUR_CLIENT_KEY
```

### 2. JWT Authentication (Required for admin operations)
Admin operations use JWT Bearer tokens obtained through login:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

**Note**: The previous X-Admin-Token authentication has been replaced with JWT Bearer tokens for enhanced security.

---

## Rate Limiting

Rate limiting is applied to prevent abuse:

- **Limit**: 5 failed attempts per 5 minutes per client
- **Scope**: Per client ID for authentication operations
- **Response**: HTTP 429 with `Retry-After` header
- **Reset**: Automatic after timeout period

**Rate Limited Endpoints**:
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/validate`

---

## Error Responses

### Standard Error Format
```json
{
  "error": "Error description",
  "message": "Detailed error message", 
  "timestamp": "2025-01-01T00:00:00Z",
  "path": "/api/endpoint"
}
```

### HTTP Status Codes
- `200` - Success
- `400` - Bad Request (missing headers, invalid data)
- `401` - Unauthorized (invalid credentials, expired token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

---

## Client Registration

Before using authentication endpoints, client applications must register to obtain credentials.

### Register New Client Application

**Endpoint**: `POST /api/clients/register`

**Request**:
```http
POST /api/clients/register
Content-Type: application/json

{
  "name": "My Application",
  "description": "Web application for customer portal",
  "idleTimeoutMinutes": 30
}
```

**Response**: `200 OK`
```json
{
  "clientId": "ABC123",
  "clientKey": "VGhpcyBpcyBhIHNlY3VyZSBjbGllbnQga2V5IGZvciBBUEk",
  "name": "My Application",
  "description": "Web application for customer portal",
  "keyStrength": "256-bit Base64 encoded",
  "keyLength": "44",
  "createdAt": "2025-01-01T12:00:00",
  "idleTimeoutMinutes": "30"
}
```

**Important**: Store the `clientId` and `clientKey` securely. The `clientKey` is only displayed once during registration.

---

## User Authentication Endpoints

### 1. User Signup

Create a new user account within your client's tenant.

**Endpoint**: `POST /api/auth/signup`

**Headers**:
```http
Content-Type: application/json
X-Client-Id: YOUR_CLIENT_ID
X-Client-Key: YOUR_CLIENT_KEY
```

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response**: `200 OK`
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyQGV4YW1wbGUuY29tIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE2NDA5OTg4MDB9.signature
```

**Error Responses**:
- `400` - Missing required headers or invalid data
- `409` - User already exists
- `429` - Rate limit exceeded

### 2. User Login

Authenticate existing user and receive JWT token.

**Endpoint**: `POST /api/auth/login`

**Headers**:
```http
Content-Type: application/json
X-Client-Id: YOUR_CLIENT_ID
X-Client-Key: YOUR_CLIENT_KEY
```

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response**: `200 OK`
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyQGV4YW1wbGUuY29tIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE2NDA5OTg4MDB9.signature
```

**Error Responses**:
- `400` - Missing required headers
- `401` - Invalid credentials
- `429` - Rate limit exceeded (includes `Retry-After` header)

### 3. Token Validation

Validate JWT token and retrieve session information.

**Endpoint**: `POST /api/auth/validate`

**Headers**:
```http
Content-Type: application/json
X-Client-Id: YOUR_CLIENT_ID
X-Client-Key: YOUR_CLIENT_KEY
```

**Request**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response**: `200 OK`
```json
{
  "valid": true,
  "userId": 123,
  "clientId": "ABC123",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Error Responses**:
- `400` - Missing token or headers
- `401` - Invalid or expired token
- `429` - Rate limit exceeded

---

## Admin Management Endpoints

All admin endpoints require admin authentication and `ROLE_ADMIN` authorization.

### Headers for Admin Endpoints
```http
X-Admin-Token: YOUR_ADMIN_TOKEN
```

### 1. Dashboard Statistics

Get system overview statistics.

**Endpoint**: `GET /api/admin/stats`

**Response**: `200 OK`
```json
{
  "totalUsers": 1500,
  "totalClients": 25,
  "activeSessions": 450,
  "totalAuditLogs": 50000,
  "activeRateLimits": 12,
  "lastStatsUpdate": "2025-01-01T12:00:00",
  "usersByClient": {
    "CLIENT1": 800,
    "CLIENT2": 700
  },
  "loginsByDay": {
    "2025-01-01": 150,
    "2024-12-31": 200
  },
  "signupsByDay": {
    "2025-01-01": 25,
    "2024-12-31": 30
  },
  "auditEventTypes": {
    "LOGIN_SUCCESS": 5000,
    "LOGIN_FAILED": 250,
    "USER_SIGNUP": 1500,
    "TOKEN_VALIDATION": 25000
  }
}
```

### 2. System Health

Get system health information.

**Endpoint**: `GET /api/admin/health`

**Response**: `200 OK`
```json
{
  "status": "UP",
  "database": "connected",
  "memoryUsage": "45%",
  "activeConnections": 15,
  "uptime": "5 days, 2 hours",
  "version": "1.0.0"
}
```

### 3. User Management

#### Get Users (Paginated)

**Endpoint**: `GET /api/admin/users`

**Query Parameters**:
- `page` (int, default: 0) - Page number
- `size` (int, default: 20) - Page size
- `sortBy` (string, default: "createdAt") - Sort field
- `clientId` (string, optional) - Filter by client

**Example**: `GET /api/admin/users?page=0&size=10&sortBy=email&clientId=ABC123`

**Response**: `200 OK`
```json
{
  "content": [
    {
      "id": 123,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "clientId": "ABC123",
      "createdAt": "2025-01-01T10:00:00",
      "updatedAt": "2025-01-01T10:00:00",
      "active": true,
      "activeSessions": 2
    }
  ],
  "totalElements": 1500,
  "totalPages": 150,
  "size": 10,
  "number": 0,
  "first": true,
  "last": false
}
```

#### Get User by ID

**Endpoint**: `GET /api/admin/users/{userId}`

**Response**: `200 OK`
```json
{
  "id": 123,
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "clientId": "ABC123",
  "createdAt": "2025-01-01T10:00:00",
  "updatedAt": "2025-01-01T10:00:00",
  "active": true,
  "activeSessions": 2
}
```

#### Get User Sessions

**Endpoint**: `GET /api/admin/users/{userId}/sessions`

**Response**: `200 OK`
```json
[
  {
    "id": 1,
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "jti": "jwt-token-id-12345",
    "userId": 123,
    "clientId": "ABC123",
    "createdAt": "2025-01-01T10:00:00",
    "lastAccessedAt": "2025-01-01T11:30:00",
    "expiresAt": "2025-01-01T18:00:00",
    "active": true,
    "ipAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0..."
  }
]
```

#### Deactivate User Sessions

**Endpoint**: `DELETE /api/admin/users/{userId}/sessions`

**Response**: `200 OK`
```
All sessions deactivated for user 123
```

#### Search Users

**Endpoint**: `GET /api/admin/users/search`

**Query Parameters**:
- `q` (string, required) - Search term
- `limit` (int, default: 10) - Result limit

**Example**: `GET /api/admin/users/search?q=john&limit=5`

**Response**: `200 OK`
```json
[
  {
    "id": 123,
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "clientId": "ABC123",
    "createdAt": "2025-01-01T10:00:00",
    "active": true,
    "activeSessions": 1
  }
]
```

### 4. Client Management

#### Get Clients (Paginated)

**Endpoint**: `GET /api/admin/clients`

**Query Parameters**:
- `page` (int, default: 0) - Page number
- `size` (int, default: 20) - Page size

**Response**: `200 OK`
```json
{
  "content": [
    {
      "id": 1,
      "clientId": "ABC123",
      "name": "My Application",
      "description": "Web application for customer portal",
      "idleTimeOut": 1800,
      "active": true,
      "createdAt": "2025-01-01T09:00:00",
      "updatedAt": "2025-01-01T09:00:00"
    }
  ],
  "totalElements": 25,
  "totalPages": 2,
  "size": 20,
  "number": 0
}
```

#### Get Client by ID

**Endpoint**: `GET /api/admin/clients/{clientId}`

**Response**: `200 OK`
```json
{
  "id": 1,
  "clientId": "ABC123",
  "name": "My Application",
  "description": "Web application for customer portal",
  "idleTimeOut": 1800,
  "active": true,
  "createdAt": "2025-01-01T09:00:00",
  "updatedAt": "2025-01-01T09:00:00"
}
```

#### Update Client

**Endpoint**: `PUT /api/admin/clients/{clientId}`

**Request**:
```json
{
  "description": "Updated description for my application",
  "idleTimeoutMinutes": 60
}
```

**Response**: `200 OK`
```json
{
  "id": 1,
  "clientId": "ABC123",
  "name": "My Application",
  "description": "Updated description for my application",
  "idleTimeOut": 3600,
  "active": true,
  "createdAt": "2025-01-01T09:00:00",
  "updatedAt": "2025-01-01T12:00:00"
}
```

#### Rotate Client Key

**Endpoint**: `POST /api/admin/clients/{clientId}/rotate-key`

**Response**: `200 OK`
```json
{
  "clientId": "ABC123",
  "newClientKey": "TmV3U2VjdXJlQ2xpZW50S2V5Rm9yQVBJQXV0aGVudGljYXRpb24",
  "message": "Client key rotated successfully",
  "timestamp": "2025-01-01T12:00:00"
}
```

### 5. Audit Log Management

#### Get Audit Logs (Paginated)

**Endpoint**: `GET /api/admin/logs`

**Query Parameters**:
- `page` (int, default: 0) - Page number
- `size` (int, default: 50) - Page size
- `eventType` (string, optional) - Filter by event type
- `clientId` (string, optional) - Filter by client

**Example**: `GET /api/admin/logs?page=0&size=25&eventType=LOGIN_SUCCESS&clientId=ABC123`

**Response**: `200 OK`
```json
{
  "content": [
    {
      "id": 12345,
      "eventType": "LOGIN_SUCCESS",
      "userEmail": "user@example.com",
      "clientId": "ABC123",
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
      "requestMethod": "POST",
      "endpoint": "/api/auth/login",
      "sessionId": "550e8400-e29b-41d4-a716-446655440000",
      "responseStatus": 200,
      "geoCountry": "United States",
      "geoCity": "New York",
      "requestId": "req-12345-67890",
      "errorCode": null,
      "timestamp": "2025-01-01T12:00:00"
    }
  ],
  "totalElements": 50000,
  "totalPages": 1000,
  "size": 50,
  "number": 0
}
```

---

## Data Models

### User Entity
```json
{
  "id": 123,
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "clientId": "ABC123",
  "active": true,
  "createdAt": "2025-01-01T10:00:00",
  "updatedAt": "2025-01-01T10:00:00"
}
```

### Client Entity
```json
{
  "id": 1,
  "clientId": "ABC123",
  "name": "My Application",
  "description": "Application description",
  "idleTimeOut": 1800,
  "active": true,
  "createdAt": "2025-01-01T09:00:00",
  "updatedAt": "2025-01-01T09:00:00"
}
```

### Session Entity
```json
{
  "id": 1,
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "jti": "jwt-token-id-12345",
  "userId": 123,
  "clientId": "ABC123",
  "createdAt": "2025-01-01T10:00:00",
  "lastAccessedAt": "2025-01-01T11:30:00",
  "expiresAt": "2025-01-01T18:00:00",
  "active": true,
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0..."
}
```

### Audit Log Entity
```json
{
  "id": 12345,
  "eventType": "LOGIN_SUCCESS",
  "userEmail": "user@example.com",
  "clientId": "ABC123",
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "requestMethod": "POST",
  "endpoint": "/api/auth/login",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "responseStatus": 200,
  "geoCountry": "United States",
  "geoCity": "New York",
  "requestId": "req-12345-67890",
  "errorCode": null,
  "timestamp": "2025-01-01T12:00:00"
}
```

---

## Security Considerations

### Authentication Security
- **Password Hashing**: BCrypt with salt rounds for secure password storage
- **JWT Security**: HS256 algorithm with configurable secret and expiration
- **Session Management**: Unique session IDs with idle timeout controls

### API Security
- **Client Credentials**: 256-bit Base64 encoded API keys
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Comprehensive request validation and sanitization

### Infrastructure Security
- **CORS Configuration**: Configurable allowed origins
- **Headers Security**: Security headers via Helmet.js
- **Audit Logging**: Complete forensic trail for security monitoring

### Best Practices
1. **Rotate API Keys**: Regular client key rotation via admin API
2. **Monitor Audit Logs**: Watch for suspicious activity patterns
3. **Environment Variables**: Never hardcode secrets in application code
4. **HTTPS Only**: Always use HTTPS in production environments
5. **Token Expiration**: Configure appropriate JWT expiration times

---

## Code Examples

### Complete Authentication Flow (JavaScript)

```javascript
class GuardianAuthClient {
  constructor(baseUrl, clientId, clientKey) {
    this.baseUrl = baseUrl;
    this.clientId = clientId;
    this.clientKey = clientKey;
    this.token = null;
  }

  // Set client headers for all requests
  getHeaders(includeAuth = false) {
    const headers = {
      'Content-Type': 'application/json',
      'X-Client-Id': this.clientId,
      'X-Client-Key': this.clientKey
    };
    
    if (includeAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // User signup
  async signup(email, password, firstName, lastName) {
    const response = await fetch(`${this.baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        email,
        password,
        firstName,
        lastName
      })
    });

    if (response.ok) {
      this.token = await response.text();
      return this.token;
    } else if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      throw new Error(`Rate limited. Retry after ${retryAfter} seconds`);
    } else {
      throw new Error(`Signup failed: ${response.statusText}`);
    }
  }

  // User login
  async login(email, password) {
    const response = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        email,
        password
      })
    });

    if (response.ok) {
      this.token = await response.text();
      return this.token;
    } else if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      throw new Error(`Rate limited. Retry after ${retryAfter} seconds`);
    } else {
      throw new Error(`Login failed: ${response.statusText}`);
    }
  }

  // Validate token
  async validateToken(token = null) {
    const tokenToValidate = token || this.token;
    
    const response = await fetch(`${this.baseUrl}/api/auth/validate`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        token: tokenToValidate
      })
    });

    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(`Token validation failed: ${response.statusText}`);
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return this.token !== null;
  }

  // Logout
  logout() {
    this.token = null;
  }
}

// Usage example
const authClient = new GuardianAuthClient(
  'http://localhost:8084',
  'YOUR_CLIENT_ID',
  'YOUR_CLIENT_KEY'
);

// Sign up new user
try {
  const token = await authClient.signup(
    'user@example.com',
    'SecurePassword123!',
    'John',
    'Doe'
  );
  console.log('Signup successful, token:', token);
} catch (error) {
  console.error('Signup error:', error.message);
}

// Login existing user
try {
  const token = await authClient.login('user@example.com', 'SecurePassword123!');
  console.log('Login successful, token:', token);
} catch (error) {
  console.error('Login error:', error.message);
}

// Validate current token
try {
  const validation = await authClient.validateToken();
  console.log('Token valid:', validation);
} catch (error) {
  console.error('Token validation error:', error.message);
}
```

### Error Handling Best Practices

```javascript
async function handleAuthRequest(requestFn, retryCount = 3) {
  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      if (error.message.includes('Rate limited') && attempt < retryCount) {
        const retrySeconds = parseInt(error.message.match(/(\d+) seconds/)?.[1]) || 60;
        console.log(`Rate limited, waiting ${retrySeconds} seconds before retry ${attempt + 1}/${retryCount}`);
        await new Promise(resolve => setTimeout(resolve, retrySeconds * 1000));
        continue;
      }
      throw error;
    }
  }
}

// Usage with retry logic
const loginWithRetry = () => authClient.login('user@example.com', 'password');
const token = await handleAuthRequest(loginWithRetry);
```

---

## Admin UI Application

The Guardian Admin UI is a React-based web application that provides a comprehensive dashboard for managing the Guardian Authentication Service.

### Features

- **Dashboard Overview**: Real-time statistics and system health monitoring
- **User Management**: View, search, and manage user accounts across all clients
- **Client Management**: Manage client applications and rotate API keys
- **Audit Logs**: Comprehensive activity logging with filtering and search
- **System Health**: Monitor API performance, database status, and security metrics
- **Dark/Light Theme**: User preference theme switching
- **JWT Authentication**: Secure admin access with token expiration handling

### Admin UI Setup

#### 1. Environment Configuration
Create a `.env` file in the admin-ui directory:

```bash
# Guardian Auth Service Configuration
REACT_APP_API_URL=http://localhost:3002
REACT_APP_GUARDIAN_CLIENT_ID=YOUR_CLIENT_ID
REACT_APP_GUARDIAN_CLIENT_KEY=YOUR_CLIENT_KEY

# Proxy Server Configuration (if needed)
REACT_APP_PROXY_URL=http://localhost:3002
```

#### 2. Installation and Running

```bash
# Install dependencies
cd admin-ui
npm install

# Development mode
npm start

# Production build
npm run build

# Using Docker
docker build -t guardian-admin-ui .
docker run -p 3000:3000 guardian-admin-ui
```

#### 3. Admin User Creation

Create an admin user using the Guardian Auth Service API:

```bash
# Register Admin UI as a client
curl -X POST http://localhost:8084/api/clients/register \
  -H "Content-Type: application/json" \
  -d '{
    "clientName": "Guardian Admin UI",
    "contactEmail": "admin@yourcompany.com",
    "description": "Admin interface for Guardian Auth Service"
  }'

# Create admin user account
curl -X POST http://localhost:8084/api/auth/signup \
  -H "Content-Type: application/json" \
  -H "X-Client-Id: YOUR_CLIENT_ID" \
  -H "X-Client-Key: YOUR_CLIENT_KEY" \
  -d '{
    "email": "admin@guardian.com",
    "password": "AdminPassword123",
    "firstName": "Admin",
    "lastName": "Guardian"
  }'
```

### Admin API Endpoints

All admin endpoints require JWT Bearer token authentication:

#### System Stats
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/health` - System health metrics

#### User Management
- `GET /api/admin/users` - List users (with pagination and filtering)
- `GET /api/admin/users/{id}` - Get user details
- `GET /api/admin/users/{id}/sessions` - Get user sessions
- `DELETE /api/admin/users/{id}/sessions` - Deactivate user sessions
- `GET /api/admin/users/search` - Search users

#### Client Management
- `GET /api/admin/clients` - List clients
- `GET /api/admin/clients/{id}` - Get client details
- `PUT /api/admin/clients/{id}` - Update client
- `POST /api/admin/clients/{id}/rotate-key` - Rotate client key

#### Audit Logs
- `GET /api/admin/logs` - Get audit logs (with filtering)

### Security Features

- **JWT Token Management**: Automatic token expiration handling with user notifications
- **Rate Limiting**: Protection against brute force attacks
- **Secure Storage**: Tokens stored in localStorage with proper cleanup
- **Theme Context**: Persistent user preferences
- **Error Handling**: Comprehensive error handling with user-friendly messages

### Architecture

- **Frontend**: React 18 with Material-UI components
- **State Management**: React Context for authentication and theme
- **HTTP Client**: Fetch API with JWT interceptors
- **Routing**: React Router for SPA navigation
- **Authentication**: JWT Bearer tokens with automatic refresh
- **Notifications**: Sonner for toast notifications

---

**For additional support or questions, please refer to the developer guide or contact the Guardian Auth Service team.**