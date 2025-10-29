#!/bin/bash

# SpaceGraphJS4 Demo Server Startup Script

echo "Starting SpaceGraphJS4 Demo Server..."
echo "===================================="

# Check if node is installed
if ! command -v node &> /dev/null
then
    echo "Node.js is not installed. Please install Node.js to run the demo."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null
then
    echo "npm is not installed. Please install npm to run the demo."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start the demo server
echo "Starting demo server on http://localhost:3000"
echo "Press Ctrl+C to stop the server"
echo ""
echo "Available demos:"
echo "  - Comprehensive Demo: http://localhost:3000/demo/comprehensive-demo.html"
echo "  - Integration Tests: http://localhost:3000/demo/integration-tests.html"
echo "  - Physics Demo: http://localhost:3000/demo/physics-demo.html"
echo ""

npx serve .