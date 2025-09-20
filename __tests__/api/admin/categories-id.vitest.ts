/**
 * Integration tests for Categories [ID] Admin API
 * Priority: MEDIUM - API endpoint functionality
 * 
 * Test Coverage Areas:
 * - GET /api/admin/categories/[id] - get specific category
 * - PUT /api/admin/categories/[id] - update category
 * - DELETE /api/admin/categories/[id] - delete category
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, PUT, DELETE } from '@/app/api/admin/categories/[id]/route'

// Mock dependencies
vi.mock('@/lib/supabase/helpers', () => ({
  createAdminClient: vi.fn()
}))

import { createAdminClient } from '@/lib/supabase/helpers'

const mockCreateAdminClient = vi.mocked(createAdminClient)

describe('/api/admin/categories/[id]', () => {
  const mockSupabaseClient = {
    from: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateAdminClient.mockReturnValue(mockSupabaseClient as any)
  })

  describe('GET', () => {
    it('should return category data for valid ID', async () => {
      const mockCategory = {
        id: 'cat-123',
        name: 'Computer Science',
        abbreviation: 'CS',
        description: 'Computer science programs',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockCategory,
              error: null
            })
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/admin/categories/cat-123')
      const response = await GET(request, { params: Promise.resolve({ id: 'cat-123' }) })
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.id).toBe('cat-123')
      expect(result.name).toBe('Computer Science')
      expect(result.abbreviation).toBe('CS')
    })

    it('should return 404 for non-existent category', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'No rows found' }
            })
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/admin/categories/nonexistent')
      const response = await GET(request, { params: Promise.resolve({ id: 'nonexistent' }) })
      const result = await response.json()

      expect(response.status).toBe(404)
      expect(result.error).toBe('Category not found')
    })

    it('should handle database errors', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection failed' }
            })
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/admin/categories/cat-123')
      const response = await GET(request, { params: Promise.resolve({ id: 'cat-123' }) })
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.error).toBe('Failed to fetch category')
    })

    it('should handle server errors', async () => {
      mockCreateAdminClient.mockImplementation(() => {
        throw new Error('Server error')
      })

      const request = new NextRequest('http://localhost:3000/api/admin/categories/cat-123')
      const response = await GET(request, { params: Promise.resolve({ id: 'cat-123' }) })
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.error).toBe('Internal server error')
    })
  })

  describe('PUT', () => {
    it('should update category with valid data', async () => {
      const updateData = {
        name: 'Updated Computer Science',
        abbreviation: 'UCS',
        description: 'Updated description'
      }

      const mockUpdatedCategory = { id: 'cat-123', ...updateData }

      // Mock duplicate check - no conflicts
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            neq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' } // No conflicts found
              })
            })
          })
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUpdatedCategory,
                error: null
              })
            })
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/admin/categories/cat-123', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })

      const response = await PUT(request, { params: Promise.resolve({ id: 'cat-123' }) })
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.name).toBe('Updated Computer Science')
      expect(result.abbreviation).toBe('UCS')
    })

    it('should return 400 for missing name', async () => {
      const updateData = {
        abbreviation: 'CS',
        description: 'Updated description'
      }

      const request = new NextRequest('http://localhost:3000/api/admin/categories/cat-123', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })

      const response = await PUT(request, { params: Promise.resolve({ id: 'cat-123' }) })
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toBe('Name and abbreviation are required')
    })

    it('should return 400 for missing abbreviation', async () => {
      const updateData = {
        name: 'Computer Science',
        description: 'Updated description'
      }

      const request = new NextRequest('http://localhost:3000/api/admin/categories/cat-123', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })

      const response = await PUT(request, { params: Promise.resolve({ id: 'cat-123' }) })
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toBe('Name and abbreviation are required')
    })

    it('should return 409 for duplicate name', async () => {
      const updateData = {
        name: 'Business', // Duplicate name
        abbreviation: 'CS',
        description: 'Updated description'
      }

      // Mock duplicate check - conflict found
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            neq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'other-cat' },
                error: null
              })
            })
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/admin/categories/cat-123', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })

      const response = await PUT(request, { params: Promise.resolve({ id: 'cat-123' }) })
      const result = await response.json()

      expect(response.status).toBe(409)
      expect(result.error).toBe('Category with this name or abbreviation already exists')
    })

    it('should return 409 for duplicate abbreviation', async () => {
      const updateData = {
        name: 'Computer Science',
        abbreviation: 'BUS', // Duplicate abbreviation
        description: 'Updated description'
      }

      // Mock duplicate check - conflict found
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            neq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'other-cat' },
                error: null
              })
            })
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/admin/categories/cat-123', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })

      const response = await PUT(request, { params: Promise.resolve({ id: 'cat-123' }) })
      const result = await response.json()

      expect(response.status).toBe(409)
      expect(result.error).toBe('Category with this name or abbreviation already exists')
    })

    it('should return 404 for non-existent category', async () => {
      const updateData = {
        name: 'Updated Category',
        abbreviation: 'UC',
        description: 'Updated description'
      }

      // Mock duplicate check - no conflicts
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            neq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' }
              })
            })
          })
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116', message: 'No rows found' }
              })
            })
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/admin/categories/nonexistent', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })

      const response = await PUT(request, { params: Promise.resolve({ id: 'nonexistent' }) })
      const result = await response.json()

      expect(response.status).toBe(404)
      expect(result.error).toBe('Category not found')
    })

    it('should handle database errors during update', async () => {
      const updateData = {
        name: 'Updated Category',
        abbreviation: 'UC'
      }

      // Mock duplicate check - no conflicts
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            neq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' }
              })
            })
          })
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database constraint violation' }
              })
            })
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/admin/categories/cat-123', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })

      const response = await PUT(request, { params: Promise.resolve({ id: 'cat-123' }) })
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.error).toBe('Failed to update category')
    })

    it('should handle server errors gracefully', async () => {
      mockCreateAdminClient.mockImplementation(() => {
        throw new Error('Server error')
      })

      const request = new NextRequest('http://localhost:3000/api/admin/categories/cat-123', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Test', abbreviation: 'T' })
      })

      const response = await PUT(request, { params: Promise.resolve({ id: 'cat-123' }) })
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.error).toBe('Internal server error')
    })
  })

  describe('DELETE', () => {
    it('should delete category successfully', async () => {
      // Mock category mapping check - no programs using this category
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: [],
              error: null
            })
          })
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/admin/categories/cat-123', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: Promise.resolve({ id: 'cat-123' }) })
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
    })

    it('should return 409 when category is assigned to programs', async () => {
      // Mock category mapping check - programs found using this category
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: [{ program_id: 'program-123' }],
              error: null
            })
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/admin/categories/cat-123', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: Promise.resolve({ id: 'cat-123' }) })
      const result = await response.json()

      expect(response.status).toBe(409)
      expect(result.error).toBe('Cannot delete category that is assigned to programs')
    })

    it('should return 404 for non-existent category', async () => {
      // Mock category mapping check - no programs using this category
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: [],
              error: null
            })
          })
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: { code: 'PGRST116', message: 'No rows found' }
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/admin/categories/nonexistent', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: Promise.resolve({ id: 'nonexistent' }) })
      const result = await response.json()

      expect(response.status).toBe(404)
      expect(result.error).toBe('Category not found')
    })

    it('should handle database errors during deletion', async () => {
      // Mock category mapping check - no programs using this category
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: [],
              error: null
            })
          })
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: { message: 'Foreign key constraint violation' }
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/admin/categories/cat-123', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: Promise.resolve({ id: 'cat-123' }) })
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.error).toBe('Failed to delete category')
    })

    it('should handle server errors gracefully', async () => {
      mockCreateAdminClient.mockImplementation(() => {
        throw new Error('Server error')
      })

      const request = new NextRequest('http://localhost:3000/api/admin/categories/cat-123', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: Promise.resolve({ id: 'cat-123' }) })
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.error).toBe('Internal server error')
    })

    it('should handle database errors during mapping check', async () => {
      // Mock category mapping check failure
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection failed' }
            })
          })
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: { message: 'Database connection failed' }
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/admin/categories/cat-123', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: Promise.resolve({ id: 'cat-123' }) })
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.error).toBe('Failed to delete category')
    })
  })
})
