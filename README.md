# Guardian Authentication Service 🛡️

[![Java](https://img.shields.io/badge/Java-17-orange.svg)](https://openjdk.java.net/projects/jdk/17/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 📋 Overview

Guardian is a comprehensive, enterprise-grade authentication service that provides secure multi-tenant user authentication with JWT tokens, comprehensive audit logging, and a modern admin dashboard. Built with Spring Boot and React, it's designed for applications requiring robust authentication infrastructure.

### 🌟 Key Features

- **🔐 Multi-tenant Authentication**: Isolated user spaces per client application
- **🎟️ JWT-based Security**: Stateless authentication with 1-hour token expiration
- **📊 Admin Dashboard**: Modern React-based UI with real-time monitoring
- **📈 Comprehensive Auditing**: Full forensic data capture with geolocation
- **🔒 Rate Limiting**: Protection against brute force attacks
- **🌐 Geolocation Tracking**: GeoLite2 integration for security analytics
- **🎨 Dark/Light Themes**: User preference support in admin UI
- **🐳 Docker Ready**: Complete containerization for easy deployment

## 🏗️ Architecture

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   Admin UI          │    │   Auth Service      │    │   PostgreSQL        │
│   (React + Nginx)   │◄──►│   (Spring Boot)     │◄──►│   Database          │
│   Port: 80          │    │   Port: 8084        │    │   Port: 5432        │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Java 17+
- Node.js 18+
- PostgreSQL 15+
- Docker & Docker Compose (optional)

### 1. Clone Repository

```bash
git clone https://github.com/priyakantsahoo/guardian.git
cd guardian
```

### 2. Start with Docker (Recommended)

```bash
# Start Auth Service with Database
cd auth_service
docker-compose up -d

# Start Admin UI (in another terminal)
cd ../admin-ui
docker-compose up -d
```

### 3. Manual Setup

#### Auth Service Setup

```bash
cd auth_service

# Configure database connection in application.properties
# Update PostgreSQL connection details

# Build and run
./mvnw spring-boot:run
```

#### Admin UI Setup

```bash
cd admin-ui

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm start

# Or build for production
npm run build
```

## 📚 API Usage

### Register Your Application

```bash
curl -X POST http://localhost:8084/api/clients/register \
  -H "Content-Type: application/json" \
  -d '{
    "clientName": "My App",
    "contactEmail": "admin@myapp.com",
    "description": "My awesome application"
  }'
```

### User Registration

```bash
curl -X POST http://localhost:8084/api/auth/signup \
  -H "Content-Type: application/json" \
  -H "X-Client-Id: YOUR_CLIENT_ID" \
  -H "X-Client-Key: YOUR_CLIENT_KEY" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### User Login

```bash
curl -X POST http://localhost:8084/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Client-Id: YOUR_CLIENT_ID" \
  -H "X-Client-Key: YOUR_CLIENT_KEY" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'
```

## 🔧 Configuration

### Environment Variables

#### Auth Service

```bash
# Database
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/authdb
SPRING_DATASOURCE_USERNAME=authuser
SPRING_DATASOURCE_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secure_jwt_secret_key
JWT_EXPIRATION=3600000

# Application
SERVER_PORT=8084
LOGGING_LEVEL_ROOT=INFO
```

#### Admin UI

```bash
# Guardian Configuration
REACT_APP_API_URL=http://localhost:3002
REACT_APP_GUARDIAN_CLIENT_ID=your_client_id
REACT_APP_GUARDIAN_CLIENT_KEY=your_client_key

# Server Configuration
BACKEND_URL=http://localhost:8084
```

## 🐳 Dockploy Deployment

Guardian is optimized for deployment on Dockploy with separate services:

### Auth Service Deployment

1. **Create Dockploy Application**
   - Repository: `https://github.com/priyakantsahoo/guardian.git`
   - Build Path: `auth_service`
   - Docker Compose: `docker-compose.yml`

2. **Environment Configuration**
   ```bash
   DB_PASSWORD=your_secure_password
   JWT_SECRET=your_jwt_secret
   AUTH_PORT=8084
   LOG_LEVEL=INFO
   ```

3. **Domain Setup**
   - Domain: `auth.yourdomain.com`
   - Port: `8084`

### Admin UI Deployment

1. **Create Dockploy Application**
   - Repository: `https://github.com/priyakantsahoo/guardian.git`
   - Build Path: `admin-ui`
   - Docker Compose: `docker-compose.yml`

2. **Environment Configuration**
   ```bash
   GUARDIAN_CLIENT_ID=your_client_id
   GUARDIAN_CLIENT_KEY=your_client_key
   REACT_APP_API_URL=https://auth.yourdomain.com
   DOMAIN=admin.yourdomain.com
   ```

3. **Domain Setup**
   - Domain: `admin.yourdomain.com`
   - Port: `80`

For detailed deployment instructions, see [Dockploy Deployment Guide](docs/DOCKPLOY_DEPLOYMENT.md).

## 📖 Documentation

- **[API Documentation](docs/API_DOCUMENTATION.md)** - Complete API reference
- **[Developer Guide](docs/DEVELOPER_GUIDE.md)** - Integration and development guide
- **[Dockploy Deployment](docs/DOCKPLOY_DEPLOYMENT.md)** - Production deployment guide
- **[Project Summary](docs/PROJECT_SUMMARY.md)** - Complete project overview

## 🛡️ Security Features

- **JWT Authentication**: HS512 algorithm with configurable expiration
- **Rate Limiting**: 5 failed attempts per 5 minutes per client
- **Password Security**: BCrypt hashing with salt
- **Session Management**: Active session tracking and deactivation
- **Audit Logging**: Comprehensive forensic data capture
- **CORS Protection**: Configurable cross-origin resource sharing
- **API Key Management**: Secure client credential rotation

## 🎨 Admin Dashboard Features

- **📊 Real-time Dashboard**: System statistics and health monitoring
- **👥 User Management**: View, search, and manage user accounts
- **🏢 Client Management**: CRUD operations for client applications
- **📋 Audit Log Viewer**: Comprehensive activity logging with filtering
- **💚 System Health**: Monitor API performance and database status
- **🌓 Theme Support**: Dark/light mode with persistent preferences
- **🔐 Secure Authentication**: JWT-based admin access with token management

## 🔧 Development

### Running Tests

```bash
# Auth Service tests
cd auth_service
./mvnw test

# Admin UI tests
cd admin-ui
npm test
```

### Building for Production

```bash
# Auth Service
cd auth_service
./mvnw clean package

# Admin UI
cd admin-ui
npm run build
```

## 📊 System Requirements

### Minimum Requirements

- **CPU**: 2 cores
- **RAM**: 2GB
- **Storage**: 5GB
- **Database**: PostgreSQL 12+

### Recommended (Production)

- **CPU**: 4+ cores
- **RAM**: 4GB+
- **Storage**: 20GB+ SSD
- **Database**: PostgreSQL 15+ with dedicated instance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/priyakantsahoo/guardian/issues)
- **Discussions**: [GitHub Discussions](https://github.com/priyakantsahoo/guardian/discussions)

## 🙏 Acknowledgments

- **Spring Boot** - Robust backend framework
- **React** - Modern frontend library
- **Material-UI** - Beautiful React components
- **PostgreSQL** - Reliable database system
- **MaxMind GeoLite2** - Geolocation data
- **Claude Code** - AI-assisted development

---

**Built with ❤️ for secure, scalable authentication**

🤖 *Generated with [Claude Code](https://claude.ai/code)*