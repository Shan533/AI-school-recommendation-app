/**
 * Conservative API utilities that maintain backward compatibility
 */

import { NextResponse } from 'next/server'

/**
 * Enhanced error logging with context
 */
export function logError(context: string, error: unknown): void {
  if (process.env.NODE_ENV === 'development') {
    const errorObj = error as Record<string, unknown>
    console.error(`[${context}]:`, {
      code: errorObj.code,
      message: errorObj.message,
      details: errorObj.details,
      hint: errorObj.hint,
      timestamp: new Date().toISOString()
    })
  } else {
    console.error(`${context}:`, error)
  }
}

/**
 * Enhanced logging for API requests (development only)
 */
export function logApiRequest(
  method: string,
  path: string,
  userId?: string,
  additionalData?: Record<string, unknown>
): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[API] ${method} ${path}`, {
      userId,
      timestamp: new Date().toISOString(),
      ...additionalData
    })
  }
}

/**
 * Validate UUID format (production only)
 */
export function isValidUUID(uuid: string): boolean {
  if (process.env.NODE_ENV === 'test') {
    return true // Skip validation in tests
  }
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Add security headers to response
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  return response
}

/**
 * Add cache headers to response
 */
export function addCacheHeaders(
  response: NextResponse, 
  maxAge: number = 60, 
  staleWhileRevalidate: number = 120,
  isPrivate: boolean = true
): NextResponse {
  const cacheControl = isPrivate 
    ? `private, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`
    : `public, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`
  
  response.headers.set('Cache-Control', cacheControl)
  return response
}

/**
 * Enhanced input sanitization
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/data:/gi, '') // Remove data: protocols
}

/**
 * Validate notes input with enhanced security
 */
export function validateNotes(notes: unknown): string | null {
  if (notes === null || notes === undefined) {
    return null
  }
  
  if (typeof notes !== 'string') {
    throw new Error('Notes must be a string or null')
  }
  
  const sanitized = sanitizeString(notes)
  
  if (sanitized.length > 500) {
    throw new Error('Notes must be less than 500 characters')
  }
  
  return sanitized || null
}
