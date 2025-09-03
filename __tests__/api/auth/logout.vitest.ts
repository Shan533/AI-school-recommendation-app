/**
 * Integration tests for Auth Logout API
 * Priority: HIGH - Quick win, simple API route
 * 
 * Test Coverage Areas:
 * - POST /api/auth/logout - user logout
 */

import { vi, describe, it, expect, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock dependencies
vi.mock('@/lib/auth-actions', () => ({
  logoutAction: vi.fn()
}))

// Import functions after mocking
import { POST } from '@/app/api/auth/logout/route'
import { logoutAction } from '@/lib/auth-actions'

// Create typed mocks
const mockLogoutAction = vi.mocked(logoutAction)

describe('Auth Logout API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/auth/logout', () => {
    const createRequest = (): NextRequest => {
      return new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
    }

    it('should call logoutAction successfully', async () => {
      // Mock logoutAction to throw NEXT_REDIRECT (simulating redirect)
      mockLogoutAction.mockRejectedValue(new Error('NEXT_REDIRECT'))

      const request = createRequest()

      // Should propagate the redirect error from logoutAction
      await expect(POST(request)).rejects.toThrow('NEXT_REDIRECT')
      expect(mockLogoutAction).toHaveBeenCalledTimes(1)
      expect(mockLogoutAction).toHaveBeenCalledWith()
    })

    it('should handle logoutAction errors gracefully', async () => {
      // Mock logoutAction to throw an error
      const errorMessage = 'Logout failed'
      mockLogoutAction.mockRejectedValue(new Error(errorMessage))

      const request = createRequest()

      // Should throw the error from logoutAction
      await expect(POST(request)).rejects.toThrow(errorMessage)
      expect(mockLogoutAction).toHaveBeenCalledTimes(1)
    })

    it('should handle logoutAction redirects properly', async () => {
      // Mock logoutAction to throw NEXT_REDIRECT (simulating redirect)
      mockLogoutAction.mockRejectedValue(new Error('NEXT_REDIRECT'))

      const request = createRequest()

      // Should propagate the redirect error
      await expect(POST(request)).rejects.toThrow('NEXT_REDIRECT')
      expect(mockLogoutAction).toHaveBeenCalledTimes(1)
    })
  })
})
