import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/programs/route'
import { NextRequest } from 'next/server'

// Mock the supabase helpers
vi.mock('@/lib/supabase/helpers', () => ({
  getSupabaseClient: vi.fn()
}))

describe('/api/programs', () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis()
  }

  beforeEach(async () => {
    vi.clearAllMocks()
    const { getSupabaseClient } = await import('@/lib/supabase/helpers')
    vi.mocked(getSupabaseClient).mockResolvedValue(mockSupabase as any)
  })

  describe('GET', () => {
    it('should return programs successfully', async () => {
      const mockPrograms = [
        {
          id: 'program-1',
          name: 'Computer Science',
          initial: 'CS',
          school_id: 'school-1',
          degree: 'Bachelor',
          duration_years: 4,
          currency: 'USD',
          total_tuition: 50000,
          is_stem: true,
          website_url: 'https://example.com',
          application_difficulty: 'Medium',
          delivery_method: 'On-campus',
          schools: {
            name: 'Stanford University',
            initial: 'SU',
            location: 'California',
            region: 'United States'
          },
          program_category_mapping: [
            {
              is_primary: true,
              program_categories: {
                id: 'category-1',
                name: 'Computer Science',
                abbreviation: 'CS'
              }
            }
          ]
        },
        {
          id: 'program-2',
          name: 'Data Science',
          initial: 'DS',
          school_id: 'school-2',
          degree: 'Master',
          duration_years: 2,
          currency: 'USD',
          total_tuition: 60000,
          is_stem: true,
          website_url: 'https://example2.com',
          application_difficulty: 'Hard',
          delivery_method: 'Online',
          schools: {
            name: 'MIT',
            initial: 'MIT',
            location: 'Massachusetts',
            region: 'United States'
          },
          program_category_mapping: [
            {
              is_primary: false,
              program_categories: {
                id: 'category-2',
                name: 'Data Science',
                abbreviation: 'DS'
              }
            }
          ]
        }
      ]

      mockSupabase.order.mockResolvedValueOnce({
        data: mockPrograms,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/programs')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockPrograms)
    })

    it('should return empty array when no programs found', async () => {
      mockSupabase.order.mockResolvedValueOnce({
        data: [],
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/programs')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual([])
    })

    it('should return null data when programs is null', async () => {
      mockSupabase.order.mockResolvedValueOnce({
        data: null,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/programs')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual([])
    })

    it('should handle database errors gracefully', async () => {
      mockSupabase.order.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection failed' }
      })

      const request = new NextRequest('http://localhost:3000/api/programs')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch programs')
    })

    it('should handle server errors gracefully', async () => {
      const { getSupabaseClient } = await import('@/lib/supabase/helpers')
      vi.mocked(getSupabaseClient).mockRejectedValue(new Error('Server error'))

      const request = new NextRequest('http://localhost:3000/api/programs')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should include all required program fields', async () => {
      const mockPrograms = [
        {
          id: 'program-1',
          name: 'Computer Science',
          initial: 'CS',
          school_id: 'school-1',
          degree: 'Bachelor',
          duration_years: 4,
          currency: 'USD',
          total_tuition: 50000,
          is_stem: true,
          website_url: 'https://example.com',
          application_difficulty: 'Medium',
          delivery_method: 'On-campus',
          schools: {
            name: 'Stanford University',
            initial: 'SU',
            location: 'California',
            region: 'United States'
          },
          program_category_mapping: []
        }
      ]

      mockSupabase.order.mockResolvedValueOnce({
        data: mockPrograms,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/programs')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data[0]).toHaveProperty('id')
      expect(data[0]).toHaveProperty('name')
      expect(data[0]).toHaveProperty('initial')
      expect(data[0]).toHaveProperty('school_id')
      expect(data[0]).toHaveProperty('degree')
      expect(data[0]).toHaveProperty('duration_years')
      expect(data[0]).toHaveProperty('currency')
      expect(data[0]).toHaveProperty('total_tuition')
      expect(data[0]).toHaveProperty('is_stem')
      expect(data[0]).toHaveProperty('website_url')
      expect(data[0]).toHaveProperty('application_difficulty')
      expect(data[0]).toHaveProperty('delivery_method')
      expect(data[0]).toHaveProperty('schools')
      expect(data[0]).toHaveProperty('program_category_mapping')
    })

    it('should verify correct database query structure', async () => {
      const mockPrograms = []

      mockSupabase.order.mockResolvedValueOnce({
        data: mockPrograms,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/programs')
      await GET(request)

      // Verify the query structure
      expect(mockSupabase.from).toHaveBeenCalledWith('programs')
      expect(mockSupabase.select).toHaveBeenCalledWith(expect.stringContaining('id,'))
      expect(mockSupabase.select).toHaveBeenCalledWith(expect.stringContaining('schools ('))
      expect(mockSupabase.select).toHaveBeenCalledWith(expect.stringContaining('program_category_mapping'))
      expect(mockSupabase.order).toHaveBeenCalledWith('name')
    })
  })
})
