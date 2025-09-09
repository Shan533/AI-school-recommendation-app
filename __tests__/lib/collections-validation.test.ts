import { describe, it, expect } from 'vitest'
import { validateCollectionData, validateCollectionItemData } from '@/lib/validation'

describe('Collections Validation', () => {
  describe('validateCollectionData', () => {
    it('should pass validation for valid collection data', () => {
      const validData = {
        name: 'My Collection',
        description: 'A valid collection description'
      }
      
      const errors = validateCollectionData(validData)
      expect(errors).toEqual([])
    })

    it('should fail validation when name is missing', () => {
      const invalidData = {}
      
      const errors = validateCollectionData(invalidData)
      expect(errors).toContain('Collection name is required')
    })

    it('should fail validation when name is empty', () => {
      const invalidData = { name: '' }
      
      const errors = validateCollectionData(invalidData)
      expect(errors).toContain('Collection name is required')
    })

    it('should fail validation when name is only whitespace', () => {
      const invalidData = { name: '   ' }
      
      const errors = validateCollectionData(invalidData)
      expect(errors).toContain('Collection name is required')
    })

    it('should fail validation when name is too long', () => {
      const invalidData = { name: 'a'.repeat(101) }
      
      const errors = validateCollectionData(invalidData)
      expect(errors).toContain('Collection name must be less than 100 characters')
    })

    it('should fail validation when description is too long', () => {
      const invalidData = {
        name: 'Valid name',
        description: 'a'.repeat(501)
      }
      
      const errors = validateCollectionData(invalidData)
      expect(errors).toContain('Collection description must be less than 500 characters')
    })

    it('should pass validation with valid name and no description', () => {
      const validData = { name: 'Valid Collection' }
      
      const errors = validateCollectionData(validData)
      expect(errors).toEqual([])
    })
  })

  describe('validateCollectionItemData', () => {
    it('should pass validation for valid school item', () => {
      const validData = {
        school_id: 'valid-school-id'
      }
      
      const errors = validateCollectionItemData(validData)
      expect(errors).toEqual([])
    })

    it('should pass validation for valid program item', () => {
      const validData = {
        program_id: 'valid-program-id'
      }
      
      const errors = validateCollectionItemData(validData)
      expect(errors).toEqual([])
    })

    it('should fail validation when neither school_id nor program_id is provided', () => {
      const invalidData = {}
      
      const errors = validateCollectionItemData(invalidData)
      expect(errors).toContain('Either school_id or program_id is required')
    })

    it('should fail validation when both school_id and program_id are provided', () => {
      const invalidData = {
        school_id: 'school-id',
        program_id: 'program-id'
      }
      
      const errors = validateCollectionItemData(invalidData)
      expect(errors).toContain('Cannot specify both school_id and program_id')
    })

    it('should fail validation when notes are too long', () => {
      const invalidData = {
        school_id: 'valid-school-id',
        notes: 'a'.repeat(501)
      }
      
      const errors = validateCollectionItemData(invalidData)
      expect(errors).toContain('Notes must be less than 500 characters')
    })

    it('should pass validation with valid item and notes', () => {
      const validData = {
        program_id: 'valid-program-id',
        notes: 'These are valid notes'
      }
      
      const errors = validateCollectionItemData(validData)
      expect(errors).toEqual([])
    })

    it('should handle empty notes', () => {
      const data = {
        school_id: 'test-school-id',
        notes: ''
      }
      const errors = validateCollectionItemData(data)
      expect(errors).toEqual([])
    })

    it('should handle null notes', () => {
      const data = {
        school_id: 'test-school-id',
        notes: null
      }
      const errors = validateCollectionItemData(data)
      expect(errors).toEqual([])
    })

    it('should handle undefined notes', () => {
      const data = {
        school_id: 'test-school-id',
        notes: undefined
      }
      const errors = validateCollectionItemData(data)
      expect(errors).toEqual([])
    })

    it('should handle non-string notes', () => {
      const data = {
        school_id: 'test-school-id',
        notes: 123 as any
      }
      const errors = validateCollectionItemData(data)
      expect(errors).toEqual([])
    })
  })
})
