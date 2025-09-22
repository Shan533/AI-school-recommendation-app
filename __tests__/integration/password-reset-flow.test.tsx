/**
 * Integration test for the complete password reset flow
 * Tests the interaction between forgot password form and reset password page
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { vi } from 'vitest'

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}))

// Mock auth actions
vi.mock('@/lib/auth-actions', () => ({
  resetPasswordAction: vi.fn(),
}))

// Mock Supabase client
const mockSupabase = {
  auth: {
    exchangeCodeForSession: vi.fn(),
    verifyOtp: vi.fn(),
    getSession: vi.fn(),
    updateUser: vi.fn(),
    signOut: vi.fn(),
  },
}

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}))

// Import components after mocking
import ForgotPasswordForm from '@/components/auth/forgot-password-form'
import ResetPasswordClient from '@/app/auth/reset-password/ResetPasswordClient'
import { resetPasswordAction } from '@/lib/auth-actions'

const mockResetPasswordAction = vi.mocked(resetPasswordAction)

describe('Password Reset Flow Integration', () => {
  const mockPush = vi.fn()
  const mockSearchParams = {
    get: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as any)
    vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as any)
    
    // Mock successful session for reset page
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'test-user' } } },
    })
    
    // Mock verifyOtp for token verification
    mockSupabase.auth.verifyOtp.mockResolvedValue({ error: null })
  })

  describe('Step 1: Request Password Reset', () => {
    it('should successfully request password reset', async () => {
      // Mock successful reset request
      mockResetPasswordAction.mockResolvedValue({ 
        success: true,
        error: 'Password reset link sent! Check your email.'
      })

      render(<ForgotPasswordForm />)

      // Fill in email
      const emailInput = screen.getByLabelText('Email')
      fireEvent.change(emailInput, { target: { value: 'user@example.com' } })

      // Submit form
      const submitButton = screen.getByRole('button', { name: 'Send Reset Link' })
      fireEvent.click(submitButton)

      // Verify success message
      await waitFor(() => {
        expect(screen.getByText('Password reset link sent! Check your email.')).toBeInTheDocument()
      })

      // Verify action was called with correct email
      expect(mockResetPasswordAction).toHaveBeenCalledWith(expect.any(FormData))
    })

  })

  describe('Step 2: Reset Password with Link', () => {
    it('should successfully reset password with valid link', async () => {
      // Mock successful password update
      mockSupabase.auth.updateUser.mockResolvedValue({ error: null })
      mockSupabase.auth.signOut.mockResolvedValue({ error: null })
      
      // Mock token parameters from email link
      mockSearchParams.get
        .mockReturnValueOnce('valid-reset-token') // token_hash
        .mockReturnValueOnce('recovery') // type

      render(<ResetPasswordClient />)

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByText('Set New Password')).toBeInTheDocument()
      })

      // Fill in new passwords
      const passwordInput = screen.getByLabelText('New Password')
      const confirmPasswordInput = screen.getByLabelText('Confirm Password')
      
      fireEvent.change(passwordInput, { target: { value: 'NewPassword123!' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'NewPassword123!' } })

      // Submit form
      const submitButton = screen.getByRole('button', { name: 'Update Password' })
      fireEvent.click(submitButton)

      // Verify success flow
      await waitFor(() => {
        expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({ 
          password: 'NewPassword123!' 
        })
      })

      await waitFor(() => {
        expect(screen.getByText('Password updated! Redirecting to sign in…')).toBeInTheDocument()
      })

      // Verify user is signed out
      await waitFor(() => {
        expect(mockSupabase.auth.signOut).toHaveBeenCalled()
      })
    })

    it('should handle expired or invalid reset link', async () => {
      // Mock no session (expired/invalid link)
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
      })

      render(<ResetPasswordClient />)

      // Verify error message for invalid link
      await waitFor(() => {
        expect(screen.getByText('Reset link is invalid or expired. Please request a new one.')).toBeInTheDocument()
      })
    })

    it('should validate password requirements during reset', async () => {
      // Mock code parameter
      mockSearchParams.get.mockReturnValue('valid-reset-code')

      render(<ResetPasswordClient />)

      await waitFor(() => {
        expect(screen.getByText('Set New Password')).toBeInTheDocument()
      })

      const passwordInput = screen.getByLabelText('New Password')
      const confirmPasswordInput = screen.getByLabelText('Confirm Password')
      const submitButton = screen.getByRole('button', { name: 'Update Password' })

      // Test short password
      fireEvent.change(passwordInput, { target: { value: '123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: '123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Password must meet all requirements: at least 8 characters, uppercase, lowercase, number, and special character')).toBeInTheDocument()
      })

      // Test mismatched passwords
      fireEvent.change(passwordInput, { target: { value: 'ValidPassword123!' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPassword123!' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
      })

      // Verify updateUser was not called for invalid inputs
      expect(mockSupabase.auth.updateUser).not.toHaveBeenCalled()
    })
  })

  describe('Complete Flow Simulation', () => {
    it('should simulate complete password reset user journey', async () => {
      // Step 1: User requests password reset
      mockResetPasswordAction.mockResolvedValue({ 
        success: true,
        error: 'Password reset link sent! Check your email.'
      })

      const { unmount: unmountForgotForm } = render(<ForgotPasswordForm />)

      const emailInput = screen.getByLabelText('Email')
      fireEvent.change(emailInput, { target: { value: 'user@example.com' } })
      fireEvent.click(screen.getByRole('button', { name: 'Send Reset Link' }))

      await waitFor(() => {
        expect(screen.getByText('Password reset link sent! Check your email.')).toBeInTheDocument()
      })

      // Cleanup first component
      unmountForgotForm()

      // Step 2: User clicks email link and lands on reset page
      mockSupabase.auth.updateUser.mockResolvedValue({ error: null })
      mockSupabase.auth.signOut.mockResolvedValue({ error: null })
      mockSearchParams.get
        .mockReturnValueOnce('email-link-code') // token_hash
        .mockReturnValueOnce('recovery') // type

      render(<ResetPasswordClient />)

      await waitFor(() => {
        expect(screen.getByText('Set New Password')).toBeInTheDocument()
      })

      // Step 3: User enters new password
      const passwordInput = screen.getByLabelText('New Password')
      const confirmPasswordInput = screen.getByLabelText('Confirm Password')
      
      fireEvent.change(passwordInput, { target: { value: 'NewSecurePassword123!' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'NewSecurePassword123!' } })
      fireEvent.click(screen.getByRole('button', { name: 'Update Password' }))

      // Step 4: Verify complete flow
      await waitFor(() => {
        expect(mockSupabase.auth.verifyOtp).toHaveBeenCalledWith({
          token_hash: 'email-link-code',
          type: 'recovery'
        })
      })

      await waitFor(() => {
        expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({ 
          password: 'NewSecurePassword123!' 
        })
      })

      await waitFor(() => {
        expect(screen.getByText('Password updated! Redirecting to sign in…')).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(mockSupabase.auth.signOut).toHaveBeenCalled()
      })
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle network errors gracefully', async () => {
      // Mock network error during reset request
      mockResetPasswordAction.mockRejectedValue(new Error('Network error'))

      render(<ForgotPasswordForm />)

      const emailInput = screen.getByLabelText('Email')
      fireEvent.change(emailInput, { target: { value: 'user@example.com' } })
      fireEvent.click(screen.getByRole('button', { name: 'Send Reset Link' }))

      await waitFor(() => {
        expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument()
      })
    })

    it('should handle password update failures', async () => {
      mockSearchParams.get.mockReturnValue('valid-code')
      mockSupabase.auth.updateUser.mockResolvedValue({ 
        error: { message: 'Password update failed' } 
      })

      render(<ResetPasswordClient />)

      await waitFor(() => {
        expect(screen.getByText('Set New Password')).toBeInTheDocument()
      })

      const passwordInput = screen.getByLabelText('New Password')
      const confirmPasswordInput = screen.getByLabelText('Confirm Password')
      
      fireEvent.change(passwordInput, { target: { value: 'NewPassword123!' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'NewPassword123!' } })
      fireEvent.click(screen.getByRole('button', { name: 'Update Password' }))

      await waitFor(() => {
        expect(screen.getByText((content) => 
          content.includes('Password update failed')
        )).toBeInTheDocument()
      })
    })
  })
})
