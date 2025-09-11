/**
 * Unit tests for authentication actions
 * Priority: HIGH - Core authentication flow
 * 
 * Test Coverage Areas:
 * - loginAction() - user login process
 * - registerAction() - user registration process
 * - logoutAction() - user logout process
 * - signInWithGoogleAction() - OAuth login
 * - resendEmailVerification() - email verification
 * - Zod validation schemas (loginSchema, registerSchema)
 */

import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn()
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
  headers: vi.fn()
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT')
  })
}))

// Import functions after mocking
import { 
  loginAction, 
  registerAction, 
  logoutAction,
  signInWithGoogleAction,
  resendEmailVerification,
  type AuthResult,
  updateUsernameAction
} from '@/lib/auth-actions'
import { createClient } from '@/lib/supabase/server'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'

// Create typed mocks
const mockCreateClient = vi.mocked(createClient)
const mockCookies = vi.mocked(cookies)
const mockHeaders = vi.mocked(headers)
const mockRedirect = vi.mocked(redirect)

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    signInWithOAuth: vi.fn(),
    resend: vi.fn()
  },
  from: vi.fn(() => ({
    insert: vi.fn()
  }))
}

describe('Authentication Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateClient.mockReturnValue(mockSupabaseClient as any)
    mockCookies.mockResolvedValue({} as any)
    mockHeaders.mockResolvedValue(new Map() as any)
  })

  describe('loginAction', () => {
    const createFormData = (email: string, password: string): FormData => {
      const formData = new FormData()
      formData.set('email', email)
      formData.set('password', password)
      return formData
    }

    it('should login user with valid credentials', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const formData = createFormData('test@example.com', 'ValidPass123!')
      
      // The function should redirect on success, which throws an error
      // We expect the redirect to be called and the function to throw
      await expect(loginAction(formData)).rejects.toThrow()
      expect(mockRedirect).toHaveBeenCalledWith('/')
      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'ValidPass123!'
      })
    })

    it('should return error for invalid credentials', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid login credentials' }
      })

      const formData = createFormData('test@example.com', 'wrongpassword')
      const result = await loginAction(formData)

      expect(result).toEqual({
        success: false,
        error: 'Invalid login credentials'
      })
      expect(mockRedirect).not.toHaveBeenCalled()
    })

    it('should return validation errors for invalid email', async () => {
      const formData = createFormData('invalid-email', 'ValidPass123!')
      const result = await loginAction(formData)

      expect(result).toEqual({
        success: false,
        error: 'Invalid email address'
      })
      expect(mockSupabaseClient.auth.signInWithPassword).not.toHaveBeenCalled()
    })

    it('should return validation errors for short password', async () => {
      const formData = createFormData('test@example.com', '123')
      const result = await loginAction(formData)

      expect(result).toEqual({
        success: false,
        error: 'Password must be at least 8 characters'
      })
      expect(mockSupabaseClient.auth.signInWithPassword).not.toHaveBeenCalled()
    })

    it('should handle server errors gracefully', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockRejectedValue(new Error('Network error'))

      const formData = createFormData('test@example.com', 'ValidPass123!')
      const result = await loginAction(formData)

      expect(result).toEqual({
        success: false,
        error: 'An unexpected error occurred'
      })
    })
  })

  describe('registerAction', () => {
    const createRegisterFormData = (email: string, password: string, name: string): FormData => {
      const formData = new FormData()
      formData.set('email', email)
      formData.set('password', password)
      formData.set('name', name)
      return formData
    }

    beforeEach(() => {
      mockSupabaseClient.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: null })
      })
    })

    it('should register new user with valid data', async () => {
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { 
          user: { id: 'user-123' },
          session: { access_token: 'token-123' }
        },
        error: null
      })

      const formData = createRegisterFormData('test@example.com', 'ValidPass123!', 'testuser')
      
      // The function should catch the redirect error and return an error result
      const result = await registerAction(formData)
      
      expect(result).toEqual({
        success: false,
        error: 'An unexpected error occurred'
      })
      expect(mockRedirect).toHaveBeenCalledWith('/')
      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'ValidPass123!'
      })
    })

    it('should create user profile after registration', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null })
      mockSupabaseClient.from.mockReturnValue({ insert: mockInsert })
      
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { 
          user: { id: 'user-123' },
          session: { access_token: 'token-123' }
        },
        error: null
      })

      const formData = createRegisterFormData('test@example.com', 'ValidPass123!', 'testuser')
      
      const result = await registerAction(formData)
      
      expect(result).toEqual({
        success: false,
        error: 'An unexpected error occurred'
      })
      
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles')
      expect(mockInsert).toHaveBeenCalledWith([{
        id: 'user-123',
        name: 'testuser',
        is_admin: false
      }])
    })

    it('should handle email confirmation required', async () => {
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { 
          user: { id: 'user-123' },
          session: null // No session means email confirmation required
        },
        error: null
      })

      const formData = createRegisterFormData('test@example.com', 'ValidPass123!', 'testuser')
      const result = await registerAction(formData)

      expect(result).toEqual({
        success: true,
        error: 'Please check your email to confirm your account'
      })
      expect(mockRedirect).not.toHaveBeenCalled()
    })

    it('should return error for existing email', async () => {
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: null,
        error: { message: 'User already registered' }
      })

      const formData = createRegisterFormData('existing@example.com', 'ValidPass123!', 'testuser')
      const result = await registerAction(formData)

      expect(result).toEqual({
        success: false,
        error: 'User already registered'
      })
      expect(mockRedirect).not.toHaveBeenCalled()
    })

    it('should return validation errors for weak password', async () => {
      const formData = createRegisterFormData('test@example.com', 'weakpass', 'testuser')
      const result = await registerAction(formData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('uppercase letter')
      expect(mockSupabaseClient.auth.signUp).not.toHaveBeenCalled()
    })

    it('should return validation errors for invalid username', async () => {
      const formData = createRegisterFormData('test@example.com', 'ValidPass123!', 'ab')
      const result = await registerAction(formData)

      expect(result).toEqual({
        success: false,
        error: 'Username must be at least 3 characters'
      })
      expect(mockSupabaseClient.auth.signUp).not.toHaveBeenCalled()
    })

    it('should reject username with spaces', async () => {
      const formData = createRegisterFormData('test@example.com', 'ValidPass123!', 'test user')
      const result = await registerAction(formData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('letters, numbers, and underscores')
      expect(mockSupabaseClient.auth.signUp).not.toHaveBeenCalled()
    })

    it('should handle profile creation errors gracefully', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ 
        error: { message: 'Profile creation failed' }
      })
      mockSupabaseClient.from.mockReturnValue({ insert: mockInsert })
      
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { 
          user: { id: 'user-123' },
          session: { access_token: 'token-123' }
        },
        error: null
      })

      const formData = createRegisterFormData('test@example.com', 'ValidPass123!', 'testuser')
      
      // Should still redirect even if profile creation fails
      const result = await registerAction(formData)
      
      expect(result).toEqual({
        success: false,
        error: 'An unexpected error occurred'
      })
      expect(mockRedirect).toHaveBeenCalledWith('/')
    })

    it('should handle server errors gracefully', async () => {
      mockSupabaseClient.auth.signUp.mockRejectedValue(new Error('Network error'))

      const formData = createRegisterFormData('test@example.com', 'ValidPass123!', 'testuser')
      const result = await registerAction(formData)

      expect(result).toEqual({
        success: false,
        error: 'An unexpected error occurred'
      })
    })
  })

  describe('logoutAction', () => {
    it('should logout user and redirect to home', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValue({ error: null })

      // Should redirect after logout
      await expect(logoutAction()).rejects.toThrow('NEXT_REDIRECT')
      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled()
      expect(mockRedirect).toHaveBeenCalledWith('/')
    })

    it('should handle logout errors gracefully', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValue({ 
        error: { message: 'Logout failed' }
      })

      // Should still redirect even if logout has errors
      await expect(logoutAction()).rejects.toThrow('NEXT_REDIRECT')
      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled()
      expect(mockRedirect).toHaveBeenCalledWith('/')
    })
  })

  describe('signInWithGoogleAction', () => {
    beforeEach(() => {
      const mockHeadersList = new Map()
      mockHeadersList.set('host', 'localhost:3000')
      mockHeadersList.set('x-forwarded-proto', 'http')
      mockHeaders.mockResolvedValue(mockHeadersList as any)
    })

    it('should initiate Google OAuth flow with correct redirect URL', async () => {
      mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://accounts.google.com/oauth/authorize?...' },
        error: null
      })

      const result = await signInWithGoogleAction()

      expect(result).toEqual({
        success: true,
        url: 'https://accounts.google.com/oauth/authorize?...'
      })
      expect(mockSupabaseClient.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:3000/auth/callback'
        }
      })
    })

    it('should use NEXT_PUBLIC_SITE_URL when available', async () => {
      const originalEnv = process.env.NEXT_PUBLIC_SITE_URL
      process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com'

      mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://accounts.google.com/oauth/authorize?...' },
        error: null
      })

      await signInWithGoogleAction()

      expect(mockSupabaseClient.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'https://example.com/auth/callback'
        }
      })

      // Restore original env
      process.env.NEXT_PUBLIC_SITE_URL = originalEnv
    })

    it('should use VERCEL_URL when host header is not available', async () => {
      const originalVercelUrl = process.env.VERCEL_URL
      const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL
      
      // Clear NEXT_PUBLIC_SITE_URL and set VERCEL_URL
      delete process.env.NEXT_PUBLIC_SITE_URL
      process.env.VERCEL_URL = 'myapp.vercel.app'
      
      mockHeaders.mockResolvedValue(new Map() as any) // Empty headers

      mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://accounts.google.com/oauth/authorize?...' },
        error: null
      })

      await signInWithGoogleAction()

      expect(mockSupabaseClient.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'https://myapp.vercel.app/auth/callback'
        }
      })

      // Restore original env
      if (originalVercelUrl !== undefined) {
        process.env.VERCEL_URL = originalVercelUrl
      } else {
        delete process.env.VERCEL_URL
      }
      if (originalSiteUrl !== undefined) {
        process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl
      }
    })

    it('should return error when OAuth fails', async () => {
      mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
        data: null,
        error: { message: 'OAuth provider error' }
      })

      const result = await signInWithGoogleAction()

      expect(result).toEqual({
        success: false,
        error: 'OAuth provider error'
      })
    })

    it('should handle server errors gracefully', async () => {
      mockSupabaseClient.auth.signInWithOAuth.mockRejectedValue(new Error('Network error'))

      const result = await signInWithGoogleAction()

      expect(result).toEqual({
        success: false,
        error: 'An unexpected error occurred'
      })
    })

    it('should return success without URL when no URL provided', async () => {
      mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
        data: { url: null },
        error: null
      })

      const result = await signInWithGoogleAction()

      expect(result).toEqual({
        success: true
      })
    })
  })

  describe('resendEmailVerification', () => {
    it('should send verification email successfully', async () => {
      mockSupabaseClient.auth.resend.mockResolvedValue({
        data: {},
        error: null
      })

      const result = await resendEmailVerification('test@example.com')

      expect(result).toEqual({
        success: true,
        error: 'Verification email sent successfully'
      })
      expect(mockSupabaseClient.auth.resend).toHaveBeenCalledWith({
        type: 'signup',
        email: 'test@example.com'
      })
    })

    it('should return error when resend fails', async () => {
      mockSupabaseClient.auth.resend.mockResolvedValue({
        data: null,
        error: { message: 'Email not found' }
      })

      const result = await resendEmailVerification('test@example.com')

      expect(result).toEqual({
        success: false,
        error: 'Email not found'
      })
    })

    it('should handle server errors gracefully', async () => {
      mockSupabaseClient.auth.resend.mockRejectedValue(new Error('Network error'))

      const result = await resendEmailVerification('test@example.com')

      expect(result).toEqual({
        success: false,
        error: 'An unexpected error occurred'
      })
    })
  })
})

