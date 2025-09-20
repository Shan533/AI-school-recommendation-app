/**
 * Unit tests for Supabase helper functions using Vitest
 * Priority: HIGH - Core database operations
 * 
 * Test Coverage Areas:
 * - getSupabaseClient() - client creation with cookie store
 * - getCurrentUser() - user authentication state retrieval
 * - getUserProfile() - user profile data fetching
 * - isAdmin() - admin permission validation
 * 
 * Using Vitest for better ESM and Server Components support
 */

import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock modules with Vitest using factory functions (no external variables)
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn()
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn()
}))

// Import mocked modules
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// Create typed mocks
const mockCreateClient = vi.mocked(createClient)
const mockCookies = vi.mocked(cookies)

// Create comprehensive mock client
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn()
  },
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn()
      })
    })
  })
}

// Import the functions to test
import { 
  getSupabaseClient,
  getCurrentUser, 
  getUserProfile, 
  isAdmin 
} from '@/lib/supabase/helpers'

describe('Supabase Helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateClient.mockReturnValue(mockSupabaseClient as any)
  })

  describe('getSupabaseClient', () => {
    it('should create Supabase client with cookie store', async () => {
      const mockCookieStore = {
        get: vi.fn(),
        set: vi.fn(),
        getAll: vi.fn(),
        has: vi.fn(),
        delete: vi.fn(),
        clear: vi.fn(),
        [Symbol.iterator]: vi.fn(() => [][Symbol.iterator]()),
        size: 0
      }
      mockCookies.mockResolvedValue(mockCookieStore)

      const client = await getSupabaseClient()

      expect(mockCookies).toHaveBeenCalledOnce()
      expect(mockCreateClient).toHaveBeenCalledWith(mockCookieStore)
      expect(client).toBe(mockSupabaseClient)
    })

    it('should handle client creation errors', async () => {
      const mockCookieStore = {
        get: vi.fn(),
        set: vi.fn(),
        getAll: vi.fn(),
        has: vi.fn(),
        delete: vi.fn(),
        clear: vi.fn(),
        [Symbol.iterator]: vi.fn(() => [][Symbol.iterator]()),
        size: 0
      }
      mockCookies.mockResolvedValue(mockCookieStore)
      mockCreateClient.mockImplementation(() => {
        throw new Error('Client creation failed')
      })

      await expect(getSupabaseClient()).rejects.toThrow('Client creation failed')
      expect(mockCookies).toHaveBeenCalledOnce()
      expect(mockCreateClient).toHaveBeenCalledWith(mockCookieStore)
    })
  })

  describe('getCurrentUser', () => {
    it('should return user when authenticated', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' }
      }
      const mockCookieStore = {
        get: vi.fn(),
        set: vi.fn(),
        getAll: vi.fn(),
        has: vi.fn(),
        delete: vi.fn(),
        clear: vi.fn(),
        [Symbol.iterator]: vi.fn(() => [][Symbol.iterator]()),
        size: 0
      }
      
      mockCookies.mockResolvedValue(mockCookieStore)
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const user = await getCurrentUser()

      expect(user).toEqual(mockUser)
      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledOnce()
    })

    it('should return null when not authenticated', async () => {
      const mockCookieStore = {
        get: vi.fn(),
        set: vi.fn(),
        getAll: vi.fn(),
        has: vi.fn(),
        delete: vi.fn(),
        clear: vi.fn(),
        [Symbol.iterator]: vi.fn(() => [][Symbol.iterator]()),
        size: 0
      }
      
      mockCookies.mockResolvedValue(mockCookieStore)
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      const user = await getCurrentUser()

      expect(user).toBeNull()
      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledOnce()
    })

    it('should handle auth errors gracefully', async () => {
      const mockCookieStore = {
        get: vi.fn(),
        set: vi.fn(),
        getAll: vi.fn(),
        has: vi.fn(),
        delete: vi.fn(),
        clear: vi.fn(),
        [Symbol.iterator]: vi.fn(() => [][Symbol.iterator]()),
        size: 0
      }
      
      mockCookies.mockResolvedValue(mockCookieStore)
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Auth error' }
      })

      const user = await getCurrentUser()

      expect(user).toBeNull()
      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledOnce()
    })

    it('should handle client creation errors', async () => {
      mockCookies.mockResolvedValue({
        get: vi.fn(),
        set: vi.fn(),
        getAll: vi.fn(),
        has: vi.fn(),
        delete: vi.fn(),
        clear: vi.fn(),
        [Symbol.iterator]: vi.fn(() => [][Symbol.iterator]()),
        size: 0
      } as any)
      mockCreateClient.mockImplementation(() => {
        throw new Error('Client error')
      })

      await expect(getCurrentUser()).rejects.toThrow('Client error')
    })
  })

  describe('getUserProfile', () => {
    it('should return user profile for valid userId', async () => {
      const mockProfile = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        is_admin: false,
        created_at: '2024-01-01T00:00:00Z'
      }
      const mockCookieStore = {
        get: vi.fn(),
        set: vi.fn(),
        getAll: vi.fn(),
        has: vi.fn(),
        delete: vi.fn(),
        clear: vi.fn(),
        [Symbol.iterator]: vi.fn(() => [][Symbol.iterator]()),
        size: 0
      }
      
      mockCookies.mockResolvedValue(mockCookieStore)
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: mockProfile,
        error: null
      })

      const profile = await getUserProfile('user-123')

      expect(profile).toEqual(mockProfile)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles')
      expect(mockSupabaseClient.from().select).toHaveBeenCalledWith('*')
      expect(mockSupabaseClient.from().select().eq).toHaveBeenCalledWith('id', 'user-123')
      expect(mockSupabaseClient.from().select().eq().single).toHaveBeenCalledOnce()
    })

    it('should return null for non-existent user', async () => {
      const mockCookieStore = {
        get: vi.fn(),
        set: vi.fn(),
        getAll: vi.fn(),
        has: vi.fn(),
        delete: vi.fn(),
        clear: vi.fn(),
        [Symbol.iterator]: vi.fn(() => [][Symbol.iterator]()),
        size: 0
      }
      
      mockCookies.mockResolvedValue(mockCookieStore)
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'No rows found' }
      })

      const profile = await getUserProfile('non-existent-user')

      expect(profile).toBeNull()
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles')
      expect(mockSupabaseClient.from().select().eq).toHaveBeenCalledWith('id', 'non-existent-user')
    })

    it('should handle database errors', async () => {
      const mockCookieStore = {
        get: vi.fn(),
        set: vi.fn(),
        getAll: vi.fn(),
        has: vi.fn(),
        delete: vi.fn(),
        clear: vi.fn(),
        [Symbol.iterator]: vi.fn(() => [][Symbol.iterator]()),
        size: 0
      }
      
      mockCookies.mockResolvedValue(mockCookieStore)
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' }
      })

      const profile = await getUserProfile('user-123')

      expect(profile).toBeNull()
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles')
    })

    it('should return complete profile data structure', async () => {
      const mockProfile = {
        id: 'user-456',
        name: 'Admin User',
        email: 'admin@example.com',
        is_admin: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        avatar_url: 'https://example.com/avatar.jpg'
      }
      const mockCookieStore = {
        get: vi.fn(),
        set: vi.fn(),
        getAll: vi.fn(),
        has: vi.fn(),
        delete: vi.fn(),
        clear: vi.fn(),
        [Symbol.iterator]: vi.fn(() => [][Symbol.iterator]()),
        size: 0
      }
      
      mockCookies.mockResolvedValue(mockCookieStore)
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: mockProfile,
        error: null
      })

      const profile = await getUserProfile('user-456')

      expect(profile).toEqual(mockProfile)
      expect(profile).toHaveProperty('id', 'user-456')
      expect(profile).toHaveProperty('name', 'Admin User')
      expect(profile).toHaveProperty('is_admin', true)
      expect(profile).toHaveProperty('created_at')
    })

    it('should handle client creation errors', async () => {
      mockCookies.mockResolvedValue({
        get: vi.fn(),
        set: vi.fn(),
        getAll: vi.fn(),
        has: vi.fn(),
        delete: vi.fn(),
        clear: vi.fn(),
        [Symbol.iterator]: vi.fn(() => [][Symbol.iterator]()),
        size: 0
      } as any)
      mockCreateClient.mockImplementation(() => {
        throw new Error('Client error')
      })

      await expect(getUserProfile('user-123')).rejects.toThrow('Client error')
    })
  })

  describe('isAdmin', () => {
    it('should return true for admin users', async () => {
      const mockProfile = {
        id: 'admin-123',
        name: 'Admin User',
        email: 'admin@example.com',
        is_admin: true
      }
      const mockCookieStore = {
        get: vi.fn(),
        set: vi.fn(),
        getAll: vi.fn(),
        has: vi.fn(),
        delete: vi.fn(),
        clear: vi.fn(),
        [Symbol.iterator]: vi.fn(() => [][Symbol.iterator]()),
        size: 0
      }
      
      mockCookies.mockResolvedValue(mockCookieStore)
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: mockProfile,
        error: null
      })

      const isAdminResult = await isAdmin('admin-123')

      expect(isAdminResult).toBe(true)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles')
      expect(mockSupabaseClient.from().select().eq).toHaveBeenCalledWith('id', 'admin-123')
    })

    it('should return false for regular users', async () => {
      const mockProfile = {
        id: 'user-123',
        name: 'Regular User',
        email: 'user@example.com',
        is_admin: false
      }
      const mockCookieStore = {
        get: vi.fn(),
        set: vi.fn(),
        getAll: vi.fn(),
        has: vi.fn(),
        delete: vi.fn(),
        clear: vi.fn(),
        [Symbol.iterator]: vi.fn(() => [][Symbol.iterator]()),
        size: 0
      }
      
      mockCookies.mockResolvedValue(mockCookieStore)
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: mockProfile,
        error: null
      })

      const isAdminResult = await isAdmin('user-123')

      expect(isAdminResult).toBe(false)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles')
      expect(mockSupabaseClient.from().select().eq).toHaveBeenCalledWith('id', 'user-123')
    })

    it('should return false for non-existent users', async () => {
      const mockCookieStore = {
        get: vi.fn(),
        set: vi.fn(),
        getAll: vi.fn(),
        has: vi.fn(),
        delete: vi.fn(),
        clear: vi.fn(),
        [Symbol.iterator]: vi.fn(() => [][Symbol.iterator]()),
        size: 0
      }
      
      mockCookies.mockResolvedValue(mockCookieStore)
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'No rows found' }
      })

      const isAdminResult = await isAdmin('non-existent-user')

      expect(isAdminResult).toBe(false)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles')
      expect(mockSupabaseClient.from().select().eq).toHaveBeenCalledWith('id', 'non-existent-user')
    })

    it('should handle null profile gracefully', async () => {
      const mockCookieStore = {
        get: vi.fn(),
        set: vi.fn(),
        getAll: vi.fn(),
        has: vi.fn(),
        delete: vi.fn(),
        clear: vi.fn(),
        [Symbol.iterator]: vi.fn(() => [][Symbol.iterator]()),
        size: 0
      }
      
      mockCookies.mockResolvedValue(mockCookieStore)
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: null,
        error: null
      })

      const isAdminResult = await isAdmin('user-123')

      expect(isAdminResult).toBe(false)
    })

    it('should handle undefined is_admin field', async () => {
      const mockProfile = {
        id: 'user-123',
        name: 'User Without Admin Field',
        email: 'user@example.com'
        // is_admin field is undefined
      }
      const mockCookieStore = {
        get: vi.fn(),
        set: vi.fn(),
        getAll: vi.fn(),
        has: vi.fn(),
        delete: vi.fn(),
        clear: vi.fn(),
        [Symbol.iterator]: vi.fn(() => [][Symbol.iterator]()),
        size: 0
      }
      
      mockCookies.mockResolvedValue(mockCookieStore)
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: mockProfile,
        error: null
      })

      const isAdminResult = await isAdmin('user-123')

      expect(isAdminResult).toBe(false)
    })

    it('should handle database errors', async () => {
      const mockCookieStore = {
        get: vi.fn(),
        set: vi.fn(),
        getAll: vi.fn(),
        has: vi.fn(),
        delete: vi.fn(),
        clear: vi.fn(),
        [Symbol.iterator]: vi.fn(() => [][Symbol.iterator]()),
        size: 0
      }
      
      mockCookies.mockResolvedValue(mockCookieStore)
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      })

      const isAdminResult = await isAdmin('user-123')

      expect(isAdminResult).toBe(false)
    })

    it('should handle client creation errors', async () => {
      mockCookies.mockResolvedValue({
        get: vi.fn(),
        set: vi.fn(),
        getAll: vi.fn(),
        has: vi.fn(),
        delete: vi.fn(),
        clear: vi.fn(),
        [Symbol.iterator]: vi.fn(() => [][Symbol.iterator]()),
        size: 0
      } as any)
      mockCreateClient.mockImplementation(() => {
        throw new Error('Client error')
      })

      await expect(isAdmin('user-123')).rejects.toThrow('Client error')
    })

    it('should handle concurrent admin checks efficiently', async () => {
      const mockProfile1 = { id: 'user-1', is_admin: true }
      const mockProfile2 = { id: 'user-2', is_admin: false }
      const mockCookieStore = {
        get: vi.fn(),
        set: vi.fn(),
        getAll: vi.fn(),
        has: vi.fn(),
        delete: vi.fn(),
        clear: vi.fn(),
        [Symbol.iterator]: vi.fn(() => [][Symbol.iterator]()),
        size: 0
      }
      
      mockCookies.mockResolvedValue(mockCookieStore)
      mockSupabaseClient.from().select().eq().single
        .mockResolvedValueOnce({ data: mockProfile1, error: null })
        .mockResolvedValueOnce({ data: mockProfile2, error: null })

      const [result1, result2] = await Promise.all([
        isAdmin('user-1'),
        isAdmin('user-2')
      ])

      expect(result1).toBe(true)
      expect(result2).toBe(false)
      expect(mockSupabaseClient.from().select().eq().single).toHaveBeenCalledTimes(2)
    })

    it('should handle mixed success and error responses in concurrent calls', async () => {
      const mockProfile = { id: 'user-1', is_admin: true }
      const mockCookieStore = {
        get: vi.fn(),
        set: vi.fn(),
        getAll: vi.fn(),
        has: vi.fn(),
        delete: vi.fn(),
        clear: vi.fn(),
        [Symbol.iterator]: vi.fn(() => [][Symbol.iterator]()),
        size: 0
      }
      
      mockCookies.mockResolvedValue(mockCookieStore)
      mockSupabaseClient.from().select().eq().single
        .mockResolvedValueOnce({ data: mockProfile, error: null })
        .mockResolvedValueOnce({ data: null, error: { message: 'User not found' } })

      const [result1, result2] = await Promise.all([
        isAdmin('user-1'),
        isAdmin('non-existent')
      ])

      expect(result1).toBe(true)
      expect(result2).toBe(false)
    })
  })
})
