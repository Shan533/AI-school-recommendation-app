import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/homepage/top-schools/route'
import { NextRequest } from 'next/server'

// Mock the supabase server
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn()
}))

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn()
}))

describe('/api/homepage/top-schools', () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis()
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
    it('should return top schools successfully', async () => {
      const mockSchools = [
        {
          id: 'school-1',
          name: 'MIT',
          initial: 'MIT',
          region: 'United States',
          location: 'Massachusetts',
          qs_ranking: 1,
          website_url: 'https://mit.edu'
        },
        {
          id: 'school-2',
          name: 'Stanford University',
          initial: 'SU',
          region: 'United States',
          location: 'California',
          qs_ranking: 2,
          website_url: 'https://stanford.edu'
        },
        {
          id: 'school-3',
          name: 'Harvard University',
          initial: 'HU',
          region: 'United States',
          location: 'Massachusetts',
          qs_ranking: 3,
          website_url: 'https://harvard.edu'
        }
      ]

      mockSupabase.limit.mockResolvedValueOnce({
        data: mockSchools,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/homepage/top-schools')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockSchools)
      expect(data.data).toHaveLength(3)
    })

    it('should return empty array when no top schools found', async () => {
      mockSupabase.limit.mockResolvedValueOnce({
        data: [],
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/homepage/top-schools')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual([])
    })

    it('should filter schools by QS ranking <= 100', async () => {
      const mockSchools = [
        {
          id: 'school-1',
          name: 'MIT',
          initial: 'MIT',
          region: 'United States',
          location: 'Massachusetts',
          qs_ranking: 1,
          website_url: 'https://mit.edu'
        },
        {
          id: 'school-2',
          name: 'Stanford University',
          initial: 'SU',
          region: 'United States',
          location: 'California',
          qs_ranking: 50,
          website_url: 'https://stanford.edu'
        },
        {
          id: 'school-3',
          name: 'Some University',
          initial: 'SU',
          region: 'United States',
          location: 'California',
          qs_ranking: 100,
          website_url: 'https://some.edu'
        }
      ]

      mockSupabase.limit.mockResolvedValueOnce({
        data: mockSchools,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/homepage/top-schools')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(3)
      
      // Verify all schools have ranking <= 100
      data.data.forEach((school: any) => {
        expect(school.qs_ranking).toBeLessThanOrEqual(100)
      })
    })

    it('should limit results to 10 schools', async () => {
      // Create 10 schools with rankings <= 100
      const mockSchools = Array.from({ length: 10 }, (_, i) => ({
        id: `school-${i + 1}`,
        name: `University ${i + 1}`,
        initial: `U${i + 1}`,
        region: 'United States',
        location: 'Location',
        qs_ranking: i + 1, // Rankings 1-10, all <= 100
        website_url: `https://university${i + 1}.edu`
      }))

      mockSupabase.limit.mockResolvedValueOnce({
        data: mockSchools,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/homepage/top-schools')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(10) // Limited to 10
    })

    it('should order schools by QS ranking ascending', async () => {
      const mockSchools = [
        {
          id: 'school-1',
          name: 'MIT',
          initial: 'MIT',
          region: 'United States',
          location: 'Massachusetts',
          qs_ranking: 1,
          website_url: 'https://mit.edu'
        },
        {
          id: 'school-2',
          name: 'Stanford University',
          initial: 'SU',
          region: 'United States',
          location: 'California',
          qs_ranking: 2,
          website_url: 'https://stanford.edu'
        }
      ]

      mockSupabase.limit.mockResolvedValueOnce({
        data: mockSchools,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/homepage/top-schools')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data[0].qs_ranking).toBeLessThanOrEqual(data.data[1].qs_ranking)
    })

    it('should handle database errors gracefully', async () => {
      mockSupabase.limit.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection failed' }
      })

      const request = new NextRequest('http://localhost:3000/api/homepage/top-schools')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch top schools')
    })

    it('should handle server errors gracefully', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockImplementation(() => {
        throw new Error('Server error')
      })

      const request = new NextRequest('http://localhost:3000/api/homepage/top-schools')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should include all required school fields', async () => {
      const mockSchools = [
        {
          id: 'school-1',
          name: 'MIT',
          initial: 'MIT',
          region: 'United States',
          location: 'Massachusetts',
          qs_ranking: 1,
          website_url: 'https://mit.edu'
        }
      ]

      mockSupabase.limit.mockResolvedValueOnce({
        data: mockSchools,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/homepage/top-schools')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data[0]).toHaveProperty('id')
      expect(data.data[0]).toHaveProperty('name')
      expect(data.data[0]).toHaveProperty('initial')
      expect(data.data[0]).toHaveProperty('region')
      expect(data.data[0]).toHaveProperty('location')
      expect(data.data[0]).toHaveProperty('qs_ranking')
      expect(data.data[0]).toHaveProperty('website_url')
    })

    it('should verify correct database query structure', async () => {
      mockSupabase.limit.mockResolvedValueOnce({
        data: [],
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/homepage/top-schools')
      await GET(request)

      // Verify the query structure
      expect(mockSupabase.from).toHaveBeenCalledWith('schools')
      expect(mockSupabase.select).toHaveBeenCalledWith(expect.stringContaining('id,'))
      expect(mockSupabase.select).toHaveBeenCalledWith(expect.stringContaining('name,'))
      expect(mockSupabase.select).toHaveBeenCalledWith(expect.stringContaining('initial,'))
      expect(mockSupabase.select).toHaveBeenCalledWith(expect.stringContaining('region,'))
      expect(mockSupabase.select).toHaveBeenCalledWith(expect.stringContaining('location,'))
      expect(mockSupabase.select).toHaveBeenCalledWith(expect.stringContaining('qs_ranking,'))
      expect(mockSupabase.select).toHaveBeenCalledWith(expect.stringContaining('website_url'))
      expect(mockSupabase.not).toHaveBeenCalledWith('qs_ranking', 'is', null)
      expect(mockSupabase.lte).toHaveBeenCalledWith('qs_ranking', 100)
      expect(mockSupabase.order).toHaveBeenCalledWith('qs_ranking')
      expect(mockSupabase.limit).toHaveBeenCalledWith(10)
    })

    it('should handle schools with missing optional fields', async () => {
      const mockSchools = [
        {
          id: 'school-1',
          name: 'MIT',
          initial: 'MIT',
          region: 'United States',
          location: 'Massachusetts',
          qs_ranking: 1,
          website_url: null // Optional field
        }
      ]

      mockSupabase.limit.mockResolvedValueOnce({
        data: mockSchools,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/homepage/top-schools')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
      expect(data.data[0].website_url).toBeNull()
    })
  })
})
