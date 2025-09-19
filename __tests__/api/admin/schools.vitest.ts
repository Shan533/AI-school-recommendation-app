/**
 * Integration tests for Schools Admin API
 * Priority: MEDIUM - API endpoint functionality
 * 
 * Test Coverage Areas:
 * - POST /api/admin/schools - create school
 * - GET /api/admin/schools/[id] - get specific school
 * - PUT /api/admin/schools/[id] - update school
 * - DELETE /api/admin/schools/[id] - delete school
 */

import { vi, describe, it, expect, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

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
  validateSchoolData: vi.fn()
}))

// Import functions after mocking
import { POST } from '@/app/api/admin/schools/route'
import { GET, PUT, DELETE } from '@/app/api/admin/schools/[id]/route'
import { getCurrentUser, isAdmin, getSupabaseClient } from '@/lib/supabase/helpers'
import { createAdminClient } from '@/lib/supabase/server'
import { validateSchoolData } from '@/lib/validation'

// Create typed mocks
const mockGetCurrentUser = vi.mocked(getCurrentUser)
const mockIsAdmin = vi.mocked(isAdmin)
const mockGetSupabaseClient = vi.mocked(getSupabaseClient)
const mockCreateAdminClient = vi.mocked(createAdminClient)
const mockValidateSchoolData = vi.mocked(validateSchoolData)

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(() => ({
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn()
      }))
    })),
    select: vi.fn(() => ({
      eq: vi.fn()
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn()
      }))
    })),
    delete: vi.fn(() => ({
      eq: vi.fn()
    }))
  }))
}

const mockAdminClient = {
  from: vi.fn(() => ({
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn()
      }))
    })),
    delete: vi.fn(() => ({
      eq: vi.fn()
    }))
  }))
}

