/**
 * Integration tests for Public School Reviews API
 * Priority: MEDIUM - User review management functionality
 * 
 * Test Coverage Areas:
 * - PUT /api/reviews/school/[id] - Update school review
 * - DELETE /api/reviews/school/[id] - Delete school review
 */

import { vi, describe, it, expect, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn()
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn()
}))

// Import functions after mocking
import { PUT, DELETE } from '@/app/api/reviews/school/[id]/route'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// Create typed mocks
const mockCreateClient = vi.mocked(createClient)
const mockCookies = vi.mocked(cookies)

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn()
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn()
      }))
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn()
      }))
    })),
    delete: vi.fn(() => ({
      eq: vi.fn()
    }))
  }))
}

describe('Public School Reviews API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateClient.mockReturnValue(mockSupabaseClient as any)
    mockCookies.mockResolvedValue({
      get: vi.fn()
    } as any)
  })

  describe('PUT /api/reviews/school/[id]', () => {
    const createRequest = (body: any): NextRequest => {
      return new NextRequest('http://localhost:3000/api/reviews/school/123', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
    }

    const createParams = (id: string) => Promise.resolve({ id })

    it('should update school review successfully', async () => {
      // Mock authenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      // Mock existing review check
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'review-123', user_id: 'user-123' },
            error: null
          })
        })
      })

      // Mock update operation
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: [{ id: 'review-123', rating: 4.5, comment: 'Great school!' }],
            error: null
          })
        })
      })

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
        update: mockUpdate
      } as any)

      const request = createRequest({ rating: 4.5, comment: 'Great school!' })
      const params = createParams('review-123')
      const response = await PUT(request, { params })

      expect(response.status).toBe(200)
      const responseData = await response.json()
      expect(responseData.data.id).toBe('review-123')
      expect(responseData.data.rating).toBe(4.5)
      expect(responseData.data.comment).toBe('Great school!')
    })

    it('should return 401 for unauthenticated user', async () => {
      // Mock unauthenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' }
      })

      const request = createRequest({ rating: 4.5, comment: 'Great school!' })
      const params = createParams('review-123')
      const response = await PUT(request, { params })

      expect(response.status).toBe(401)
      const responseData = await response.json()
      expect(responseData.error).toBe('Unauthorized')
    })

    it('should validate rating range', async () => {
      // Mock authenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const request = createRequest({ rating: 6.0, comment: 'Invalid rating' })
      const params = createParams('review-123')
      const response = await PUT(request, { params })

      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData.error).toBe('Invalid rating')
    })

    it('should validate minimum rating', async () => {
      // Mock authenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const request = createRequest({ rating: 0.0, comment: 'Too low rating' })
      const params = createParams('review-123')
      const response = await PUT(request, { params })

      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData.error).toBe('Invalid rating')
    })

    it('should return 404 for non-existent review', async () => {
      // Mock authenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      // Mock review not found
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Review not found' }
          })
        })
      })

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect
      } as any)

      const request = createRequest({ rating: 4.5, comment: 'Great school!' })
      const params = createParams('review-999')
      const response = await PUT(request, { params })

      expect(response.status).toBe(404)
      const responseData = await response.json()
      expect(responseData.error).toBe('Review not found')
    })

    it('should return 403 for review not owned by user', async () => {
      // Mock authenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      // Mock review owned by different user
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'review-123', user_id: 'user-456' },
            error: null
          })
        })
      })

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect
      } as any)

      const request = createRequest({ rating: 4.5, comment: 'Great school!' })
      const params = createParams('review-123')
      const response = await PUT(request, { params })

      expect(response.status).toBe(403)
      const responseData = await response.json()
      expect(responseData.error).toBe('Forbidden')
    })

    it('should handle update errors gracefully', async () => {
      // Mock authenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      // Mock existing review check
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'review-123', user_id: 'user-123' },
            error: null
          })
        })
      })

      // Mock update error
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Update failed' }
          })
        })
      })

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
        update: mockUpdate
      } as any)

      const request = createRequest({ rating: 4.5, comment: 'Great school!' })
      const params = createParams('review-123')
      const response = await PUT(request, { params })

      expect(response.status).toBe(500)
      const responseData = await response.json()
      expect(responseData.error).toBe('Failed to update review')
      expect(responseData.details).toBe('Update failed')
    })
  })

  describe('DELETE /api/reviews/school/[id]', () => {
    const createRequest = (): NextRequest => {
      return new NextRequest('http://localhost:3000/api/reviews/school/123', {
        method: 'DELETE'
      })
    }

    const createParams = (id: string) => Promise.resolve({ id })

    it('should delete school review successfully', async () => {
      // Mock authenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      // Mock existing review check
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'review-123', user_id: 'user-123' },
            error: null
          })
        })
      })

      // Mock delete operation
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null
        })
      })

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
        delete: mockDelete
      } as any)

      const request = createRequest()
      const params = createParams('review-123')
      const response = await DELETE(request, { params })

      expect(response.status).toBe(200)
      const responseData = await response.json()
      expect(responseData.message).toBe('Review deleted successfully')
    })

    it('should return 401 for unauthenticated user', async () => {
      // Mock unauthenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' }
      })

      const request = createRequest()
      const params = createParams('review-123')
      const response = await DELETE(request, { params })

      expect(response.status).toBe(401)
      const responseData = await response.json()
      expect(responseData.error).toBe('Unauthorized')
    })

    it('should return 404 for non-existent review', async () => {
      // Mock authenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      // Mock review not found
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Review not found' }
          })
        })
      })

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect
      } as any)

      const request = createRequest()
      const params = createParams('review-999')
      const response = await DELETE(request, { params })

      expect(response.status).toBe(404)
      const responseData = await response.json()
      expect(responseData.error).toBe('Review not found')
    })

    it('should return 403 for review not owned by user', async () => {
      // Mock authenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      // Mock review owned by different user
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'review-123', user_id: 'user-456' },
            error: null
          })
        })
      })

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect
      } as any)

      const request = createRequest()
      const params = createParams('review-123')
      const response = await DELETE(request, { params })

      expect(response.status).toBe(403)
      const responseData = await response.json()
      expect(responseData.error).toBe('Forbidden')
    })

    it('should handle delete errors gracefully', async () => {
      // Mock authenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      // Mock existing review check
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'review-123', user_id: 'user-123' },
            error: null
          })
        })
      })

      // Mock delete error
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Delete failed' }
        })
      })

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
        delete: mockDelete
      } as any)

      const request = createRequest()
      const params = createParams('review-123')
      const response = await DELETE(request, { params })

      expect(response.status).toBe(500)
      const responseData = await response.json()
      expect(responseData.error).toBe('Failed to delete review')
      // Note: DELETE endpoint doesn't return details field
    })
  })
})
