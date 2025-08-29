# 🐳 Docker Environment Setup Guide

## 🔧 Prerequisites

### Required Software
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (latest version)
- Git (for cloning the repository)

### Environment Setup
1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd ai-school-recommend-app
   ```

2. **Set up environment variables**:
   ```bash
   # Copy the example file
   cp docs/env.local.example .env.local
   
   # Edit the file with your Supabase credentials
   # Required variables:
   # - NEXT_PUBLIC_SUPABASE_URL
   # - NEXT_PUBLIC_SUPABASE_ANON_KEY
   # - SUPABASE_SERVICE_ROLE_KEY
   ```

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

### Available Services
- **🕷️ Crawler Service**: Available (requires crawler/ directory and requirements.txt)

## 🛠️ Common Commands

### Starting Services
```bash
# Start all base services
docker-compose -f docker/docker-compose.yml up -d

# Start specific services
docker-compose -f docker/docker-compose.yml up -d web
docker-compose -f docker/docker-compose.yml --profile crawler up -d crawler
```

### Checking Status
```bash
# Check all service status
docker-compose -f docker/docker-compose.yml ps

# View logs
docker-compose -f docker/docker-compose.yml logs web
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
docker-compose -f docker/docker-compose.yml restart crawler
```

## 🔧 Development Mode

### Real-time Code Updates
- Web application supports hot reload
- Code changes are automatically reflected in the browser
- Node modules and Next.js cache are preserved in Docker volumes
- Crawler code changes require container restart (Python service)

### Debugging
```bash
# Enter container
docker exec -it ai-school-app sh
docker exec -it web-crawler bash

# View real-time logs
docker-compose -f docker/docker-compose.yml logs -f web

## ✅ Quick Verification

### Check if everything is working:
1. **Access the application**: http://localhost:3000
2. **Check container status**: `docker-compose -f docker/docker-compose.yml ps`
3. **View logs**: `docker-compose -f docker/docker-compose.yml logs web`

### Expected behavior:
- ✅ Web application loads at http://localhost:3000
- ✅ Hot reload works when you edit files
- ✅ No error messages in the logs
```

## 📁 File Structure
```
├── docker/                      # Docker configuration folder
│   ├── docker-compose.yml      # Main configuration file
│   ├── start-docker.bat        # Windows startup script
│   ├── start-docker.sh         # Linux/Mac startup script
│   ├── Dockerfile.dev          # Next.js development environment
│   └── Dockerfile.crawler      # Crawler environment
├── components.json             # shadcn/ui configuration
├── eslint.config.mjs           # ESLint configuration
├── postcss.config.mjs          # PostCSS configuration
├── crawler/                     # Python crawler code (in development)
├── requirements.txt             # Python dependencies (in development)
└── docs/                        # Documentation
    └── env.local.example       # Environment variables template
```

## 🚨 Important Notes

1. **Port Conflicts**: Ensure port 3000 is not occupied
2. **Environment Variables**: Copy `docs/env.local.example` to `.env.local` and configure your Supabase credentials
3. **Data Persistence**: Application data stored in Docker volumes
4. **Network**: All services in same network, accessible via service names
5. **Configuration Files**: Configuration files are in the root directory for proper build tool integration
6. **Project Structure**: The project has been reorganized for better maintainability
7. **Crawler Development**: The crawler service is in development - ensure `crawler/` directory and `requirements.txt` exist

## 🔍 Troubleshooting

### Common Issues
1. **Port Occupied**: Modify port mappings in `docker/docker-compose.yml`
2. **Build Failure**: Check Dockerfile and dependency files
3. **Service Won't Start**: View logs with `docker-compose -f docker/docker-compose.yml logs web`
4. **Environment Variables Missing**: Ensure `.env.local` file exists with proper Supabase credentials
5. **Permission Issues**: Make sure Docker has proper permissions to access the project directory

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
- [Supabase Documentation](https://supabase.com/docs)
- [Project Documentation](docs/)
