/**
 * Unit tests for Supabase Server Configuration
 * Priority: MEDIUM - Infrastructure completion
 * 
 * Test Coverage Areas:
 * - createClient() - Server client creation with cookies
 * - createAdminClient() - Admin client creation
 * - Environment variable handling
 * - Cookie management
 * - Error handling
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

// Mock the @supabase/ssr module
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn()
}))

// Mock the @supabase/supabase-js module
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn()
}))

// Mock Next.js headers
vi.mock('next/headers', () => ({
  cookies: vi.fn()
}))

// Import after mocking
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Create typed mocks
const mockCreateServerClient = vi.mocked(createServerClient)
const mockCreateSupabaseClient = vi.mocked(createSupabaseClient)
const mockCookies = vi.mocked(cookies)

describe('Supabase Server Configuration', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset environment variables
    process.env = { ...originalEnv }
    
    // Mock cookies to return a mock cookie store
    mockCookies.mockReturnValue({
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      getAll: vi.fn(),
      has: vi.fn()
    } as any)
  })

  afterEach(() => {
    // Restore environment variables
    process.env = originalEnv
  })

  describe('createClient', () => {
    it('should create server client with correct configuration', () => {
      // Set up environment variables
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

      // Mock the createServerClient to return a mock client
      const mockClient = { auth: {}, from: vi.fn() }
      mockCreateServerClient.mockReturnValue(mockClient as any)

      // Mock cookie store
      const mockCookieStore = {
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn()
      }
      mockCookies.mockReturnValue(mockCookieStore as any)

      const result = createClient(mockCookieStore)

      // Verify createServerClient was called with correct parameters
      expect(mockCreateServerClient).toHaveBeenCalledTimes(1)
      expect(mockCreateServerClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-anon-key',
        {
          cookies: {
            get: expect.any(Function),
            set: expect.any(Function),
            remove: expect.any(Function)
          }
        }
      )

      // Verify the result
      expect(result).toBe(mockClient)
    })

    it('should handle missing environment variables gracefully', () => {
      // Remove environment variables
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      // Mock the createServerClient to return a mock client
      const mockClient = { auth: {}, from: vi.fn() }
      mockCreateServerClient.mockReturnValue(mockClient as any)

      // Mock cookie store
      const mockCookieStore = {
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn()
      }

      // Should still work but with undefined values
      const result = createClient(mockCookieStore)

      expect(mockCreateServerClient).toHaveBeenCalledTimes(1)
      expect(mockCreateServerClient).toHaveBeenCalledWith(
        undefined,
        undefined,
        {
          cookies: {
            get: expect.any(Function),
            set: expect.any(Function),
            remove: expect.any(Function)
          }
        }
      )

      expect(result).toBe(mockClient)
    })

    it('should handle cookie store operations correctly', () => {
      // Set up environment variables
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

      // Mock the createServerClient to return a mock client
      const mockClient = { auth: {}, from: vi.fn() }
      mockCreateServerClient.mockReturnValue(mockClient as any)

      // Mock cookie store with specific implementations
      const mockCookieStore = {
        get: vi.fn((name: string) => ({ value: `cookie-${name}` })),
        set: vi.fn(),
        delete: vi.fn()
      }

      const result = createClient(mockCookieStore)

      // Verify createServerClient was called
      expect(mockCreateServerClient).toHaveBeenCalledTimes(1)
      
      // Get the cookies configuration that was passed
      const cookiesConfig = mockCreateServerClient.mock.calls[0][2]?.cookies
      expect(cookiesConfig).toBeDefined()
      expect(cookiesConfig?.get).toBeDefined()
      expect(cookiesConfig?.set).toBeDefined()
      expect(cookiesConfig?.remove).toBeDefined()

      // Test the get function
      if (cookiesConfig?.get) {
        const cookieValue = cookiesConfig.get('test-cookie')
        expect(cookieValue).toBe('cookie-test-cookie')
      }

      expect(result).toBe(mockClient)
    })

    it('should handle createServerClient errors gracefully', () => {
      // Set up environment variables
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

      // Mock createServerClient to throw an error
      const errorMessage = 'Failed to create server client'
      mockCreateServerClient.mockImplementation(() => {
        throw new Error(errorMessage)
      })

      // Mock cookie store
      const mockCookieStore = {
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn()
      }

      // Should throw the error
      expect(() => createClient(mockCookieStore)).toThrow(errorMessage)
      expect(mockCreateServerClient).toHaveBeenCalledTimes(1)
    })
  })

  describe('createAdminClient', () => {
    it('should create admin client with correct configuration', () => {
      // Set up environment variables
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'

      // Mock the createSupabaseClient to return a mock client
      const mockClient = { auth: {}, from: vi.fn() }
      mockCreateSupabaseClient.mockReturnValue(mockClient as any)

      const result = createAdminClient()

      // Verify createSupabaseClient was called with correct parameters
      expect(mockCreateSupabaseClient).toHaveBeenCalledTimes(1)
      expect(mockCreateSupabaseClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-service-role-key',
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )

      // Verify the result
      expect(result).toBe(mockClient)
    })

    it('should handle missing environment variables gracefully', () => {
      // Remove environment variables
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.SUPABASE_SERVICE_ROLE_KEY

      // Mock the createSupabaseClient to return a mock client
      const mockClient = { auth: {}, from: vi.fn() }
      mockCreateSupabaseClient.mockReturnValue(mockClient as any)

      // Should still work but with undefined values
      const result = createAdminClient()

      expect(mockCreateSupabaseClient).toHaveBeenCalledTimes(1)
      expect(mockCreateSupabaseClient).toHaveBeenCalledWith(
        undefined,
        undefined,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )

      expect(result).toBe(mockClient)
    })

    it('should handle createSupabaseClient errors gracefully', () => {
      // Set up environment variables
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'

      // Mock createSupabaseClient to throw an error
      const errorMessage = 'Failed to create admin client'
      mockCreateSupabaseClient.mockImplementation(() => {
        throw new Error(errorMessage)
      })

      // Should throw the error
      expect(() => createAdminClient()).toThrow(errorMessage)
      expect(mockCreateSupabaseClient).toHaveBeenCalledTimes(1)
    })

    it('should create unique admin client instances on each call', () => {
      // Set up environment variables
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'

      // Mock createSupabaseClient to return different clients
      const mockClient1 = { auth: {}, from: vi.fn(), id: 1 }
      const mockClient2 = { auth: {}, from: vi.fn(), id: 2 }
      
      mockCreateSupabaseClient
        .mockReturnValueOnce(mockClient1 as any)
        .mockReturnValueOnce(mockClient2 as any)

      const result1 = createAdminClient()
      const result2 = createAdminClient()

      // Verify different clients were created
      expect(result1).toBe(mockClient1)
      expect(result2).toBe(mockClient2)
      expect(result1).not.toBe(result2)

      // Verify createSupabaseClient was called twice
      expect(mockCreateSupabaseClient).toHaveBeenCalledTimes(2)
    })
  })
})
