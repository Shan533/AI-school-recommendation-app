This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
# or using docker
docker compose -f docker-compose.dev.yml up --build
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Quick Start with Docker
### One-Click Startup

#### Windows Users
```bash
# Double-click to run
docker/start-docker.bat

# Or run from command line
.\docker\start-docker.bat
```

#### Linux/Mac Users
```bash
# Add execution permissions
chmod +x docker/start-docker.sh

# Run script
./docker/start-docker.sh
```

### What Gets Started
- **🌐 Web Application**: http://localhost:3000
- **🔴 Redis**: localhost:6379
- **🕷️ Web Crawler**: Optional Python service
- **📊 Redis Monitoring**: Optional web-based management

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
