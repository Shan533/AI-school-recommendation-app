/**
 * Integration tests for Programs Admin API
 * Priority: MEDIUM - API endpoint functionality
 * 
 * Test Coverage Areas:
 * - GET /api/admin/programs - list programs
 * - POST /api/admin/programs - create program
 * - GET /api/admin/programs/[id] - get specific program
 * - PUT /api/admin/programs/[id] - update program
 * - DELETE /api/admin/programs/[id] - delete program
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/admin/programs/route'
import { GET, PUT, DELETE } from '@/app/api/admin/programs/[id]/route'

// Add this at the top of the file after imports
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(() => ({ value: 'mock-cookie' })),
    set: vi.fn(),
    delete: vi.fn()
  }))
}))

// Mock dependencies
vi.mock('@/lib/supabase/helpers', () => ({
  getCurrentUser: vi.fn(),
  isAdmin: vi.fn(),
  getSupabaseClient: vi.fn()
}))

vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: vi.fn()
}))

vi.mock('@/lib/validation', () => ({
  validateProgramData: vi.fn(),
  validateRequirementsData: vi.fn()
}))

import { getCurrentUser, isAdmin, getSupabaseClient } from '@/lib/supabase/helpers'
import { createAdminClient } from '@/lib/supabase/server'
import { validateProgramData, validateRequirementsData } from '@/lib/validation'

const mockGetCurrentUser = vi.mocked(getCurrentUser)
const mockIsAdmin = vi.mocked(isAdmin)
const mockGetSupabaseClient = vi.mocked(getSupabaseClient)
const mockCreateAdminClient = vi.mocked(createAdminClient)
const mockValidateProgramData = vi.mocked(validateProgramData)
const mockValidateRequirementsData = vi.mocked(validateRequirementsData)

describe('/api/admin/programs', () => {
  const mockUser = { 
    id: 'user-123', 
    email: 'admin@test.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString()
  } as any

  const mockSupabaseClient = {
    from: vi.fn()
  }
  const mockAdminClient = {
    from: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default successful auth setup
    mockGetCurrentUser.mockResolvedValue(mockUser)
    mockIsAdmin.mockResolvedValue(true)
    mockGetSupabaseClient.mockResolvedValue(mockSupabaseClient as any)
    mockCreateAdminClient.mockReturnValue(mockAdminClient as any)
    
    // Default validation success
    mockValidateProgramData.mockReturnValue([])
    mockValidateRequirementsData.mockReturnValue([])
  })

  describe('POST', () => {
    it('should create new program with valid data', async () => {
      const programData = {
        name: 'Computer Science',
        school_id: 'school-123',
        degree: 'Master',
        website_url: 'https://example.com',
        duration_years: 2,
        currency: 'USD',
        total_tuition: 50000,
        is_stem: true,
        description: 'CS program',
        credits: 36,
        delivery_method: 'On-campus',
        schedule_type: 'Full-time',
        location: 'Boston, MA',
        start_date: '2024-09-01'
      }

      // First mock - school verification
      let fromCallCount = 0
      mockSupabaseClient.from.mockImplementation((table) => {
        fromCallCount++
        if (fromCallCount === 1) {
          // First call should be to schools table for verification
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'school-123' },
                  error: null
                })
              })
            })
          }
        } else {
          // Second call should be to programs table for insertion
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'program-123', ...programData },
                  error: null
                })
              })
            })
          }
        }
      })

      const request = new NextRequest('http://localhost:3000/api/admin/programs', {
        method: 'POST',
        body: JSON.stringify(programData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(201)
      expect(result.id).toBe('program-123')
      expect(result.name).toBe('Computer Science')
    })

    it('should return 401 for unauthenticated users', async () => {
      mockGetCurrentUser.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/admin/programs', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Program' })
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(401)
      expect(result.error).toBe('Unauthorized')
    })

    it('should return 403 for non-admin users', async () => {
      mockIsAdmin.mockResolvedValue(false)

      const request = new NextRequest('http://localhost:3000/api/admin/programs', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Program' })
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(403)
      expect(result.error).toBe('Forbidden')
    })

    it('should return 400 for missing program name', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/programs', {
        method: 'POST',
        body: JSON.stringify({ school_id: 'school-123', degree: 'Master' })
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toBe('Program name is required')
    })

    it('should return 400 for missing school_id', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/programs', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Program', degree: 'Master' })
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toBe('School ID is required')
    })

    it('should return 400 for missing degree', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/programs', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Program', school_id: 'school-123' })
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toBe('Degree is required')
    })

    it('should return 400 for invalid school_id', async () => {
      // Mock school verification failure
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'School not found' }
            })
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/admin/programs', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Program',
          school_id: 'invalid-school',
          degree: 'Master'
        })
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toBe('Invalid school ID')
    })

    it('should handle database errors during program creation', async () => {
      // Mock school verification success
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'school-123' },
              error: null
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

      const request = new NextRequest('http://localhost:3000/api/admin/programs', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Program',
          school_id: 'school-123',
          degree: 'Master'
        })
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.error).toBe('Database constraint violation')
    })

    it('should handle server errors gracefully', async () => {
      mockGetCurrentUser.mockRejectedValue(new Error('Server error'))

      const request = new NextRequest('http://localhost:3000/api/admin/programs', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Program',
          school_id: 'school-123',
          degree: 'Master'
        })
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.error).toBe('Internal server error')
    })

    it('should create program with requirements', async () => {
      const programData = {
        name: 'Computer Science',
        school_id: 'school-123',
        degree: 'Master',
        ielts_score: 7.0,
        toefl_score: 100,
        min_gpa: 3.5,
        requires_personal_statement: true
      }

      // Mock school verification
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'school-123' },
              error: null
            })
          })
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'program-123', name: 'Computer Science' },
              error: null
            })
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/admin/programs', {
        method: 'POST',
        body: JSON.stringify(programData)
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(201)
      expect(result.id).toBe('program-123')
      expect(result.name).toBe('Computer Science')
    })



    it('should handle add_ons as JSON string', async () => {
      const programData = {
        name: 'Test Program',
        school_id: 'school-123',
        degree: 'Master',
        add_ons: JSON.stringify({ test: 'value' })
      }

      // Mock school verification
      let fromCallCount = 0
      mockSupabaseClient.from.mockImplementation((table) => {
        fromCallCount++
        if (fromCallCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'school-123' },
                  error: null
                })
              })
            })
          }
        } else {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'program-123', ...programData, add_ons: { test: 'value' } },
                  error: null
                })
              })
            })
          }
        }
      })

      const request = new NextRequest('http://localhost:3000/api/admin/programs', {
        method: 'POST',
        body: JSON.stringify(programData)
      })

      const response = await POST(request)
      expect(response.status).toBe(201)
      
      const result = await response.json()
      expect(result.add_ons).toEqual({ test: 'value' })
    })

    it('should handle add_ons as object', async () => {
      const programData = {
        name: 'Test Program',
        school_id: 'school-123',
        degree: 'Master',
        add_ons: { test: 'value' }
      }

      // Mock school verification and program creation
      let fromCallCount = 0
      mockSupabaseClient.from.mockImplementation((table) => {
        fromCallCount++
        if (fromCallCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'school-123' },
                  error: null
                })
              })
            })
          }
        } else {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'program-123', ...programData },
                  error: null
                })
              })
            })
          }
        }
      })

      const request = new NextRequest('http://localhost:3000/api/admin/programs', {
        method: 'POST',
        body: JSON.stringify(programData)
      })

      const response = await POST(request)
      expect(response.status).toBe(201)
      
      const result = await response.json()
      expect(result.add_ons).toEqual({ test: 'value' })
    })

    it('should handle invalid add_ons JSON gracefully', async () => {
      const programData = {
        name: 'Test Program',
        school_id: 'school-123',
        degree: 'Master',
        add_ons: 'invalid json'
      }

      // Mock school verification
      let fromCallCount = 0
      mockSupabaseClient.from.mockImplementation((table) => {
        fromCallCount++
        if (fromCallCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'school-123' },
                  error: null
                })
              })
            })
          }
        } else {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'program-123', ...programData, add_ons: null },
                  error: null
                })
              })
            })
          }
        }
      })

      const request = new NextRequest('http://localhost:3000/api/admin/programs', {
        method: 'POST',
        body: JSON.stringify(programData)
      })

      const response = await POST(request)
      expect(response.status).toBe(201)
      
      const result = await response.json()
      expect(result.add_ons).toBeNull()
    })

    
  })
})

describe('/api/admin/programs/[id]', () => {
  const mockUser = { 
    id: 'user-123', 
    email: 'admin@test.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString()
  } as any

  const mockSupabaseClient = {
    from: vi.fn()
  }
  const mockAdminClient = {
    from: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default successful auth setup
    mockGetCurrentUser.mockResolvedValue(mockUser)
    mockIsAdmin.mockResolvedValue(true)
    mockGetSupabaseClient.mockResolvedValue(mockSupabaseClient as any)
    mockCreateAdminClient.mockReturnValue(mockAdminClient as any)
    
    // Default validation success
    mockValidateProgramData.mockReturnValue([])
    mockValidateRequirementsData.mockReturnValue([])
  })

  describe('GET', () => {
    it('should return program data for valid ID', async () => {
      const mockProgram = {
        id: 'program-123',
        name: 'Computer Science',
        degree: 'Master',
        schools: { name: 'MIT', initial: 'MIT' },
        requirements: { ielts_score: 7.0, toefl_score: 100 }
      }

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [mockProgram],
            error: null
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/admin/programs/program-123')
      const response = await GET(request, { params: Promise.resolve({ id: 'program-123' }) })
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.id).toBe('program-123')
      expect(result.name).toBe('Computer Science')
      expect(result.schools).toEqual({ name: 'MIT', initial: 'MIT' })
    })

    it('should return 404 for non-existent program', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/admin/programs/nonexistent')
      const response = await GET(request, { params: Promise.resolve({ id: 'nonexistent' }) })
      const result = await response.json()

      expect(response.status).toBe(404)
      expect(result.error).toBe('Program not found')
    })

    it('should return 401 for unauthenticated users', async () => {
      mockGetCurrentUser.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/admin/programs/program-123')
      const response = await GET(request, { params: Promise.resolve({ id: 'program-123' }) })
      const result = await response.json()

      expect(response.status).toBe(401)
      expect(result.error).toBe('Unauthorized')
    })

    it('should return 403 for non-admin users', async () => {
      mockIsAdmin.mockResolvedValue(false)

      const request = new NextRequest('http://localhost:3000/api/admin/programs/program-123')
      const response = await GET(request, { params: Promise.resolve({ id: 'program-123' }) })
      const result = await response.json()

      expect(response.status).toBe(403)
      expect(result.error).toBe('Forbidden')
    })

    it('should handle database errors', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database connection failed' }
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/admin/programs/program-123')
      const response = await GET(request, { params: Promise.resolve({ id: 'program-123' }) })
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.error).toBe('Error fetching program')
    })
  })

  describe('PUT', () => {
    it('should update program with valid data', async () => {
      const updateData = {
        name: 'Updated Computer Science',
        degree: 'Master',
        school_id: 'school-123',
        duration_years: 3,
        credits: 45
      }

      // Set up sequential mocks for multiple from() calls
      let callCount = 0
      mockSupabaseClient.from.mockImplementation((table) => {
        callCount++
        if (callCount === 1 && table === 'programs') {
          // First call: program existence check
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: 'program-123' }],
                error: null
              })
            })
          }
        } else if (callCount === 2 && table === 'schools') {
          // Second call: school verification
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: 'school-123' }],
                error: null
              })
            })
          }
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null })
          })
        }
      })

      // Mock admin client for program update and requirements
      let adminCallCount = 0
      mockAdminClient.from.mockImplementation((table) => {
        adminCallCount++
        if (adminCallCount === 1 && table === 'programs') {
          // Program update
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockResolvedValue({
                  data: [{ id: 'program-123', ...updateData }],
                  error: null
                })
              })
            })
          }
        } else if (table === 'requirements') {
          // Requirements operations
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [],
                error: null
              })
            }),
            insert: vi.fn().mockResolvedValue({
              data: [{ id: 'req-123' }],
              error: null
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                error: null
              })
            }),
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                error: null
              })
            })
          }
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null })
          })
        }
      })

      const request = new NextRequest('http://localhost:3000/api/admin/programs/program-123', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })

      const response = await PUT(request, { params: Promise.resolve({ id: 'program-123' }) })
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.name).toBe('Updated Computer Science')
    })

    it('should return 404 for non-existent program', async () => {
      // Mock program existence check - not found
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/admin/programs/nonexistent', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Program' })
      })

      const response = await PUT(request, { params: Promise.resolve({ id: 'nonexistent' }) })
      const result = await response.json()

      expect(response.status).toBe(404)
      expect(result.error).toBe('Program not found')
    })

    it('should return 400 for missing required fields', async () => {
      // Mock program existence check
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ id: 'program-123' }],
            error: null
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/admin/programs/program-123', {
        method: 'PUT',
        body: JSON.stringify({ description: 'Only description' })
      })

      const response = await PUT(request, { params: Promise.resolve({ id: 'program-123' }) })
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toBe('Missing required fields')
    })

    it('should return 400 for validation errors', async () => {
      // Mock program existence check
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ id: 'program-123' }],
            error: null
          })
        })
      })

      // Mock validation failure
      mockValidateProgramData.mockReturnValue(['Duration must be between 0.5 and 8.0'])

      const request = new NextRequest('http://localhost:3000/api/admin/programs/program-123', {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Test Program',
          degree: 'Master',
          school_id: 'school-123',
          duration_years: 15 // Invalid duration
        })
      })

      const response = await PUT(request, { params: Promise.resolve({ id: 'program-123' }) })
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toBe('Duration must be between 0.5 and 8.0')
    })

    it('should return 400 for invalid school_id in update', async () => {
      // We need to set up the mocks in sequence to handle multiple from() calls
      let callCount = 0
      mockSupabaseClient.from.mockImplementation((table) => {
        callCount++
        if (callCount === 1 && table === 'programs') {
          // First call: program existence check
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: 'program-123' }],
                error: null
              })
            })
          }
        } else if (callCount === 2 && table === 'schools') {
          // Second call: school verification failure
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [],
                error: null
              })
            })
          }
        }
        // Default fallback
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [],
              error: null
            })
          })
        }
      })

      const request = new NextRequest('http://localhost:3000/api/admin/programs/program-123', {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Test Program',
          degree: 'Master',
          school_id: 'invalid-school'
        })
      })

      const response = await PUT(request, { params: Promise.resolve({ id: 'program-123' }) })
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toBe('Invalid school ID')
    })

    it('should return 401 for unauthenticated users', async () => {
      mockGetCurrentUser.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/admin/programs/program-123', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Program' })
      })

      const response = await PUT(request, { params: Promise.resolve({ id: 'program-123' }) })
      const result = await response.json()

      expect(response.status).toBe(401)
      expect(result.error).toBe('Unauthorized')
    })

    it('should return 403 for non-admin users', async () => {
      mockIsAdmin.mockResolvedValue(false)

      const request = new NextRequest('http://localhost:3000/api/admin/programs/program-123', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Program' })
      })

      const response = await PUT(request, { params: Promise.resolve({ id: 'program-123' }) })
      const result = await response.json()

      expect(response.status).toBe(403)
      expect(result.error).toBe('Forbidden')
    })

    it('should update program requirements', async () => {
      const updateData = {
        name: 'Computer Science',
        degree: 'Master',
        school_id: 'school-123',
        ielts_score: 7.5,
        toefl_score: 110,
        min_gpa: 3.8,
        requires_personal_statement: true,
        requires_portfolio: false
      }

      // Mock program existence check
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ id: 'program-123' }],
            error: null
          })
        })
      })

      // Mock school verification
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ id: 'school-123' }],
            error: null
          })
        })
      })

      // Mock program update
      mockAdminClient.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: [{ id: 'program-123', name: 'Computer Science' }],
              error: null
            })
          })
        }),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ id: 'req-123' }], // Existing requirements
            error: null
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/admin/programs/program-123', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })

      const response = await PUT(request, { params: Promise.resolve({ id: 'program-123' }) })
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.name).toBe('Computer Science')
    })



    it('should handle requirements update errors during PUT', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'admin-123', is_admin: true })

      const updateData = {
        name: 'Updated Program',
        school_id: 'school-123', // Add required field
        degree: 'Bachelor', // Add required field
        requirements: {
          gpa: 3.5,
          gre_score: 320
        }
      }

      // Mock school verification
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ id: 'school-123' }],
            error: null
          })
        })
      })

      // Mock program update success
      const mockProgramUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: [{ id: 'program-123', name: 'Updated Program' }],
            error: null
          })
        })
      })

      // Mock requirements check
      const mockRequirementsSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [{ id: 'req-123' }], // Existing requirements
          error: null
        })
      })

      // Mock requirements update error
      const mockRequirementsUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: { message: 'Requirements update failed' }
        })
      })

      // Set up the mock chain properly
      mockAdminClient.from
        .mockReturnValueOnce({
          update: mockProgramUpdate
        })
        .mockReturnValueOnce({
          select: mockRequirementsSelect
        })
        .mockReturnValueOnce({
          update: mockRequirementsUpdate
        })

      const request = new NextRequest('http://localhost:3000/api/admin/programs/program-123', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })

      const response = await PUT(request, { params: Promise.resolve({ id: 'program-123' }) })
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.name).toBe('Updated Program')
      expect(mockRequirementsUpdate).toHaveBeenCalled()
    })

    it('should handle PUT server errors gracefully', async () => {
      mockGetCurrentUser.mockRejectedValue(new Error('Server error'))

      const request = new NextRequest('http://localhost:3000/api/admin/programs/program-123', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Test' })
      })

      const response = await PUT(request, { params: Promise.resolve({ id: 'program-123' }) })
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.error).toBe('Internal server error')
    })
  })

  describe('DELETE', () => {
    it('should delete program for valid ID', async () => {
      // Mock program existence check
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ id: 'program-123' }],
            error: null
          })
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/admin/programs/program-123', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: Promise.resolve({ id: 'program-123' }) })
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.message).toBe('Program deleted successfully')
    })

    it('should return 404 for non-existent program', async () => {
      // Mock program existence check - not found
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/admin/programs/nonexistent', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: Promise.resolve({ id: 'nonexistent' }) })
      const result = await response.json()

      expect(response.status).toBe(404)
      expect(result.error).toBe('Program not found')
    })

    it('should handle related reviews deletion', async () => {
      // Mock program existence check
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ id: 'program-123' }],
            error: null
          })
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/admin/programs/program-123', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: Promise.resolve({ id: 'program-123' }) })
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.message).toBe('Program deleted successfully')
      
      // Verify requirements deletion was called first
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('requirements')
    })

    it('should return 401 for unauthenticated users', async () => {
      mockGetCurrentUser.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/admin/programs/program-123', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: Promise.resolve({ id: 'program-123' }) })
      const result = await response.json()

      expect(response.status).toBe(401)
      expect(result.error).toBe('Unauthorized')
    })

    it('should return 403 for non-admin users', async () => {
      mockIsAdmin.mockResolvedValue(false)

      const request = new NextRequest('http://localhost:3000/api/admin/programs/program-123', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: Promise.resolve({ id: 'program-123' }) })
      const result = await response.json()

      expect(response.status).toBe(403)
      expect(result.error).toBe('Forbidden')
    })

    it('should handle database errors during deletion', async () => {
      // Mock program existence check
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ id: 'program-123' }],
            error: null
          })
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: { message: 'Foreign key constraint violation' }
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/admin/programs/program-123', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: Promise.resolve({ id: 'program-123' }) })
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.error).toBe('Foreign key constraint violation')
    })

    it('should handle database errors during program existence check', async () => {
      // Mock program existence check failure
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database connection failed' }
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/admin/programs/program-123', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: Promise.resolve({ id: 'program-123' }) })
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.error).toBe('Error checking program')
    })

    it('should handle DELETE server errors gracefully', async () => {
      mockGetCurrentUser.mockRejectedValue(new Error('Server error'))

      const request = new NextRequest('http://localhost:3000/api/admin/programs/program-123', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: Promise.resolve({ id: 'program-123' }) })
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.error).toBe('Internal server error')
    })

  })
})