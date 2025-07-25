# Guardian Auth Service - Implementation Todo List

## High Priority Tasks

### Security Fixes (CRITICAL)
- [ ] Feature 1 - User Registration: Add BCrypt password hashing (currently plain text)
- [ ] Security: Replace hardcoded JWT secret with environment variable
- [ ] Security: Replace hardcoded database password with environment variable

### Core Authentication
- [ ] Feature 2 - User Login: Implement complete login endpoint (/api/auth/login)
- [ ] Feature 2 - User Login: Add JWT 'jti' claim for session tracking
- [ ] Feature 3 - Session Management: Create Session entity and repository
- [ ] Feature 3 - Session Management: Implement SessionService with idle timeout checks
- [ ] Feature 3 - Session Management: Implement token validation endpoint (/api/auth/validate)

### Database & Infrastructure
- [ ] Infrastructure: Create PostgreSQL schema with all required tables and indexes

### Security Features
- [ ] Feature 5 - Rate Limiting: Create RateLimit entity and repository
- [ ] Feature 5 - Rate Limiting: Implement RateLimitService (5 attempts/5 minutes)
- [ ] Feature 5 - Rate Limiting: Return 429 Too Many Requests on limit exceeded

### Audit Logging
- [ ] Feature 4 - Audit Logging: Add all required fields (user_agent, request_method, endpoint, session_id, response_status, geo_country, geo_city, request_id, error_code)

### Admin Interface
- [ ] Feature 6 - Admin UI: Create React-based admin dashboard
- [ ] Feature 6 - Admin UI: Implement AdminController with user/log/client management endpoints
- [ ] Feature 6 - Admin UI: Add admin role authorization (@PreAuthorize)

## Medium Priority Tasks

### Feature Enhancements
- [ ] Feature 1 - User Registration: Activate audit logging (currently commented out)
- [ ] Feature 1 - User Registration: Add HttpServletRequest parameter to signup method
- [ ] Feature 3 - Session Management: Add in-memory session cache for performance
- [ ] Feature 4 - Audit Logging: Implement GeoService with offline GeoLite2 support
- [ ] Feature 4 - Audit Logging: Make logging asynchronous with @Async annotation
- [ ] Feature 6 - Admin UI: Create Node.js backend proxy for admin UI
- [ ] Feature 7 - Client Onboarding: Add secure client key generation (Base64 encoded)

### Infrastructure
- [ ] Infrastructure: Add Spring Boot Async configuration
- [ ] Infrastructure: Add Docker configuration (Dockerfile and docker-compose.yml)

## Low Priority Tasks

- [ ] Infrastructure: Add GeoLite2 database integration

## Completed Tasks

- [x] Review and understand PDF requirements for self-hosted Auth service
- [x] Analyze existing codebase implementation

## Task Breakdown by Feature

### Feature 1: User Registration (70% Complete)
- Missing: Password hashing, audit logging activation, request tracking

### Feature 2: User Login (0% Complete)
- Missing: Everything - no implementation exists

### Feature 3: Session Management (10% Complete)
- Missing: Session entity, service, validation endpoint, caching

### Feature 4: Audit Logging (60% Complete)
- Missing: Additional fields, geo-location, async processing

### Feature 5: Rate Limiting (0% Complete)
- Missing: Everything - no implementation exists

### Feature 6: Admin UI (0% Complete)
- Missing: Everything - no implementation exists

### Feature 7: Client Onboarding (80% Complete)
- Missing: Secure key generation

## Development Schedule Estimate

### Week 1
- Day 1-2: Critical security fixes (password hashing, externalize secrets)
- Day 3-5: Implement login and session management

### Week 2
- Day 6-7: Add rate limiting
- Day 8-9: Complete audit logging
- Day 10: Infrastructure improvements

### Week 3
- Day 11-13: Build admin UI
- Day 14-15: Docker setup and deployment preparation
- Day 16-17: Testing and documentation

## Notes

1. **CRITICAL**: The application currently stores passwords in plain text. This must be fixed immediately before any deployment.

2. **Security**: JWT secret and database passwords are hardcoded in application.properties. These should be externalized to environment variables.

3. **Database**: A complete PostgreSQL schema needs to be created with proper indexes for performance.

4. **Dependencies**: Additional Maven dependencies are needed for BCrypt, GeoIP2, and async support.

5. **Testing**: No tests currently exist. Unit and integration tests should be added for all new features.

6. **Documentation**: API documentation should be created, possibly using OpenAPI/Swagger.

## Quick Start Commands

```bash
# Navigate to auth service directory
cd /home/skyva/projects/guardian/auth_service

# Build the project
./mvnw clean install

# Run the application
./mvnw spring-boot:run

# Run tests (when implemented)
./mvnw test
```

## Important Files to Review

- `/auth_service/src/main/java/com/example/authservice/service/AuthService.java` - Needs password hashing
- `/auth_service/src/main/resources/application.properties` - Needs externalization
- `/auth_service/src/main/java/com/example/authservice/controller/AuthController.java` - Missing login endpoint
- `/auth_service/src/main/java/com/example/authservice/config/SecurityConfig.java` - Needs updates for new endpoints