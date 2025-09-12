import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'
import {
  logError,
  logApiRequest,
  isValidUUID,
  addSecurityHeaders,
  addCacheHeaders,
  sanitizeString,
  validateNotes
} from '@/lib/api-utils-conservative'

describe('api-utils-conservative', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock console methods
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  describe('logError', () => {
    it('should log error in development mode with detailed context', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const error = {
        code: 'TEST_ERROR',
        message: 'Test error message',
        details: 'Test details',
        hint: 'Test hint'
      }

      logError('Test context', error)

      expect(console.error).toHaveBeenCalledWith(
        '[Test context]:',
        expect.objectContaining({
          code: 'TEST_ERROR',
          message: 'Test error message',
          details: 'Test details',
          hint: 'Test hint',
          timestamp: expect.any(String)
        })
      )

      process.env.NODE_ENV = originalEnv
    })

    it('should log simple error in production mode', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const error = { message: 'Test error' }
      logError('Test context', error)

      expect(console.error).toHaveBeenCalledWith('Test context:', error)

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('logApiRequest', () => {
    it('should log API request in development mode', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      logApiRequest('GET', '/api/test', 'user123', { additional: 'data' })

      expect(console.log).toHaveBeenCalledWith(
        '[API] GET /api/test',
        expect.objectContaining({
          userId: 'user123',
          timestamp: expect.any(String),
          additional: 'data'
        })
      )

      process.env.NODE_ENV = originalEnv
    })

    it('should not log in production mode', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      logApiRequest('GET', '/api/test', 'user123')

      expect(console.log).not.toHaveBeenCalled()

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('isValidUUID', () => {
    it('should return true in test environment', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'test'

      expect(isValidUUID('invalid-uuid')).toBe(true)
      expect(isValidUUID('')).toBe(true)

      process.env.NODE_ENV = originalEnv
    })

    it('should validate UUID format in production', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      // Valid UUIDs
      expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true)
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
      expect(isValidUUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(true)

      // Invalid UUIDs
      expect(isValidUUID('invalid-uuid')).toBe(false)
      expect(isValidUUID('123e4567-e89b-12d3-a456')).toBe(false)
      expect(isValidUUID('')).toBe(false)
      expect(isValidUUID('123e4567-e89b-12d3-a456-42661417400g')).toBe(false)

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('addSecurityHeaders', () => {
    it('should add security headers to response', () => {
      const response = NextResponse.json({ message: 'test' })
      const result = addSecurityHeaders(response)

      expect(result.headers.get('X-Content-Type-Options')).toBe('nosniff')
      expect(result.headers.get('X-Frame-Options')).toBe('DENY')
    })

    it('should return the same response instance', () => {
      const response = NextResponse.json({ message: 'test' })
      const result = addSecurityHeaders(response)

      expect(result).toBe(response)
    })
  })

  describe('addCacheHeaders', () => {
    it('should add private cache headers with default values', () => {
      const response = NextResponse.json({ message: 'test' })
      const result = addCacheHeaders(response)

      expect(result.headers.get('Cache-Control')).toBe(
        'private, max-age=60, stale-while-revalidate=120'
      )
    })

    it('should add public cache headers with custom values', () => {
      const response = NextResponse.json({ message: 'test' })
      const result = addCacheHeaders(response, 300, 600, false)

      expect(result.headers.get('Cache-Control')).toBe(
        'public, max-age=300, stale-while-revalidate=600'
      )
    })

    it('should return the same response instance', () => {
      const response = NextResponse.json({ message: 'test' })
      const result = addCacheHeaders(response)

      expect(result).toBe(response)
    })
  })

  describe('sanitizeString', () => {
    it('should remove script tags', () => {
      const input = 'Hello <script>alert("xss")</script> World'
      const result = sanitizeString(input)
      expect(result).toBe('Hello  World')
    })

    it('should remove javascript: protocols', () => {
      const input = 'Click javascript:alert("xss") here'
      const result = sanitizeString(input)
      expect(result).toBe('Click alert("xss") here')
    })

    it('should remove data: protocols', () => {
      const input = 'Image data:text/html,<script>alert("xss")</script>'
      const result = sanitizeString(input)
      expect(result).toBe('Image text/html,')
    })

    it('should trim whitespace', () => {
      const input = '  Hello World  '
      const result = sanitizeString(input)
      expect(result).toBe('Hello World')
    })

    it('should handle multiple malicious patterns', () => {
      const input = 'Text <script>alert("xss")</script> javascript:alert("xss") data:text/html,<script>alert("xss")</script>'
      const result = sanitizeString(input)
      expect(result).toBe('Text  alert("xss") text/html,')
    })
  })

  describe('validateNotes', () => {
    it('should return null for null input', () => {
      expect(validateNotes(null)).toBe(null)
    })

    it('should return null for undefined input', () => {
      expect(validateNotes(undefined)).toBe(null)
    })

    it('should throw error for non-string input', () => {
      expect(() => validateNotes(123)).toThrow('Notes must be a string or null')
      expect(() => validateNotes({})).toThrow('Notes must be a string or null')
      expect(() => validateNotes([])).toThrow('Notes must be a string or null')
    })

    it('should sanitize and return valid string', () => {
      const input = '  Valid notes <script>alert("xss")</script>  '
      const result = validateNotes(input)
      expect(result).toBe('Valid notes ')
    })

    it('should throw error for string longer than 500 characters', () => {
      const longString = 'a'.repeat(501)
      expect(() => validateNotes(longString)).toThrow('Notes must be less than 500 characters')
    })

    it('should return null for empty string after sanitization', () => {
      const input = '   <script>alert("xss")</script>   '
      const result = validateNotes(input)
      expect(result).toBe(null)
    })

    it('should handle exactly 500 characters', () => {
      const validString = 'a'.repeat(500)
      const result = validateNotes(validString)
      expect(result).toBe(validString)
    })
  })
})
