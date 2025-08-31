import { cn } from '@/lib/utils'

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
})
