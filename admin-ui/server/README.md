# Guardian Admin UI Proxy Server

A Node.js proxy server that provides secure access to the Guardian Authentication Service admin API for the React admin dashboard.

## Features

- **Authentication Forwarding**: Automatically adds admin tokens to backend requests
- **CORS Handling**: Properly configured CORS for frontend-backend communication
- **Security Headers**: Implements Helmet.js for security best practices
- **Request Logging**: Morgan logging for all requests
- **Error Handling**: Comprehensive error handling with graceful fallbacks
- **Health Checks**: Built-in health monitoring for both proxy and backend
- **Environment Configuration**: Secure configuration via environment variables

## Setup

1. **Install Dependencies**
   ```bash
   cd server
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Start Production Server**
   ```bash
   npm start
   ```

## Configuration

### Environment Variables

- `PORT`: Server port (default: 3002)
- `NODE_ENV`: Environment mode (development/production)
- `BACKEND_URL`: Guardian auth service URL (default: http://localhost:8084)
- `ADMIN_TOKEN`: Admin authentication token
- `ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins
- `SESSION_SECRET`: Session secret for security
- `RATE_LIMIT_WINDOW_MS`: Rate limiting window in milliseconds
- `RATE_LIMIT_MAX_REQUESTS`: Maximum requests per window
- `LOG_LEVEL`: Logging level (info, debug, error)

## API Endpoints

### Health Checks
- `GET /health` - Proxy server health status
- `GET /api/health` - Combined proxy and backend health status

### Admin API Proxy
All `/api/admin/*` requests are proxied to the backend with authentication:

- `GET /api/admin/users` - Get users with pagination
- `GET /api/admin/users/search` - Search users
- `GET /api/admin/users/:id` - Get user details
- `GET /api/admin/users/:id/sessions` - Get user sessions
- `POST /api/admin/users/:id/deactivate-sessions` - Deactivate user sessions
- `GET /api/admin/clients` - Get clients with pagination
- `GET /api/admin/clients/:id` - Get client details
- `PUT /api/admin/clients/:id` - Update client
- `GET /api/admin/audit-logs` - Get audit logs with filtering
- `GET /api/admin/stats` - Get system statistics
- `GET /api/admin/health` - Get system health metrics

## Security Features

1. **Authentication**: All admin API requests require valid admin token
2. **CORS**: Restrictive CORS policy with configurable origins
3. **Helmet**: Security headers including CSP, HSTS, etc.
4. **Input Validation**: Request size limits and content type validation
5. **Error Sanitization**: Production mode hides sensitive error details

## Usage with React Admin UI

Update your React app's API configuration to use the proxy:

```javascript
// In src/services/api.js
const API_BASE_URL = 'http://localhost:3002';

// Add admin token to requests
axios.defaults.headers.common['X-Admin-Token'] = 'your-admin-token';
```

## Development

### Running in Development Mode
```bash
npm run dev
```

This uses nodemon for automatic restarts on file changes.

### Testing
```bash
# Test health endpoint
curl http://localhost:3002/health

# Test backend health through proxy
curl http://localhost:3002/api/health

# Test admin API (requires token)
curl -H "X-Admin-Token: your-token" http://localhost:3002/api/admin/stats
```

## Deployment

### Production Checklist
1. Set `NODE_ENV=production`
2. Use strong `ADMIN_TOKEN` and `SESSION_SECRET`
3. Configure appropriate `ALLOWED_ORIGINS`
4. Set up proper logging and monitoring
5. Use process manager (PM2, systemd, etc.)
6. Set up reverse proxy (nginx, Apache)

### Docker Deployment
```bash
# Build image
docker build -t guardian-admin-proxy .

# Run container
docker run -d \
  --name guardian-admin-proxy \
  -p 3002:3002 \
  --env-file .env \
  guardian-admin-proxy
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Check `ALLOWED_ORIGINS` configuration
2. **Authentication Failures**: Verify `ADMIN_TOKEN` matches backend
3. **Connection Refused**: Ensure `BACKEND_URL` is correct and backend is running
4. **Port Conflicts**: Change `PORT` if 3002 is already in use

### Logging

The server logs all requests and responses. Check console output for:
- `[PROXY]` - Successful proxy requests
- `[PROXY ERROR]` - Proxy failures
- `[HEALTH CHECK ERROR]` - Backend health check failures
- `[SERVER ERROR]` - General server errors

## License

MIT License - See LICENSE file for details