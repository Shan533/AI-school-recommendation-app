# 🐳 Docker Environment Setup Guide

## 🚀 One-Click Startup

### Windows Users
```bash
# Double-click to run
docker/start-docker.bat

# Or run from command line
.\docker\start-docker.bat
```

### Linux/Mac Users
```bash
# Add execution permissions
chmod +x docker/start-docker.sh

# Run script
./docker/start-docker.sh
```

## 📋 Service Overview

### Base Services (Auto-start)
- **🌐 Web Application**: http://localhost:3000
- **🔴 Redis**: localhost:6379

### Optional Services
- **🕷️ Crawler Service**: `docker-compose -f docker/docker-compose.yml --profile crawler up -d crawler`
- **📊 Redis Monitoring**: `docker-compose -f docker/docker-compose.yml --profile monitoring up -d redis-commander`

## 🛠️ Common Commands

### Starting Services
```bash
# Start all base services
docker-compose -f docker/docker-compose.yml up -d

# Start specific services
docker-compose -f docker/docker-compose.yml up -d web redis
docker-compose -f docker/docker-compose.yml up -d crawler  # Requires --profile crawler
```

### Checking Status
```bash
# Check all service status
docker-compose -f docker/docker-compose.yml ps

# View logs
docker-compose -f docker/docker-compose.yml logs web
docker-compose -f docker/docker-compose.yml logs redis
docker-compose -f docker/docker-compose.yml logs crawler
```

### Stopping Services
```bash
# Stop all services
docker-compose -f docker/docker-compose.yml down

# Stop and remove data volumes
docker-compose -f docker/docker-compose.yml down -v
```

### Restarting Services
```bash
# Restart specific service
docker-compose -f docker/docker-compose.yml restart web
docker-compose -f docker/docker-compose.yml restart redis
```

## 🔧 Development Mode

### Real-time Code Updates
- Web application supports hot reload
- Crawler code changes require container restart

### Debugging
```bash
# Enter container
docker exec -it ai-school-app sh
docker exec -it web-crawler bash

# View real-time logs
docker-compose -f docker/docker-compose.yml logs -f web
```

## 📁 File Structure
```
├── docker/                      # Docker configuration folder
│   ├── docker-compose.yml      # Main configuration file
│   ├── start-docker.bat        # Windows startup script
│   ├── start-docker.sh         # Linux/Mac startup script
│   ├── .dockerignore           # Docker build ignore file
│   ├── Dockerfile              # Next.js production environment
│   ├── Dockerfile.dev          # Next.js development environment
│   └── Dockerfile.crawler      # Crawler environment
├── redis/                       # Redis configuration
│   ├── docker-compose.yml      # Redis standalone configuration
│   └── redis.conf             # Redis configuration file
└── crawler/                     # Python crawler code
```

## 🚨 Important Notes

1. **Port Conflicts**: Ensure ports 3000, 6379, 8081 are not occupied
2. **Environment Variables**: Create `.env` file for database connection configuration
3. **Data Persistence**: Redis data stored in Docker volumes
4. **Network**: All services in same network, accessible via service names

## 🔍 Troubleshooting

### Common Issues
1. **Port Occupied**: Modify port mappings in `docker/docker-compose.yml`
2. **Build Failure**: Check Dockerfile and dependency files
3. **Service Won't Start**: View logs with `docker-compose -f docker/docker-compose.yml logs [service_name]`

### Reset Environment
```bash
# Complete reset
docker-compose -f docker/docker-compose.yml down -v --remove-orphans
docker system prune -f
./docker/start-docker.sh  # or start-docker.bat
```

## 📚 Additional Resources

- [Docker Compose Official Documentation](https://docs.docker.com/compose/)
- [Next.js Docker Deployment](https://nextjs.org/docs/deployment#docker-image)
- [Redis Docker Image](https://hub.docker.com/_/redis)
