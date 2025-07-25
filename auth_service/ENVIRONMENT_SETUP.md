# Environment Setup Guide

## Quick Start

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Update the `.env` file with your actual values:**
   - Set your database connection details
   - Generate a secure JWT secret (32+ characters)
   - Configure any other environment-specific settings

3. **Start the application:**
   ```bash
   ./mvnw spring-boot:run
   ```

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DB_HOST` | Database host | localhost | Yes |
| `DB_PORT` | Database port | 5432 | Yes |
| `DB_NAME` | Database name | guardian | Yes |
| `DB_USERNAME` | Database username | postgres | Yes |
| `DB_PASSWORD` | Database password | password | Yes |
| `JWT_SECRET` | JWT signing secret | default-secret-change-in-production | Yes |
| `JWT_EXPIRATION` | JWT expiration time (ms) | 3600000 | No |
| `SERVER_PORT` | Application port | 8084 | No |

## Security Notes

### Development
- Use the `.env` file for local development
- Never commit `.env` files to version control
- Use strong, unique secrets for each environment

### Production
Replace the `.env` approach with proper secrets management:

#### AWS
```bash
# Use AWS Secrets Manager
aws secretsmanager get-secret-value --secret-id guardian-auth-secrets
```

#### Kubernetes
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: guardian-auth-secrets
type: Opaque
data:
  jwt-secret: <base64-encoded-secret>
  db-password: <base64-encoded-password>
```

#### Docker
```bash
# Use Docker secrets
docker run -d \
  --env-file .env \
  guardian-auth:latest
```

#### Environment Variables
```bash
# Set directly in deployment system
export JWT_SECRET="your-production-secret"
export DB_PASSWORD="your-production-password"
```

## JWT Secret Generation

Generate a secure JWT secret:

```bash
# Option 1: Using OpenSSL
openssl rand -base64 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Using Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

## Troubleshooting

### Environment Variables Not Loading
1. Ensure `.env` file exists in the application root
2. Check file permissions (should be readable)
3. Verify environment variable names match exactly
4. Check application logs for dotenv loading messages

### Database Connection Issues
1. Verify database credentials in `.env`
2. Ensure database server is running
3. Check network connectivity
4. Verify database name exists

### JWT Issues
1. Ensure JWT_SECRET is set and at least 32 characters
2. Check JWT_EXPIRATION is a valid number in milliseconds
3. Verify secret consistency across restarts