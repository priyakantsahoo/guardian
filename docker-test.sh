#!/bin/bash

# Guardian Auth Service Docker Test Script
# Tests the Docker Compose setup

set -e

echo "🐳 Guardian Auth Service - Docker Test Suite"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="auth_service/docker-compose.yml"
ENV_FILE="auth_service/.env"

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "success") echo -e "${GREEN}✅ $message${NC}" ;;
        "error") echo -e "${RED}❌ $message${NC}" ;;
        "warning") echo -e "${YELLOW}⚠️  $message${NC}" ;;
        "info") echo -e "ℹ️  $message" ;;
    esac
}

# Check prerequisites
check_prerequisites() {
    print_status "info" "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        print_status "error" "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        if ! docker compose version &> /dev/null; then
            print_status "error" "Docker Compose is not installed"
            exit 1
        fi
        COMPOSE_CMD="docker compose"
    else
        COMPOSE_CMD="docker-compose"
    fi
    
    print_status "success" "Prerequisites check passed"
}

# Check configuration files
check_config() {
    print_status "info" "Checking configuration files..."
    
    if [ ! -f "$COMPOSE_FILE" ]; then
        print_status "error" "Docker Compose file not found: $COMPOSE_FILE"
        exit 1
    fi
    
    if [ ! -f "$ENV_FILE" ]; then
        print_status "warning" "Environment file not found: $ENV_FILE"
        print_status "info" "Creating from template..."
        cp auth_service/.env.docker "$ENV_FILE"
    fi
    
    print_status "success" "Configuration files check passed"
}

# Validate Docker Compose file
validate_compose() {
    print_status "info" "Validating Docker Compose configuration..."
    
    cd auth_service
    if $COMPOSE_CMD config > /dev/null 2>&1; then
        print_status "success" "Docker Compose configuration is valid"
    else
        print_status "error" "Docker Compose configuration is invalid"
        $COMPOSE_CMD config
        exit 1
    fi
    cd ..
}

# Test Docker build
test_build() {
    print_status "info" "Testing Docker build..."
    
    cd auth_service
    if docker build -t guardian-auth:test . > /dev/null 2>&1; then
        print_status "success" "Auth service Docker build successful"
    else
        print_status "error" "Auth service Docker build failed"
        exit 1
    fi
    cd ..
    
    cd admin-ui
    if docker build -t guardian-admin:test . > /dev/null 2>&1; then
        print_status "success" "Admin UI Docker build successful"
    else
        print_status "error" "Admin UI Docker build failed"
        exit 1
    fi
    cd ..
}

# Test full deployment
test_deployment() {
    print_status "info" "Testing full deployment..."
    
    cd auth_service
    
    # Start services
    print_status "info" "Starting services..."
    $COMPOSE_CMD up -d
    
    # Wait for services to start
    print_status "info" "Waiting for services to start..."
    sleep 30
    
    # Check service status
    if $COMPOSE_CMD ps | grep -q "Up"; then
        print_status "success" "Services are running"
    else
        print_status "error" "Some services failed to start"
        $COMPOSE_CMD ps
        exit 1
    fi
    
    # Test health endpoints
    print_status "info" "Testing health endpoints..."
    
    # Test PostgreSQL
    if $COMPOSE_CMD exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
        print_status "success" "PostgreSQL is healthy"
    else
        print_status "error" "PostgreSQL health check failed"
    fi
    
    # Test Auth Service (with retry)
    for i in {1..10}; do
        if curl -f http://localhost:8084/actuator/health > /dev/null 2>&1; then
            print_status "success" "Auth Service is healthy"
            break
        elif [ $i -eq 10 ]; then
            print_status "error" "Auth Service health check failed after 10 attempts"
        else
            print_status "info" "Waiting for Auth Service... (attempt $i/10)"
            sleep 10
        fi
    done
    
    # Test Admin UI
    if curl -f http://localhost:3002/health > /dev/null 2>&1; then
        print_status "success" "Admin UI is healthy"
    else
        print_status "error" "Admin UI health check failed"
    fi
    
    cd ..
}

# Test API endpoints
test_api() {
    print_status "info" "Testing API endpoints..."
    
    # Test client registration
    RESPONSE=$(curl -s -X POST http://localhost:3002/api/clients/register \
        -H "Content-Type: application/json" \
        -H "X-Admin-Token: admin-secure-docker-token-change-me" \
        -d '{"name": "Docker Test Client", "description": "Testing Docker deployment", "idleTimeoutMinutes": 30}')
    
    if echo "$RESPONSE" | grep -q "clientId"; then
        print_status "success" "Client registration API works"
        CLIENT_ID=$(echo "$RESPONSE" | grep -o '"clientId":"[^"]*"' | cut -d'"' -f4)
        print_status "info" "Created test client: $CLIENT_ID"
    else
        print_status "error" "Client registration API failed"
        echo "Response: $RESPONSE"
    fi
    
    # Test admin stats
    if curl -f -H "X-Admin-Token: admin-secure-docker-token-change-me" \
            http://localhost:3002/api/admin/stats > /dev/null 2>&1; then
        print_status "success" "Admin stats API works"
    else
        print_status "error" "Admin stats API failed"
    fi
}

# Cleanup
cleanup() {
    print_status "info" "Cleaning up test resources..."
    
    cd auth_service
    $COMPOSE_CMD down -v > /dev/null 2>&1 || true
    cd ..
    
    # Remove test images
    docker rmi guardian-auth:test guardian-admin:test > /dev/null 2>&1 || true
    
    print_status "success" "Cleanup completed"
}

# Main execution
main() {
    print_status "info" "Starting Docker test suite..."
    
    check_prerequisites
    check_config
    validate_compose
    test_build
    
    if [ "${1:-}" = "--deploy" ]; then
        test_deployment
        test_api
        
        print_status "info" "Deployment is running. Press Ctrl+C to stop and cleanup."
        trap cleanup EXIT
        
        # Keep script running to maintain deployment
        while true; do
            sleep 30
            print_status "info" "Services still running... (Ctrl+C to stop)"
        done
    else
        print_status "success" "All Docker tests passed!"
        print_status "info" "Run with --deploy flag to test full deployment"
    fi
}

# Run main function
main "$@"