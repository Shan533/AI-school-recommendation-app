import { describe, it, expect, beforeEach, vi } from 'vitest'
import { resetPasswordAction, updateEmailAction } from '@/lib/auth-actions'

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
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
})
