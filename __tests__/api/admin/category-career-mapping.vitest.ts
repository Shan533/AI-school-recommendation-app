/**
 * Unit tests for Category-Career Mapping Admin API
 * Priority: HIGH - New feature with zero coverage
 * 
 * Test Coverage Areas:
 * - GET /api/admin/category-career-mapping - fetch all mappings
 * - POST /api/admin/category-career-mapping - create new mapping
 * - DELETE /api/admin/category-career-mapping - delete mapping
 * - Validation and error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST, DELETE } from '@/app/api/admin/category-career-mapping/route'

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: vi.fn()
}))

import { createAdminClient } from '@/lib/supabase/server'

const mockCreateAdminClient = vi.mocked(createAdminClient)

describe('/api/admin/category-career-mapping', () => {
  const mockSupabaseClient = {
    from: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateAdminClient.mockResolvedValue(mockSupabaseClient as any)
  })

  describe('GET', () => {
    it('should return category-career mappings', async () => {
      const mockMappings = [
        {
          category_id: 'cat-1',
          career_id: 'career-1',
          is_default: true,
          program_categories: { id: 'cat-1', name: 'Computer Science', abbreviation: 'CS' },
          careers: { id: 'career-1', name: 'Software Engineer', abbreviation: 'SWE' }
        },
        {
          category_id: 'cat-1',
          career_id: 'career-2',
          is_default: true,
          program_categories: { id: 'cat-1', name: 'Computer Science', abbreviation: 'CS' },
          careers: { id: 'career-2', name: 'Data Scientist', abbreviation: 'DS' }
        }
      ]

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockMappings,
              error: null
            })
          })
        })
      })

      const response = await GET()
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.mappings).toEqual({
        'cat-1': [
          { id: 'career-1', name: 'Software Engineer', abbreviation: 'SWE' },
          { id: 'career-2', name: 'Data Scientist', abbreviation: 'DS' }
        ]
      })
      expect(result.raw).toEqual(mockMappings)
    })

    it('should return empty mappings when no data exists', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: null
            })
          })
        })
      })

      const response = await GET()
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.mappings).toEqual({})
      expect(result.raw).toEqual(null)
    })

    it('should handle database errors', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection failed' }
            })
          })
        })
      })

      const response = await GET()
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.error).toBe('Failed to fetch category-career mappings')
    })

    it('should handle server errors', async () => {
      mockCreateAdminClient.mockRejectedValue(new Error('Server error'))

      const response = await GET()
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.error).toBe('Internal server error')
    })

    it('should transform mappings correctly with multiple categories', async () => {
      const mockMappings = [
        {
          category_id: 'cat-1',
          career_id: 'career-1',
          is_default: true,
          program_categories: { id: 'cat-1', name: 'Computer Science', abbreviation: 'CS' },
          careers: { id: 'career-1', name: 'Software Engineer', abbreviation: 'SWE' }
        },
        {
          category_id: 'cat-2',
          career_id: 'career-2',
          is_default: true,
          program_categories: { id: 'cat-2', name: 'Business', abbreviation: 'BUS' },
          careers: { id: 'career-2', name: 'Product Manager', abbreviation: 'PM' }
        }
      ]

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockMappings,
              error: null
            })
          })
        })
      })

      const response = await GET()
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.mappings).toEqual({
        'cat-1': [{ id: 'career-1', name: 'Software Engineer', abbreviation: 'SWE' }],
        'cat-2': [{ id: 'career-2', name: 'Product Manager', abbreviation: 'PM' }]
      })
    })
  })

  describe('POST', () => {
    it('should create new category-career mapping', async () => {
      const mappingData = {
        category_id: 'cat-1',
        career_id: 'career-1'
      }

      const mockCreatedMapping = { id: 'mapping-123', ...mappingData, is_default: true }

      // Mock duplicate check - no existing mapping
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' } // No rows found
              })
            })
          })
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockCreatedMapping,
              error: null
            })
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/admin/category-career-mapping', {
        method: 'POST',
        body: JSON.stringify(mappingData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(201)
      expect(result.id).toBe('mapping-123')
      expect(result.category_id).toBe('cat-1')
      expect(result.career_id).toBe('career-1')
    })

    it('should return 400 for missing category_id', async () => {
      const mappingData = {
        career_id: 'career-1'
        // Missing category_id
      }

      const request = new NextRequest('http://localhost:3000/api/admin/category-career-mapping', {
        method: 'POST',
        body: JSON.stringify(mappingData)
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toBe('category_id and career_id are required')
    })

    it('should return 400 for missing career_id', async () => {
      const mappingData = {
        category_id: 'cat-1'
        // Missing career_id
      }

      const request = new NextRequest('http://localhost:3000/api/admin/category-career-mapping', {
        method: 'POST',
        body: JSON.stringify(mappingData)
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toBe('category_id and career_id are required')
    })

    it('should return 409 for duplicate mapping', async () => {
      const mappingData = {
        category_id: 'cat-1',
        career_id: 'career-1'
      }

      // Mock duplicate check - existing mapping found
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'existing-mapping' },
                error: null
              })
            })
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/admin/category-career-mapping', {
        method: 'POST',
        body: JSON.stringify(mappingData)
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(409)
      expect(result.error).toBe('This career is already mapped to this category')
    })

    it('should handle database errors during creation', async () => {
      const mappingData = {
        category_id: 'cat-1',
        career_id: 'career-1'
      }

      // Mock duplicate check - no existing mapping
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' }
              })
            })
          })
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database constraint violation' }
            })
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/admin/category-career-mapping', {
        method: 'POST',
        body: JSON.stringify(mappingData)
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.error).toBe('Failed to create mapping')
    })

    it('should handle server errors gracefully', async () => {
      mockCreateAdminClient.mockRejectedValue(new Error('Server error'))

      const request = new NextRequest('http://localhost:3000/api/admin/category-career-mapping', {
        method: 'POST',
        body: JSON.stringify({ category_id: 'cat-1', career_id: 'career-1' })
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.error).toBe('Internal server error')
    })
  })

  describe('DELETE', () => {
    it('should delete category-career mapping', async () => {
      mockSupabaseClient.from.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              error: null
            })
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/admin/category-career-mapping?category_id=cat-1&career_id=career-1')

      const response = await DELETE(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
    })

    it('should return 400 for missing category_id', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/category-career-mapping?career_id=career-1')

      const response = await DELETE(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toBe('category_id and career_id are required')
    })

    it('should return 400 for missing career_id', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/category-career-mapping?category_id=cat-1')

      const response = await DELETE(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toBe('category_id and career_id are required')
    })

    it('should handle database errors during deletion', async () => {
      mockSupabaseClient.from.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              error: { message: 'Database constraint violation' }
            })
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/admin/category-career-mapping?category_id=cat-1&career_id=career-1')

      const response = await DELETE(request)
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.error).toBe('Failed to delete mapping')
    })

    it('should handle server errors gracefully', async () => {
      mockCreateAdminClient.mockRejectedValue(new Error('Server error'))

      const request = new NextRequest('http://localhost:3000/api/admin/category-career-mapping?category_id=cat-1&career_id=career-1')

      const response = await DELETE(request)
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.error).toBe('Internal server error')
    })
  })
})
