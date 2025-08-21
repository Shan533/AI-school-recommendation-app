# 🚀 Quick Start Guide

## 🐳 Docker Environment (Recommended)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Git

### One-Click Startup

**Windows:**
```bash
# Double-click or run:
.\docker\start-docker.bat
```

**Linux/Mac:**
```bash
# Add permissions and run:
chmod +x docker/start-docker.sh
./docker/start-docker.sh
```

### What You Get
- 🌐 **Web App**: http://localhost:3000
- 🔴 **Redis**: localhost:6379
- 🕷️ **Crawler**: Optional Python service
- 📊 **Monitoring**: Optional Redis Commander

## 🛠️ Local Development

### Prerequisites
- Node.js 18+
- Python 3.11+
- Redis

### Setup
```bash
# Install Node.js dependencies
npm install

# Install Python dependencies
pip install -r requirements.txt

# Start Redis (if not using Docker)
redis-server

# Start development server
npm run dev
```

## 📚 Next Steps

1. **Read Documentation**: Check [docs/](docs/) for detailed guides
2. **Docker Setup**: See [docker/README.md](docker/README.md) for Docker usage
3. **Development**: Follow [docs/implementation-plan.md](docs/implementation-plan.md)

## 🆘 Need Help?

- 📖 [Documentation](docs/)
- 🐳 [Docker Guide](docker/README.md)
- 🧪 [Testing Guide](docs/testing-guide.md)
- 🐛 [GitHub Issues](https://github.com/your-repo/issues)

---

**Happy Coding! 🎉**
