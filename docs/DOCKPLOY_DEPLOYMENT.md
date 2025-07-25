# Guardian Authentication Service - Dockploy Deployment Guide

**Version**: 1.0.0  
**Platform**: Dockploy  
**Deployment Type**: Separate Services

---

## Overview

This guide provides step-by-step instructions for deploying the Guardian Authentication Service on Dockploy platform using separate deployments for the Auth Service and Admin UI.

### Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Guardian Admin  │    │ Guardian Auth   │    │ PostgreSQL      │
│ UI (Nginx+React)│◄──►│ Service (Java)  │◄──►│ Database        │
│ Port: 80        │    │ Port: 8084      │    │ Port: 5432      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## Prerequisites

1. **Dockploy Account**: Access to Dockploy platform
2. **Domain Names**: Two subdomains (e.g., `auth.yourdomain.com`, `admin.yourdomain.com`)
3. **SSL Certificates**: Automatic via Dockploy/Let's Encrypt
4. **Git Repository**: Guardian project accessible to Dockploy

---

## Deployment Steps

### 1. Deploy Guardian Auth Service

#### 1.1 Create New Application in Dockploy
1. Login to Dockploy dashboard
2. Click "New Application"
3. Select "Docker Compose" deployment type
4. Set application name: `guardian-auth-service`

#### 1.2 Configure Repository
```
Repository URL: https://github.com/your-username/guardian
Branch: main
Build Path: auth_service
Docker Compose File: docker-compose.yml
```

#### 1.3 Environment Variables
Set the following environment variables in Dockploy:

```bash
# Database Configuration
DB_PASSWORD=your_super_secure_database_password_2024

# JWT Configuration
JWT_SECRET=YourSuperSecureJWTSecretKeyThatIsAtLeast64CharactersLongForProductionUse2024
JWT_EXPIRATION=3600000

# Application Configuration
AUTH_PORT=8084
LOG_LEVEL=INFO
LOG_LEVEL_APP=INFO

# Admin Configuration
ADMIN_ENABLED=true

# GeoLite2 Configuration
GEOLITE2_ENABLED=true
```

#### 1.4 Domain Configuration
- **Primary Domain**: `auth.yourdomain.com`
- **Port**: `8084`
- **Health Check**: `/actuator/health`

#### 1.5 Deploy
1. Click "Deploy" to start the deployment
2. Monitor logs for successful startup
3. Verify health check: `https://auth.yourdomain.com/actuator/health`

### 2. Deploy Guardian Admin UI

#### 2.1 Create New Application in Dockploy
1. Click "New Application"
2. Select "Docker Compose" deployment type
3. Set application name: `guardian-admin-ui`

#### 2.2 Configure Repository
```
Repository URL: https://github.com/your-username/guardian
Branch: main
Build Path: admin-ui
Docker Compose File: docker-compose.yml
```

#### 2.3 Environment Variables
Set the following environment variables in Dockploy:

```bash
# Guardian Auth Service Configuration
GUARDIAN_CLIENT_ID=your_client_id_from_auth_service
GUARDIAN_CLIENT_KEY=your_client_key_from_auth_service

# API URLs
REACT_APP_API_URL=https://auth.yourdomain.com
REACT_APP_PROXY_URL=https://admin.yourdomain.com

# Backend Configuration
BACKEND_URL=https://auth.yourdomain.com

# Port Configuration
UI_PORT=80
PROXY_PORT=3002

# Domain Configuration
DOMAIN=admin.yourdomain.com
```

#### 2.4 Domain Configuration
- **Primary Domain**: `admin.yourdomain.com`
- **Port**: `80`
- **Health Check**: `/`

#### 2.5 Deploy
1. Click "Deploy" to start the deployment
2. Monitor logs for successful startup
3. Verify access: `https://admin.yourdomain.com`

---

## Pre-Deployment Setup

### 1. Register Admin UI as Client

Before deploying the Admin UI, you need to register it as a client in the Auth Service:

```bash
# Register Admin UI as a client
curl -X POST https://auth.yourdomain.com/api/clients/register \
  -H "Content-Type: application/json" \
  -d '{
    "clientName": "Guardian Admin UI",
    "contactEmail": "admin@yourdomain.com",
    "description": "Production Admin Interface for Guardian Auth Service"
  }'
```

**Save the returned `clientId` and `clientKey` for the Admin UI environment variables.**

### 2. Create Admin User