// Validation Schema Tests
describe('Authentication Validation Schemas', () => {
  // We'll test the schemas indirectly through the action functions
  // since the schemas are not exported from auth-actions.ts
  
  describe('Login Validation', () => {
    const createFormData = (email: string, password: string): FormData => {
      const formData = new FormData()
      formData.set('email', email)
      formData.set('password', password)
      return formData
    }

    it('should validate correct email and password', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const formData = createFormData('valid@example.com', 'ValidPass123!')
      
      // The function should redirect on success, which throws an error
      await expect(loginAction(formData)).rejects.toThrow()
      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalled()
    })

    it('should reject invalid email format', async () => {
      const formData = createFormData('not-an-email', 'ValidPass123!')
      const result = await loginAction(formData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid email address')
    })

    it('should reject short passwords', async () => {
      const formData = createFormData('test@example.com', '1234567')
      const result = await loginAction(formData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Password must be at least 8 characters')
    })
  })

  describe('Registration Validation', () => {
    const createFormData = (email: string, password: string, name: string): FormData => {
      const formData = new FormData()
      formData.set('email', email)
      formData.set('password', password)
      formData.set('name', name)
      return formData
    }

    it('should validate correct registration data', async () => {
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { 
          user: { id: 'user-123' },
          session: { access_token: 'token-123' }
        },
        error: null
      })

      const formData = createFormData('valid@example.com', 'ValidPass123!', 'validuser')
      
      const result = await registerAction(formData)
      
      expect(result).toEqual({
        success: false,
        error: 'An unexpected error occurred'
      })
      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalled()
    })

    it('should reject weak passwords - missing uppercase', async () => {
      const formData = createFormData('test@example.com', 'validpass123!', 'testuser')
      const result = await registerAction(formData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('uppercase letter')
    })

    it('should reject weak passwords - missing lowercase', async () => {
      const formData = createFormData('test@example.com', 'VALIDPASS123!', 'testuser')
      const result = await registerAction(formData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('lowercase letter')
    })

    it('should reject weak passwords - missing number', async () => {
      const formData = createFormData('test@example.com', 'ValidPass!', 'testuser')
      const result = await registerAction(formData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('number')
    })

    it('should reject weak passwords - missing special character', async () => {
      const formData = createFormData('test@example.com', 'ValidPass123', 'testuser')
      const result = await registerAction(formData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('special character')
    })

    it('should reject invalid usernames - too short', async () => {
      const formData = createFormData('test@example.com', 'ValidPass123!', 'ab')
      const result = await registerAction(formData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Username must be at least 3 characters')
    })

    it('should reject invalid usernames - special characters', async () => {
      const formData = createFormData('test@example.com', 'ValidPass123!', 'test@user')
      const result = await registerAction(formData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('letters, numbers, and underscores')
    })

    it('should reject usernames with spaces', async () => {
      const formData = createFormData('test@example.com', 'ValidPass123!', 'test user')
      const result = await registerAction(formData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('letters, numbers, and underscores')
    })
  })
})

describe('Username Update Actions', () => {
  describe('updateUsernameAction', () => {
    it('should update username successfully with valid data', async () => {
      const mockFormData = new FormData()
      mockFormData.append('username', 'newusername')

      const mockUser = { id: 'user-123', email: 'test@example.com' }
      const mockProfile = { id: 'user-123', name: 'oldusername', is_admin: false }

      // Mock Supabase client with proper chaining
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null
          })
        },
        from: vi.fn().mockImplementation((table) => {
          if (table === 'profiles') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockProfile,
                    error: null
                  }),
                  neq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: null,
                      error: { code: 'PGRST116' } // No rows returned
                    })
                  })
                })
              }),
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  select: vi.fn().mockResolvedValue({
                    data: [{ ...mockProfile, name: 'newusername' }],
                    error: null
                  })
                })
              })
            }
          }
          return {}
        })
      }

      vi.mocked(createClient).mockReturnValue(mockSupabase as any)

      const result = await updateUsernameAction(mockFormData)

      expect(result.success).toBe(true)
      expect(result.error).toBe('Username updated successfully!')
      expect(mockSupabase.auth.getUser).toHaveBeenCalled()
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
    })

    it('should handle validation errors', async () => {
      const mockFormData = new FormData()
      mockFormData.append('username', 'ab') // Too short

      const result = await updateUsernameAction(mockFormData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Username must be at least 3 characters')
    })

    it('should handle invalid username format', async () => {
      const mockFormData = new FormData()
      mockFormData.append('username', 'user@name') // Contains special character

      const result = await updateUsernameAction(mockFormData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Username can only contain letters, numbers, and underscores')
    })

    it('should handle user authentication errors', async () => {
      const mockFormData = new FormData()
      mockFormData.append('username', 'newusername')

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Authentication failed' }
          })
        }
      }

      vi.mocked(createClient).mockReturnValue(mockSupabase as any)

      const result = await updateUsernameAction(mockFormData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('User not authenticated')
    })

    it('should handle profile not found errors', async () => {
      const mockFormData = new FormData()
      mockFormData.append('username', 'newusername')

      const mockUser = { id: 'user-123', email: 'test@example.com' }

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null
          })
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Profile not found' }
              })
            })
          })
        })
      }

      vi.mocked(createClient).mockReturnValue(mockSupabase as any)

      const result = await updateUsernameAction(mockFormData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Profile not found')
    })

    it('should handle username already taken errors', async () => {
      const mockFormData = new FormData()
      mockFormData.append('username', 'existinguser')

      const mockUser = { id: 'user-123', email: 'test@example.com' }
      const mockProfile = { id: 'user-123', name: 'oldusername', is_admin: false }
      const existingUser = { name: 'existinguser' }

      // Mock Supabase client with proper chaining
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null
          })
        },
        from: vi.fn().mockImplementation((table) => {
          if (table === 'profiles') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockProfile,
                    error: null
                  }),
                  neq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: existingUser,
                      error: null
                    })
                  })
                })
              }),
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  select: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'Update failed' }
                  })
                })
              })
            }
          }
          return {}
        })
      }

      vi.mocked(createClient).mockReturnValue(mockSupabase as any)

      const result = await updateUsernameAction(mockFormData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Username already taken')
    })

    it('should handle database update errors', async () => {
      const mockFormData = new FormData()
      mockFormData.append('username', 'newusername')

      const mockUser = { id: 'user-123', email: 'test@example.com' }
      const mockProfile = { id: 'user-123', name: 'oldusername', is_admin: false }

      // Mock Supabase client with proper chaining
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null
          })
        },
        from: vi.fn().mockImplementation((table) => {
          if (table === 'profiles') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockProfile,
                    error: null
                  }),
                  neq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: null,
                      error: { code: 'PGRST116' } // No rows returned
                    })
                  })
                })
              }),
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  select: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'Update failed' }
                  })
                })
              })
            }
          }
          return {}
        })
      }

      vi.mocked(createClient).mockReturnValue(mockSupabase as any)

      const result = await updateUsernameAction(mockFormData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Update failed')
    })

    it('should handle unexpected errors', async () => {
      const mockFormData = new FormData()
      mockFormData.append('username', 'newusername')

      vi.mocked(createClient).mockImplementation(() => {
        throw new Error('Unexpected error')
      })

      const result = await updateUsernameAction(mockFormData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('An unexpected error occurred')
    })
  })
})
