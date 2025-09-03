import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    include: ['__tests__/**/*.{test,spec,vitest}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [
      '__tests__/**/*.skip.*',  // Skip .skip.* files for now
      'node_modules',
      'dist',
      '.next'
    ],
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/**/*.{js,jsx,ts,tsx}',           // Utility functions and business logic
        'src/app/api/**/*.{js,jsx,ts,tsx}',       // API routes
      ],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.stories.{js,jsx,ts,tsx}',
        'src/**/index.{js,jsx,ts,tsx}',
        'src/components/**/*',                    // Exclude all frontend components
        'src/app/**/page.tsx',                   // Exclude Next.js pages
        'src/app/**/layout.tsx',                 // Exclude Next.js layouts
        'src/app/**/loading.tsx',                // Exclude Next.js loading pages
        'src/app/**/not-found.tsx',              // Exclude Next.js 404 pages
        'src/app/**/error.tsx',                  // Exclude Next.js error pages
        'src/app/globals.css',                   // Exclude global CSS
        'src/middleware.ts',                     // Middleware is hard to test in isolation
      ],
      reporter: ['text', 'json-summary', 'html']
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
