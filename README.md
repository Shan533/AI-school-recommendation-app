# 🎓 Top Tech Schools

A modern web application for finding, rating, and reviewing top CS, AI/ML, Data, Cybersecurity & more programs, built with Next.js 15, React 19, and Supabase.

![Next.js](https://img.shields.io/badge/Next.js-15.4.6-black)
![React](https://img.shields.io/badge/React-19.1.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Supabase](https://img.shields.io/badge/Supabase-2.55.0-green)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38B2AC)

## 🛠️ Tech Stack

- **Frontend**: Next.js 15.4.6, React 19.1.0, TypeScript 5.x
- **Styling**: Tailwind CSS 4.x, shadcn/ui
- **Backend**: Supabase 2.55.0 (PostgreSQL, Auth, RLS)
- **Testing**: Vitest 3.2.4, React Testing Library
- **Deployment**: Vercel
- **Form Handling**: React Hook Form, Zod validation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker Desktop (optional, for containerized setup)

### Option 1: Docker (Recommended)

**Windows:**
```bash
.\docker\start-docker.bat
```

**Linux/Mac:**
```bash
chmod +x docker/start-docker.sh
./docker/start-docker.sh
```

### Option 2: Local Development

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

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 📚 Documentation

- **[Design Document](docs/design-doc.mdc)** - Application design and features
- **[Setup Instructions](docs/setup-instructions.md)** - Detailed setup guide
- **[Testing Guide](docs/testing-guide.md)** - Testing strategy

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Interactive UI
npm run test:ui
```

## 🚀 Deployment

Deploy to Vercel:
```bash
vercel
```

---

**Happy Coding! 🎉**
