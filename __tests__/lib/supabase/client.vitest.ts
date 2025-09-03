/**
 * Unit tests for Supabase Client Configuration
 * Priority: MEDIUM - Infrastructure foundation
 * 
 * Test Coverage Areas:
 * - createClient() - Browser client creation
 * - Environment variable handling
 * - Client configuration
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

// Mock the @supabase/ssr module
vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn()
}))

// Import after mocking
import { createClient } from '@/lib/supabase/client'
import { createBrowserClient } from '@supabase/ssr'

// Create typed mocks
const mockCreateBrowserClient = vi.mocked(createBrowserClient)

describe('Supabase Client Configuration', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset environment variables
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    // Restore environment variables
    process.env = originalEnv
  })

  describe('createClient', () => {
    it('should create browser client with correct configuration', () => {
      // Set up environment variables
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

      // Mock the createBrowserClient to return a mock client
      const mockClient = { auth: {}, from: vi.fn() }
      mockCreateBrowserClient.mockReturnValue(mockClient as any)

      const result = createClient()

      // Verify createBrowserClient was called with correct parameters
      expect(mockCreateBrowserClient).toHaveBeenCalledTimes(1)
      expect(mockCreateBrowserClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-anon-key'
      )

      // Verify the result
      expect(result).toBe(mockClient)
    })

    it('should handle missing environment variables gracefully', () => {
      // Remove environment variables
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      // Mock the createBrowserClient to return a mock client
      const mockClient = { auth: {}, from: vi.fn() }
      mockCreateBrowserClient.mockReturnValue(mockClient as any)

      // Should still work but with undefined values
      const result = createClient()

      expect(mockCreateBrowserClient).toHaveBeenCalledTimes(1)
      expect(mockCreateBrowserClient).toHaveBeenCalledWith(
        undefined,
        undefined
      )

      expect(result).toBe(mockClient)
    })

    it('should handle empty environment variables', () => {
      // Set empty environment variables
      process.env.NEXT_PUBLIC_SUPABASE_URL = ''
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ''

      // Mock the createBrowserClient to return a mock client
      const mockClient = { auth: {}, from: vi.fn() }
      mockCreateBrowserClient.mockReturnValue(mockClient as any)

      const result = createClient()

      expect(mockCreateBrowserClient).toHaveBeenCalledTimes(1)
      expect(mockCreateBrowserClient).toHaveBeenCalledWith(
        '',
        ''
      )

      expect(result).toBe(mockClient)
    })

    it('should handle createBrowserClient errors gracefully', () => {
      // Set up environment variables
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

      // Mock createBrowserClient to throw an error
      const errorMessage = 'Failed to create client'
      mockCreateBrowserClient.mockImplementation(() => {
        throw new Error(errorMessage)
      })

      // Should throw the error
      expect(() => createClient()).toThrow(errorMessage)
      expect(mockCreateBrowserClient).toHaveBeenCalledTimes(1)
    })

    it('should create unique client instances on each call', () => {
      // Set up environment variables
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

      // Mock createBrowserClient to return different clients
      const mockClient1 = { auth: {}, from: vi.fn(), id: 1 }
      const mockClient2 = { auth: {}, from: vi.fn(), id: 2 }
      
      mockCreateBrowserClient
        .mockReturnValueOnce(mockClient1 as any)
        .mockReturnValueOnce(mockClient2 as any)

      const result1 = createClient()
      const result2 = createClient()

      // Verify different clients were created
      expect(result1).toBe(mockClient1)
      expect(result2).toBe(mockClient2)
      expect(result1).not.toBe(result2)

      // Verify createBrowserClient was called twice
      expect(mockCreateBrowserClient).toHaveBeenCalledTimes(2)
    })
  })
})
