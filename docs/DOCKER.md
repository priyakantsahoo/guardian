# Guardian Auth Service - Docker Deployment Guide

This guide explains how to deploy the Guardian Auth Service using Docker and Docker Compose.

## Quick Start

1. **Prerequisites**
   ```bash
   # Install Docker and Docker Compose
   docker --version
   docker-compose --version
   ```

2. **Clone and Setup**
   ```bash
   cd guardian/auth_service
   cp .env.docker .env
   # Edit .env with your production values
   ```

3. **Download GeoLite2 Database** (Optional)
   ```bash
   # Download from MaxMind (requires free account)
   # Place GeoLite2-City.mmdb in auth_service/ directory
   ```

4. **Start Services**
   ```bash
   docker-compose up -d
   ```

5. **Verify Deployment**
   ```bash
   # Check service health
   curl http://localhost:8084/actuator/health
   
   # Access admin UI
   open http://localhost:3000
   ```

## Architecture

The Docker deployment includes:

- **PostgreSQL Database** (port 5432)
- **Guardian Auth Service** (port 8084)  
- **Admin UI Frontend + Proxy** (ports 3000, 3002)

## Services

### PostgreSQL Database
- **Image**: `postgres:15-alpine`
- **Port**: `5432`
- **Database**: `guardian`
- **Volume**: `guardian-postgres-data`
- **Health Check**: `pg_isready`

### Auth Service
- **Build**: Custom Dockerfile with Java 17
- **Port**: `8084`
- **Profiles**: `docker`
- **Health Check**: `/actuator/health`
- **Logs**: `./logs` volume mount

### Admin UI
- **Build**: Multi-stage Node.js 18
- **Ports**: `3000` (React), `3002` (Proxy)
- **Process Manager**: PM2
- **Health Check**: Server ping

## Configuration

### Environment Variables

**Required (Production)**
```bash
JWT_SECRET=your-secure-jwt-secret-here
ADMIN_TOKEN=your-secure-admin-token-here
```

**Optional**
```bash
DB_HOST=postgres
DB_PORT=5432
DB_NAME=guardian
DB_USERNAME=postgres
DB_PASSWORD=guardian_password
GEOLITE2_DATABASE_PATH=./GeoLite2-City.mmdb
LOGGING_LEVEL_ROOT=INFO
```

### Database Initialization

The database is automatically initialized with:
- All required tables and indexes
- Proper foreign key constraints
- Performance optimizations
- Default admin client (for testing)

## Management Commands

### Basic Operations
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f auth-service
docker-compose logs -f postgres

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

### Database Operations
```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d guardian

# Backup database
docker-compose exec postgres pg_dump -U postgres guardian > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres guardian < backup.sql
```

### Maintenance
```bash
# View service status
docker-compose ps

# Update services
docker-compose pull
docker-compose up -d

# Clean up unused images
docker system prune -f
```

## Security Considerations

### Production Checklist

1. **Change Default Secrets**
   ```bash
   # Generate secure JWT secret
   openssl rand -base64 64
   
   # Generate secure admin token
   openssl rand -hex 32
   ```

2. **Database Security**
   - Use strong database password
   - Consider external managed database
   - Enable SSL/TLS connections

3. **Network Security**
   - Use reverse proxy (nginx/traefik)
   - Enable HTTPS with certificates
   - Restrict port access

4. **Container Security**
   - Non-root user in containers
   - Regular security updates
   - Resource limits

### Environment-Specific Configurations

**Development**
```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  auth-service:
    environment:
      LOGGING_LEVEL_COM_EXAMPLE_AUTHSERVICE: DEBUG
      SPRING_JPA_SHOW_SQL: true
    volumes:
      - ./src:/app/src
```

**Production**
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  auth-service:
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
```

## Monitoring

### Health Checks
- **Auth Service**: `http://localhost:8084/actuator/health`
- **Database**: PostgreSQL `pg_isready`
- **Admin UI**: `http://localhost:3002/health`

### Logs
```bash
# Application logs
docker-compose logs -f auth-service

# Database logs  
docker-compose logs -f postgres

# Follow all logs
docker-compose logs -f
```

### Metrics
Access Spring Boot Actuator endpoints:
- Health: `/actuator/health`
- Metrics: `/actuator/metrics`
- Info: `/actuator/info`

## Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   # Change ports in docker-compose.yml
   ports:
     - "8085:8084"  # External:Internal
   ```

2. **Database Connection Issues**
   ```bash
   # Check database is running
   docker-compose ps postgres
   
   # Verify database connectivity
   docker-compose exec auth-service curl postgres:5432
   ```

3. **Permission Issues**
   ```bash
   # Fix volume permissions
   sudo chown -R $USER:$USER ./logs
   ```

4. **Memory Issues**
   ```bash
   # Increase container memory
   environment:
     JAVA_OPTS: "-Xmx1g -Xms512m"
   ```

### Debugging
```bash
# Enter container shell
docker-compose exec auth-service sh

# Check container resources
docker stats

# Inspect container configuration
docker-compose config
```

## Scaling

### Horizontal Scaling
```yaml
# Scale auth service
services:
  auth-service:
    deploy:
      replicas: 3
    depends_on:
      - postgres
      - redis  # Add Redis for session sharing
```

### Load Balancer
```yaml
# Add nginx load balancer
nginx:
  image: nginx:alpine
  ports:
    - "80:80"
  depends_on:
    - auth-service
```

## Backup & Recovery

### Automated Backups
```bash
# Create backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec postgres pg_dump -U postgres guardian > "backup_${DATE}.sql"
```

### Disaster Recovery
1. Backup `.env` file
2. Backup database dumps
3. Backup GeoLite2 database
4. Document custom configurations

---

For additional help, check:
- Application logs: `docker-compose logs auth-service`
- Spring Boot docs: https://spring.io/projects/spring-boot
- Docker Compose docs: https://docs.docker.com/compose/