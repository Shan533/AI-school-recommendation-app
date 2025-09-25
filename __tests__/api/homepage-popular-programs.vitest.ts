import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/homepage/popular-programs/route'
import { NextRequest } from 'next/server'

// Mock the supabase server
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn()
}))

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn()
}))

describe('/api/homepage/popular-programs', () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis()
  }

  beforeEach(async () => {
    vi.clearAllMocks()
    const { createClient } = await import('@/lib/supabase/server')
    const { cookies } = await import('next/headers')
    
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      has: vi.fn(),
      getAll: vi.fn(),
      toString: vi.fn()
    } as any)
    
    vi.mocked(createClient).mockReturnValue(mockSupabase as any)
  })

  describe('GET', () => {
    it('should return popular programs with ratings successfully', async () => {
      const mockPrograms = [
        {
          id: 'program-1',
          name: 'Computer Science',
          initial: 'CS',
          degree: 'Bachelor',
          duration_years: 4,
          total_tuition: 50000,
          currency: 'USD',
          is_stem: true,
          description: 'CS program',
          application_difficulty: 'Medium',
          schools: {
            id: 'school-1',
            name: 'Stanford University',
            initial: 'SU',
            region: 'United States',
            location: 'California',
            qs_ranking: 2
          },
          program_reviews: [
            { rating: 5 },
            { rating: 4 },
            { rating: 5 }
          ]
        },
        {
          id: 'program-2',
          name: 'Data Science',
          initial: 'DS',
          degree: 'Master',
          duration_years: 2,
          total_tuition: 60000,
          currency: 'USD',
          is_stem: true,
          description: 'DS program',
          application_difficulty: 'Hard',
          schools: {
            id: 'school-2',
            name: 'MIT',
            initial: 'MIT',
            region: 'United States',
            location: 'Massachusetts',
            qs_ranking: 1
          },
          program_reviews: [
            { rating: 3 },
            { rating: 4 }
          ]
        }
      ]

      mockSupabase.not.mockResolvedValueOnce({
        data: mockPrograms,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/homepage/popular-programs')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(2)
      
      // Check that programs are sorted by rating (descending)
      expect(data.data[0].average_rating).toBeGreaterThanOrEqual(data.data[1].average_rating)
      
      // Check rating calculations
      expect(data.data[0].average_rating).toBeCloseTo(4.67, 2) // (5+4+5)/3
      expect(data.data[0].review_count).toBe(3)
      expect(data.data[1].average_rating).toBeCloseTo(3.5, 2) // (3+4)/2
      expect(data.data[1].review_count).toBe(2)
    })

    it('should return empty array when no programs with reviews found', async () => {
      mockSupabase.not.mockResolvedValueOnce({
        data: [],
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/homepage/popular-programs')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual([])
    })

    it('should filter out programs without reviews', async () => {
      const mockPrograms = [
        {
          id: 'program-1',
          name: 'Computer Science',
          initial: 'CS',
          degree: 'Bachelor',
          duration_years: 4,
          total_tuition: 50000,
          currency: 'USD',
          is_stem: true,
          description: 'CS program',
          application_difficulty: 'Medium',
          schools: {
            id: 'school-1',
            name: 'Stanford University',
            initial: 'SU',
            region: 'United States',
            location: 'California',
            qs_ranking: 2
          },
          program_reviews: [
            { rating: 5 },
            { rating: 4 }
          ]
        },
        {
          id: 'program-2',
          name: 'Data Science',
          initial: 'DS',
          degree: 'Master',
          duration_years: 2,
          total_tuition: 60000,
          currency: 'USD',
          is_stem: true,
          description: 'DS program',
          application_difficulty: 'Hard',
          schools: {
            id: 'school-2',
            name: 'MIT',
            initial: 'MIT',
            region: 'United States',
            location: 'Massachusetts',
            qs_ranking: 1
          },
          program_reviews: [] // No reviews
        }
      ]

      mockSupabase.not.mockResolvedValueOnce({
        data: mockPrograms,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/homepage/popular-programs')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1) // Only programs with reviews
      expect(data.data[0].id).toBe('program-1')
      expect(data.data[0].review_count).toBe(2)
    })

    it('should limit results to 10 programs', async () => {
      // Create 15 programs with reviews
      const mockPrograms = Array.from({ length: 15 }, (_, i) => ({
        id: `program-${i + 1}`,
        name: `Program ${i + 1}`,
        initial: `P${i + 1}`,
        degree: 'Bachelor',
        duration_years: 4,
        total_tuition: 50000,
        currency: 'USD',
        is_stem: true,
        description: `Program ${i + 1} description`,
        application_difficulty: 'Medium',
        schools: {
          id: `school-${i + 1}`,
          name: `School ${i + 1}`,
          initial: `S${i + 1}`,
          region: 'United States',
          location: 'Location',
          qs_ranking: i + 1
        },
        program_reviews: [
          { rating: 5 - (i % 5) } // Varying ratings
        ]
      }))

      mockSupabase.not.mockResolvedValueOnce({
        data: mockPrograms,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/homepage/popular-programs')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(10) // Limited to 10
    })

    it('should handle database errors gracefully', async () => {
      mockSupabase.not.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection failed' }
      })

      const request = new NextRequest('http://localhost:3000/api/homepage/popular-programs')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch popular programs')
    })

    it('should handle server errors gracefully', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockImplementation(() => {
        throw new Error('Server error')
      })

      const request = new NextRequest('http://localhost:3000/api/homepage/popular-programs')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should handle programs with null reviews', async () => {
      const mockPrograms = [
        {
          id: 'program-1',
          name: 'Computer Science',
          initial: 'CS',
          degree: 'Bachelor',
          duration_years: 4,
          total_tuition: 50000,
          currency: 'USD',
          is_stem: true,
          description: 'CS program',
          application_difficulty: 'Medium',
          schools: {
            id: 'school-1',
            name: 'Stanford University',
            initial: 'SU',
            region: 'United States',
            location: 'California',
            qs_ranking: 2
          },
          program_reviews: null
        }
      ]

      mockSupabase.not.mockResolvedValueOnce({
        data: mockPrograms,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/homepage/popular-programs')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(0) // Filtered out due to no reviews
    })

    it('should verify correct database query structure', async () => {
      mockSupabase.not.mockResolvedValueOnce({
        data: [],
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/homepage/popular-programs')
      await GET(request)

      // Verify the query structure
      expect(mockSupabase.from).toHaveBeenCalledWith('programs')
      expect(mockSupabase.select).toHaveBeenCalledWith(expect.stringContaining('id,'))
      expect(mockSupabase.select).toHaveBeenCalledWith(expect.stringContaining('schools ('))
      expect(mockSupabase.select).toHaveBeenCalledWith(expect.stringContaining('program_reviews ('))
      expect(mockSupabase.not).toHaveBeenCalledWith('program_reviews', 'is', null)
    })
  })
})
