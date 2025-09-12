import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as addItemToCollection } from '@/app/api/collections/[id]/items/route'
import { PUT as updateCollectionItem, DELETE as deleteCollectionItem } from '@/app/api/collections/[id]/items/[itemId]/route'

// Mock the supabase helpers
vi.mock('@/lib/supabase/helpers', () => ({
  getCurrentUser: vi.fn(),
  getSupabaseClient: vi.fn(),
}))

// Mock validation
vi.mock('@/lib/validation', () => ({
  validateCollectionItemData: vi.fn(() => []),
}))

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com'
}

const mockCollection = {
  id: 'test-collection-id',
  user_id: 'test-user-id',
  name: 'Test Collection'
}

const mockCollectionItem = {
  id: 'test-item-id',
  collection_id: 'test-collection-id',
  school_id: 'test-school-id',
  program_id: null,
  notes: 'Test notes',
  created_at: '2024-01-01T00:00:00Z',
  schools: {
    id: 'test-school-id',
    name: 'Test School',
    initial: 'TS',
    location: 'Test City',
    country: 'Test Country'
  }
}

const createMockChain = (returnData = mockCollectionItem) => {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve({ data: returnData, error: null })),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    then: vi.fn((callback) => callback({ data: [returnData], error: null }))
  }
  return chain
}

const mockSupabaseClient = {
  from: vi.fn(() => createMockChain())
}

