import { describe, it, expect, beforeEach, vi } from 'vitest'
import { resetPasswordAction, updateEmailAction, changePasswordAction } from '@/lib/auth-actions'

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
    },
  })),
}))

// Mock Next.js functions
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve({})),
}))

describe('Password Reset and Email Update Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('resetPasswordAction', () => {
    it('should successfully send password reset email', async () => {
      const mockSupabase = {
        auth: {
          resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
        },
      }
      
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockReturnValue(mockSupabase as any)
      
      const formData = new FormData()
      formData.append('email', 'test@example.com')
      
      const result = await resetPasswordAction(formData)
      
      expect(result.success).toBe(true)
      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('test@example.com', {
        redirectTo: 'http://localhost:3000/auth/reset-password'
      })
    })

    it('should handle invalid email format', async () => {
      const formData = new FormData()
      formData.append('email', 'invalid-email')
      
      const result = await resetPasswordAction(formData)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid email address')
    })

    it('should handle Supabase errors', async () => {
      const mockSupabase = {
        auth: {
          resetPasswordForEmail: vi.fn().mockResolvedValue({ 
            error: { message: 'User not found' } 
          }),
        },
      }
      
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockReturnValue(mockSupabase as any)
      
      const formData = new FormData()
      formData.append('email', 'test@example.com')
      
      const result = await resetPasswordAction(formData)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('User not found')
    })

    it('should handle empty email', async () => {
      const formData = new FormData()
      formData.append('email', '')
      
      const result = await resetPasswordAction(formData)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid email address')
    })
  })

  describe('updateEmailAction', () => {
    it('should successfully update user email', async () => {
      const mockSupabase = {
        auth: {
          updateUser: vi.fn().mockResolvedValue({ 
            data: { user: { email: 'new@example.com' } }, 
            error: null 
          }),
        },
      }
      
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockReturnValue(mockSupabase as any)
      
      const formData = new FormData()
      formData.append('email', 'new@example.com')
      
      const result = await updateEmailAction(formData)
      
      expect(result.success).toBe(true)
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({ 
        email: 'new@example.com' 
      })
    })

    it('should validate email format', async () => {
      const formData = new FormData()
      formData.append('email', 'invalid-email')
      
      const result = await updateEmailAction(formData)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid email address')
    })

    it('should handle Supabase update errors', async () => {
      const mockSupabase = {
        auth: {
          updateUser: vi.fn().mockResolvedValue({ 
            data: null, 
            error: { message: 'Email already in use' } 
          }),
        },
      }
      
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockReturnValue(mockSupabase as any)
      
      const formData = new FormData()
      formData.append('email', 'existing@example.com')
      
      const result = await updateEmailAction(formData)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Email already in use')
    })

    it('should require email field', async () => {
      const formData = new FormData()
      
      const result = await updateEmailAction(formData)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid input')
    })
  })

  describe('changePasswordAction', () => {
    it('should successfully change password with valid credentials', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123', email: 'test@example.com' } },
            error: null
          }),
          signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
          updateUser: vi.fn().mockResolvedValue({ error: null }),
        },
      }
      
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockReturnValue(mockSupabase as any)
      
      const formData = new FormData()
      formData.append('currentPassword', 'OldPassword123!')
      formData.append('newPassword', 'NewPassword123!')
      
      const result = await changePasswordAction(formData)
      
      expect(result.success).toBe(true)
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'OldPassword123!'
      })
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'NewPassword123!'
      })
    })

    it('should handle user without email address', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123', email: null } },
            error: null
          }),
        },
      }
      
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockReturnValue(mockSupabase as any)
      
      const formData = new FormData()
      formData.append('currentPassword', 'OldPassword123!')
      formData.append('newPassword', 'NewPassword123!')
      
      const result = await changePasswordAction(formData)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Cannot change password: user account does not have an email address. Please contact support.')
    })

    it('should handle incorrect current password', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123', email: 'test@example.com' } },
            error: null
          }),
          signInWithPassword: vi.fn().mockResolvedValue({ 
            error: { message: 'Invalid login credentials' } 
          }),
        },
      }
      
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockReturnValue(mockSupabase as any)
      
      const formData = new FormData()
      formData.append('currentPassword', 'WrongPassword123!')
      formData.append('newPassword', 'NewPassword123!')
      
      const result = await changePasswordAction(formData)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Current password is incorrect')
    })

    it('should validate new password requirements', async () => {
      const formData = new FormData()
      formData.append('currentPassword', 'OldPassword123!')
      formData.append('newPassword', 'weak') // Too weak
      
      const result = await changePasswordAction(formData)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Password must be at least 8 characters')
    })

    it('should handle user authentication error', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'User not found' }
          }),
        },
      }
      
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockReturnValue(mockSupabase as any)
      
      const formData = new FormData()
      formData.append('currentPassword', 'OldPassword123!')
      formData.append('newPassword', 'NewPassword123!')
      
      const result = await changePasswordAction(formData)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('User not authenticated')
    })

    it('should handle password update error', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123', email: 'test@example.com' } },
            error: null
          }),
          signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
          updateUser: vi.fn().mockResolvedValue({ 
            error: { message: 'Password update failed' } 
          }),
        },
      }
      
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockReturnValue(mockSupabase as any)
      
      const formData = new FormData()
      formData.append('currentPassword', 'OldPassword123!')
      formData.append('newPassword', 'NewPassword123!')
      
      const result = await changePasswordAction(formData)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Password update failed')
    })

    it('should require both password fields', async () => {
      const formData = new FormData()
      formData.append('currentPassword', 'OldPassword123!')
      // Missing newPassword
      
      const result = await changePasswordAction(formData)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid input')
    })
  })
})
