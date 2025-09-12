/**
 * API utilities for consistent error handling and response formatting
 */

import { NextResponse } from 'next/server'

/**
 * Standard API error codes
 */
export const API_ERRORS = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN', 
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
} as const

/**
 * Error response interface
 */
interface ErrorResponse {
  error: string
  code?: string
  details?: unknown
  timestamp?: string
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  message: string,
  status: number,
  code?: string,
  details?: unknown
): NextResponse<ErrorResponse> {
  const errorResponse: ErrorResponse = {
    error: message,
    timestamp: new Date().toISOString()
  }

  if (code) {
    errorResponse.code = code
  }

  if (details) {
    errorResponse.details = details
  }

  return NextResponse.json(errorResponse, { status })
}

/**
 * Handle Supabase errors with proper logging and response
 */
export function handleSupabaseError(
  error: unknown,
  context: string,
  fallbackMessage: string = 'Database operation failed'
): NextResponse {
  const errorObj = error as Record<string, unknown>
  console.error(`${context}:`, {
    code: errorObj.code,
    message: errorObj.message,
    details: errorObj.details,
    hint: errorObj.hint,
    timestamp: new Date().toISOString()
  })

  // Handle specific Supabase error codes
  switch (errorObj.code) {
    case 'PGRST116': // No rows returned
      return createErrorResponse('Resource not found', 404, API_ERRORS.NOT_FOUND)
    
    case '23505': // Unique constraint violation
      return createErrorResponse(
        'Resource already exists', 
        409, 
        API_ERRORS.VALIDATION_ERROR,
        { constraint: errorObj.details }
      )
    
    case '23503': // Foreign key constraint violation
      return createErrorResponse(
        'Referenced resource does not exist', 
        400, 
        API_ERRORS.VALIDATION_ERROR
      )
    
    case '42501': // Insufficient privilege
      return createErrorResponse('Access denied', 403, API_ERRORS.FORBIDDEN)
    
    default:
      return createErrorResponse(
        fallbackMessage, 
        500, 
        API_ERRORS.DATABASE_ERROR,
        process.env.NODE_ENV === 'development' ? errorObj.message : undefined
      )
  }
}

/**
 * Handle validation errors
 */
export function handleValidationError(
  errors: string[],
  message: string = 'Validation failed'
): NextResponse {
  return createErrorResponse(
    message,
    400,
    API_ERRORS.VALIDATION_ERROR,
    errors
  )
}

/**
 * Standard unauthorized response
 */
export function unauthorizedResponse(): NextResponse {
  return createErrorResponse(
    'Authentication required',
    401,
    API_ERRORS.UNAUTHORIZED
  )
}

/**
 * Standard forbidden response
 */
export function forbiddenResponse(message: string = 'Access denied'): NextResponse {
  return createErrorResponse(message, 403, API_ERRORS.FORBIDDEN)
}

/**
 * Log API request for debugging
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
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Sanitize and validate pagination parameters
 */
export function validatePagination(
  page?: string | null,
  limit?: string | null
): { page: number; limit: number } {
  const parsedPage = Math.max(1, parseInt(page || '1', 10) || 1)
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit || '20', 10) || 20))
  
  return { page: parsedPage, limit: parsedLimit }
}

/**
 * Create success response with consistent format and optional caching
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = 200,
  options?: {
    message?: string
    cache?: {
      maxAge?: number
      staleWhileRevalidate?: number
      private?: boolean
    }
  }
): NextResponse {
  const response = NextResponse.json({
    success: true,
    data,
    message: options?.message,
    timestamp: new Date().toISOString()
  }, { status })

  // Add cache headers if specified
  if (options?.cache) {
    const { maxAge = 0, staleWhileRevalidate = 0, private: isPrivate = true } = options.cache
    const cacheControl = isPrivate 
      ? `private, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`
      : `public, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`
    
    response.headers.set('Cache-Control', cacheControl)
  }

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  
  return response
}

/**
 * Rate limiting check (simple implementation)
 */
export function checkRateLimit(
  userId: string,
  endpoint: string,
  maxRequests: number = 100,
  windowMs: number = 60000 // 1 minute
): boolean {
  // This is a simple in-memory implementation
  // In production, you'd use Redis or similar
  if (typeof globalThis !== 'undefined') {
    const globalStore = globalThis as Record<string, unknown>
    let rateLimitStore: Map<string, number[]>
    
    if (globalStore.rateLimitStore instanceof Map) {
      rateLimitStore = globalStore.rateLimitStore as Map<string, number[]>
    } else {
      rateLimitStore = new Map<string, number[]>()
    }
    
    const key = `${userId}:${endpoint}`
    const now = Date.now()
    const windowStart = now - windowMs
    
    // Get existing requests
    const requests = rateLimitStore.get(key) || []
    
    // Filter out old requests
    const recentRequests = requests.filter((time: number) => time > windowStart)
    
    // Check if limit exceeded
    if (recentRequests.length >= maxRequests) {
      return false
    }
    
    // Add current request
    recentRequests.push(now)
    rateLimitStore.set(key, recentRequests)
    
    // Store the rate limit store globally
    globalStore.rateLimitStore = rateLimitStore
    
    return true
  }
  
  return true // Allow if we can't check
}
