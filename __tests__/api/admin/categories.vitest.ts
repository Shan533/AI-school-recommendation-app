/**
 * Integration tests for Categories Admin API
 * Priority: MEDIUM - API endpoint functionality
 * 
 * Test Coverage Areas:
 * - GET /api/admin/categories - list categories with search/pagination
 * - POST /api/admin/categories - create category
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/admin/categories/route'

// Mock dependencies
vi.mock('@/lib/supabase/helpers', () => ({
  createAdminClient: vi.fn()
}))

import { createAdminClient } from '@/lib/supabase/helpers'

const mockCreateAdminClient = vi.mocked(createAdminClient)

describe('/api/admin/categories', () => {
  const mockSupabaseClient = {
    from: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateAdminClient.mockReturnValue(mockSupabaseClient as any)
  })

  describe('GET', () => {
    it('should return categories list with default pagination', async () => {
      const mockCategories = [
        { id: 'cat-1', name: 'Computer Science', abbreviation: 'CS', description: 'CS programs' },
        { id: 'cat-2', name: 'Business', abbreviation: 'BUS', description: 'Business programs' }
      ]

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({
              data: mockCategories,
              error: null,
              count: 2
            })
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/admin/categories')
      const response = await GET(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.categories).toEqual([
        { id: 'cat-1', name: 'Computer Science', abbreviation: 'CS', description: 'CS programs', career_paths: [] },
        { id: 'cat-2', name: 'Business', abbreviation: 'BUS', description: 'Business programs', career_paths: [] }
      ])
      expect(result.total).toBe(2)
    })

    it('should handle search query parameter', async () => {
      const mockCategories = [
        { id: 'cat-1', name: 'Computer Science', abbreviation: 'CS' }
      ]

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockReturnValue({
              or: vi.fn().mockResolvedValue({
                data: mockCategories,
                error: null,
                count: 1
              })
            })
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/admin/categories?search=computer')
      const response = await GET(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.categories).toEqual([
        { id: 'cat-1', name: 'Computer Science', abbreviation: 'CS', career_paths: [] }
      ])
      expect(result.total).toBe(1)
    })

    it('should handle pagination parameters', async () => {
      const mockCategories = [
        { id: 'cat-3', name: 'Engineering', abbreviation: 'ENG' }
      ]

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({
              data: mockCategories,
              error: null,
              count: 1
            })
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/admin/categories?limit=10&offset=20')
      const response = await GET(request)

      expect(response.status).toBe(200)
    })

    it('should handle database errors', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection failed' },
              count: null
            })
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/admin/categories')
      const response = await GET(request)
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.error).toBe('Failed to fetch categories')
    })

    it('should handle server errors', async () => {
      mockCreateAdminClient.mockImplementation(() => {
        throw new Error('Server error')
      })

      const request = new NextRequest('http://localhost:3000/api/admin/categories')
      const response = await GET(request)
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.error).toBe('Internal server error')
    })
  })

  describe('POST', () => {
    it('should create new category with valid data', async () => {
      const categoryData = {
        name: 'Data Science',
        abbreviation: 'DS',
        description: 'Data science programs'
      }

      const mockCreatedCategory = { id: 'cat-123', ...categoryData }

      // Mock duplicate check - no existing category
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' } // No rows found
            })
          })
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockCreatedCategory,
              error: null
            })
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify(categoryData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(201)
      expect(result.id).toBe('cat-123')
      expect(result.name).toBe('Data Science')
    })

    it('should return 400 for missing name', async () => {
      const categoryData = {
        abbreviation: 'DS',
        description: 'Data science programs'
      }

      const request = new NextRequest('http://localhost:3000/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify(categoryData)
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toBe('Validation failed')
      expect(result.details).toHaveLength(1)
      expect(result.details[0].field).toBe('name')
    })

    it('should return 400 for missing abbreviation', async () => {
      const categoryData = {
        name: 'Data Science',
        description: 'Data science programs'
      }

      const request = new NextRequest('http://localhost:3000/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify(categoryData)
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toBe('Validation failed')
      expect(result.details).toHaveLength(1)
      expect(result.details[0].field).toBe('abbreviation')
    })

    it('should return 409 for duplicate name', async () => {
      const categoryData = {
        name: 'Computer Science',
        abbreviation: 'CS',
        description: 'CS programs'
      }

      // Mock duplicate check - existing category found
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'existing-cat' },
              error: null
            })
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify(categoryData)
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(409)
      expect(result.error).toBe('Category with this name or abbreviation already exists')
    })

    it('should return 409 for duplicate abbreviation', async () => {
      const categoryData = {
        name: 'Computer Studies',
        abbreviation: 'CS', // Same abbreviation
        description: 'Computer studies programs'
      }

      // Mock duplicate check - existing category found
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'existing-cat' },
              error: null
            })
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify(categoryData)
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(409)
      expect(result.error).toBe('Category with this name or abbreviation already exists')
    })

    it('should handle database errors during creation', async () => {
      const categoryData = {
        name: 'Data Science',
        abbreviation: 'DS'
      }

      // Mock duplicate check - no existing category
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }
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

      const request = new NextRequest('http://localhost:3000/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify(categoryData)
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.error).toBe('Failed to create category')
    })

    it('should handle server errors gracefully', async () => {
      mockCreateAdminClient.mockImplementation(() => {
        throw new Error('Server error')
      })

      const request = new NextRequest('http://localhost:3000/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test', abbreviation: 'T' })
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.error).toBe('Internal server error')
    })

    it('should create category without description', async () => {
      const categoryData = {
        name: 'Engineering',
        abbreviation: 'ENG'
        // No description provided
      }

      const mockCreatedCategory = { id: 'cat-456', ...categoryData, description: null }

      // Mock duplicate check - no existing category
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }
            })
          })
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockCreatedCategory,
              error: null
            })
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify(categoryData)
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(201)
      expect(result.id).toBe('cat-456')
      expect(result.description).toBeNull()
    })
  })
})
