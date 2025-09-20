/**
 * Integration tests for Programs Bulk Assign Admin API
 * Priority: MEDIUM - API endpoint functionality
 * 
 * Test Coverage Areas:
 * - POST /api/admin/programs/bulk-assign - bulk assign categories and careers to programs
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/admin/programs/bulk-assign/route'

// Mock dependencies
vi.mock('@/lib/supabase/helpers', () => ({
  createAdminClient: vi.fn()
}))

import { createAdminClient } from '@/lib/supabase/helpers'

const mockCreateAdminClient = vi.mocked(createAdminClient)

describe('/api/admin/programs/bulk-assign', () => {
  const mockSupabaseClient = {
    from: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateAdminClient.mockReturnValue(mockSupabaseClient as any)
  })

  describe('POST', () => {
    it('should successfully bulk assign categories to programs', async () => {
      const bulkData = {
        programIds: ['program-1', 'program-2'],
        categoryIds: ['cat-1', 'cat-2'],
        primaryCategoryId: 'cat-1'
      }

      // Mock program validation
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: [
              { id: 'program-1' },
              { id: 'program-2' }
            ],
            error: null
          })
        }),
        delete: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            error: null
          })
        }),
        insert: vi.fn().mockResolvedValue({
          error: null
        }),
        update: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            error: null
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/admin/programs/bulk-assign', {
        method: 'POST',
        body: JSON.stringify(bulkData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.updatedCount).toBe(2)
      expect(result.message).toBe('Successfully assigned categories to 2 programs')
    })

    it('should successfully bulk assign categories and careers to programs', async () => {
      const bulkData = {
        programIds: ['program-1'],
        categoryIds: ['cat-1'],
        primaryCategoryId: 'cat-1',
        careerPaths: ['Software Engineer']
      }

      // Simplified mock setup
      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'programs') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [{ id: 'program-1' }],
                error: null
              })
            }),
            update: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                error: null
              })
            })
          }
        } else if (table === 'program_category_mapping') {
          return {
            delete: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                error: null
              })
            }),
            insert: vi.fn().mockResolvedValue({
              error: null
            })
          }
        } else if (table === 'program_career_mapping') {
          return {
            delete: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                error: null
              })
            }),
            insert: vi.fn().mockResolvedValue({
              error: null
            })
          }
        } else if (table === 'careers') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116' }
                })
              })
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'career-1' },
                  error: null
                })
              })
            })
          }
        }
        return {}
      })

      const request = new NextRequest('http://localhost:3000/api/admin/programs/bulk-assign', {
        method: 'POST',
        body: JSON.stringify(bulkData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.updatedCount).toBe(1)
    })

    it('should return 400 for missing program IDs', async () => {
      const bulkData = {
        categoryIds: ['cat-1'],
        primaryCategoryId: 'cat-1'
      }

      const request = new NextRequest('http://localhost:3000/api/admin/programs/bulk-assign', {
        method: 'POST',
        body: JSON.stringify(bulkData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toBe('Program IDs are required')
    })

    it('should return 400 for empty program IDs array', async () => {
      const bulkData = {
        programIds: [],
        categoryIds: ['cat-1'],
        primaryCategoryId: 'cat-1'
      }

      const request = new NextRequest('http://localhost:3000/api/admin/programs/bulk-assign', {
        method: 'POST',
        body: JSON.stringify(bulkData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toBe('Program IDs are required')
    })

    it('should return 400 for missing category IDs', async () => {
      const bulkData = {
        programIds: ['program-1'],
        primaryCategoryId: 'cat-1'
      }

      const request = new NextRequest('http://localhost:3000/api/admin/programs/bulk-assign', {
        method: 'POST',
        body: JSON.stringify(bulkData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toBe('At least one category must be selected')
    })

    it('should return 400 for empty category IDs array', async () => {
      const bulkData = {
        programIds: ['program-1'],
        categoryIds: [],
        primaryCategoryId: 'cat-1'
      }

      const request = new NextRequest('http://localhost:3000/api/admin/programs/bulk-assign', {
        method: 'POST',
        body: JSON.stringify(bulkData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toBe('At least one category must be selected')
    })

    it('should handle programs validation failure', async () => {
      const bulkData = {
        programIds: ['program-1', 'program-2'],
        categoryIds: ['cat-1'],
        primaryCategoryId: 'cat-1'
      }

      // Mock program validation failure
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' }
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/admin/programs/bulk-assign', {
        method: 'POST',
        body: JSON.stringify(bulkData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.success).toBe(false)
      expect(result.errors).toContain('Failed to validate programs')
    })

    it('should handle some programs not found', async () => {
      const bulkData = {
        programIds: ['program-1', 'program-2'],
        categoryIds: ['cat-1'],
        primaryCategoryId: 'cat-1'
      }

      // Mock program validation - only one program found
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: [{ id: 'program-1' }], // Only one program found
            error: null
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/admin/programs/bulk-assign', {
        method: 'POST',
        body: JSON.stringify(bulkData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.success).toBe(false)
      expect(result.errors).toContain('Some programs not found')
    })

    it('should handle category mapping deletion failure', async () => {
      const bulkData = {
        programIds: ['program-1'],
        categoryIds: ['cat-1'],
        primaryCategoryId: 'cat-1'
      }

      // Mock program validation success
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: [{ id: 'program-1' }],
            error: null
          })
        }),
        delete: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            error: { message: 'Failed to delete mappings' }
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/admin/programs/bulk-assign', {
        method: 'POST',
        body: JSON.stringify(bulkData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.success).toBe(false)
      expect(result.errors).toContain('Failed to clear existing category mappings')
    })

    it('should handle category mapping insertion failure', async () => {
      const bulkData = {
        programIds: ['program-1'],
        categoryIds: ['cat-1'],
        primaryCategoryId: 'cat-1'
      }

      // Mock program validation and deletion success, insertion failure
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: [{ id: 'program-1' }],
            error: null
          })
        }),
        delete: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            error: null
          })
        }),
        insert: vi.fn().mockResolvedValue({
          error: { message: 'Failed to insert mappings' }
        })
      })

      const request = new NextRequest('http://localhost:3000/api/admin/programs/bulk-assign', {
        method: 'POST',
        body: JSON.stringify(bulkData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.success).toBe(false)
      expect(result.errors).toContain('Failed to create category mappings')
    })

    it('should handle career creation failure gracefully', async () => {
      const bulkData = {
        programIds: ['program-1'],
        categoryIds: ['cat-1'],
        primaryCategoryId: 'cat-1',
        careerPaths: ['Software Engineer']
      }

      // Simplified mock setup
      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'programs') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [{ id: 'program-1' }],
                error: null
              })
            }),
            update: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                error: null
              })
            })
          }
        } else if (table === 'program_category_mapping') {
          return {
            delete: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                error: null
              })
            }),
            insert: vi.fn().mockResolvedValue({
              error: null
            })
          }
        } else if (table === 'program_career_mapping') {
          return {
            delete: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                error: null
              })
            }),
            insert: vi.fn().mockResolvedValue({
              error: null
            })
          }
        } else if (table === 'careers') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
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
                  error: { message: 'Failed to create career' }
                })
              })
            })
          }
        }
        return {}
      })

      const request = new NextRequest('http://localhost:3000/api/admin/programs/bulk-assign', {
        method: 'POST',
        body: JSON.stringify(bulkData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(200) // Still successful despite career creation failure
      expect(result.success).toBe(true)
      expect(result.errors).toContain('Failed to create career: Software Engineer')
    })

    it('should handle program update failure as warning', async () => {
      const bulkData = {
        programIds: ['program-1'],
        categoryIds: ['cat-1'],
        primaryCategoryId: 'cat-1'
      }

      // Mock successful operations until program update
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: [{ id: 'program-1' }],
            error: null
          })
        }),
        delete: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            error: null
          })
        }),
        insert: vi.fn().mockResolvedValue({
          error: null
        }),
        update: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            error: { message: 'Failed to update programs' }
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/admin/programs/bulk-assign', {
        method: 'POST',
        body: JSON.stringify(bulkData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.errors).toContain('Warning: Failed to update programs table: Failed to update programs')
      expect(result.message).toContain('with warnings')
    })

    it('should handle server errors gracefully', async () => {
      mockCreateAdminClient.mockImplementation(() => {
        throw new Error('Server error')
      })

      const request = new NextRequest('http://localhost:3000/api/admin/programs/bulk-assign', {
        method: 'POST',
        body: JSON.stringify({
          programIds: ['program-1'],
          categoryIds: ['cat-1']
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.success).toBe(false)
      expect(result.errors).toContain('Internal server error')
      expect(result.message).toBe('Failed to process bulk assignment')
    })

    it('should handle bulk assign with existing careers', async () => {
      const bulkData = {
        programIds: ['program-1'],
        categoryIds: ['cat-1'],
        primaryCategoryId: 'cat-1',
        careerPaths: ['Software Engineer']
      }

      // Simplified mock setup
      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'programs') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [{ id: 'program-1' }],
                error: null
              })
            }),
            update: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                error: null
              })
            })
          }
        } else if (table === 'program_category_mapping') {
          return {
            delete: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                error: null
              })
            }),
            insert: vi.fn().mockResolvedValue({
              error: null
            })
          }
        } else if (table === 'program_career_mapping') {
          return {
            delete: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                error: null
              })
            }),
            insert: vi.fn().mockResolvedValue({
              error: null
            })
          }
        } else if (table === 'careers') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'existing-career' },
                  error: null
                })
              })
            })
          }
        }
        return {}
      })

      const request = new NextRequest('http://localhost:3000/api/admin/programs/bulk-assign', {
        method: 'POST',
        body: JSON.stringify(bulkData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.updatedCount).toBe(1)
    })
  })
})
