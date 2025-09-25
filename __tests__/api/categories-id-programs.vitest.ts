import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/categories/[id]/programs/route'
import { NextRequest } from 'next/server'

// Mock the supabase helpers
vi.mock('@/lib/supabase/helpers', () => ({
  getSupabaseClient: vi.fn()
}))

describe('/api/categories/[id]/programs', () => {
  const mockSupabase = {
    from: vi.fn(),
    select: vi.fn(),
    eq: vi.fn(),
    single: vi.fn(),
    order: vi.fn(),
    range: vi.fn()
  }

  beforeEach(async () => {
    vi.clearAllMocks()
    const { getSupabaseClient } = await import('@/lib/supabase/helpers')
    vi.mocked(getSupabaseClient).mockResolvedValue(mockSupabase as any)
  })

  describe('GET', () => {
    it('should return category programs successfully', async () => {
      const mockCategory = {
        id: 'category-1',
        name: 'Computer Science'
      }

      const mockPrograms = [
        {
          is_primary: true,
          programs: {
            id: 'program-1',
            name: 'Computer Science',
            initial: 'CS',
            degree: 'Bachelor',
            duration_years: 4,
            total_tuition: 50000,
            currency: 'USD',
            is_stem: true,
            description: 'CS program',
            delivery_method: 'On-campus',
            schedule_type: 'Full-time',
            location: 'California',
            application_difficulty: 'Medium',
            difficulty_description: 'Moderate difficulty',
            schools: {
              id: 'school-1',
              name: 'Stanford University',
              initial: 'SU',
              region: 'United States',
              location: 'California',
              qs_ranking: 2
            }
          }
        }
      ]

      // Mock category verification
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockCategory,
              error: null
            })
          })
        })
      })

      // Mock programs fetch
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: mockPrograms,
                error: null
              })
            })
          })
        })
      })

      // Mock count fetch
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            count: 1,
            error: null
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/categories/category-1/programs')
      const params = { id: 'category-1' }

      const response = await GET(request, { params: Promise.resolve(params) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.category).toEqual(mockCategory)
      expect(data.data.programs).toHaveLength(1)
      expect(data.data.programs[0].is_primary_category).toBe(true)
      expect(data.data.pagination.page).toBe(1)
      expect(data.data.pagination.limit).toBe(25)
      expect(data.data.pagination.total).toBe(1)
    })

    it('should return 404 when category not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Category not found' }
            })
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/categories/non-existent/programs')
      const params = { id: 'non-existent' }

      const response = await GET(request, { params: Promise.resolve(params) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Category not found')
    })

    it('should handle programs fetch error', async () => {
      const mockCategory = {
        id: 'category-1',
        name: 'Computer Science'
      }

      // Mock category verification (success)
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockCategory,
              error: null
            })
          })
        })
      })

      // Mock programs fetch (error)
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database error' }
              })
            })
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/categories/category-1/programs')
      const params = { id: 'category-1' }

      const response = await GET(request, { params: Promise.resolve(params) })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch programs')
    })

    it('should handle server errors gracefully', async () => {
      const { getSupabaseClient } = await import('@/lib/supabase/helpers')
      vi.mocked(getSupabaseClient).mockRejectedValue(new Error('Database connection failed'))

      const request = new NextRequest('http://localhost:3000/api/categories/category-1/programs')
      const params = { id: 'category-1' }

      const response = await GET(request, { params: Promise.resolve(params) })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })
})