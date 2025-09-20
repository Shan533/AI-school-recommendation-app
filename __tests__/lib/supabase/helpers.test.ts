import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock Next.js cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    has: vi.fn(),
    getAll: vi.fn(),
    clear: vi.fn(),
    toString: vi.fn(),
    [Symbol.iterator]: vi.fn(() => [][Symbol.iterator]()),
    size: 0
  }))
}))

// Mock Supabase server client
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn()
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          then: vi.fn((callback) => callback({ data: [], error: null }))
        })),
        single: vi.fn(() => Promise.resolve({ data: null, error: null }))
      }))
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: null, error: null }))
      }))
    }))
  }))
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
  createAdminClient: vi.fn(() => mockSupabaseClient)
}))

describe('Supabase Helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getSupabaseClient', () => {
    it('should create and return a Supabase client', async () => {
      const { getSupabaseClient } = await import('@/lib/supabase/helpers')
      const client = await getSupabaseClient()
      
      expect(client).toBe(mockSupabaseClient)
    })
  })

  describe('getCurrentUser', () => {
    it('should return user when authenticated', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const { getCurrentUser } = await import('@/lib/supabase/helpers')
      const user = await getCurrentUser()
      
      expect(user).toEqual(mockUser)
    })

    it('should return null when not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      const { getCurrentUser } = await import('@/lib/supabase/helpers')
      const user = await getCurrentUser()
      
      expect(user).toBeNull()
    })

    it('should return null when auth error occurs', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Auth error' }
      })

      const { getCurrentUser } = await import('@/lib/supabase/helpers')
      const user = await getCurrentUser()
      
      expect(user).toBeNull()
    })
  })

  describe('getUserProfile', () => {
    it('should return user profile when found', async () => {
      const mockProfile = {
        id: 'user-123',
        username: 'testuser',
        is_admin: false
      }

      const mockChain = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: mockProfile, error: null }))
          }))
        })),
        insert: vi.fn()
      }
      mockSupabaseClient.from.mockReturnValue(mockChain as any)

      const { getUserProfile } = await import('@/lib/supabase/helpers')
      const profile = await getUserProfile('user-123')
      
      expect(profile).toEqual(mockProfile)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles')
    })

    it('should return null when profile not found', async () => {
      const mockChain = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ 
              data: null, 
              error: { code: 'PGRST116', message: 'Not found' } 
            }))
          }))
        })),
        insert: vi.fn()
      }
      mockSupabaseClient.from.mockReturnValue(mockChain as any)

      const { getUserProfile } = await import('@/lib/supabase/helpers')
      const profile = await getUserProfile('user-123')
      
      expect(profile).toBeNull()
    })

    it('should return null when database error occurs', async () => {
      const mockChain = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ 
              data: null, 
              error: { message: 'Database error' } 
            }))
          }))
        })),
        insert: vi.fn()
      }
      mockSupabaseClient.from.mockReturnValue(mockChain as any)

      const { getUserProfile } = await import('@/lib/supabase/helpers')
      const profile = await getUserProfile('user-123')
      
      expect(profile).toBeNull()
    })
  })

  describe('isAdmin', () => {
    it('should return true when user is admin', async () => {
      const mockProfile = {
        id: 'user-123',
        username: 'admin',
        is_admin: true
      }

      const mockChain = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: mockProfile, error: null }))
          }))
        })),
        insert: vi.fn()
      }
      mockSupabaseClient.from.mockReturnValue(mockChain as any)

      const { isAdmin } = await import('@/lib/supabase/helpers')
      const result = await isAdmin('user-123')
      
      expect(result).toBe(true)
    })

    it('should return false when user is not admin', async () => {
      const mockProfile = {
        id: 'user-123',
        username: 'user',
        is_admin: false
      }

      const mockChain = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: mockProfile, error: null }))
          }))
        })),
        insert: vi.fn()
      }
      mockSupabaseClient.from.mockReturnValue(mockChain as any)

      const { isAdmin } = await import('@/lib/supabase/helpers')
      const result = await isAdmin('user-123')
      
      expect(result).toBe(false)
    })

    it('should return false when profile not found', async () => {
      const mockChain = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ 
              data: null, 
              error: { code: 'PGRST116', message: 'Not found' } 
            }))
          }))
        })),
        insert: vi.fn()
      }
      mockSupabaseClient.from.mockReturnValue(mockChain as any)

      const { isAdmin } = await import('@/lib/supabase/helpers')
      const result = await isAdmin('user-123')
      
      expect(result).toBe(false)
    })

    it('should return false when profile is null', async () => {
      const mockChain = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: null }))
          }))
        })),
        insert: vi.fn()
      }
      mockSupabaseClient.from.mockReturnValue(mockChain as any)

      const { isAdmin } = await import('@/lib/supabase/helpers')
      const result = await isAdmin('user-123')
      
      expect(result).toBe(false)
    })
  })

  describe('getUserCollections', () => {
    it('should return collections with item counts', async () => {
      const mockCollections = [
        {
          id: 'collection-1',
          name: 'My Favorites',
          description: 'Favorite programs',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          collection_items: [{ id: 'item-1' }, { id: 'item-2' }]
        },
        {
          id: 'collection-2',
          name: 'Research Programs',
          description: null,
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          collection_items: []
        }
      ]

      const mockChain = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              then: vi.fn((callback) => callback({ data: mockCollections, error: null }))
            }))
          }))
        })),
        insert: vi.fn()
      }
      mockSupabaseClient.from.mockReturnValue(mockChain as any)

      const { getUserCollections } = await import('@/lib/supabase/helpers')
      const collections = await getUserCollections('user-123')
      
      expect(collections).toEqual([
        {
          id: 'collection-1',
          name: 'My Favorites',
          description: 'Favorite programs',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          item_count: 2
        },
        {
          id: 'collection-2',
          name: 'Research Programs',
          description: null,
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          item_count: 0
        }
      ])
    })

    it('should return empty array when database error occurs', async () => {
      const mockChain = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              then: vi.fn((callback) => callback({ 
                data: null, 
                error: { message: 'Database error' } 
              }))
            }))
          }))
        })),
        insert: vi.fn()
      }
      mockSupabaseClient.from.mockReturnValue(mockChain as any)

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { getUserCollections } = await import('@/lib/supabase/helpers')
      const collections = await getUserCollections('user-123')
      
      expect(collections).toEqual([])
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching collections:', { message: 'Database error' })
      
      consoleSpy.mockRestore()
    })

    it('should return empty array when no collections found', async () => {
      const mockChain = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              then: vi.fn((callback) => callback({ data: [], error: null }))
            }))
          }))
        })),
        insert: vi.fn()
      }
      mockSupabaseClient.from.mockReturnValue(mockChain as any)

      const { getUserCollections } = await import('@/lib/supabase/helpers')
      const collections = await getUserCollections('user-123')
      
      expect(collections).toEqual([])
    })

    it('should handle null collections data', async () => {
      const mockChain = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              then: vi.fn((callback) => callback({ data: null, error: null }))
            }))
          }))
        })),
        insert: vi.fn()
      }
      mockSupabaseClient.from.mockReturnValue(mockChain as any)

      const { getUserCollections } = await import('@/lib/supabase/helpers')
      const collections = await getUserCollections('user-123')
      
      expect(collections).toEqual([])
    })
  })

  describe('getCollectionWithItems', () => {
    it('should return collection with items when found', async () => {
      const mockCollection = {
        id: 'collection-1',
        name: 'My Favorites',
        description: 'Favorite programs',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        collection_items: [
          {
            id: 'item-1',
            notes: 'Great program',
            created_at: '2024-01-01T00:00:00Z',
            school_id: 'school-1',
            program_id: null,
            schools: {
              id: 'school-1',
              name: 'Harvard University',
              initial: 'HU',
              location: 'Cambridge, MA',
              region: 'United States'
            },
            programs: null
          }
        ]
      }

      const mockChain = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: mockCollection, error: null }))
            }))
          }))
        })),
        insert: vi.fn()
      }
      mockSupabaseClient.from.mockReturnValue(mockChain as any)

      const { getCollectionWithItems } = await import('@/lib/supabase/helpers')
      const collection = await getCollectionWithItems('collection-1', 'user-123')
      
      expect(collection).toEqual(mockCollection)
    })

    it('should return null when collection not found', async () => {
      const mockChain = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ 
                data: null, 
                error: { code: 'PGRST116', message: 'Not found' } 
              }))
            }))
          }))
        })),
        insert: vi.fn()
      }
      mockSupabaseClient.from.mockReturnValue(mockChain as any)

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { getCollectionWithItems } = await import('@/lib/supabase/helpers')
      const collection = await getCollectionWithItems('collection-1', 'user-123')
      
      expect(collection).toBeNull()
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching collection:', { code: 'PGRST116', message: 'Not found' })
      
      consoleSpy.mockRestore()
    })

    it('should return null when database error occurs', async () => {
      const mockChain = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ 
                data: null, 
                error: { message: 'Database error' } 
              }))
            }))
          }))
        })),
        insert: vi.fn()
      }
      mockSupabaseClient.from.mockReturnValue(mockChain as any)

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { getCollectionWithItems } = await import('@/lib/supabase/helpers')
      const collection = await getCollectionWithItems('collection-1', 'user-123')
      
      expect(collection).toBeNull()
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching collection:', { message: 'Database error' })
      
      consoleSpy.mockRestore()
    })
  })

  describe('createDefaultCollection', () => {
    it('should return existing collection if user already has "My Favorites"', async () => {
      const existingCollection = { id: 'existing-collection-1' }
      
      // Mock existing collection found
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: existingCollection,
                error: null
              })
            })
          })
        }),
        insert: vi.fn()
      } as any)

      const { createDefaultCollection } = await import('@/lib/supabase/helpers')
      const result = await createDefaultCollection('user-123')

      expect(result).toEqual(existingCollection)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('collections')
    })

    it('should create new collection if user does not have "My Favorites"', async () => {
      const newCollection = { 
        id: 'new-collection-1',
        user_id: 'user-123',
        name: 'My Favorites',
        description: 'My favorite schools and programs'
      }
      
      // Mock no existing collection
      const selectChain = {
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: null
            })
          })
        })
      }

      // Mock successful creation
      const insertChain = {
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: newCollection,
            error: null
          })
        })
      }

      mockSupabaseClient.from
        .mockReturnValueOnce({ select: vi.fn().mockReturnValue(selectChain), insert: vi.fn() } as any)
        .mockReturnValueOnce({ select: vi.fn(), insert: vi.fn().mockReturnValue(insertChain) } as any)

      const { createDefaultCollection } = await import('@/lib/supabase/helpers')
      const result = await createDefaultCollection('user-123')

      expect(result).toEqual(newCollection)
      expect(mockSupabaseClient.from).toHaveBeenCalledTimes(2)
    })

    it('should return null if collection creation fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      // Mock no existing collection
      const selectChain = {
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: null
            })
          })
        })
      }

      // Mock creation error
      const insertChain = {
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Creation failed' }
          })
        })
      }

      mockSupabaseClient.from
        .mockReturnValueOnce({ select: vi.fn().mockReturnValue(selectChain), insert: vi.fn() } as any)
        .mockReturnValueOnce({ select: vi.fn(), insert: vi.fn().mockReturnValue(insertChain) } as any)

      const { createDefaultCollection } = await import('@/lib/supabase/helpers')
      const result = await createDefaultCollection('user-123')

      expect(result).toBeNull()
      expect(consoleSpy).toHaveBeenCalledWith('Error creating default collection:', { message: 'Creation failed' })
      
      consoleSpy.mockRestore()
    })

    it('should handle errors when checking for existing collection', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      // Mock error when checking existing collection
      const selectChain = {
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' }
            })
          })
        })
      }

      // Mock successful creation
      const insertChain = {
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'new-collection-1' },
            error: null
          })
        })
      }

      mockSupabaseClient.from
        .mockReturnValueOnce({ select: vi.fn().mockReturnValue(selectChain), insert: vi.fn() } as any)
        .mockReturnValueOnce({ select: vi.fn(), insert: vi.fn().mockReturnValue(insertChain) } as any)

      const { createDefaultCollection } = await import('@/lib/supabase/helpers')
      const result = await createDefaultCollection('user-123')

      // Should still try to create since we couldn't verify existing collection
      expect(result).toBeDefined()
      
      consoleSpy.mockRestore()
    })
  })

  describe('createAdminClient', () => {
    it('should create and return an admin client', async () => {
      const { createAdminClient } = await import('@/lib/supabase/helpers')
      
      const result = createAdminClient()
      
      // Should return a client object (mocked in the test setup)
      expect(result).toBeDefined()
    })
  })
})
