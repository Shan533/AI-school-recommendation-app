# 🚀 Quick Start Guide

## 🎯 Overview

The AI School Recommendation App is a modern web application built with Next.js 15, React 19, and Supabase.

## 🐳 Docker Environment (Recommended)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### One-Click Startup

**Windows:**
```bash
.\docker\start-docker.bat
```

**Linux/Mac:**
```bash
chmod +x docker/start-docker.sh
./docker/start-docker.sh
```

### What You Get
- 🌐 **Web App**: http://localhost:3000
- 🔐 **Authentication**: Supabase Auth integration
- 📊 **Database**: PostgreSQL with RLS policies

## 🛠️ Local Development

### Prerequisites
- [Node.js 18+](https://nodejs.org/)
- [Supabase Account](https://supabase.com/)

### Setup
```bash
# Clone and install
git clone https://github.com/your-username/ai-school-recommend-app.git
cd ai-school-recommend-app
npm install

# Set up environment
cp env.local.example .env.local
# Edit .env.local with your Supabase credentials

# Start development server
npm run dev
```

### Environment Variables
Create a `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 🧪 Testing

```bash
# Jest (Pure Functions) - 65 tests
npm test
npm run test:ci

# Vitest (Server Components) - 51 tests  
npm run test:vitest
npm run test:vitest:ci

# Run All Tests - 116 total
npm run test:all
```

## 📚 Documentation

- **[Design Document](docs/design-doc.mdc)** - Application design and features
- **[Setup Instructions](docs/setup-instructions.md)** - Detailed setup guide
- **[Testing Guide](docs/testing-guide.md)** - Testing strategy

## 🚀 Deployment

Deploy to Vercel:
```bash
vercel
```

---

**Happy Coding! 🎉**
