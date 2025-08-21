#!/bin/bash

echo "========================================"
echo "   AI School Recommendation App"
echo "   One-Click Docker Environment"
echo "========================================"
echo

# Check if Docker is running
echo "🔍 Checking Docker status..."
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running, please start Docker Desktop first"
    exit 1
fi
echo "✅ Docker is running"

# Stop and remove existing containers
echo
echo "🧹 Cleaning up existing containers..."
docker-compose -f docker/docker-compose.yml down --remove-orphans
echo "✅ Cleanup completed"

# Start base services (Web + Redis)
echo
echo "🚀 Starting base services (Web + Redis)..."
if ! docker-compose -f docker/docker-compose.yml up -d web redis; then
    echo "❌ Failed to start base services"
    exit 1
fi
echo "✅ Base services started successfully"

# Wait for services to be ready
echo
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service status
echo
echo "🔍 Checking service status..."
docker-compose -f docker/docker-compose.yml ps

echo
echo "========================================"
echo "🎉 Environment startup completed!"
echo
echo "📱 Web Application: http://localhost:3000"
echo "🔴 Redis: localhost:6379"
echo
echo "💡 Optional services:"
echo "   Start crawler: docker-compose -f docker/docker-compose.yml --profile crawler up -d crawler"
echo "   Start monitoring: docker-compose -f docker/docker-compose.yml --profile monitoring up -d redis-commander"
echo
echo "🛑 Stop services: docker-compose -f docker/docker-compose.yml down"
echo "========================================"
echo

# Ask if user wants to start crawler
read -p "Do you want to start the crawler service? (y/n): " start_crawler
if [[ $start_crawler =~ ^[Yy]$ ]]; then
    echo
    echo "🕷️ Starting crawler service..."
    if docker-compose -f docker/docker-compose.yml --profile crawler up -d crawler; then
        echo "✅ Crawler service started successfully"
        echo "📊 Crawler status: docker-compose -f docker/docker-compose.yml ps crawler"
    else
        echo "❌ Failed to start crawler service"
    fi
fi

echo
read -p "Press Enter to continue..."
