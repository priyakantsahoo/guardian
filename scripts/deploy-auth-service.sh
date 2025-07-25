#!/bin/bash

# Guardian Auth Service - Dockploy Deployment Script
# This script helps set up environment variables and validates the deployment

set -e

echo "🛡️  Guardian Auth Service - Dockploy Deployment Setup"
echo "======================================================"

# Check if we're in the correct directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: Please run this script from the auth_service directory"
    exit 1
fi

# Function to generate a secure JWT secret
generate_jwt_secret() {
    openssl rand -base64 64 | tr -d "=+/" | cut -c1-64
}

# Function to generate a secure password
generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-24
}

echo "🔧 Setting up environment configuration..."

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✅ Created .env file from template"
else
    echo "⚠️  .env file already exists, backing up to .env.backup"
    cp .env .env.backup
fi

# Generate secure values
JWT_SECRET=$(generate_jwt_secret)
DB_PASSWORD=$(generate_password)

echo "🔑 Generated secure credentials:"
echo "   - JWT Secret: ${JWT_SECRET:0:20}..."
echo "   - DB Password: ${DB_PASSWORD:0:8}..."

# Update .env file
sed -i "s|JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" .env
sed -i "s|DB_PASSWORD=.*|DB_PASSWORD=${DB_PASSWORD}|" .env

echo "📝 Environment variables configured in .env file"

# Validate Docker setup
echo "🐳 Validating Docker setup..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in PATH"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed or not in PATH"
    exit 1
fi

# Check if GeoLite2 database exists
if [ ! -f "GeoLite2-City.mmdb" ]; then
    echo "⚠️  GeoLite2-City.mmdb not found"
    echo "   Download it from MaxMind and place it in this directory"
    echo "   Or set GEOLITE2_ENABLED=false in .env"
fi

echo "✅ Docker setup validated"

# Display next steps
echo ""
echo "🚀 Ready for Dockploy Deployment!"
echo "================================="
echo ""
echo "Next steps:"
echo "1. Copy the following environment variables to Dockploy:"
echo ""
echo "   DB_PASSWORD=${DB_PASSWORD}"
echo "   JWT_SECRET=${JWT_SECRET}"
echo "   JWT_EXPIRATION=3600000"
echo "   AUTH_PORT=8084"
echo "   LOG_LEVEL=INFO"
echo "   ADMIN_ENABLED=true"
echo "   GEOLITE2_ENABLED=true"
echo ""
echo "2. Set up your Dockploy application:"
echo "   - Repository: Your Guardian repository URL"
echo "   - Build Path: auth_service"
echo "   - Docker Compose File: docker-compose.yml"
echo "   - Domain: auth.yourdomain.com"
echo "   - Port: 8084"
echo ""
echo "3. After deployment, register Admin UI as a client:"
echo "   curl -X POST https://auth.yourdomain.com/api/clients/register \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"clientName\": \"Guardian Admin UI\", \"contactEmail\": \"admin@yourdomain.com\"}'"
echo ""
echo "4. Create an admin user with the returned client credentials"
echo ""
echo "📚 Full documentation: docs/DOCKPLOY_DEPLOYMENT.md"
echo ""

# Test local deployment (optional)
read -p "🧪 Test local deployment with docker-compose? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔄 Starting local test deployment..."
    docker-compose up -d
    
    echo "⏳ Waiting for services to start..."
    sleep 30
    
    # Check health
    if curl -f http://localhost:8084/actuator/health &> /dev/null; then
        echo "✅ Auth Service is healthy!"
        echo "   Health Check: http://localhost:8084/actuator/health"
        echo "   API Base URL: http://localhost:8084/api"
    else
        echo "❌ Auth Service health check failed"
        echo "   Check logs: docker-compose logs guardian-auth"
    fi
    
    echo ""
    echo "🛑 To stop test deployment: docker-compose down"
fi

echo ""
echo "🎉 Deployment setup complete!"