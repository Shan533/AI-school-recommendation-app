/**
 * Unit tests for Supabase helper functions
 * Priority: HIGH - Core database operations
 * 
 * Test Coverage Areas:
 * - getSupabaseClient() - client creation
 * - getCurrentUser() - user authentication state
 * - getUserProfile() - user profile retrieval
 * - isAdmin() - admin permission check
 * 
 * NOTE: Currently disabled due to module resolution issues with Next.js Server Components
 * TODO: Implement these tests after resolving Jest + Next.js 15 + Server Components compatibility
 */

// Mock the entire helpers module to test logic without external dependencies
const mockSupabaseClient = {
  auth: {
    getUser: jest.fn()
  },
  from: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn()
      })
    })
  })
}

const mockCookies = jest.fn()
const mockCreateClient = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient
}))
jest.mock('next/headers', () => ({
  cookies: mockCookies
}))

// Import after mocking
import { 
  getSupabaseClient,
  getCurrentUser, 
  getUserProfile, 
  isAdmin 
} from '@/lib/supabase/helpers'

describe('getSupabaseClient', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateClient.mockReturnValue(mockSupabaseClient)
  })

  it('should create Supabase client with cookie store', async () => {
    const mockCookieStore = { get: jest.fn(), set: jest.fn() }
    
    mockCookies.mockResolvedValue(mockCookieStore)

    const client = await getSupabaseClient()

    expect(mockCookies).toHaveBeenCalledTimes(1)
    expect(mockCreateClient).toHaveBeenCalledWith(mockCookieStore)
    expect(client).toBe(mockSupabaseClient)
  })

  it('should handle client creation errors', async () => {
    const mockCookieStore = { get: jest.fn(), set: jest.fn() }
    
    mockCookies.mockResolvedValue(mockCookieStore)
    mockCreateClient.mockImplementation(() => {
      throw new Error('Client creation failed')
    })

    await expect(getSupabaseClient()).rejects.toThrow('Client creation failed')
    expect(mockCookies).toHaveBeenCalledTimes(1)
    expect(mockCreateClient).toHaveBeenCalledWith(mockCookieStore)
  })
})

describe('getCurrentUser', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateClient.mockReturnValue(mockSupabaseClient)
  })

  it('should return user when authenticated', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      user_metadata: { name: 'Test User' }
    }
    const mockCookieStore = { get: jest.fn(), set: jest.fn() }
    
    mockCookies.mockResolvedValue(mockCookieStore)
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    })

    const user = await getCurrentUser()

    expect(user).toEqual(mockUser)
    expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledTimes(1)
  })

  it('should return null when not authenticated', async () => {
    const mockCookieStore = { get: jest.fn(), set: jest.fn() }
    
    mockCookies.mockResolvedValue(mockCookieStore)
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null
    })

    const user = await getCurrentUser()

    expect(user).toBeNull()
    expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledTimes(1)
  })

  it('should handle auth errors gracefully', async () => {
    const mockCookieStore = { get: jest.fn(), set: jest.fn() }
    
    mockCookies.mockResolvedValue(mockCookieStore)
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Auth error' }
    })

    const user = await getCurrentUser()

    expect(user).toBeNull()
    expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledTimes(1)
  })

  it('should handle client creation errors', async () => {
    mockCookies.mockResolvedValue({ get: jest.fn(), set: jest.fn() })
    mockCreateClient.mockImplementation(() => {
      throw new Error('Client error')
    })

    await expect(getCurrentUser()).rejects.toThrow('Client error')
  })
})

describe('getUserProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateClient.mockReturnValue(mockSupabaseClient)
  })

  it('should return user profile for valid userId', async () => {
    const mockProfile = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      is_admin: false,
      created_at: '2024-01-01T00:00:00Z'
    }
    const mockCookieStore = { get: jest.fn(), set: jest.fn() }
    
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
    expect(mockSupabaseClient.from().select().eq().single).toHaveBeenCalledTimes(1)
  })

  it('should return null for non-existent user', async () => {
    const mockCookieStore = { get: jest.fn(), set: jest.fn() }
    
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
    const mockCookieStore = { get: jest.fn(), set: jest.fn() }
    
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
    const mockCookieStore = { get: jest.fn(), set: jest.fn() }
    
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
    mockCookies.mockResolvedValue({ get: jest.fn(), set: jest.fn() })
    mockCreateClient.mockImplementation(() => {
      throw new Error('Client error')
    })

    await expect(getUserProfile('user-123')).rejects.toThrow('Client error')
  })
})

describe('isAdmin', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateClient.mockReturnValue(mockSupabaseClient)
  })

  it('should return true for admin users', async () => {
    const mockProfile = {
      id: 'admin-123',
      name: 'Admin User',
      email: 'admin@example.com',
      is_admin: true
    }
    const mockCookieStore = { get: jest.fn(), set: jest.fn() }
    
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
    const mockCookieStore = { get: jest.fn(), set: jest.fn() }
    
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
    const mockCookieStore = { get: jest.fn(), set: jest.fn() }
    
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
    const mockCookieStore = { get: jest.fn(), set: jest.fn() }
    
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
    const mockCookieStore = { get: jest.fn(), set: jest.fn() }
    
    mockCookies.mockResolvedValue(mockCookieStore)
    mockSupabaseClient.from().select().eq().single.mockResolvedValue({
      data: mockProfile,
      error: null
    })

    const isAdminResult = await isAdmin('user-123')

    expect(isAdminResult).toBe(false)
  })

  it('should handle database errors', async () => {
    const mockCookieStore = { get: jest.fn(), set: jest.fn() }
    
    mockCookies.mockResolvedValue(mockCookieStore)
    mockSupabaseClient.from().select().eq().single.mockResolvedValue({
      data: null,
      error: { message: 'Database error' }
    })

    const isAdminResult = await isAdmin('user-123')

    expect(isAdminResult).toBe(false)
  })

  it('should handle client creation errors', async () => {
    mockCookies.mockResolvedValue({ get: jest.fn(), set: jest.fn() })
    mockCreateClient.mockImplementation(() => {
      throw new Error('Client error')
    })

    await expect(isAdmin('user-123')).rejects.toThrow('Client error')
  })
})
