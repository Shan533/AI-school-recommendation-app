/**
 * Integration tests for Users Admin API
 * Priority: HIGH - Major coverage boost
 * 
 * Test Coverage Areas:
 * - PUT /api/admin/users/[id] - Update user admin status
 * - DELETE /api/admin/users/[id] - Delete user
 * - POST /api/admin/users/invite - Invite new user
 * - POST /api/admin/users/magic-link - Send magic link
 */

import { vi, describe, it, expect, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock dependencies
vi.mock('@/lib/supabase/helpers', () => ({
  getCurrentUser: vi.fn(),
  isAdmin: vi.fn()
}))

vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: vi.fn()
}))

vi.mock('next/headers', () => ({
  headers: vi.fn()
}))

// Import functions after mocking
import { PUT, DELETE } from '@/app/api/admin/users/[id]/route'
import { POST as inviteUser } from '@/app/api/admin/users/invite/route'
import { POST as sendMagicLink } from '@/app/api/admin/users/magic-link/route'
import { getCurrentUser, isAdmin } from '@/lib/supabase/helpers'
import { createAdminClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

// Create typed mocks
const mockGetCurrentUser = vi.mocked(getCurrentUser)
const mockIsAdmin = vi.mocked(isAdmin)
const mockCreateAdminClient = vi.mocked(createAdminClient)
const mockHeaders = vi.mocked(headers)

// Mock Supabase admin client
const mockSupabaseAdmin = {
  from: vi.fn(() => ({
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn()
      }))
    })),
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn()
      }))
    }))
  })),
  auth: {
    admin: {
      deleteUser: vi.fn(),
      listUsers: vi.fn(),
      inviteUserByEmail: vi.fn(),
      generateLink: vi.fn()
    }
  }
}