```bash
# Create admin user account
curl -X POST https://auth.yourdomain.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -H "X-Client-Id: YOUR_CLIENT_ID" \
  -H "X-Client-Key: YOUR_CLIENT_KEY" \
  -d '{
    "email": "admin@yourdomain.com",
    "password": "SecureAdminPassword123!",
    "firstName": "Admin",
    "lastName": "User"
  }'
```

---

## Configuration Files

### Auth Service Docker Compose
Located at: `auth_service/docker-compose.yml`

Key features:
- PostgreSQL 15 database with persistent storage
- Health checks for both database and application
- Environment variable configuration
- Logging with persistent volumes
- Restart policies for production

### Admin UI Docker Compose
Located at: `admin-ui/docker-compose.yml`

Key features:
- Multi-stage build with Nginx
- React app served via Nginx on port 80
- Node.js proxy server for API communication
- Health checks and restart policies
- Traefik labels for reverse proxy support

---

## Monitoring and Health Checks

### Auth Service Health Endpoints
```bash
# Application Health
GET https://auth.yourdomain.com/actuator/health

# Database Health
GET https://auth.yourdomain.com/actuator/health/db

# System Metrics
GET https://auth.yourdomain.com/api/admin/stats
```

### Admin UI Health Checks
```bash
# Application Status
GET https://admin.yourdomain.com/

# Proxy Server Health
GET https://admin.yourdomain.com:3002/health
```

---

## Security Configuration

### 1. Environment Variables Security
- Store sensitive values in Dockploy's encrypted environment variables
- Never commit `.env` files with real credentials
- Use strong, unique passwords for production

### 2. Network Security
```yaml
# Both services should be on the same Docker network
networks:
  guardian-network:
    driver: bridge
    name: guardian-network
    external: true
```

### 3. SSL/TLS Configuration
- Dockploy automatically provisions SSL certificates
- Ensure HTTPS-only access in production
- Configure proper CORS settings

---

## Backup and Recovery

### Database Backup
```bash
# Create database backup
docker exec guardian-postgres pg_dump -U authuser authdb > guardian_backup_$(date +%Y%m%d).sql

# Restore from backup
docker exec -i guardian-postgres psql -U authuser authdb < guardian_backup_20240101.sql
```

### Volume Backup
```bash
# Backup PostgreSQL data
docker run --rm -v guardian-postgres-data:/source -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz -C /source .

# Backup application logs
docker run --rm -v guardian-auth-logs:/source -v $(pwd):/backup alpine tar czf /backup/logs_backup.tar.gz -C /source .
```

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Issues
```bash
# Check database logs
docker logs guardian-postgres

# Verify database connectivity
docker exec guardian-auth-service curl -f http://localhost:8084/actuator/health/db
```

#### 2. Authentication Errors
```bash
# Check Auth Service logs
docker logs guardian-auth-service

# Verify JWT configuration
docker exec guardian-auth-service env | grep JWT
```

#### 3. Admin UI Loading Issues
```bash
# Check Nginx logs
docker logs guardian-admin-ui

# Verify environment variables
docker exec guardian-admin-ui env | grep REACT_APP
```

### Performance Optimization

#### 1. Database Performance
```sql
-- Monitor slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

#### 2. Application Performance
```bash
# Monitor JVM metrics
docker exec guardian-auth-service curl -s http://localhost:8084/actuator/metrics/jvm.memory.used

# Check application logs for performance
docker logs guardian-auth-service | grep -i "slow\|performance"
```

---

## Scaling and Load Balancing

### Horizontal Scaling
```yaml
# Add multiple instances in Dockploy
services:
  guardian-auth:
    scale: 3  # Run 3 instances
    deploy:
      replicas: 3
```

### Load Balancer Configuration
```nginx
# Nginx upstream configuration
upstream guardian_auth {
    server guardian-auth-1:8084;
    server guardian-auth-2:8084;
    server guardian-auth-3:8084;
}
```

---

## Maintenance

### Updates and Deployments
1. **Rolling Updates**: Use Dockploy's rolling deployment feature
2. **Database Migrations**: Run with zero-downtime strategies
3. **Backup Before Updates**: Always backup data before major updates

### Log Management
```bash
# Set log rotation in docker-compose
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

---

## Support and Resources

### Documentation Links
- [API Documentation](./API_DOCUMENTATION.md)
- [Developer Guide](./DEVELOPER_GUIDE.md)
- [Project Summary](./PROJECT_SUMMARY.md)

### Monitoring URLs
- **Auth Service**: `https://auth.yourdomain.com/actuator/health`
- **Admin UI**: `https://admin.yourdomain.com`
- **Database**: Internal network only

---

**For additional support, consult the Dockploy documentation or contact the Guardian Auth Service team.**