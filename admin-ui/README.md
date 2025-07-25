# Guardian Admin UI

A comprehensive React-based admin dashboard for the Guardian Authentication Service, featuring real-time monitoring, user management, audit logging, and system health tracking.

## Features

### 🎛️ Dashboard Overview
- Real-time system statistics and metrics
- Interactive charts for login/signup activity
- Event type distribution visualization
- User distribution by client
- System health monitoring

### 👥 User Management
- Paginated user listing with search functionality
- Detailed user profiles with session information
- Active session management and termination
- User filtering by client

### 🏢 Client Management
- Client application overview and configuration
- Client details editing (description, idle timeout)
- Client key management (secure display)
- Creation date tracking

### 📊 Audit Logs
- Comprehensive audit log viewer with filtering
- Event type filtering (LOGIN, SIGNUP, VALIDATION, etc.)
- Client-based filtering
- Detailed log entry inspection
- Pagination and search capabilities

### 🔍 System Health
- Real-time system status monitoring
- Performance metrics tracking
- Security status overview
- Recent activity summaries
- Auto-refresh capabilities

## Architecture

### Frontend (React)
- **Framework**: React 18 with functional components and hooks
- **UI Library**: Material-UI (MUI) v5 for consistent design
- **Routing**: React Router v6 for navigation
- **Charts**: Recharts for data visualization
- **HTTP Client**: Axios for API communication
- **State Management**: React hooks (useState, useEffect)

### Backend Proxy (Node.js)
- **Framework**: Express.js
- **Security**: Helmet.js for security headers
- **CORS**: Configurable cross-origin resource sharing
- **Logging**: Morgan for request logging
- **Proxy**: http-proxy-middleware for API forwarding
- **Authentication**: Admin token validation

## Setup and Installation

### Prerequisites
- Node.js 16+ and npm
- Guardian Authentication Service running on port 8084
- Admin token configured in both services

### Quick Start

1. **Clone and Install**
   ```bash
   cd admin-ui
   npm run install:all
   ```

2. **Configure Environment**
   ```bash
   # Main app configuration
   cp .env.example .env
   
   # Proxy server configuration
   cp server/.env.example server/.env
   ```

3. **Start Complete UI (React + Proxy)**
   ```bash
   npm run start:full
   ```

4. **Access the Dashboard**
   - Admin UI: http://localhost:3000
   - Proxy Server: http://localhost:3002
   - Health Check: http://localhost:3002/health

### Individual Component Startup

```bash
# Start only React app (port 3000)
npm start

# Start only proxy server (port 3002)
npm run start:proxy

# Start both with monitoring script
./start-admin-ui.sh
```

## Configuration

### Environment Variables

#### React App (.env)
```env
REACT_APP_PROXY_URL=http://localhost:3002
REACT_APP_ADMIN_TOKEN=your-admin-token
REACT_APP_API_URL=http://localhost:8084
```

#### Proxy Server (server/.env)
```env
PORT=3002
NODE_ENV=development
BACKEND_URL=http://localhost:8084
ADMIN_TOKEN=your-admin-token
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

## API Integration

The admin UI communicates with the Guardian Authentication Service through a secure proxy server that handles:

- **Authentication**: Automatic admin token injection
- **CORS**: Cross-origin request handling
- **Error Handling**: Graceful error responses
- **Logging**: Request/response monitoring

### Available Endpoints

#### Dashboard & Statistics
- `GET /api/admin/stats` - System statistics
- `GET /api/admin/health` - Health metrics

#### User Management
- `GET /api/admin/users` - Paginated user list
- `GET /api/admin/users/:id` - User details
- `GET /api/admin/users/:id/sessions` - User sessions
- `DELETE /api/admin/users/:id/sessions` - Deactivate sessions
- `GET /api/admin/users/search` - Search users

#### Client Management
- `GET /api/admin/clients` - Client list
- `GET /api/admin/clients/:id` - Client details
- `PUT /api/admin/clients/:id` - Update client

#### Audit Logs
- `GET /api/admin/logs` - Filtered audit logs

## Component Structure

```
src/
├── components/
│   ├── Dashboard.js          # Main dashboard with statistics
│   ├── UserManagement.js     # User listing and management
│   ├── ClientManagement.js   # Client configuration
│   ├── AuditLogs.js          # Audit log viewer
│   └── SystemHealth.js       # System monitoring
├── services/
│   └── api.js                # API client configuration
├── App.js                    # Main application component
└── index.js                  # Application entry point

server/
├── server.js                 # Express proxy server
├── package.json              # Node.js dependencies
└── README.md                 # Proxy server documentation
```

## Security Features

### Authentication & Authorization
- Admin token-based authentication
- Secure token transmission via headers
- Role-based access control integration

### Security Headers
- Content Security Policy (CSP)
- Helmet.js security middleware
- CORS policy enforcement

### Data Protection
- Sensitive data masking (client keys)
- Secure error message handling
- Input validation and sanitization

## Development

### Development Mode
```bash
# Start with hot reload
npm run dev

# Start proxy in development mode
cd server && npm run dev
```

### Building for Production
```bash
# Build React app and install proxy dependencies
npm run build:all

# Serve built files
npx serve -s build -l 3000
```

### Testing API Integration
```bash
# Test proxy health
curl http://localhost:3002/health

# Test admin API (requires token)
curl -H "X-Admin-Token: your-token" http://localhost:3002/api/admin/stats
```

## Deployment

### Production Checklist
1. Set `NODE_ENV=production` in proxy server
2. Configure strong admin tokens
3. Set appropriate CORS origins
4. Enable HTTPS in production
5. Set up reverse proxy (nginx/Apache)
6. Configure logging and monitoring

### Docker Deployment
```bash
# Build and run with Docker
docker build -t guardian-admin-ui .
docker run -d -p 3000:3000 -p 3002:3002 guardian-admin-ui
```

### Environment-Specific Configuration
- Development: Auto-refresh, detailed logging
- Staging: Production-like with debug info
- Production: Optimized builds, minimal logging

## Monitoring and Maintenance

### Health Checks
- React app availability
- Proxy server status
- Backend connectivity
- Authentication validity

### Logging
- Request/response logging
- Error tracking and alerts
- Performance metrics
- User activity monitoring

### Auto-Refresh
- Dashboard data: 30-second intervals
- System health: 30-second intervals
- Session validation: Per request
- Error recovery: Automatic retry

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check `ALLOWED_ORIGINS` in proxy configuration
   - Verify React app URL matches allowed origins

2. **Authentication Failed**
   - Verify admin token matches between UI and backend
   - Check token format (X-Admin-Token header)

3. **Connection Refused**
   - Ensure Guardian backend is running on port 8084
   - Check proxy server is running on port 3002
   - Verify network connectivity

4. **Data Not Loading**
   - Check browser console for API errors
   - Verify admin endpoints are accessible
   - Test API directly with curl

### Debug Mode
Enable detailed logging by setting:
```env
NODE_ENV=development
REACT_APP_DEBUG=true
```

## Contributing

### Code Style
- ESLint configuration for React
- Prettier for code formatting
- Material-UI design system compliance
- Consistent error handling patterns

### Adding New Features
1. Create component in `src/components/`
2. Add API endpoints in `src/services/api.js`
3. Update routing in `App.js`
4. Add navigation in sidebar
5. Update documentation

## License

MIT License - See LICENSE file for details

## Support

For issues and support:
- Check the troubleshooting section
- Review server logs for errors
- Test API endpoints directly
- Contact the development team

---

**Guardian Admin UI v1.0.0** | Built with ❤️ for secure authentication management