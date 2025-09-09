import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET as checkItemInCollections } from '@/app/api/collections/check/route'

// Mock the supabase helpers
vi.mock('@/lib/supabase/helpers', () => ({
  getCurrentUser: vi.fn(),
  getSupabaseClient: vi.fn(),
}))

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com'
}

const mockCollectionItems = [
  {
    id: 'item-1',
    collection_id: 'collection-1',
    collections: { name: 'Collection 1' }
  },
  {
    id: 'item-2',
    collection_id: 'collection-2',
    collections: { name: 'Collection 2' }
  }
]

const createMockChain = (returnData = mockCollectionItems) => {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    or: vi.fn(() => chain),
    then: vi.fn((callback) => callback({ data: returnData, error: null }))
  }
  return chain
}

const mockSupabaseClient = {
  from: vi.fn(() => createMockChain())
}

describe('Collections Check API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/collections/check', () => {
    it('should return 401 when user is not authenticated', async () => {
      const { getCurrentUser } = await import('@/lib/supabase/helpers')
      vi.mocked(getCurrentUser).mockResolvedValue(null)

      const url = new URL('http://localhost:3000/api/collections/check?school_id=test-school-id')
      const request = new NextRequest(url)
      const response = await checkItemInCollections(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 400 when neither school_id nor program_id is provided', async () => {
      const { getCurrentUser } = await import('@/lib/supabase/helpers')
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser)

      const url = new URL('http://localhost:3000/api/collections/check')
      const request = new NextRequest(url)
      const response = await checkItemInCollections(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Either school_id or program_id is required')
    })

    it('should return 400 when both school_id and program_id are provided', async () => {
      const { getCurrentUser } = await import('@/lib/supabase/helpers')
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser)

      const url = new URL('http://localhost:3000/api/collections/check?school_id=test-school&program_id=test-program')
      const request = new NextRequest(url)
      const response = await checkItemInCollections(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Cannot specify both school_id and program_id')
    })

    it('should check if school exists in collections', async () => {
      const { getCurrentUser, getSupabaseClient } = await import('@/lib/supabase/helpers')
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
      vi.mocked(getSupabaseClient).mockResolvedValue(mockSupabaseClient as any)

      const url = new URL('http://localhost:3000/api/collections/check?school_id=test-school-id')
      const request = new NextRequest(url)
      const response = await checkItemInCollections(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.in_collections).toBe(true)
      expect(data.collections).toHaveLength(2)
      expect(data.collections[0]).toEqual({
        collection_id: 'collection-1',
        collection_name: 'Collection 1',
        item_id: 'item-1'
      })
    })

    it('should check if program exists in collections', async () => {
      const { getCurrentUser, getSupabaseClient } = await import('@/lib/supabase/helpers')
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
      vi.mocked(getSupabaseClient).mockResolvedValue(mockSupabaseClient as any)

      const url = new URL('http://localhost:3000/api/collections/check?program_id=test-program-id')
      const request = new NextRequest(url)
      const response = await checkItemInCollections(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.in_collections).toBe(true)
      expect(data.collections).toHaveLength(2)
    })

    it('should return empty collections when item is not in any collection', async () => {
      const { getCurrentUser, getSupabaseClient } = await import('@/lib/supabase/helpers')
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
      
      // Mock empty result
      const emptyChain = createMockChain([])
      const mockEmptyClient = { from: vi.fn(() => emptyChain) }
      vi.mocked(getSupabaseClient).mockResolvedValue(mockEmptyClient as any)

      const url = new URL('http://localhost:3000/api/collections/check?school_id=non-existent-school')
      const request = new NextRequest(url)
      const response = await checkItemInCollections(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.in_collections).toBe(false)
      expect(data.collections).toHaveLength(0)
    })

    it('should handle database errors', async () => {
      const { getCurrentUser, getSupabaseClient } = await import('@/lib/supabase/helpers')
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
      
      // Mock database error
      const errorChain = createMockChain([])
      errorChain.then = vi.fn((callback) => callback({ 
        data: null, 
        error: { message: 'Database error' } 
      }))
      const mockErrorClient = { from: vi.fn(() => errorChain) }
      vi.mocked(getSupabaseClient).mockResolvedValue(mockErrorClient as any)

      const url = new URL('http://localhost:3000/api/collections/check?school_id=test-school-id')
      const request = new NextRequest(url)
      const response = await checkItemInCollections(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Error checking collections')
    })

    it('should handle server errors gracefully', async () => {
      const { getCurrentUser } = await import('@/lib/supabase/helpers')
      vi.mocked(getCurrentUser).mockImplementation(() => {
        throw new Error('Server error')
      })

      const url = new URL('http://localhost:3000/api/collections/check?school_id=test-school-id')
      const request = new NextRequest(url)
      const response = await checkItemInCollections(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })
})
