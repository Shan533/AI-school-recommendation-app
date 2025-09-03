import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock the auth action first
vi.mock('@/lib/auth-actions', () => ({
  resetPasswordAction: vi.fn(),
}))

// Import after mocking
import ForgotPasswordForm from '@/components/auth/forgot-password-form'
import { resetPasswordAction } from '@/lib/auth-actions'

const mockResetPasswordAction = vi.mocked(resetPasswordAction)

describe('ForgotPasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders forgot password form correctly', () => {
    render(<ForgotPasswordForm />)
    
    expect(screen.getByText('Reset Password')).toBeInTheDocument()
    expect(screen.getByText('Enter your email address and we\'ll send you a link to reset your password.')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send Reset Link' })).toBeInTheDocument()
  })

  it('shows success message after successful submission', async () => {
    mockResetPasswordAction.mockResolvedValue({ success: true })
    
    render(<ForgotPasswordForm />)
    
    const emailInput = screen.getByLabelText('Email')
    const submitButton = screen.getByRole('button', { name: 'Send Reset Link' })
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Password reset link sent! Check your email.')).toBeInTheDocument()
    })
  })

  it('shows error message from server', async () => {
    mockResetPasswordAction.mockResolvedValue({ 
      success: false, 
      error: 'User not found' 
    })
    
    render(<ForgotPasswordForm />)
    
    const emailInput = screen.getByLabelText('Email')
    const submitButton = screen.getByRole('button', { name: 'Send Reset Link' })
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('User not found')).toBeInTheDocument()
    })
  })
})
