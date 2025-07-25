#!/bin/bash

# Guardian Admin UI - Dockploy Deployment Script
# This script helps set up environment variables for Admin UI deployment

set -e

echo "🎨 Guardian Admin UI - Dockploy Deployment Setup"
echo "==============================================="

# Check if we're in the correct directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: Please run this script from the admin-ui directory"
    exit 1
fi

echo "🔧 Setting up environment configuration..."

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✅ Created .env file from template"
else
    echo "⚠️  .env file already exists, backing up to .env.backup"
    cp .env .env.backup
fi

# Prompt for required configuration
echo ""
echo "📋 Please provide the following information:"
echo ""

# Auth Service URL
read -p "🔗 Auth Service URL (e.g., https://auth.yourdomain.com): " AUTH_URL
if [ -z "$AUTH_URL" ]; then
    AUTH_URL="https://auth.yourdomain.com"
fi

# Domain for Admin UI
read -p "🌐 Admin UI Domain (e.g., admin.yourdomain.com): " ADMIN_DOMAIN
if [ -z "$ADMIN_DOMAIN" ]; then
    ADMIN_DOMAIN="admin.yourdomain.com"
fi

# Client credentials
echo ""
echo "🔑 Guardian Auth Service Client Credentials:"
echo "   (You should have obtained these from the Auth Service)"
echo ""
read -p "📱 Client ID: " CLIENT_ID
read -p "🔐 Client Key: " CLIENT_KEY

if [ -z "$CLIENT_ID" ] || [ -z "$CLIENT_KEY" ]; then
    echo "❌ Error: Client ID and Client Key are required"
    echo "   Please register the Admin UI as a client in the Auth Service first"
    echo ""
    echo "   Registration command:"
    echo "   curl -X POST ${AUTH_URL}/api/clients/register \\"
    echo "     -H \"Content-Type: application/json\" \\"
    echo "     -d '{\"clientName\": \"Guardian Admin UI\", \"contactEmail\": \"admin@yourdomain.com\"}'"
    echo ""
    exit 1
fi

# Update .env file
sed -i "s|GUARDIAN_CLIENT_ID=.*|GUARDIAN_CLIENT_ID=${CLIENT_ID}|" .env
sed -i "s|GUARDIAN_CLIENT_KEY=.*|GUARDIAN_CLIENT_KEY=${CLIENT_KEY}|" .env
sed -i "s|REACT_APP_API_URL=.*|REACT_APP_API_URL=${AUTH_URL}|" .env
sed -i "s|REACT_APP_PROXY_URL=.*|REACT_APP_PROXY_URL=https://${ADMIN_DOMAIN}|" .env
sed -i "s|BACKEND_URL=.*|BACKEND_URL=${AUTH_URL}|" .env
sed -i "s|DOMAIN=.*|DOMAIN=${ADMIN_DOMAIN}|" .env

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

# Check Node.js setup for local development
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js detected: ${NODE_VERSION}"
else
    echo "⚠️  Node.js not found (only needed for local development)"
fi

echo "✅ Docker setup validated"

# Display configuration summary
echo ""
echo "📋 Configuration Summary:"
echo "========================"
echo "Auth Service URL: ${AUTH_URL}"
echo "Admin UI Domain:  ${ADMIN_DOMAIN}"
echo "Client ID:        ${CLIENT_ID}"
echo "Client Key:       ${CLIENT_KEY:0:8}..."
echo ""

# Display next steps
echo "🚀 Ready for Dockploy Deployment!"
echo "================================="
echo ""
echo "Next steps:"
echo "1. Copy the following environment variables to Dockploy:"
echo ""
echo "   GUARDIAN_CLIENT_ID=${CLIENT_ID}"
echo "   GUARDIAN_CLIENT_KEY=${CLIENT_KEY}"
echo "   REACT_APP_API_URL=${AUTH_URL}"
echo "   REACT_APP_PROXY_URL=https://${ADMIN_DOMAIN}"
echo "   BACKEND_URL=${AUTH_URL}"
echo "   UI_PORT=80"
echo "   PROXY_PORT=3002"
echo "   DOMAIN=${ADMIN_DOMAIN}"
echo "   NODE_ENV=production"
echo ""
echo "2. Set up your Dockploy application:"
echo "   - Repository: Your Guardian repository URL"
echo "   - Build Path: admin-ui"
echo "   - Docker Compose File: docker-compose.yml"
echo "   - Domain: ${ADMIN_DOMAIN}"
echo "   - Port: 80"
echo ""
echo "3. After deployment, create an admin user:"
echo "   curl -X POST ${AUTH_URL}/api/auth/signup \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -H \"X-Client-Id: ${CLIENT_ID}\" \\"
echo "     -H \"X-Client-Key: ${CLIENT_KEY}\" \\"
echo "     -d '{\"email\": \"admin@yourdomain.com\", \"password\": \"SecurePassword123!\", \"firstName\": \"Admin\", \"lastName\": \"User\"}'"
echo ""
echo "4. Access your Admin UI at: https://${ADMIN_DOMAIN}"
echo ""
echo "📚 Full documentation: docs/DOCKPLOY_DEPLOYMENT.md"
echo ""

# Test local build (optional)
read -p "🧪 Test local build with docker-compose? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔄 Building Admin UI locally..."
    docker-compose build
    
    echo "🚀 Starting local test deployment..."
    docker-compose up -d
    
    echo "⏳ Waiting for services to start..."
    sleep 20
    
    # Check health
    if curl -f http://localhost:80 &> /dev/null; then
        echo "✅ Admin UI is running!"
        echo "   Access URL: http://localhost"
        echo "   Proxy Server: http://localhost:3002"
    else
        echo "❌ Admin UI health check failed"
        echo "   Check logs: docker-compose logs guardian-admin-ui"
    fi
    
    echo ""
    echo "🛑 To stop test deployment: docker-compose down"
fi

echo ""
echo "🎉 Admin UI deployment setup complete!"