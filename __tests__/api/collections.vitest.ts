import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET as getCollections, POST as createCollection } from '@/app/api/collections/route'
import { GET as getCollection, PUT as updateCollection, DELETE as deleteCollection } from '@/app/api/collections/[id]/route'

// Mock the supabase helpers
vi.mock('@/lib/supabase/helpers', () => ({
  getCurrentUser: vi.fn(),
  getSupabaseClient: vi.fn(),
}))

// Mock validation
vi.mock('@/lib/validation', () => ({
  validateCollectionData: vi.fn(() => []),
  validateCollectionItemData: vi.fn(() => []),
}))

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com'
}

const mockCollection = {
  id: 'test-collection-id',
  user_id: 'test-user-id',
  name: 'Test Collection',
  description: 'Test description',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

const createMockChain = () => {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve({ data: mockCollection, error: null })),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    then: vi.fn((callback) => callback({ data: [mockCollection], error: null }))
  }
  // Make single return the promise directly
  chain.single = vi.fn(() => Promise.resolve({ data: mockCollection, error: null }))
  return chain
}

const mockSupabaseClient = {
  from: vi.fn(() => createMockChain())
}

describe('Collections API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/collections', () => {
    it('should return 401 when user is not authenticated', async () => {
      const { getCurrentUser } = await import('@/lib/supabase/helpers')
      vi.mocked(getCurrentUser).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/collections')
      const response = await getCollections(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return collections for authenticated user', async () => {
      const { getCurrentUser, getSupabaseClient } = await import('@/lib/supabase/helpers')
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
      vi.mocked(getSupabaseClient).mockResolvedValue(mockSupabaseClient as any)

      const request = new NextRequest('http://localhost:3000/api/collections')
      const response = await getCollections(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
    })

    it('should handle database errors gracefully', async () => {
      const { getCurrentUser, getSupabaseClient } = await import('@/lib/supabase/helpers')
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
      
      const errorChain = createMockChain()
      errorChain.then = vi.fn((callback) => callback({ 
        data: null, 
        error: { message: 'Database connection failed' } 
      }))
      const mockErrorClient = { from: vi.fn(() => errorChain) }
      vi.mocked(getSupabaseClient).mockResolvedValue(mockErrorClient as any)

      const request = new NextRequest('http://localhost:3000/api/collections')
      const response = await getCollections(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Error fetching collections')
    })

    it('should handle server errors gracefully', async () => {
      const { getCurrentUser } = await import('@/lib/supabase/helpers')
      vi.mocked(getCurrentUser).mockImplementation(() => {
        throw new Error('Server error')
      })

      const request = new NextRequest('http://localhost:3000/api/collections')
      const response = await getCollections(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })

  describe('POST /api/collections', () => {
    it('should return 401 when user is not authenticated', async () => {
      const { getCurrentUser } = await import('@/lib/supabase/helpers')
      vi.mocked(getCurrentUser).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/collections', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Collection' })
      })
      const response = await createCollection(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should create collection for authenticated user', async () => {
      const { getCurrentUser, getSupabaseClient } = await import('@/lib/supabase/helpers')
      const { validateCollectionData } = await import('@/lib/validation')
      
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
      vi.mocked(getSupabaseClient).mockResolvedValue(mockSupabaseClient as any)
      vi.mocked(validateCollectionData).mockReturnValue([])

      const request = new NextRequest('http://localhost:3000/api/collections', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Collection', description: 'Test description' })
      })
      const response = await createCollection(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.id).toBe(mockCollection.id)
    })

    it('should return validation errors for invalid data', async () => {
      const { getCurrentUser } = await import('@/lib/supabase/helpers')
      const { validateCollectionData } = await import('@/lib/validation')
      
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
      vi.mocked(validateCollectionData).mockReturnValue(['Collection name is required'])

      const request = new NextRequest('http://localhost:3000/api/collections', {
        method: 'POST',
        body: JSON.stringify({ name: '' })
      })
      const response = await createCollection(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.details).toEqual(['Collection name is required'])
    })

    it('should handle database errors during creation', async () => {
      const { getCurrentUser, getSupabaseClient } = await import('@/lib/supabase/helpers')
      const { validateCollectionData } = await import('@/lib/validation')
      
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
      vi.mocked(validateCollectionData).mockReturnValue([])
      
      const errorChain = createMockChain()
      errorChain.insert = vi.fn(() => errorChain)
      errorChain.select = vi.fn(() => errorChain)
      errorChain.single = vi.fn(() => Promise.resolve({ 
        data: null, 
        error: { message: 'Database constraint violation' } 
      }))
      const mockErrorClient = { from: vi.fn(() => errorChain) }
      vi.mocked(getSupabaseClient).mockResolvedValue(mockErrorClient as any)

      const request = new NextRequest('http://localhost:3000/api/collections', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Collection' })
      })
      const response = await createCollection(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Database constraint violation')
    })

    it('should handle server errors gracefully', async () => {
      const { getCurrentUser } = await import('@/lib/supabase/helpers')
      vi.mocked(getCurrentUser).mockImplementation(() => {
        throw new Error('Server error')
      })

      const request = new NextRequest('http://localhost:3000/api/collections', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Collection' })
      })
      const response = await createCollection(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })

  describe('GET /api/collections/[id]', () => {
    it('should return 401 when user is not authenticated', async () => {
      const { getCurrentUser } = await import('@/lib/supabase/helpers')
      vi.mocked(getCurrentUser).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/collections/test-id')
      const params = Promise.resolve({ id: 'test-id' })
      const response = await getCollection(request, { params })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return collection for authenticated user', async () => {
      const { getCurrentUser, getSupabaseClient } = await import('@/lib/supabase/helpers')
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
      vi.mocked(getSupabaseClient).mockResolvedValue(mockSupabaseClient as any)

      const request = new NextRequest('http://localhost:3000/api/collections/test-id')
      const params = Promise.resolve({ id: 'test-id' })
      const response = await getCollection(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.id).toBe(mockCollection.id)
    })

    it('should return 404 when collection not found', async () => {
      const { getCurrentUser, getSupabaseClient } = await import('@/lib/supabase/helpers')
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
      
      const notFoundChain = createMockChain()
      notFoundChain.single = vi.fn(() => Promise.resolve({ 
        data: null, 
        error: { code: 'PGRST116', message: 'Not found' } 
      }))
      const mockNotFoundClient = { from: vi.fn(() => notFoundChain) }
      vi.mocked(getSupabaseClient).mockResolvedValue(mockNotFoundClient as any)

      const request = new NextRequest('http://localhost:3000/api/collections/non-existent')
      const params = Promise.resolve({ id: 'non-existent' })
      const response = await getCollection(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Collection not found')
    })

    it('should handle database errors gracefully', async () => {
      const { getCurrentUser, getSupabaseClient } = await import('@/lib/supabase/helpers')
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
      
      const errorChain = createMockChain()
      errorChain.single = vi.fn(() => Promise.resolve({ 
        data: null, 
        error: { message: 'Database connection failed' } 
      }))
      const mockErrorClient = { from: vi.fn(() => errorChain) }
      vi.mocked(getSupabaseClient).mockResolvedValue(mockErrorClient as any)

      const request = new NextRequest('http://localhost:3000/api/collections/test-id')
      const params = Promise.resolve({ id: 'test-id' })
      const response = await getCollection(request, { params })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Error fetching collection')
    })

    it('should handle server errors gracefully', async () => {
      const { getCurrentUser } = await import('@/lib/supabase/helpers')
      vi.mocked(getCurrentUser).mockImplementation(() => {
        throw new Error('Server error')
      })

      const request = new NextRequest('http://localhost:3000/api/collections/test-id')
      const params = Promise.resolve({ id: 'test-id' })
      const response = await getCollection(request, { params })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })

  describe('PUT /api/collections/[id]', () => {
    it('should return 401 when user is not authenticated', async () => {
      const { getCurrentUser } = await import('@/lib/supabase/helpers')
      vi.mocked(getCurrentUser).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/collections/test-id', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Collection' })
      })
      const params = Promise.resolve({ id: 'test-id' })
      const response = await updateCollection(request, { params })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should update collection for authenticated user', async () => {
      const { getCurrentUser, getSupabaseClient } = await import('@/lib/supabase/helpers')
      const { validateCollectionData } = await import('@/lib/validation')
      
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
      vi.mocked(getSupabaseClient).mockResolvedValue(mockSupabaseClient as any)
      vi.mocked(validateCollectionData).mockReturnValue([])

      const request = new NextRequest('http://localhost:3000/api/collections/test-id', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Collection' })
      })
      const params = Promise.resolve({ id: 'test-id' })
      const response = await updateCollection(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.id).toBe(mockCollection.id)
    })

    it('should return validation errors for invalid data', async () => {
      const { getCurrentUser } = await import('@/lib/supabase/helpers')
      const { validateCollectionData } = await import('@/lib/validation')
      
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
      vi.mocked(validateCollectionData).mockReturnValue(['Collection name is required'])

      const request = new NextRequest('http://localhost:3000/api/collections/test-id', {
        method: 'PUT',
        body: JSON.stringify({ name: '' })
      })
      const params = Promise.resolve({ id: 'test-id' })
      const response = await updateCollection(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.details).toEqual(['Collection name is required'])
    })

    it('should return 404 when collection not found', async () => {
      const { getCurrentUser, getSupabaseClient } = await import('@/lib/supabase/helpers')
      const { validateCollectionData } = await import('@/lib/validation')
      
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
      vi.mocked(validateCollectionData).mockReturnValue([])
      
      const notFoundChain = createMockChain()
      notFoundChain.single = vi.fn(() => Promise.resolve({ 
        data: null, 
        error: { code: 'PGRST116', message: 'Not found' } 
      }))
      const mockNotFoundClient = { from: vi.fn(() => notFoundChain) }
      vi.mocked(getSupabaseClient).mockResolvedValue(mockNotFoundClient as any)

      const request = new NextRequest('http://localhost:3000/api/collections/non-existent', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Collection' })
      })
      const params = Promise.resolve({ id: 'non-existent' })
      const response = await updateCollection(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Collection not found')
    })

    it('should handle update errors gracefully', async () => {
      const { getCurrentUser, getSupabaseClient } = await import('@/lib/supabase/helpers')
      const { validateCollectionData } = await import('@/lib/validation')
      
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
      vi.mocked(validateCollectionData).mockReturnValue([])
      
      // Mock successful check
      const checkChain = createMockChain(mockCollection)
      // Mock failed update
      const updateChain = createMockChain()
      updateChain.update = vi.fn(() => updateChain)
      updateChain.eq = vi.fn(() => updateChain)
      updateChain.select = vi.fn(() => updateChain)
      updateChain.single = vi.fn(() => Promise.resolve({ 
        data: null, 
        error: { message: 'Update failed' } 
      }))
      
      const mockClient = { 
        from: vi.fn()
          .mockReturnValueOnce(checkChain)  // First call for check
          .mockReturnValueOnce(updateChain) // Second call for update
      }
      vi.mocked(getSupabaseClient).mockResolvedValue(mockClient as any)

      const request = new NextRequest('http://localhost:3000/api/collections/test-id', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Collection' })
      })
      const params = Promise.resolve({ id: 'test-id' })
      const response = await updateCollection(request, { params })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Update failed')
    })

    it('should handle server errors gracefully', async () => {
      const { getCurrentUser } = await import('@/lib/supabase/helpers')
      vi.mocked(getCurrentUser).mockImplementation(() => {
        throw new Error('Server error')
      })

      const request = new NextRequest('http://localhost:3000/api/collections/test-id', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Collection' })
      })
      const params = Promise.resolve({ id: 'test-id' })
      const response = await updateCollection(request, { params })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })

  describe('DELETE /api/collections/[id]', () => {
    it('should return 401 when user is not authenticated', async () => {
      const { getCurrentUser } = await import('@/lib/supabase/helpers')
      vi.mocked(getCurrentUser).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/collections/test-id', {
        method: 'DELETE'
      })
      const params = Promise.resolve({ id: 'test-id' })
      const response = await deleteCollection(request, { params })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should delete collection for authenticated user', async () => {
      const { getCurrentUser, getSupabaseClient } = await import('@/lib/supabase/helpers')
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
      vi.mocked(getSupabaseClient).mockResolvedValue(mockSupabaseClient as any)

      const request = new NextRequest('http://localhost:3000/api/collections/test-id', {
        method: 'DELETE'
      })
      const params = Promise.resolve({ id: 'test-id' })
      const response = await deleteCollection(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Collection deleted successfully')
    })

    it('should return 404 when collection not found', async () => {
      const { getCurrentUser, getSupabaseClient } = await import('@/lib/supabase/helpers')
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
      
      const notFoundChain = createMockChain()
      notFoundChain.single = vi.fn(() => Promise.resolve({ 
        data: null, 
        error: { code: 'PGRST116', message: 'Not found' } 
      }))
      const mockNotFoundClient = { from: vi.fn(() => notFoundChain) }
      vi.mocked(getSupabaseClient).mockResolvedValue(mockNotFoundClient as any)

      const request = new NextRequest('http://localhost:3000/api/collections/non-existent', {
        method: 'DELETE'
      })
      const params = Promise.resolve({ id: 'non-existent' })
      const response = await deleteCollection(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Collection not found')
    })

    it('should handle delete errors gracefully', async () => {
      const { getCurrentUser, getSupabaseClient } = await import('@/lib/supabase/helpers')
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
      
      // Mock successful check
      const checkChain = createMockChain(mockCollection)
      // Mock failed delete
      const deleteChain = createMockChain()
      deleteChain.delete = vi.fn(() => deleteChain)
      deleteChain.then = vi.fn((callback) => callback({ 
        data: null, 
        error: { message: 'Delete operation failed' } 
      }))
      
      const mockClient = { 
        from: vi.fn()
          .mockReturnValueOnce(checkChain)  // First call for check
          .mockReturnValueOnce(deleteChain) // Second call for delete
      }
      vi.mocked(getSupabaseClient).mockResolvedValue(mockClient as any)

      const request = new NextRequest('http://localhost:3000/api/collections/test-id', {
        method: 'DELETE'
      })
      const params = Promise.resolve({ id: 'test-id' })
      const response = await deleteCollection(request, { params })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Delete operation failed')
    })

    it('should handle server errors gracefully', async () => {
      const { getCurrentUser } = await import('@/lib/supabase/helpers')
      vi.mocked(getCurrentUser).mockImplementation(() => {
        throw new Error('Server error')
      })

      const request = new NextRequest('http://localhost:3000/api/collections/test-id', {
        method: 'DELETE'
      })
      const params = Promise.resolve({ id: 'test-id' })
      const response = await deleteCollection(request, { params })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })
})
