import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/categories/route'

// Mock Supabase
const mockSupabase = {
  from: vi.fn(),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabase),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({})),
}))

describe('/api/categories', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return categories with related careers', async () => {
    const mockCategories = [
      {
        id: '1',
        name: 'Computer Science',
        abbreviation: 'CS',
        description: 'Computer Science programs',
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
      },
    ]

    const mockCareers = [
      {
        careers: {
          id: '1',
          name: 'Software Engineer',
          abbreviation: 'SWE',
          career_type: 'Software',
          industry: 'Technology',
        },
      },
    ]

    // Mock the first call for categories
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: mockCategories,
        error: null,
      }),
    })

    // Mock the second call for careers (for each category)
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn(),
    }
    
    // Configure eq to return this for chaining on first call, result on second call
    let eqCallCount = 0
    mockQuery.eq.mockImplementation(() => {
      eqCallCount++
      if (eqCallCount === 1) {
        return mockQuery // Return this for chaining
      } else {
        return Promise.resolve({
          data: mockCareers,
          error: null,
        })
      }
    })
    
    mockSupabase.from.mockReturnValueOnce(mockQuery)

    const request = new NextRequest('http://localhost:3000/api/categories')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toHaveLength(1)
    expect(data.data[0]).toMatchObject({
      id: '1',
      name: 'Computer Science',
      abbreviation: 'CS',
    })
  })

  it('should handle categories with custom sorting', async () => {
    const mockCategories = [
      {
        id: '1',
        name: 'Data Science',
        abbreviation: 'DS',
        description: 'Data Science programs',
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
      },
      {
        id: '2',
        name: 'Computer Science',
        abbreviation: 'CS',
        description: 'Computer Science programs',
        created_at: '2023-01-02',
        updated_at: '2023-01-02',
      },
      {
        id: '3',
        name: 'Artificial Intelligence',
        abbreviation: 'AI',
        description: 'AI programs',
        created_at: '2023-01-03',
        updated_at: '2023-01-03',
      },
    ]

    const mockCareers = [
      {
        careers: {
          id: '1',
          name: 'Software Engineer',
          abbreviation: 'SWE',
          career_type: 'Software',
          industry: 'Technology',
        },
      },
    ]

    // Mock the first call for categories
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: mockCategories,
        error: null,
      }),
    })

    // Mock multiple calls for careers (one for each category)
    for (let i = 0; i < mockCategories.length; i++) {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn(),
      }
      
      let eqCallCount = 0
      mockQuery.eq.mockImplementation(() => {
        eqCallCount++
        if (eqCallCount === 1) {
          return mockQuery // Return this for chaining
        } else {
          return Promise.resolve({
            data: i === 0 ? mockCareers : [], // Only first category has careers
            error: null,
          })
        }
      })
      
      mockSupabase.from.mockReturnValueOnce(mockQuery)
    }

    const request = new NextRequest('http://localhost:3000/api/categories')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toHaveLength(3)
    
    // Check custom sorting - Computer Science should come before Data Science
    expect(data.data[0].name).toBe('Computer Science')
    expect(data.data[1].name).toBe('Data Science')
    expect(data.data[2].name).toBe('Artificial Intelligence') // Alphabetical for non-custom
  })

  it('should handle categories with no careers', async () => {
    const mockCategories = [
      {
        id: '1',
        name: 'Computer Science',
        abbreviation: 'CS',
        description: 'Computer Science programs',
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
      },
    ]

    // Mock the first call for categories
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: mockCategories,
        error: null,
      }),
    })

    // Mock the second call for careers (empty result)
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn(),
    }
    
    let eqCallCount = 0
    mockQuery.eq.mockImplementation(() => {
      eqCallCount++
      if (eqCallCount === 1) {
        return mockQuery // Return this for chaining
      } else {
        return Promise.resolve({
          data: [],
          error: null,
        })
      }
    })
    
    mockSupabase.from.mockReturnValueOnce(mockQuery)

    const request = new NextRequest('http://localhost:3000/api/categories')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toHaveLength(1)
    expect(data.data[0].related_careers).toEqual([])
  })

  it('should handle database errors', async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      }),
    })

    const request = new NextRequest('http://localhost:3000/api/categories')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch categories')
  })

  it('should handle server errors gracefully', async () => {
    // Mock createClient to throw an error
    const { createClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockImplementation(() => {
      throw new Error('Server error')
    })

    const request = new NextRequest('http://localhost:3000/api/categories')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Internal server error')
  })
})