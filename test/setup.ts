/**
 * Vitest setup file
 * Configures testing environment for Next.js 15 + Supabase
 */

import { beforeAll, afterEach, afterAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'

// Global test setup
beforeAll(() => {
  // Setup any global test configurations
})

// Cleanup after each test
afterEach(() => {
  cleanup()
})
// Cleanup after all tests
afterAll(() => {
  // Cleanup global resources
})

