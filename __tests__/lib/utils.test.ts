import { cn, getErrorMessage } from '@/lib/utils'

describe('Utils', () => {
  describe('cn function', () => {
    test('should merge class names correctly', () => {
      const result = cn('class1', 'class2')
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })

    test('should handle conditional classes', () => {
      const result = cn('base', true && 'conditional', false && 'hidden')
      expect(typeof result).toBe('string')
    })

    test('should handle empty input', () => {
      const result = cn()
      expect(typeof result).toBe('string')
    })

    test('should handle undefined and null values', () => {
      const result = cn('base', undefined, null, 'end')
      expect(typeof result).toBe('string')
    })
  })

  describe('getErrorMessage function', () => {
    test('should return error message for Error instances', () => {
      const error = new Error('Test error message')
      const result = getErrorMessage(error)
      expect(result).toBe('Test error message')
    })

    test('should return string for string errors', () => {
      const error = 'String error message'
      const result = getErrorMessage(error)
      expect(result).toBe('String error message')
    })

    test('should return JSON string for object errors', () => {
      const error = { message: 'Object error', code: 500 }
      const result = getErrorMessage(error)
      expect(result).toBe('{"message":"Object error","code":500}')
    })

    test('should return "Unknown error" for circular reference objects', () => {
      const error: any = { message: 'Circular error' }
      error.self = error // Create circular reference
      const result = getErrorMessage(error)
      expect(result).toBe('Unknown error')
    })

    test('should return JSON string for null/undefined', () => {
      expect(getErrorMessage(null)).toBe('null')
      expect(getErrorMessage(undefined)).toBe(undefined)
    })
  })
})
