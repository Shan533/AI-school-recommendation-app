/**
 * Integration tests for Admin Reviews API
 * Priority: MEDIUM - Admin functionality, review management
 * 
 * Test Coverage Areas:
 * - DELETE /api/admin/reviews/[id] - Admin delete any review
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

// Import functions after mocking
import { DELETE } from '@/app/api/admin/reviews/[id]/route'
import { getCurrentUser, isAdmin } from '@/lib/supabase/helpers'
import { createAdminClient } from '@/lib/supabase/server'

// Create typed mocks
const mockGetCurrentUser = vi.mocked(getCurrentUser)
const mockIsAdmin = vi.mocked(isAdmin)
const mockCreateAdminClient = vi.mocked(createAdminClient)

// Mock Supabase admin client
const mockSupabaseAdmin = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn()
      }))
    })),
    delete: vi.fn(() => ({
      eq: vi.fn()
    }))
  }))
}

describe('Admin Reviews API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateAdminClient.mockReturnValue(mockSupabaseAdmin as any)
  })

  describe('DELETE /api/admin/reviews/[id]', () => {
    const createRequest = (): NextRequest => {
      return new NextRequest('http://localhost:3000/api/admin/reviews/123', {
        method: 'DELETE'
      })
    }

    const createParams = (id: string) => Promise.resolve({ id })

    it('should delete school review successfully', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'admin-123' } as any)
      mockIsAdmin.mockResolvedValue(true)

      // Mock school review found
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'review-123' },
            error: null
          })
        })
      })

      // Mock program review not found
      const mockSelectNotFound = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Not found' }
          })
        })
      })

      mockSupabaseAdmin.from.mockReturnValue({
        select: mockSelect
      } as any)

      // Mock deletion success
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null
        })
      })

      mockSupabaseAdmin.from.mockReturnValue({
        select: mockSelect,
        delete: mockDelete
      } as any)

      const request = createRequest()
      const params = createParams('review-123')
      const response = await DELETE(request, { params })

      expect(response.status).toBe(200)
      const responseData = await response.json()
      expect(responseData.message).toBe('Review deleted successfully')
      expect(responseData.reviewId).toBe('review-123')
      expect(responseData.tableName).toBe('school_reviews')
    })

    it('should delete program review successfully', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'admin-123' } as any)
      mockIsAdmin.mockResolvedValue(true)

      // Mock the from method to return different select results for different table calls
      let callCount = 0
      mockSupabaseAdmin.from.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          // First call: school_reviews table (not found)
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Not found' }
                })
              })
            })
          }
        } else if (callCount === 2) {
          // Second call: program_reviews table (found)
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'review-456' },
                  error: null
                })
              })
            })
          }
        } else {
          // Third call: delete operation
          return {
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: null,
                error: null
              })
            })
          }
        }
      })

      const request = createRequest()
      const params = createParams('review-456')
      const response = await DELETE(request, { params })

      expect(response.status).toBe(200)
      const responseData = await response.json()
      expect(responseData.message).toBe('Review deleted successfully')
      expect(responseData.reviewId).toBe('review-456')
      expect(responseData.tableName).toBe('program_reviews')
    })

    it('should return 401 for unauthenticated user', async () => {
      mockGetCurrentUser.mockResolvedValue(null)

      const request = createRequest()
      const params = createParams('review-123')
      const response = await DELETE(request, { params })

      expect(response.status).toBe(401)
      const responseData = await response.json()
      expect(responseData.error).toBe('Unauthorized')
    })

    it('should return 403 for non-admin user', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'user-123' } as any)
      mockIsAdmin.mockResolvedValue(false)

      const request = createRequest()
      const params = createParams('review-123')
      const response = await DELETE(request, { params })

      expect(response.status).toBe(403)
      const responseData = await response.json()
      expect(responseData.error).toBe('Forbidden - Admin access required')
    })

    it('should return 404 for non-existent review', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'admin-123' } as any)
      mockIsAdmin.mockResolvedValue(true)

      // Mock both school and program reviews not found
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Not found' }
          })
        })
      })

      mockSupabaseAdmin.from.mockReturnValue({
        select: mockSelect
      } as any)

      const request = createRequest()
      const params = createParams('review-999')
      const response = await DELETE(request, { params })

      expect(response.status).toBe(404)
      const responseData = await response.json()
      expect(responseData.error).toBe('Review not found')
    })

    it('should handle database errors during review check gracefully', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'admin-123' } as any)
      mockIsAdmin.mockResolvedValue(true)

      // Mock database error during review check
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database connection failed' }
          })
        })
      })

      mockSupabaseAdmin.from.mockReturnValue({
        select: mockSelect
      } as any)

      const request = createRequest()
      const params = createParams('review-123')
      const response = await DELETE(request, { params })

      expect(response.status).toBe(404)
      const responseData = await response.json()
      expect(responseData.error).toBe('Review not found')
    })

    it('should handle deletion errors gracefully', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'admin-123' } as any)
      mockIsAdmin.mockResolvedValue(true)

      // Mock school review found
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'review-123' },
            error: null
          })
        })
      })

      // Mock deletion error
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Delete operation failed' }
        })
      })

      mockSupabaseAdmin.from.mockReturnValue({
        select: mockSelect,
        delete: mockDelete
      } as any)

      const request = createRequest()
      const params = createParams('review-123')
      const response = await DELETE(request, { params })

      expect(response.status).toBe(500)
      const responseData = await response.json()
      expect(responseData.error).toBe('Failed to delete review')
      expect(responseData.details).toBe('Delete operation failed')
    })

    it('should handle server errors gracefully', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'admin-123' } as any)
      mockIsAdmin.mockResolvedValue(true)

      // Mock createAdminClient to throw error
      mockCreateAdminClient.mockImplementation(() => {
        throw new Error('Server error')
      })

      const request = createRequest()
      const params = createParams('review-123')
      const response = await DELETE(request, { params })

      expect(response.status).toBe(500)
      const responseData = await response.json()
      expect(responseData.error).toBe('Internal server error')
    })
  })
})
