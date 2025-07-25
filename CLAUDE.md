# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Guardian is a Spring Boot authentication microservice that provides multi-tenant user authentication with JWT tokens and client API key management. The service runs on port 8084 and uses PostgreSQL as the primary database.

## Development Commands

All commands should be run from the `auth_service/` directory.

### Build and Run
```bash
# Build the project
./mvnw clean install

# Run the application
./mvnw spring-boot:run

# Run with specific profile
./mvnw spring-boot:run -Dspring.profiles.active=dev

# Package as JAR
./mvnw package
```

### Testing
```bash
# Run all tests
./mvnw test

# Run a specific test class
./mvnw test -Dtest=AuthserviceApplicationTests

# Run tests with coverage
./mvnw test jacoco:report
```

### Database Setup
Ensure PostgreSQL is running on `localhost:5432` with database `authdb`. The application uses auto-DDL update mode.

## Architecture

### Multi-Tenant Design
- Each client application registers and receives unique `clientId` and `clientKey`
- Users belong to specific clients (same email can exist across different clients)
- All API requests require client authentication via headers

### Security Layers
1. **API Key Filter** (`ApiKeyAuthFilter`): Validates client credentials in headers
2. **JWT Authentication**: Manages user sessions with 1-hour token expiration
3. **Spring Security**: Configured for stateless authentication

### Key Components
- **Controllers**: `AuthController` (user auth), `ClientController` (client registration)
- **Services**: `AuthService`, `JwtService`, `ClientService`, `AuditLogService`
- **Entities**: `User` (user accounts), `Client` (API clients), `AuditLog` (audit trail)

### API Endpoints
- `POST /api/clients/register` - Register new client application
- `POST /api/auth/signup` - User registration (requires client headers)
- Login and validation endpoints are configured but not yet implemented

### Request Headers
All authenticated requests require:
- `X-Client-Id`: Client's unique ID
- `X-Client-Key`: Client's API key

## Current Implementation Status

### Completed
- Client registration and validation
- User signup with client isolation
- JWT token generation
- Basic security configuration

### Pending Implementation
- Login endpoint (`/api/auth/login`)
- Token validation endpoint (`/api/auth/validate`)
- Admin endpoints (`/api/auth/admin/**`)
- Audit logging (service exists but calls are commented out)

## Configuration Notes

The application uses `application.properties` with:
- JWT secret and 1-hour expiration
- PostgreSQL connection (credentials currently hardcoded)
- Debug logging enabled for Spring Security and MVC

For production deployment, externalize sensitive configuration values and disable auto-DDL mode.