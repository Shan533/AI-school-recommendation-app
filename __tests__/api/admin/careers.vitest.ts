/**
 * Unit tests for Careers Admin API
 * Priority: HIGH - New feature with zero coverage
 * 
 * Test Coverage Areas:
 * - GET /api/admin/careers - fetch all careers
 * - POST /api/admin/careers - create new career
 * - Validation and error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/admin/careers/route'

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: vi.fn()
}))

vi.mock('@/lib/validation', () => ({
  validateCareerData: vi.fn()
}))

import { createAdminClient } from '@/lib/supabase/server'
import { validateCareerData } from '@/lib/validation'

const mockCreateAdminClient = vi.mocked(createAdminClient)
const mockValidateCareerData = vi.mocked(validateCareerData)

describe('/api/admin/careers', () => {
  const mockSupabaseClient = {
    from: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateAdminClient.mockResolvedValue(mockSupabaseClient as any)
  })

  describe('GET', () => {
    it('should return careers list', async () => {
      const mockCareers = [
        { id: 'career-1', name: 'Software Engineer', abbreviation: 'SWE', career_type: 'technical' },
        { id: 'career-2', name: 'Data Scientist', abbreviation: 'DS', career_type: 'technical' }
      ]

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockCareers,
            error: null
          })
        })
      })

      const response = await GET()
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result).toEqual(mockCareers)
    })

    it('should return empty array when no careers exist', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: null
          })
        })
      })

      const response = await GET()
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result).toEqual([])
    })

    it('should handle database errors', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database connection failed' }
          })
        })
      })

      const response = await GET()
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.error).toBe('Failed to fetch careers')
    })

    it('should handle server errors', async () => {
      mockCreateAdminClient.mockRejectedValue(new Error('Server error'))

      const response = await GET()
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.error).toBe('Internal server error')
    })
  })

  describe('POST', () => {
    it('should create new career with valid data', async () => {
      const careerData = {
        name: 'Product Manager',
        abbreviation: 'PM',
        description: 'Product management role',
        industry: 'Technology',
        career_type: 'business'
      }

      const mockCreatedCareer = { id: 'career-123', ...careerData }

      // Mock validation success
      mockValidateCareerData.mockReturnValue({ valid: true, errors: [] })

      // Mock duplicate check - no existing career
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
              data: mockCreatedCareer,
              error: null
            })
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/admin/careers', {
        method: 'POST',
        body: JSON.stringify(careerData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(201)
      expect(result.id).toBe('career-123')
      expect(result.name).toBe('Product Manager')
    })

    it('should return 400 for validation errors', async () => {
      const careerData = {
        name: '', // Invalid name
        abbreviation: 'PM',
        career_type: 'business'
      }

      // Mock validation failure
      mockValidateCareerData.mockReturnValue({
        valid: false,
        errors: [{ field: 'name', message: 'Name is required' }]
      })

      const request = new NextRequest('http://localhost:3000/api/admin/careers', {
        method: 'POST',
        body: JSON.stringify(careerData)
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toBe('Validation failed')
      expect(result.details).toEqual([{ field: 'name', message: 'Name is required' }])
    })

    it('should return 409 for duplicate name', async () => {
      const careerData = {
        name: 'Software Engineer',
        abbreviation: 'SWE',
        career_type: 'technical'
      }

      // Mock validation success
      mockValidateCareerData.mockReturnValue({ valid: true, errors: [] })

      // Mock duplicate check - existing career found
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'existing-career' },
              error: null
            })
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/admin/careers', {
        method: 'POST',
        body: JSON.stringify(careerData)
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(409)
      expect(result.error).toBe('Career with this name or abbreviation already exists')
    })

    it('should return 409 for duplicate abbreviation', async () => {
      const careerData = {
        name: 'Senior Software Engineer',
        abbreviation: 'SWE', // Same abbreviation
        career_type: 'technical'
      }

      // Mock validation success
      mockValidateCareerData.mockReturnValue({ valid: true, errors: [] })

      // Mock duplicate check - existing career found
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'existing-career' },
              error: null
            })
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/admin/careers', {
        method: 'POST',
        body: JSON.stringify(careerData)
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(409)
      expect(result.error).toBe('Career with this name or abbreviation already exists')
    })

    it('should handle database errors during creation', async () => {
      const careerData = {
        name: 'Product Manager',
        abbreviation: 'PM',
        career_type: 'business'
      }

      // Mock validation success
      mockValidateCareerData.mockReturnValue({ valid: true, errors: [] })

      // Mock duplicate check - no existing career
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

      const request = new NextRequest('http://localhost:3000/api/admin/careers', {
        method: 'POST',
        body: JSON.stringify(careerData)
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.error).toBe('Failed to create career')
    })

    it('should handle server errors gracefully', async () => {
      mockCreateAdminClient.mockRejectedValue(new Error('Server error'))

      const request = new NextRequest('http://localhost:3000/api/admin/careers', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test', abbreviation: 'T', career_type: 'technical' })
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.error).toBe('Internal server error')
    })

    it('should create career with optional fields as null', async () => {
      const careerData = {
        name: 'Software Engineer',
        abbreviation: 'SWE',
        career_type: 'technical'
        // No description or industry provided
      }

      const mockCreatedCareer = { 
        id: 'career-456', 
        ...careerData, 
        description: null, 
        industry: null 
      }

      // Mock validation success
      mockValidateCareerData.mockReturnValue({ valid: true, errors: [] })

      // Mock duplicate check - no existing career
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
              data: mockCreatedCareer,
              error: null
            })
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/admin/careers', {
        method: 'POST',
        body: JSON.stringify(careerData)
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(201)
      expect(result.id).toBe('career-456')
      expect(result.description).toBeNull()
      expect(result.industry).toBeNull()
    })
  })

  describe('/api/admin/careers/[id]', () => {
    describe('GET', () => {
      it('should fetch a single career by ID', async () => {
        const mockCareer = {
          id: 'career-123',
          name: 'Software Engineer',
          abbreviation: 'SWE',
          description: 'Software development',
          industry: 'Technology',
          career_type: 'Software'
        }

        vi.mocked(createAdminClient).mockResolvedValue({
          from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockCareer,
                  error: null
                })
              })
            })
          })
        } as any)

        const request = new Request('http://localhost:3000/api/admin/careers/career-123')
        const { GET } = await import('@/app/api/admin/careers/[id]/route')
        
        const response = await GET(request, { params: Promise.resolve({ id: 'career-123' }) })
        const result = await response.json()

        expect(response.status).toBe(200)
        expect(result).toEqual(mockCareer)
      })

      it('should return 404 for non-existent career', async () => {
        vi.mocked(createAdminClient).mockResolvedValue({
          from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Not found' }
                })
              })
            })
          })
        } as any)

        const request = new Request('http://localhost:3000/api/admin/careers/non-existent')
        const { GET } = await import('@/app/api/admin/careers/[id]/route')
        
        const response = await GET(request, { params: Promise.resolve({ id: 'non-existent' }) })
        const result = await response.json()

        expect(response.status).toBe(404)
        expect(result.error).toBe('Career not found')
      })
    })

    describe('PUT', () => {
      it('should update a career successfully', async () => {
        const updatedCareer = {
          id: 'career-123',
          name: 'Senior Software Engineer',
          abbreviation: 'SSWE',
          description: 'Senior software development',
          industry: 'Technology',
          career_type: 'Software'
        }

        vi.mocked(createAdminClient).mockResolvedValue({
          from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              or: vi.fn().mockReturnValue({
                neq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: null,
                    error: null
                  })
                })
              })
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: updatedCareer,
                    error: null
                  })
                })
              })
            })
          })
        } as any)

        const request = new Request('http://localhost:3000/api/admin/careers/career-123', {
          method: 'PUT',
          body: JSON.stringify(updatedCareer),
          headers: { 'Content-Type': 'application/json' }
        })
        const { PUT } = await import('@/app/api/admin/careers/[id]/route')
        
        const response = await PUT(request, { params: Promise.resolve({ id: 'career-123' }) })
        const result = await response.json()

        expect(response.status).toBe(200)
        expect(result).toEqual(updatedCareer)
      })

      it('should return 409 for duplicate name or abbreviation', async () => {
        vi.mocked(createAdminClient).mockResolvedValue({
          from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              or: vi.fn().mockReturnValue({
                neq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: 'other-career' },
                    error: null
                  })
                })
              })
            })
          })
        } as any)

        const request = new Request('http://localhost:3000/api/admin/careers/career-123', {
          method: 'PUT',
          body: JSON.stringify({
            name: 'Existing Career',
            abbreviation: 'EXIST',
            career_type: 'Software'
          }),
          headers: { 'Content-Type': 'application/json' }
        })
        const { PUT } = await import('@/app/api/admin/careers/[id]/route')
        
        const response = await PUT(request, { params: Promise.resolve({ id: 'career-123' }) })
        const result = await response.json()

        expect(response.status).toBe(409)
        expect(result.error).toBe('Career with this name or abbreviation already exists')
      })
    })

    describe('DELETE', () => {
      it('should delete a career successfully', async () => {
        const mockCareer = {
          id: 'career-123',
          name: 'Software Engineer'
        }

        vi.mocked(createAdminClient).mockResolvedValue({
          from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockCareer,
                  error: null
                }),
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
        } as any)

        const request = new Request('http://localhost:3000/api/admin/careers/career-123', {
          method: 'DELETE'
        })
        const { DELETE } = await import('@/app/api/admin/careers/[id]/route')
        
        const response = await DELETE(request, { params: Promise.resolve({ id: 'career-123' }) })
        const result = await response.json()

        expect(response.status).toBe(200)
        expect(result.message).toBe('Career deleted successfully')
      })

      it('should return 404 for non-existent career', async () => {
        vi.mocked(createAdminClient).mockResolvedValue({
          from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Not found' }
                })
              })
            })
          })
        } as any)

        const request = new Request('http://localhost:3000/api/admin/careers/non-existent', {
          method: 'DELETE'
        })
        const { DELETE } = await import('@/app/api/admin/careers/[id]/route')
        
        const response = await DELETE(request, { params: Promise.resolve({ id: 'non-existent' }) })
        const result = await response.json()

        expect(response.status).toBe(404)
        expect(result.error).toBe('Career not found')
      })

      it('should return 409 if career is assigned to categories', async () => {
        const mockCareer = {
          id: 'career-123',
          name: 'Software Engineer'
        }

        vi.mocked(createAdminClient).mockResolvedValue({
          from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockCareer,
                  error: null
                }),
                limit: vi.fn().mockResolvedValue({
                  data: [{ category_id: 'category-123', career_id: 'career-123' }],
                  error: null
                })
              })
            })
          })
        } as any)

        const request = new Request('http://localhost:3000/api/admin/careers/career-123', {
          method: 'DELETE'
        })
        const { DELETE } = await import('@/app/api/admin/careers/[id]/route')
        
        const response = await DELETE(request, { params: Promise.resolve({ id: 'career-123' }) })
        const result = await response.json()

        expect(response.status).toBe(409)
        expect(result.error).toBe('Cannot delete career that is assigned to categories')
      })

      it('should handle database errors during deletion', async () => {
        const mockCareer = {
          id: 'career-123',
          name: 'Software Engineer'
        }

        vi.mocked(createAdminClient).mockResolvedValue({
          from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockCareer,
                  error: null
                }),
                limit: vi.fn().mockResolvedValue({
                  data: [],
                  error: null
                })
              })
            }),
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                error: { message: 'Database error' }
              })
            })
          })
        } as any)

        const request = new Request('http://localhost:3000/api/admin/careers/career-123', {
          method: 'DELETE'
        })
        const { DELETE } = await import('@/app/api/admin/careers/[id]/route')
        
        const response = await DELETE(request, { params: Promise.resolve({ id: 'career-123' }) })
        const result = await response.json()

        expect(response.status).toBe(500)
        expect(result.error).toBe('Failed to delete career')
      })

      it('should handle mapping check errors during deletion', async () => {
        const mockCareer = {
          id: 'career-123',
          name: 'Software Engineer'
        }

        vi.mocked(createAdminClient).mockResolvedValue({
          from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockCareer,
                  error: null
                }),
                limit: vi.fn().mockResolvedValue({
                  data: [],
                  error: { message: 'Mapping check failed' }
                })
              })
            })
          })
        } as any)

        const request = new Request('http://localhost:3000/api/admin/careers/career-123', {
          method: 'DELETE'
        })
        const { DELETE } = await import('@/app/api/admin/careers/[id]/route')
        
        const response = await DELETE(request, { params: Promise.resolve({ id: 'career-123' }) })
        const result = await response.json()

        expect(response.status).toBe(500)
        expect(result.error).toBe('Failed to check career dependencies')
      })

      it('should handle server errors during deletion', async () => {
        vi.mocked(createAdminClient).mockRejectedValue(new Error('Server error'))

        const request = new Request('http://localhost:3000/api/admin/careers/career-123', {
          method: 'DELETE'
        })
        const { DELETE } = await import('@/app/api/admin/careers/[id]/route')
        
        const response = await DELETE(request, { params: Promise.resolve({ id: 'career-123' }) })
        const result = await response.json()

        expect(response.status).toBe(500)
        expect(result.error).toBe('Internal server error')
      })
    })

    describe('PUT', () => {
      it('should handle validation errors', async () => {
        mockValidateCareerData.mockReturnValue({
          valid: false,
          errors: ['Name is required']
        })

        const request = new Request('http://localhost:3000/api/admin/careers/career-123', {
          method: 'PUT',
          body: JSON.stringify({
            name: '',
            abbreviation: 'TEST',
            career_type: 'Software'
          }),
          headers: { 'Content-Type': 'application/json' }
        })
        const { PUT } = await import('@/app/api/admin/careers/[id]/route')
        
        const response = await PUT(request, { params: Promise.resolve({ id: 'career-123' }) })
        const result = await response.json()

        expect(response.status).toBe(400)
        expect(result.error).toBe('Validation failed')
        expect(result.details).toEqual(['Name is required'])
      })

      it('should handle database errors during update', async () => {
        mockValidateCareerData.mockReturnValue({ valid: true, errors: [] })

        vi.mocked(createAdminClient).mockResolvedValue({
          from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              or: vi.fn().mockReturnValue({
                neq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: null,
                    error: null
                  })
                })
              })
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'Update failed' }
                  })
                })
              })
            })
          })
        } as any)

        const request = new Request('http://localhost:3000/api/admin/careers/career-123', {
          method: 'PUT',
          body: JSON.stringify({
            name: 'Updated Career',
            abbreviation: 'UPD',
            career_type: 'Software'
          }),
          headers: { 'Content-Type': 'application/json' }
        })
        const { PUT } = await import('@/app/api/admin/careers/[id]/route')
        
        const response = await PUT(request, { params: Promise.resolve({ id: 'career-123' }) })
        const result = await response.json()

        expect(response.status).toBe(500)
        expect(result.error).toBe('Failed to update career')
      })

      it('should handle server errors during update', async () => {
        vi.mocked(createAdminClient).mockRejectedValue(new Error('Server error'))

        const request = new Request('http://localhost:3000/api/admin/careers/career-123', {
          method: 'PUT',
          body: JSON.stringify({
            name: 'Updated Career',
            abbreviation: 'UPD',
            career_type: 'Software'
          }),
          headers: { 'Content-Type': 'application/json' }
        })
        const { PUT } = await import('@/app/api/admin/careers/[id]/route')
        
        const response = await PUT(request, { params: Promise.resolve({ id: 'career-123' }) })
        const result = await response.json()

        expect(response.status).toBe(500)
        expect(result.error).toBe('Internal server error')
      })
    })

    describe('GET', () => {
      it('should handle server errors', async () => {
        vi.mocked(createAdminClient).mockRejectedValue(new Error('Server error'))

        const request = new Request('http://localhost:3000/api/admin/careers/career-123')
        const { GET } = await import('@/app/api/admin/careers/[id]/route')
        
        const response = await GET(request, { params: Promise.resolve({ id: 'career-123' }) })
        const result = await response.json()

        expect(response.status).toBe(500)
        expect(result.error).toBe('Internal server error')
      })
    })
  })
})
