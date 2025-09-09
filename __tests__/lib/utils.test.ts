import { describe, it, expect } from 'vitest'
import { cn, getErrorMessage } from '@/lib/utils'

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
})