describe('Collection Items API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/collections/[id]/items', () => {
    it('should return 401 when user is not authenticated', async () => {
      const { getCurrentUser } = await import('@/lib/supabase/helpers')
      vi.mocked(getCurrentUser).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/collections/test-id/items', {
        method: 'POST',
        body: JSON.stringify({ school_id: 'test-school-id' })
      })
      const params = Promise.resolve({ id: 'test-collection-id' })
      const response = await addItemToCollection(request, { params })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should add school to collection for authenticated user', async () => {
      const { getCurrentUser, getSupabaseClient } = await import('@/lib/supabase/helpers')
      const { validateCollectionItemData } = await import('@/lib/validation')
      
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
      vi.mocked(getSupabaseClient).mockResolvedValue(mockSupabaseClient as any)
      vi.mocked(validateCollectionItemData).mockReturnValue([])

      // Mock collection exists and belongs to user
      const collectionChain = createMockChain(mockCollection)
      mockSupabaseClient.from.mockReturnValueOnce(collectionChain)
      
      // Mock no existing item (returns PGRST116 error)
      const noExistingChain = createMockChain(null)
      noExistingChain.single = vi.fn(() => Promise.resolve({ 
        data: null, 
        error: { code: 'PGRST116', message: 'Not found' } 
      }))
      mockSupabaseClient.from.mockReturnValueOnce(noExistingChain)
      
      // Mock school exists
      const schoolChain = createMockChain({ id: 'test-school-id' })
      mockSupabaseClient.from.mockReturnValueOnce(schoolChain)
      
      // Mock item insertion
      const itemChain = createMockChain(mockCollectionItem)
      mockSupabaseClient.from.mockReturnValueOnce(itemChain)

      const request = new NextRequest('http://localhost:3000/api/collections/test-id/items', {
        method: 'POST',
        body: JSON.stringify({ school_id: 'test-school-id', notes: 'Test notes' })
      })
      const params = Promise.resolve({ id: 'test-collection-id' })
      const response = await addItemToCollection(request, { params })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.id).toBe(mockCollectionItem.id)
    })

    it('should add program to collection for authenticated user', async () => {
      const { getCurrentUser, getSupabaseClient } = await import('@/lib/supabase/helpers')
      const { validateCollectionItemData } = await import('@/lib/validation')
      
      const programItem = { ...mockCollectionItem, school_id: null, program_id: 'test-program-id' }
      
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
      vi.mocked(getSupabaseClient).mockResolvedValue(mockSupabaseClient as any)
      vi.mocked(validateCollectionItemData).mockReturnValue([])

      // Mock collection exists and belongs to user
      const collectionChain = createMockChain(mockCollection)
      mockSupabaseClient.from.mockReturnValueOnce(collectionChain)
      
      // Mock no existing item (returns PGRST116 error)
      const noExistingChain = createMockChain(null)
      noExistingChain.single = vi.fn(() => Promise.resolve({ 
        data: null, 
        error: { code: 'PGRST116', message: 'Not found' } 
      }))
      mockSupabaseClient.from.mockReturnValueOnce(noExistingChain)
      
      // Mock program exists
      const programChain = createMockChain({ id: 'test-program-id' })
      mockSupabaseClient.from.mockReturnValueOnce(programChain)
      
      // Mock item insertion
      const itemChain = createMockChain(programItem)
      mockSupabaseClient.from.mockReturnValueOnce(itemChain)

      const request = new NextRequest('http://localhost:3000/api/collections/test-id/items', {
        method: 'POST',
        body: JSON.stringify({ program_id: 'test-program-id' })
      })
      const params = Promise.resolve({ id: 'test-collection-id' })
      const response = await addItemToCollection(request, { params })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.id).toBe(programItem.id)
    })

    it('should return validation errors for invalid data', async () => {
      const { getCurrentUser } = await import('@/lib/supabase/helpers')
      const { validateCollectionItemData } = await import('@/lib/validation')
      
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
      vi.mocked(validateCollectionItemData).mockReturnValue(['Either school_id or program_id is required'])

      const request = new NextRequest('http://localhost:3000/api/collections/test-id/items', {
        method: 'POST',
        body: JSON.stringify({})
      })
      const params = Promise.resolve({ id: 'test-collection-id' })
      const response = await addItemToCollection(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.details).toEqual(['Either school_id or program_id is required'])
    })

    it('should return 404 when collection does not belong to user', async () => {
      const { getCurrentUser, getSupabaseClient } = await import('@/lib/supabase/helpers')
      const { validateCollectionItemData } = await import('@/lib/validation')
      
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
      vi.mocked(getSupabaseClient).mockResolvedValue(mockSupabaseClient as any)
      vi.mocked(validateCollectionItemData).mockReturnValue([])

      // Mock collection not found (different user means query returns no results)
      const notFoundChain = createMockChain(null)
      notFoundChain.single = vi.fn(() => Promise.resolve({ 
        data: null, 
        error: { code: 'PGRST116', message: 'Not found' } 
      }))
      mockSupabaseClient.from.mockReturnValueOnce(notFoundChain)

      const request = new NextRequest('http://localhost:3000/api/collections/test-id/items', {
        method: 'POST',
        body: JSON.stringify({ school_id: 'test-school-id' })
      })
      const params = Promise.resolve({ id: 'test-collection-id' })
      const response = await addItemToCollection(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Collection not found')
    })

    it('should handle database errors during item addition', async () => {
      const { getCurrentUser, getSupabaseClient } = await import('@/lib/supabase/helpers')
      const { validateCollectionItemData } = await import('@/lib/validation')
      
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
      vi.mocked(validateCollectionItemData).mockReturnValue([])
      
      // Mock successful collection check
      const collectionChain = createMockChain(mockCollection)
      mockSupabaseClient.from.mockReturnValueOnce(collectionChain)
      
      // Mock successful existing item check (no existing item)
      const existingItemChain = createMockChain(null)
      existingItemChain.single = vi.fn(() => Promise.resolve({ 
        data: null, 
        error: { code: 'PGRST116', message: 'No existing item' } 
      }))
      mockSupabaseClient.from.mockReturnValueOnce(existingItemChain)
      
      // Mock successful school check
      const schoolChain = createMockChain({ id: 'test-school-id', name: 'Test School' })
      mockSupabaseClient.from.mockReturnValueOnce(schoolChain)
      
      // Mock failed item insertion
      const insertChain = createMockChain()
      insertChain.insert = vi.fn(() => insertChain)
      insertChain.select = vi.fn(() => insertChain)
      insertChain.single = vi.fn(() => Promise.resolve({ 
        data: null, 
        error: { message: 'Database insertion failed' } 
      }))
      mockSupabaseClient.from.mockReturnValueOnce(insertChain)

      const request = new NextRequest('http://localhost:3000/api/collections/test-collection-id/items', {
        method: 'POST',
        body: JSON.stringify({ school_id: 'test-school-id' })
      })
      const params = Promise.resolve({ id: 'test-collection-id' })
      const response = await addItemToCollection(request, { params })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Database insertion failed')
    })

    it('should handle server errors gracefully', async () => {
      const { getCurrentUser } = await import('@/lib/supabase/helpers')
      vi.mocked(getCurrentUser).mockImplementation(() => {
        throw new Error('Server error')
      })

      const request = new NextRequest('http://localhost:3000/api/collections/test-collection-id/items', {
        method: 'POST',
        body: JSON.stringify({ school_id: 'test-school-id' })
      })
      const params = Promise.resolve({ id: 'test-collection-id' })
      const response = await addItemToCollection(request, { params })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })

  describe('PUT /api/collections/[id]/items/[itemId]', () => {
    it('should return 401 when user is not authenticated', async () => {
      const { getCurrentUser } = await import('@/lib/supabase/helpers')
      vi.mocked(getCurrentUser).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/collections/test-id/items/test-item-id', {
        method: 'PUT',
        body: JSON.stringify({ notes: 'Updated notes' })
      })
      const params = Promise.resolve({ id: 'test-collection-id', itemId: 'test-item-id' })
      const response = await updateCollectionItem(request, { params })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should update item notes for authenticated user', async () => {
      const { getCurrentUser, getSupabaseClient } = await import('@/lib/supabase/helpers')
      
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
      vi.mocked(getSupabaseClient).mockResolvedValue(mockSupabaseClient as any)

      // Mock item exists and belongs to user's collection
      const itemWithCollection = {
        id: mockCollectionItem.id,
        collection_id: mockCollectionItem.collection_id,
        school_id: mockCollectionItem.school_id,
        program_id: mockCollectionItem.program_id,
        collections: { user_id: mockUser.id }
      }
      const checkChain = createMockChain(itemWithCollection)
      mockSupabaseClient.from.mockReturnValueOnce(checkChain)

      // Mock update operation with complete data (optimized query)
      const updatedItem = { ...mockCollectionItem, notes: 'Updated notes' }
      const updateChain = {
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn(() => Promise.resolve({ data: [updatedItem], error: null }))
            }))
          }))
        }))
      }
      mockSupabaseClient.from.mockReturnValueOnce(updateChain)

      const request = new NextRequest('http://localhost:3000/api/collections/test-id/items/test-item-id', {
        method: 'PUT',
        body: JSON.stringify({ notes: 'Updated notes' })
      })
      const params = Promise.resolve({ id: 'test-collection-id', itemId: 'test-item-id' })
      const response = await updateCollectionItem(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.notes).toBe('Updated notes')
    })

    it('should return 404 when item not found', async () => {
      const { getCurrentUser, getSupabaseClient } = await import('@/lib/supabase/helpers')
      
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
      vi.mocked(getSupabaseClient).mockResolvedValue(mockSupabaseClient as any)

      // Mock item not found
      const notFoundChain = createMockChain(null)
      notFoundChain.single = vi.fn(() => Promise.resolve({ 
        data: null, 
        error: { code: 'PGRST116', message: 'Not found' } 
      }))
      mockSupabaseClient.from.mockReturnValueOnce(notFoundChain)

      const request = new NextRequest('http://localhost:3000/api/collections/test-id/items/test-item-id', {
        method: 'PUT',
        body: JSON.stringify({ notes: 'Updated notes' })
      })
      const params = Promise.resolve({ id: 'test-collection-id', itemId: 'test-item-id' })
      const response = await updateCollectionItem(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Item not found in this collection')
    })

    it('should handle database errors during item check', async () => {
      const { getCurrentUser, getSupabaseClient } = await import('@/lib/supabase/helpers')
      
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
      vi.mocked(getSupabaseClient).mockResolvedValue(mockSupabaseClient as any)

      // Mock database error during item check
      const errorChain = createMockChain(null)
      errorChain.single = vi.fn(() => Promise.resolve({ 
        data: null, 
        error: { message: 'Database connection failed' } 
      }))
      mockSupabaseClient.from.mockReturnValueOnce(errorChain)

      const request = new NextRequest('http://localhost:3000/api/collections/test-id/items/test-item-id', {
        method: 'PUT',
        body: JSON.stringify({ notes: 'Updated notes' })
      })
      const params = Promise.resolve({ id: 'test-collection-id', itemId: 'test-item-id' })
      const response = await updateCollectionItem(request, { params })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Error checking item')
    })

    it('should handle server errors gracefully', async () => {
      const { getCurrentUser } = await import('@/lib/supabase/helpers')
      vi.mocked(getCurrentUser).mockImplementation(() => {
        throw new Error('Server error')
      })

      const request = new NextRequest('http://localhost:3000/api/collections/test-id/items/test-item-id', {
        method: 'PUT',
        body: JSON.stringify({ notes: 'Updated notes' })
      })
      const params = Promise.resolve({ id: 'test-collection-id', itemId: 'test-item-id' })
      const response = await updateCollectionItem(request, { params })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })

  describe('DELETE /api/collections/[id]/items/[itemId]', () => {
    it('should return 401 when user is not authenticated', async () => {
      const { getCurrentUser } = await import('@/lib/supabase/helpers')
      vi.mocked(getCurrentUser).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/collections/test-id/items/test-item-id', {
        method: 'DELETE'
      })
      const params = Promise.resolve({ id: 'test-collection-id', itemId: 'test-item-id' })
      const response = await deleteCollectionItem(request, { params })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should delete item for authenticated user', async () => {
      const { getCurrentUser, getSupabaseClient } = await import('@/lib/supabase/helpers')
      
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
      vi.mocked(getSupabaseClient).mockResolvedValue(mockSupabaseClient as any)

      // Mock item exists and belongs to user's collection
      const itemWithCollection = {
        id: mockCollectionItem.id,
        collection_id: mockCollectionItem.collection_id,
        school_id: mockCollectionItem.school_id,
        program_id: mockCollectionItem.program_id,
        collections: { user_id: mockUser.id }
      }
      const checkChain = createMockChain(itemWithCollection)
      mockSupabaseClient.from.mockReturnValueOnce(checkChain)

      // Mock delete operation
      const deleteChain = {
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
          }))
        }))
      }
      mockSupabaseClient.from.mockReturnValueOnce(deleteChain)

      const request = new NextRequest('http://localhost:3000/api/collections/test-id/items/test-item-id', {
        method: 'DELETE'
      })
      const params = Promise.resolve({ id: 'test-collection-id', itemId: 'test-item-id' })
      const response = await deleteCollectionItem(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Item removed from collection successfully')
    })

    it('should return 404 when item not found', async () => {
      const { getCurrentUser, getSupabaseClient } = await import('@/lib/supabase/helpers')
      
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
      vi.mocked(getSupabaseClient).mockResolvedValue(mockSupabaseClient as any)

      // Mock item not found
      const notFoundChain = createMockChain(null)
      notFoundChain.single = vi.fn(() => Promise.resolve({ 
        data: null, 
        error: { code: 'PGRST116', message: 'Not found' } 
      }))
      mockSupabaseClient.from.mockReturnValueOnce(notFoundChain)

      const request = new NextRequest('http://localhost:3000/api/collections/test-id/items/test-item-id', {
        method: 'DELETE'
      })
      const params = Promise.resolve({ id: 'test-collection-id', itemId: 'test-item-id' })
      const response = await deleteCollectionItem(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Item not found')
    })

    it('should handle database errors during item check', async () => {
      const { getCurrentUser, getSupabaseClient } = await import('@/lib/supabase/helpers')
      
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
      vi.mocked(getSupabaseClient).mockResolvedValue(mockSupabaseClient as any)

      // Mock database error during item check
      const errorChain = createMockChain(null)
      errorChain.single = vi.fn(() => Promise.resolve({ 
        data: null, 
        error: { message: 'Database connection failed' } 
      }))
      mockSupabaseClient.from.mockReturnValueOnce(errorChain)

      const request = new NextRequest('http://localhost:3000/api/collections/test-id/items/test-item-id', {
        method: 'DELETE'
      })
      const params = Promise.resolve({ id: 'test-collection-id', itemId: 'test-item-id' })
      const response = await deleteCollectionItem(request, { params })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Error checking item')
    })

    it('should handle server errors gracefully', async () => {
      const { getCurrentUser } = await import('@/lib/supabase/helpers')
      vi.mocked(getCurrentUser).mockImplementation(() => {
        throw new Error('Server error')
      })

      const request = new NextRequest('http://localhost:3000/api/collections/test-id/items/test-item-id', {
        method: 'DELETE'
      })
      const params = Promise.resolve({ id: 'test-collection-id', itemId: 'test-item-id' })
      const response = await deleteCollectionItem(request, { params })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should handle Supabase inner join returning array instead of single object', async () => {
      const { getCurrentUser, getSupabaseClient } = await import('@/lib/supabase/helpers')
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser)

      const mockDelete = vi.fn().mockReturnThis()
      mockDelete.mockResolvedValue({ error: null })

      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'test-item-id',
                    // Simulate Supabase returning collections as array instead of single object
                    collections: [{ user_id: 'test-user-id' }]
                  },
                  error: null
                })
              }))
            }))
          })),
          delete: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: mockDelete
            }))
          }))
        }))
      }

      vi.mocked(getSupabaseClient).mockResolvedValue(mockSupabase as any)

      const request = new NextRequest('http://localhost:3000/api/collections/test-id/items/test-item-id', {
        method: 'DELETE'
      })
      const params = Promise.resolve({ id: 'test-collection-id', itemId: 'test-item-id' })
      const response = await deleteCollectionItem(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Item removed from collection successfully')
    })
  })
})