describe('Schools Admin API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSupabaseClient.mockResolvedValue(mockSupabaseClient as any)
    mockCreateAdminClient.mockReturnValue(mockAdminClient as any)
    mockValidateSchoolData.mockReturnValue([])
  })

  describe('POST /api/admin/schools', () => {
    const createRequest = (body: any): NextRequest => {
      return new NextRequest('http://localhost:3000/api/admin/schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
    }

    it('should create new school with valid data', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'admin-123' } as any)
      mockIsAdmin.mockResolvedValue(true)

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'school-123',
              name: 'Test University',
              region: 'United States',
              created_by: 'admin-123'
            },
            error: null
          })
        })
      })
      mockSupabaseClient.from.mockReturnValue({ 
        insert: mockInsert,
        select: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
      })

      const schoolData = {
        name: 'Test University',
        region: 'United States',
        type: 'Public',
        location: 'New York'
      }

      const request = createRequest(schoolData)
      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(201)
      expect(result.name).toBe('Test University')
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('schools')
      expect(mockInsert).toHaveBeenCalledWith([{
        name: 'Test University',
        initial: null,
        type: 'Public',
        region: 'United States',
        location: 'New York',
        year_founded: null,
        qs_ranking: null,
        website_url: null,
        created_by: 'admin-123'
      }])
    })

    it('should return 401 for unauthenticated users', async () => {
      mockGetCurrentUser.mockResolvedValue(null)

      const request = createRequest({ name: 'Test School' })
      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(401)
      expect(result.error).toBe('Unauthorized')
      expect(mockSupabaseClient.from).not.toHaveBeenCalled()
    })

    it('should return 403 for non-admin users', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'user-123' } as any)
      mockIsAdmin.mockResolvedValue(false)

      const request = createRequest({ name: 'Test School' })
      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(403)
      expect(result.error).toBe('Forbidden')
      expect(mockSupabaseClient.from).not.toHaveBeenCalled()
    })

    it('should return 400 for missing required fields', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'admin-123' } as any)
      mockIsAdmin.mockResolvedValue(true)

      const request = createRequest({ region: 'United States' }) // Missing name
      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toBe('School name is required')
      expect(mockSupabaseClient.from).not.toHaveBeenCalled()
    })

    it('should handle database errors gracefully', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'admin-123' } as any)
      mockIsAdmin.mockResolvedValue(true)

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database connection failed' }
          })
        })
      })
      mockSupabaseClient.from.mockReturnValue({ 
        insert: mockInsert,
        select: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
      })

      const request = createRequest({ name: 'Test School' })
      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.error).toBe('Database connection failed')
    })

    it('should handle server errors gracefully', async () => {
      mockGetCurrentUser.mockRejectedValue(new Error('Server error'))

      const request = createRequest({ name: 'Test School' })
      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.error).toBe('Internal server error')
    })
  })

  describe('GET /api/admin/schools/[id]', () => {
    it('should return school data for valid ID', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'admin-123' } as any)
      mockIsAdmin.mockResolvedValue(true)

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [{
            id: 'school-123',
            name: 'Test University',
            region: 'United States',
            type: 'Public'
          }],
          error: null
        })
      })
      mockSupabaseClient.from.mockReturnValue({ 
        select: mockSelect,
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
      })

      const request = new NextRequest('http://localhost:3000/api/admin/schools/school-123')
      const params = Promise.resolve({ id: 'school-123' })
      const response = await GET(request, { params })
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.id).toBe('school-123')
      expect(result.name).toBe('Test University')
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('schools')
    })

    it('should return 404 for non-existent school', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'admin-123' } as any)
      mockIsAdmin.mockResolvedValue(true)

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [],
          error: null
        })
      })
      mockSupabaseClient.from.mockReturnValue({ 
        select: mockSelect,
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
      })

      const request = new NextRequest('http://localhost:3000/api/admin/schools/nonexistent')
      const params = Promise.resolve({ id: 'nonexistent' })
      const response = await GET(request, { params })
      const result = await response.json()

      expect(response.status).toBe(404)
      expect(result.error).toBe('School not found')
    })

    it('should return 401 for unauthenticated users', async () => {
      mockGetCurrentUser.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/admin/schools/school-123')
      const params = Promise.resolve({ id: 'school-123' })
      const response = await GET(request, { params })
      const result = await response.json()

      expect(response.status).toBe(401)
      expect(result.error).toBe('Unauthorized')
      expect(mockSupabaseClient.from).not.toHaveBeenCalled()
    })

    it('should return 403 for non-admin users', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'user-123' } as any)
      mockIsAdmin.mockResolvedValue(false)

      const request = new NextRequest('http://localhost:3000/api/admin/schools/school-123')
      const params = Promise.resolve({ id: 'school-123' })
      const response = await GET(request, { params })
      const result = await response.json()

      expect(response.status).toBe(403)
      expect(result.error).toBe('Forbidden')
      expect(mockSupabaseClient.from).not.toHaveBeenCalled()
    })

    it('should handle database errors gracefully', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'admin-123' } as any)
      mockIsAdmin.mockResolvedValue(true)

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database connection failed' }
        })
      })
      mockSupabaseClient.from.mockReturnValue({ 
        select: mockSelect,
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
      })

      const request = new NextRequest('http://localhost:3000/api/admin/schools/school-123')
      const params = Promise.resolve({ id: 'school-123' })
      const response = await GET(request, { params })
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.error).toBe('Error fetching school')
    })
  })

  describe('PUT /api/admin/schools/[id]', () => {
    const createPutRequest = (body: any): NextRequest => {
      return new NextRequest('http://localhost:3000/api/admin/schools/school-123', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
    }

    it('should update school with valid data', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'admin-123' } as any)
      mockIsAdmin.mockResolvedValue(true)

      // Mock school exists check
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [{ id: 'school-123' }],
          error: null
        })
      })
      mockSupabaseClient.from.mockReturnValue({ 
        select: mockSelect,
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
      })

      // Mock admin client update
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: [{
              id: 'school-123',
              name: 'Updated University',
              region: 'Canada'
            }],
            error: null
          })
        })
      })
      mockAdminClient.from.mockReturnValue({ 
        update: mockUpdate,
        delete: vi.fn()
      })

      const updateData = {
        name: 'Updated University',
        region: 'Canada',
        type: 'Private'
      }

      const request = createPutRequest(updateData)
      const params = Promise.resolve({ id: 'school-123' })
      const response = await PUT(request, { params })
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.name).toBe('Updated University')
      expect(mockValidateSchoolData).toHaveBeenCalled()
      expect(mockAdminClient.from).toHaveBeenCalledWith('schools')
    })

    it('should return 404 for non-existent school', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'admin-123' } as any)
      mockIsAdmin.mockResolvedValue(true)

      // Mock school does not exist
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [],
          error: null
        })
      })
      mockSupabaseClient.from.mockReturnValue({ 
        select: mockSelect,
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
      })

      const request = createPutRequest({ name: 'Updated School' })
      const params = Promise.resolve({ id: 'nonexistent' })
      const response = await PUT(request, { params })
      const result = await response.json()

      expect(response.status).toBe(404)
      expect(result.error).toBe('School not found')
      expect(mockAdminClient.from).not.toHaveBeenCalled()
    })

    it('should return 400 for missing required fields', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'admin-123' } as any)
      mockIsAdmin.mockResolvedValue(true)

      // Mock school exists check
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [{ id: 'school-123' }],
          error: null
        })
      })
      mockSupabaseClient.from.mockReturnValue({ 
        select: mockSelect,
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
      })

      const request = createPutRequest({ region: 'United States' }) // Missing name
      const params = Promise.resolve({ id: 'school-123' })
      const response = await PUT(request, { params })
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toBe('School name is required')
    })

    it('should return 400 for validation errors', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'admin-123' } as any)
      mockIsAdmin.mockResolvedValue(true)
      mockValidateSchoolData.mockReturnValue(['Year founded must be between 1000 and 2025'])

      // Mock school exists check
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [{ id: 'school-123' }],
          error: null
        })
      })
      mockSupabaseClient.from.mockReturnValue({ 
        select: mockSelect,
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
      })

      const request = createPutRequest({ 
        name: 'Test School',
        year_founded: 500 // Invalid year
      })
      const params = Promise.resolve({ id: 'school-123' })
      const response = await PUT(request, { params })
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toBe('Year founded must be between 1000 and 2025')
    })

    it('should return 401 for unauthenticated users', async () => {
      mockGetCurrentUser.mockResolvedValue(null)

      const request = createPutRequest({ name: 'Test School' })
      const params = Promise.resolve({ id: 'school-123' })
      const response = await PUT(request, { params })
      const result = await response.json()

      expect(response.status).toBe(401)
      expect(result.error).toBe('Unauthorized')
    })

    it('should return 403 for non-admin users', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'user-123' } as any)
      mockIsAdmin.mockResolvedValue(false)

      const request = createPutRequest({ name: 'Test School' })
      const params = Promise.resolve({ id: 'school-123' })
      const response = await PUT(request, { params })
      const result = await response.json()

      expect(response.status).toBe(403)
      expect(result.error).toBe('Forbidden')
    })
  })

  describe('DELETE /api/admin/schools/[id]', () => {
    it('should delete school for valid ID', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'admin-123' } as any)
      mockIsAdmin.mockResolvedValue(true)

      // Mock school exists check
      const mockSelect = vi.fn()
        .mockReturnValueOnce({
          eq: vi.fn().mockResolvedValue({
            data: [{ id: 'school-123' }],
            error: null
          })
        })
        .mockReturnValueOnce({
          eq: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: [], // No programs
              error: null
            })
          })
        })
      mockSupabaseClient.from.mockReturnValue({ 
        select: mockSelect,
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
      })

      // Mock admin client delete
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: null
        })
      })
      mockAdminClient.from.mockReturnValue({ 
        delete: mockDelete,
        update: vi.fn()
      })

      const request = new NextRequest('http://localhost:3000/api/admin/schools/school-123', {
        method: 'DELETE'
      })
      const params = Promise.resolve({ id: 'school-123' })
      const response = await DELETE(request, { params })
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.message).toBe('School deleted successfully')
      expect(mockAdminClient.from).toHaveBeenCalledWith('schools')
    })

    it('should return 404 for non-existent school', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'admin-123' } as any)
      mockIsAdmin.mockResolvedValue(true)

      // Mock school does not exist
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [],
          error: null
        })
      })
      mockSupabaseClient.from.mockReturnValue({ 
        select: mockSelect,
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
      })

      const request = new NextRequest('http://localhost:3000/api/admin/schools/nonexistent', {
        method: 'DELETE'
      })
      const params = Promise.resolve({ id: 'nonexistent' })
      const response = await DELETE(request, { params })
      const result = await response.json()

      expect(response.status).toBe(404)
      expect(result.error).toBe('School not found')
      expect(mockAdminClient.from).not.toHaveBeenCalled()
    })

    it('should return 400 when school has existing programs', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'admin-123' } as any)
      mockIsAdmin.mockResolvedValue(true)

      // Mock school exists and has programs
      const mockSelect = vi.fn()
        .mockReturnValueOnce({
          eq: vi.fn().mockResolvedValue({
            data: [{ id: 'school-123' }],
            error: null
          })
        })
        .mockReturnValueOnce({
          eq: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: [{ id: 'program-123' }], // Has programs
              error: null
            })
          })
        })
      mockSupabaseClient.from.mockReturnValue({ 
        select: mockSelect,
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
      })

      const request = new NextRequest('http://localhost:3000/api/admin/schools/school-123', {
        method: 'DELETE'
      })
      const params = Promise.resolve({ id: 'school-123' })
      const response = await DELETE(request, { params })
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toContain('Cannot delete school with existing programs')
      expect(mockAdminClient.from).not.toHaveBeenCalled()
    })

    it('should return 401 for unauthenticated users', async () => {
      mockGetCurrentUser.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/admin/schools/school-123', {
        method: 'DELETE'
      })
      const params = Promise.resolve({ id: 'school-123' })
      const response = await DELETE(request, { params })
      const result = await response.json()

      expect(response.status).toBe(401)
      expect(result.error).toBe('Unauthorized')
    })

    it('should return 403 for non-admin users', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'user-123' } as any)
      mockIsAdmin.mockResolvedValue(false)

      const request = new NextRequest('http://localhost:3000/api/admin/schools/school-123', {
        method: 'DELETE'
      })
      const params = Promise.resolve({ id: 'school-123' })
      const response = await DELETE(request, { params })
      const result = await response.json()

      expect(response.status).toBe(403)
      expect(result.error).toBe('Forbidden')
    })

    it('should handle database errors during deletion', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'admin-123' } as any)
      mockIsAdmin.mockResolvedValue(true)

      // Mock school exists and no programs
      const mockSelect = vi.fn()
        .mockReturnValueOnce({
          eq: vi.fn().mockResolvedValue({
            data: [{ id: 'school-123' }],
            error: null
          })
        })
        .mockReturnValueOnce({
          eq: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: [],
              error: null
            })
          })
        })
      mockSupabaseClient.from.mockReturnValue({ 
        select: mockSelect,
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
      })

      // Mock admin client delete error
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: { message: 'Delete operation failed' }
        })
      })
      mockAdminClient.from.mockReturnValue({ 
        delete: mockDelete,
        update: vi.fn()
      })

      const request = new NextRequest('http://localhost:3000/api/admin/schools/school-123', {
        method: 'DELETE'
      })
      const params = Promise.resolve({ id: 'school-123' })
      const response = await DELETE(request, { params })
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.error).toBe('Delete operation failed')
    })
  })
})
