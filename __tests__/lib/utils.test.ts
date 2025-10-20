import { describe, it, expect, vi } from 'vitest'
import { cn, getErrorMessage, formatDate } from '@/lib/utils'

describe('Utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('px-2 py-1', 'px-3')).toBe('py-1 px-3')
    })

    it('should handle conditional classes', () => {
      expect(cn('base-class', true && 'conditional-class')).toBe('base-class conditional-class')
      expect(cn('base-class', false && 'conditional-class')).toBe('base-class')
    })

    it('should handle arrays of classes', () => {
      expect(cn(['class1', 'class2'], 'class3')).toBe('class1 class2 class3')
    })

    it('should handle objects with boolean values', () => {
      expect(cn({ 'active': true, 'disabled': false })).toBe('active')
      expect(cn({ 'active': false, 'disabled': true })).toBe('disabled')
    })

    it('should handle mixed inputs', () => {
      expect(cn('base', ['array1', 'array2'], { 'object': true }, 'string')).toBe('base array1 array2 object string')
    })

    it('should handle empty inputs', () => {
      expect(cn()).toBe('')
      expect(cn('')).toBe('')
      expect(cn(null, undefined, false)).toBe('')
    })

    it('should handle Tailwind conflicts correctly', () => {
      expect(cn('px-2', 'px-4')).toBe('px-4')
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
      expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500')
    })
  })

  describe('getErrorMessage', () => {
    it('should return message from Error instance', () => {
      const error = new Error('Test error message')
      expect(getErrorMessage(error)).toBe('Test error message')
    })

    it('should return string as-is', () => {
      expect(getErrorMessage('Simple string error')).toBe('Simple string error')
    })

    it('should stringify plain objects', () => {
      const obj = { code: 500, message: 'Server error' }
      expect(getErrorMessage(obj)).toBe('{"code":500,"message":"Server error"}')
    })

    it('should stringify arrays', () => {
      const arr = ['error1', 'error2']
      expect(getErrorMessage(arr)).toBe('["error1","error2"]')
    })

    it('should handle null', () => {
      expect(getErrorMessage(null)).toBe('null')
    })

    it('should handle undefined', () => {
      // JSON.stringify(undefined) returns undefined, not a string
      expect(getErrorMessage(undefined)).toBe(undefined)
    })

    it('should handle numbers', () => {
      expect(getErrorMessage(404)).toBe('404')
      expect(getErrorMessage(3.14)).toBe('3.14')
    })

    it('should handle booleans', () => {
      expect(getErrorMessage(true)).toBe('true')
      expect(getErrorMessage(false)).toBe('false')
    })

    it('should return "Unknown error" for circular references', () => {
      const circular: any = {}
      circular.self = circular
      
      expect(getErrorMessage(circular)).toBe('Unknown error')
    })

    it('should handle functions', () => {
      const func = () => 'test'
      // JSON.stringify(function) returns undefined, not a string
      expect(getErrorMessage(func)).toBe(undefined)
    })

    it('should handle complex nested objects', () => {
      const complex = {
        error: {
          code: 500,
          details: {
            field: 'email',
            message: 'Invalid format'
          }
        }
      }
      expect(getErrorMessage(complex)).toBe('{"error":{"code":500,"details":{"field":"email","message":"Invalid format"}}}')
    })

    it('should handle objects with undefined values', () => {
      const obj = { message: 'Error', details: undefined }
      expect(getErrorMessage(obj)).toBe('{"message":"Error"}')
    })

    it('should handle objects with null values', () => {
      const obj = { message: 'Error', details: null }
      expect(getErrorMessage(obj)).toBe('{"message":"Error","details":null}')
    })
  })

  describe('formatDate', () => {
    // Mock console.warn to avoid test output noise
    const originalWarn = console.warn
    beforeEach(() => {
      console.warn = vi.fn()
    })
    afterEach(() => {
      console.warn = originalWarn
    })

    it('should format valid ISO date strings', () => {
      const isoDate = '2024-01-15T10:30:00Z'
      const result = formatDate(isoDate)
      expect(result).toMatch(/Jan 15, 2024, \d{2}:\d{2} (AM|PM)/)
    })

    it('should format valid date strings with timezone', () => {
      const dateWithTz = '2024-01-15T10:30:00-05:00'
      const result = formatDate(dateWithTz)
      expect(result).toMatch(/Jan 15, 2024, \d{2}:\d{2} (AM|PM)/)
    })

    it('should format valid date strings without time', () => {
      const dateOnly = '2024-01-15'
      const result = formatDate(dateOnly)
      // Account for timezone differences - the date might be Jan 14 or 15 depending on timezone
      expect(result).toMatch(/Jan (14|15), 2024, \d{2}:\d{2} (AM|PM)/)
    })

    it('should return "-" for null input', () => {
      expect(formatDate(null)).toBe('-')
    })

    it('should return "-" for undefined input', () => {
      expect(formatDate(undefined)).toBe('-')
    })

    it('should return "-" for empty string', () => {
      expect(formatDate('')).toBe('-')
    })

    it('should return "-" for invalid date strings', () => {
      expect(formatDate('invalid-date')).toBe('-')
      expect(formatDate('not-a-date')).toBe('-')
      expect(formatDate('2024-13-45')).toBe('-') // Invalid month/day
    })

    it('should return "-" for non-string inputs', () => {
      expect(formatDate(1234567890 as any)).toBe('-') // Unix timestamp as number
      expect(formatDate({} as any)).toBe('-') // Object
      expect(formatDate(true as any)).toBe('-') // Boolean
    })

    it('should handle edge case dates', () => {
      // Test with a very old date - account for timezone differences
      const oldDate = '1900-01-01T00:00:00Z'
      const result = formatDate(oldDate)
      expect(result).toMatch(/Dec 31, 1899|Jan 1, 1900, \d{2}:\d{2} (AM|PM)/)
    })

    it('should handle future dates', () => {
      const futureDate = '2030-12-31T23:59:59Z'
      const result = formatDate(futureDate)
      expect(result).toMatch(/Dec 31, 2030, \d{2}:\d{2} (AM|PM)/)
    })

    it('should log warning for invalid dates', () => {
      formatDate('invalid-date')
      expect(console.warn).toHaveBeenCalledWith('Failed to format date: invalid date string', 'invalid-date')
    })

    it('should handle malformed JSON date strings', () => {
      expect(formatDate('{"date": "2024-01-15"}')).toBe('-')
    })

    it('should handle whitespace-only strings', () => {
      expect(formatDate('   ')).toBe('-')
      expect(formatDate('\t\n')).toBe('-')
    })

    it('should handle special characters in date strings', () => {
      expect(formatDate('2024-01-15T10:30:00Z@#$')).toBe('-')
    })
  })
})
