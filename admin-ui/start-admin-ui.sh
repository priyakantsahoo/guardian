#!/bin/bash

# Guardian Admin UI Startup Script
# This script starts both the React frontend and Node.js proxy server

set -e  # Exit on any error

echo "🚀 Starting Guardian Admin UI..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill process on port
kill_port() {
    local port=$1
    echo -e "${YELLOW}Killing process on port $port...${NC}"
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed. Please install npm first.${NC}"
    exit 1
fi

# Clean up function
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down services...${NC}"
    kill_port 3000  # React app
    kill_port 3002  # Proxy server
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Check if proxy server dependencies are installed
if [ ! -d "server/node_modules" ]; then
    echo -e "${BLUE}📦 Installing proxy server dependencies...${NC}"
    cd server
    npm install
    cd ..
fi

# Check if React app dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 Installing React app dependencies...${NC}"
    npm install
fi

# Kill existing processes if they're running
if check_port 3000; then
    echo -e "${YELLOW}⚠️  Port 3000 is already in use${NC}"
    kill_port 3000
    sleep 2
fi

if check_port 3002; then
    echo -e "${YELLOW}⚠️  Port 3002 is already in use${NC}"
    kill_port 3002
    sleep 2
fi

# Start the proxy server in the background
echo -e "${GREEN}🔧 Starting proxy server on port 3002...${NC}"
cd server
npm start &
PROXY_PID=$!
cd ..

# Wait for proxy server to start
echo -e "${BLUE}⏳ Waiting for proxy server to start...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:3002/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Proxy server is running${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Proxy server failed to start${NC}"
        kill $PROXY_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
done

# Start the React app
echo -e "${GREEN}⚛️  Starting React app on port 3000...${NC}"
npm start &
REACT_PID=$!

# Wait for React app to start
echo -e "${BLUE}⏳ Waiting for React app to start...${NC}"
for i in {1..60}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ React app is running${NC}"
        break
    fi
    if [ $i -eq 60 ]; then
        echo -e "${RED}❌ React app failed to start${NC}"
        kill $PROXY_PID $REACT_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
done

# Display startup information
echo -e "\n${GREEN}🎉 Guardian Admin UI is running!${NC}"
echo -e "${BLUE}📊 Admin Dashboard: http://localhost:3000${NC}"
echo -e "${BLUE}🔧 Proxy Server: http://localhost:3002${NC}"
echo -e "${BLUE}🔍 Proxy Health: http://localhost:3002/health${NC}"
echo -e "${BLUE}📈 Backend Health: http://localhost:3002/api/health${NC}"
echo -e "\n${YELLOW}Press Ctrl+C to stop all services${NC}"

# Wait for both processes
wait $PROXY_PID $REACT_PID