import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/careers/route'

// Mock Supabase
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabase),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({})),
}))

describe('/api/careers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return all careers', async () => {
    const mockCareers = [
      {
        id: '1',
        name: 'Software Engineer',
        abbreviation: 'SWE',
        description: 'Software development career',
        industry: 'Technology',
        career_type: 'Software',
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
      },
    ]

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: mockCareers,
        error: null,
      }),
    })

    const request = new NextRequest('http://localhost:3000/api/careers')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toHaveLength(1)
    expect(data.data[0]).toMatchObject({
      id: '1',
      name: 'Software Engineer',
      abbreviation: 'SWE',
    })
  })

  it('should handle database errors', async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      }),
    })

    const request = new NextRequest('http://localhost:3000/api/careers')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch careers')
  })

  it('should handle server errors gracefully', async () => {
    // Mock createClient to throw an error
    const { createClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockImplementation(() => {
      throw new Error('Server error')
    })

    const request = new NextRequest('http://localhost:3000/api/careers')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Internal server error')
  })
})