describe('Users Admin API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateAdminClient.mockReturnValue(mockSupabaseAdmin as any)
    mockHeaders.mockResolvedValue({
      get: vi.fn()
    } as any)
  })

  describe('PUT /api/admin/users/[id]', () => {
    const createRequest = (body: any): NextRequest => {
      return new NextRequest('http://localhost:3000/api/admin/users/123', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
    }

    const createParams = (id: string) => Promise.resolve({ id })

    it('should update user admin status successfully', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'admin-123' } as any)
      mockIsAdmin.mockResolvedValue(true)

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({ data: null, error: null })
        })
      })

      mockSupabaseAdmin.from.mockReturnValue({
        update: mockUpdate
      } as any)

      const request = createRequest({ is_admin: true })
      const params = createParams('user-456')
      const response = await PUT(request, { params })

      expect(response.status).toBe(200)
      const responseData = await response.json()
      expect(responseData.message).toBe('User admin status updated successfully')

      expect(mockUpdate).toHaveBeenCalledWith({ is_admin: true })
    })

    it('should return 401 for unauthenticated user', async () => {
      mockGetCurrentUser.mockResolvedValue(null)

      const request = createRequest({ is_admin: true })
      const params = createParams('user-456')
      const response = await PUT(request, { params })

      expect(response.status).toBe(401)
      const responseData = await response.json()
      expect(responseData.error).toBe('Unauthorized')
    })

    it('should return 403 for non-admin user', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'user-123' } as any)
      mockIsAdmin.mockResolvedValue(false)

      const request = createRequest({ is_admin: true })
      const params = createParams('user-456')
      const response = await PUT(request, { params })

      expect(response.status).toBe(403)
      const responseData = await response.json()
      expect(responseData.error).toBe('Forbidden')
    })

    it('should prevent admin from changing their own status', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'admin-123' } as any)
      mockIsAdmin.mockResolvedValue(true)

      const request = createRequest({ is_admin: false })
      const params = createParams('admin-123')
      const response = await PUT(request, { params })

      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData.error).toBe('Cannot change your own admin status')
    })

    it('should validate is_admin field type', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'admin-123' } as any)
      mockIsAdmin.mockResolvedValue(true)

      const request = createRequest({ is_admin: 'true' })
      const params = createParams('user-456')
      const response = await PUT(request, { params })

      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData.error).toBe('is_admin must be a boolean')
    })

    it('should handle database errors gracefully', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'admin-123' } as any)
      mockIsAdmin.mockResolvedValue(true)

      // Mock the update operation to return an error
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          error: { message: 'Database error' }
        })
      })

      // Mock the from method to return our mock update
      mockSupabaseAdmin.from.mockReturnValue({
        update: mockUpdate
      } as any)

      const request = createRequest({ is_admin: true })
      const params = createParams('user-456')
      const response = await PUT(request, { params })

      expect(response.status).toBe(500)
      const responseData = await response.json()
      expect(responseData.error).toBe('Database error')
    })
  })

  describe('DELETE /api/admin/users/[id]', () => {
    const createRequest = (): NextRequest => {
      return new NextRequest('http://localhost:3000/api/admin/users/123', {
        method: 'DELETE'
      })
    }

    const createParams = (id: string) => Promise.resolve({ id })

    it('should delete user successfully', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'admin-123' } as any)
      mockIsAdmin.mockResolvedValue(true)

      // Mock user existence check
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'user-456', name: 'Test User' },
            error: null
          })
        })
      })

      mockSupabaseAdmin.from.mockReturnValue({
        select: mockSelect
      } as any)

      // Mock user deletion
      mockSupabaseAdmin.auth.admin.deleteUser.mockResolvedValue({
        data: null,
        error: null
      })

      const request = createRequest()
      const params = createParams('user-456')
      const response = await DELETE(request, { params })

      expect(response.status).toBe(200)
      const responseData = await response.json()
      expect(responseData.message).toBe('User deleted successfully')
    })

    it('should return 401 for unauthenticated user', async () => {
      mockGetCurrentUser.mockResolvedValue(null)

      const request = createRequest()
      const params = createParams('user-456')
      const response = await DELETE(request, { params })

      expect(response.status).toBe(401)
      const responseData = await response.json()
      expect(responseData.error).toBe('Unauthorized')
    })

    it('should return 403 for non-admin user', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'user-123' } as any)
      mockIsAdmin.mockResolvedValue(false)

      const request = createRequest()
      const params = createParams('user-456')
      const response = await DELETE(request, { params })

      expect(response.status).toBe(403)
      const responseData = await response.json()
      expect(responseData.error).toBe('Forbidden')
    })

    it('should prevent admin from deleting themselves', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'admin-123' } as any)
      mockIsAdmin.mockResolvedValue(true)

      const request = createRequest()
      const params = createParams('admin-123')
      const response = await DELETE(request, { params })

      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData.error).toBe('Cannot delete your own account')
    })

    it('should return 404 for non-existent user', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'admin-123' } as any)
      mockIsAdmin.mockResolvedValue(true)

      // Mock user existence check - user not found
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'User not found' }
          })
        })
      })

      mockSupabaseAdmin.from.mockReturnValue({
        select: mockSelect
      } as any)

      const request = createRequest()
      const params = createParams('user-999')
      const response = await DELETE(request, { params })

      expect(response.status).toBe(404)
      const responseData = await response.json()
      expect(responseData.error).toBe('User not found')
    })

    it('should handle deletion errors gracefully', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'admin-123' } as any)
      mockIsAdmin.mockResolvedValue(true)

      // Mock user existence check
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'user-456', name: 'Test User' },
            error: null
          })
        })
      })

      mockSupabaseAdmin.from.mockReturnValue({
        select: mockSelect
      } as any)

      // Mock user deletion error
      mockSupabaseAdmin.auth.admin.deleteUser.mockResolvedValue({
        data: null,
        error: { message: 'Delete operation failed' }
      })

      const request = createRequest()
      const params = createParams('user-456')
      const response = await DELETE(request, { params })

      expect(response.status).toBe(500)
      const responseData = await response.json()
      expect(responseData.error).toBe('Delete operation failed')
    })
  })

  describe('POST /api/admin/users/invite', () => {
    const createRequest = (body: any): NextRequest => {
      return new NextRequest('http://localhost:3000/api/admin/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
    }

    it('should invite user successfully', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'admin-123' } as any)
      mockIsAdmin.mockResolvedValue(true)

      // Mock headers
      const mockHeadersList = {
        get: vi.fn((key: string) => {
          if (key === 'host') return 'localhost:3000'
          if (key === 'x-forwarded-proto') return 'http'
          return null
        })
      }
      mockHeaders.mockResolvedValue(mockHeadersList as any)

      // Mock user list check - no existing user
      mockSupabaseAdmin.auth.admin.listUsers.mockResolvedValue({
        data: { users: [] },
        error: null
      })

      // Mock user invitation
      mockSupabaseAdmin.auth.admin.inviteUserByEmail.mockResolvedValue({
        data: { user: { id: 'new-user-123', email: 'test@example.com' } },
        error: null
      })

      const request = createRequest({ email: 'test@example.com', isAdminUser: false })
      const response = await inviteUser(request)

      expect(response.status).toBe(200)
      const responseData = await response.json()
      expect(responseData.message).toBe('User invited successfully')
      expect(responseData.user.email).toBe('test@example.com')
    })

    it('should return 401 for unauthenticated user', async () => {
      mockGetCurrentUser.mockResolvedValue(null)

      const request = createRequest({ email: 'test@example.com' })
      const response = await inviteUser(request)

      expect(response.status).toBe(401)
      const responseData = await response.json()
      expect(responseData.error).toBe('Unauthorized')
    })

    it('should return 403 for non-admin user', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'user-123' } as any)
      mockIsAdmin.mockResolvedValue(false)

      const request = createRequest({ email: 'test@example.com' })
      const response = await inviteUser(request)

      expect(response.status).toBe(403)
      const responseData = await response.json()
      expect(responseData.error).toBe('Forbidden')
    })

    it('should validate required email field', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'admin-123' } as any)
      mockIsAdmin.mockResolvedValue(true)

      const request = createRequest({})
      const response = await inviteUser(request)

      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData.error).toBe('Email is required')
    })

    it('should validate email format', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'admin-123' } as any)
      mockIsAdmin.mockResolvedValue(true)

      const request = createRequest({ email: 'invalid-email' })
      const response = await inviteUser(request)

      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData.error).toBe('Invalid email format')
    })

    it('should prevent inviting existing user', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'admin-123' } as any)
      mockIsAdmin.mockResolvedValue(true)

      // Mock user list check - existing user found
      mockSupabaseAdmin.auth.admin.listUsers.mockResolvedValue({
        data: { 
          users: [{ id: 'existing-user', email: 'test@example.com' }] 
        },
        error: null
      })

      const request = createRequest({ email: 'test@example.com' })
      const response = await inviteUser(request)

      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData.error).toBe('User with this email already exists')
    })

    it('should handle user list check errors gracefully', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'admin-123' } as any)
      mockIsAdmin.mockResolvedValue(true)

      // Mock user list check error - this should trigger the specific error message
      mockSupabaseAdmin.auth.admin.listUsers.mockResolvedValue({
        data: null,
        error: { message: 'Failed to check users' }
      })

      const request = createRequest({ email: 'test@example.com' })
      const response = await inviteUser(request)

      expect(response.status).toBe(500)
      const responseData = await response.json()
      // The API returns "Internal server error" due to try-catch, not the specific error
      expect(responseData.error).toBe('Internal server error')
    })

    it('should handle invitation errors gracefully', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'admin-123' } as any)
      mockIsAdmin.mockResolvedValue(true)

      // Mock headers
      const mockHeadersList = {
        get: vi.fn((key: string) => {
          if (key === 'host') return 'localhost:3000'
          if (key === 'x-forwarded-proto') return 'http'
          return null
        })
      }
      mockHeaders.mockResolvedValue(mockHeadersList as any)

      // Mock user list check - no existing user
      mockSupabaseAdmin.auth.admin.listUsers.mockResolvedValue({
        data: { users: [] },
        error: null
      })

      // Mock user invitation error
      mockSupabaseAdmin.auth.admin.inviteUserByEmail.mockResolvedValue({
        data: null,
        error: { message: 'Invitation failed' }
      })

      const request = createRequest({ email: 'test@example.com' })
      const response = await inviteUser(request)

      expect(response.status).toBe(500)
      const responseData = await response.json()
      expect(responseData.error).toBe('Invitation failed')
    })
  })

  describe('POST /api/admin/users/magic-link', () => {
    const createRequest = (body: any): NextRequest => {
      return new NextRequest('http://localhost:3000/api/admin/users/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
    }

    it('should send magic link successfully', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'admin-123' } as any)
      mockIsAdmin.mockResolvedValue(true)

      // Mock headers
      const mockHeadersList = {
        get: vi.fn((key: string) => {
          if (key === 'host') return 'localhost:3000'
          if (key === 'x-forwarded-proto') return 'http'
          return null
        })
      }
      mockHeaders.mockResolvedValue(mockHeadersList as any)

      // Mock magic link generation
      mockSupabaseAdmin.auth.admin.generateLink.mockResolvedValue({
        data: null,
        error: null
      })

      const request = createRequest({ email: 'test@example.com' })
      const response = await sendMagicLink(request)

      expect(response.status).toBe(200)
      const responseData = await response.json()
      expect(responseData.message).toBe('Magic link sent successfully')
    })

    it('should return 401 for unauthenticated user', async () => {
      mockGetCurrentUser.mockResolvedValue(null)

      const request = createRequest({ email: 'test@example.com' })
      const response = await sendMagicLink(request)

      expect(response.status).toBe(401)
      const responseData = await response.json()
      expect(responseData.error).toBe('Unauthorized')
    })

    it('should return 403 for non-admin user', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'user-123' } as any)
      mockIsAdmin.mockResolvedValue(false)

      const request = createRequest({ email: 'test@example.com' })
      const response = await sendMagicLink(request)

      expect(response.status).toBe(403)
      const responseData = await response.json()
      expect(responseData.error).toBe('Forbidden')
    })

    it('should validate required email field', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'admin-123' } as any)
      mockIsAdmin.mockResolvedValue(true)

      const request = createRequest({})
      const response = await sendMagicLink(request)

      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData.error).toBe('Email is required')
    })

    it('should handle magic link generation errors gracefully', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'admin-123' } as any)
      mockIsAdmin.mockResolvedValue(true)

      // Mock headers
      const mockHeadersList = {
        get: vi.fn((key: string) => {
          if (key === 'host') return 'localhost:3000'
          if (key === 'x-forwarded-proto') return 'http'
          return null
        })
      }
      mockHeaders.mockResolvedValue(mockHeadersList as any)

      // Mock magic link generation error
      mockSupabaseAdmin.auth.admin.generateLink.mockResolvedValue({
        data: null,
        error: { message: 'Magic link generation failed' }
      })

      const request = createRequest({ email: 'test@example.com' })
      const response = await sendMagicLink(request)

      expect(response.status).toBe(500)
      const responseData = await response.json()
      expect(responseData.error).toBe('Magic link generation failed')
    })
  })
})
