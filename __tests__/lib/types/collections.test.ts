/**
 * Unit tests for Collections TypeScript types
 * Priority: MEDIUM - Type validation and structure testing
 * 
 * Test Coverage Areas:
 * - Type structure validation
 * - Interface compatibility
 * - Type safety checks
 */

import { describe, it, expect } from 'vitest'
import type {
  Collection,
  CollectionItem,
  CollectionWithItems,
  CollectionItemWithDetails,
  CollectionFormData,
  CollectionItemFormData,
  CollectionsResponse,
  CollectionResponse,
  CollectionItemsResponse,
  CollectionValidationError,
  CollectionValidationResult
} from '@/lib/types/collections'

describe('Collections Types', () => {
  describe('Collection interface', () => {
    it('should accept valid collection data', () => {
      const collection: Collection = {
        id: 'coll-1',
        user_id: 'user-123',
        name: 'My Favorites',
        description: 'My favorite schools and programs',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      expect(collection.id).toBe('coll-1')
      expect(collection.user_id).toBe('user-123')
      expect(collection.name).toBe('My Favorites')
      expect(collection.description).toBe('My favorite schools and programs')
    })

    it('should accept collection without description', () => {
      const collection: Collection = {
        id: 'coll-2',
        user_id: 'user-456',
        name: 'Short List',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      expect(collection.description).toBeUndefined()
      expect(collection.name).toBe('Short List')
    })

    it('should enforce required string types', () => {
      const collection: Collection = {
        id: 'coll-3',
        user_id: 'user-789',
        name: 'Test Collection',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      // All required fields should be strings
      expect(typeof collection.id).toBe('string')
      expect(typeof collection.user_id).toBe('string')
      expect(typeof collection.name).toBe('string')
      expect(typeof collection.created_at).toBe('string')
      expect(typeof collection.updated_at).toBe('string')
    })
  })

  describe('CollectionItem interface', () => {
    it('should accept valid collection item with school_id', () => {
      const item: CollectionItem = {
        id: 'item-1',
        collection_id: 'coll-1',
        school_id: 'school-123',
        notes: 'Great school!',
        created_at: '2024-01-01T00:00:00Z'
      }

      expect(item.school_id).toBe('school-123')
      expect(item.program_id).toBeUndefined()
      expect(item.notes).toBe('Great school!')
    })

    it('should accept valid collection item with program_id', () => {
      const item: CollectionItem = {
        id: 'item-2',
        collection_id: 'coll-1',
        program_id: 'program-456',
        notes: 'Excellent program',
        created_at: '2024-01-01T00:00:00Z'
      }

      expect(item.program_id).toBe('program-456')
      expect(item.school_id).toBeUndefined()
      expect(item.notes).toBe('Excellent program')
    })

    it('should accept collection item without notes', () => {
      const item: CollectionItem = {
        id: 'item-3',
        collection_id: 'coll-1',
        school_id: 'school-789',
        created_at: '2024-01-01T00:00:00Z'
      }

      expect(item.notes).toBeUndefined()
      expect(item.school_id).toBe('school-789')
    })
  })

  describe('CollectionWithItems interface', () => {
    it('should extend Collection with items array', () => {
      const collectionWithItems: CollectionWithItems = {
        id: 'coll-1',
        user_id: 'user-123',
        name: 'My Collection',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        items: [
          {
            id: 'item-1',
            collection_id: 'coll-1',
            school_id: 'school-123',
            created_at: '2024-01-01T00:00:00Z',
            school: {
              id: 'school-123',
              name: 'MIT',
              initial: 'MIT',
              location: 'Cambridge',
              country: 'USA'
            }
          }
        ]
      }

      expect(collectionWithItems.name).toBe('My Collection')
      expect(collectionWithItems.items).toHaveLength(1)
      expect(collectionWithItems.items[0].school?.name).toBe('MIT')
    })
  })

  describe('CollectionItemWithDetails interface', () => {
    it('should include school details when school_id is present', () => {
      const itemWithDetails: CollectionItemWithDetails = {
        id: 'item-1',
        collection_id: 'coll-1',
        school_id: 'school-123',
        notes: 'Amazing school',
        created_at: '2024-01-01T00:00:00Z',
        school: {
          id: 'school-123',
          name: 'Stanford University',
          initial: 'SU',
          location: 'Stanford',
          country: 'USA'
        }
      }

      expect(itemWithDetails.school?.name).toBe('Stanford University')
      expect(itemWithDetails.school?.initial).toBe('SU')
      expect(itemWithDetails.program).toBeUndefined()
    })

    it('should include program details when program_id is present', () => {
      const itemWithDetails: CollectionItemWithDetails = {
        id: 'item-2',
        collection_id: 'coll-1',
        program_id: 'program-456',
        notes: 'Great program',
        created_at: '2024-01-01T00:00:00Z',
        program: {
          id: 'program-456',
          name: 'Computer Science',
          initial: 'CS',
          degree: 'Master of Science',
          school: {
            name: 'Harvard University',
            initial: 'HU'
          }
        }
      }

      expect(itemWithDetails.program?.name).toBe('Computer Science')
      expect(itemWithDetails.program?.degree).toBe('Master of Science')
      expect(itemWithDetails.program?.school.name).toBe('Harvard University')
      expect(itemWithDetails.school).toBeUndefined()
    })
  })

  describe('CollectionFormData interface', () => {
    it('should accept valid form data', () => {
      const formData: CollectionFormData = {
        name: 'New Collection',
        description: 'Collection description'
      }

      expect(formData.name).toBe('New Collection')
      expect(formData.description).toBe('Collection description')
    })

    it('should accept form data without description', () => {
      const formData: CollectionFormData = {
        name: 'Simple Collection'
      }

      expect(formData.name).toBe('Simple Collection')
      expect(formData.description).toBeUndefined()
    })
  })

  describe('CollectionItemFormData interface', () => {
    it('should accept form data with school_id', () => {
      const formData: CollectionItemFormData = {
        school_id: 'school-123',
        notes: 'My notes'
      }

      expect(formData.school_id).toBe('school-123')
      expect(formData.program_id).toBeUndefined()
      expect(formData.notes).toBe('My notes')
    })

    it('should accept form data with program_id', () => {
      const formData: CollectionItemFormData = {
        program_id: 'program-456',
        notes: 'Program notes'
      }

      expect(formData.program_id).toBe('program-456')
      expect(formData.school_id).toBeUndefined()
      expect(formData.notes).toBe('Program notes')
    })

    it('should accept form data without notes', () => {
      const formData: CollectionItemFormData = {
        school_id: 'school-789'
      }

      expect(formData.school_id).toBe('school-789')
      expect(formData.notes).toBeUndefined()
    })
  })

  describe('CollectionsResponse interface', () => {
    it('should structure collections response correctly', () => {
      const response: CollectionsResponse = {
        collections: [
          {
            id: 'coll-1',
            user_id: 'user-123',
            name: 'Collection 1',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          },
          {
            id: 'coll-2',
            user_id: 'user-123',
            name: 'Collection 2',
            created_at: '2024-01-02T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z'
          }
        ],
        total: 2
      }

      expect(response.collections).toHaveLength(2)
      expect(response.total).toBe(2)
      expect(response.collections[0].name).toBe('Collection 1')
      expect(response.collections[1].name).toBe('Collection 2')
    })
  })

  describe('CollectionResponse interface', () => {
    it('should structure single collection response correctly', () => {
      const response: CollectionResponse = {
        collection: {
          id: 'coll-1',
          user_id: 'user-123',
          name: 'My Collection',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          items: []
        }
      }

      expect(response.collection.name).toBe('My Collection')
      expect(response.collection.items).toEqual([])
    })
  })

  describe('CollectionItemsResponse interface', () => {
    it('should structure items response correctly', () => {
      const response: CollectionItemsResponse = {
        items: [
          {
            id: 'item-1',
            collection_id: 'coll-1',
            school_id: 'school-123',
            created_at: '2024-01-01T00:00:00Z',
            school: {
              id: 'school-123',
              name: 'MIT'
            }
          }
        ],
        total: 1
      }

      expect(response.items).toHaveLength(1)
      expect(response.total).toBe(1)
      expect(response.items[0].school?.name).toBe('MIT')
    })
  })

  describe('CollectionValidationError interface', () => {
    it('should structure validation error correctly', () => {
      const error: CollectionValidationError = {
        field: 'name',
        message: 'Collection name is required'
      }

      expect(error.field).toBe('name')
      expect(error.message).toBe('Collection name is required')
    })
  })

  describe('CollectionValidationResult interface', () => {
    it('should structure validation result with errors', () => {
      const result: CollectionValidationResult = {
        valid: false,
        errors: [
          {
            field: 'name',
            message: 'Collection name is required'
          },
          {
            field: 'description',
            message: 'Description too long'
          }
        ]
      }

      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(2)
      expect(result.errors[0].field).toBe('name')
      expect(result.errors[1].field).toBe('description')
    })

    it('should structure validation result without errors', () => {
      const result: CollectionValidationResult = {
        valid: true,
        errors: []
      }

      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })
  })

  describe('Type compatibility', () => {
    it('should allow Collection to be assigned to CollectionWithItems when items is empty', () => {
      const collection: Collection = {
        id: 'coll-1',
        user_id: 'user-123',
        name: 'Test Collection',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const collectionWithItems: CollectionWithItems = {
        ...collection,
        items: []
      }

      expect(collectionWithItems.name).toBe('Test Collection')
      expect(collectionWithItems.items).toEqual([])
    })

    it('should allow CollectionItem to be assigned to CollectionItemWithDetails', () => {
      const item: CollectionItem = {
        id: 'item-1',
        collection_id: 'coll-1',
        school_id: 'school-123',
        created_at: '2024-01-01T00:00:00Z'
      }

      const itemWithDetails: CollectionItemWithDetails = {
        ...item,
        school: {
          id: 'school-123',
          name: 'Test School'
        }
      }

      expect(itemWithDetails.id).toBe('item-1')
      expect(itemWithDetails.school?.name).toBe('Test School')
    })
  })

  describe('Type safety checks', () => {
    it('should enforce required fields in Collection', () => {
      // This test ensures TypeScript compilation would fail if required fields are missing
      const collection: Collection = {
        id: 'test',
        user_id: 'user-123',
        name: 'Test',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      // All required fields should be present
      expect(collection).toHaveProperty('id')
      expect(collection).toHaveProperty('user_id')
      expect(collection).toHaveProperty('name')
      expect(collection).toHaveProperty('created_at')
      expect(collection).toHaveProperty('updated_at')
    })

    it('should enforce required fields in CollectionItem', () => {
      const item: CollectionItem = {
        id: 'item-1',
        collection_id: 'coll-1',
        created_at: '2024-01-01T00:00:00Z'
      }

      // Required fields should be present
      expect(item).toHaveProperty('id')
      expect(item).toHaveProperty('collection_id')
      expect(item).toHaveProperty('created_at')
    })
  })
})
