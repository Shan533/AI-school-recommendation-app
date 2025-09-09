import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { vi } from 'vitest'
import ResetPasswordClient from '@/app/auth/reset-password/ResetPasswordClient'

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}))

// Mock Supabase client
const mockSupabase = {
  auth: {
    exchangeCodeForSession: vi.fn(),
    getSession: vi.fn(),
    updateUser: vi.fn(),
    signOut: vi.fn(),
  },
}

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}))

describe('ResetPasswordClient', () => {
  const mockPush = vi.fn()
  const mockSearchParams = {
    get: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as any)
    vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as any)
    
    // Mock successful session by default
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'test-user' } } },
    })
  })

  it('renders reset password form correctly', async () => {
    render(<ResetPasswordClient />)
    
    expect(screen.getByText('Set New Password')).toBeInTheDocument()
    expect(screen.getByText('Enter your new password below')).toBeInTheDocument()
    expect(screen.getByLabelText('New Password')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Update Password' })).toBeInTheDocument()
  })

  it('handles password validation correctly', async () => {
    render(<ResetPasswordClient />)
    
    const passwordInput = screen.getByLabelText('New Password')
    const confirmPasswordInput = screen.getByLabelText('Confirm Password')
    const submitButton = screen.getByRole('button', { name: 'Update Password' })
    
    // Test short password
    fireEvent.change(passwordInput, { target: { value: '123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: '123' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters long')).toBeInTheDocument()
    })
    
    // Test mismatched passwords
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'different123' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
    })
  })

  it('successfully updates password', async () => {
    mockSupabase.auth.updateUser.mockResolvedValue({ error: null })
    mockSupabase.auth.signOut.mockResolvedValue({ error: null })
    
    render(<ResetPasswordClient />)
    
    const passwordInput = screen.getByLabelText('New Password')
    const confirmPasswordInput = screen.getByLabelText('Confirm Password')
    const submitButton = screen.getByRole('button', { name: 'Update Password' })
    
    fireEvent.change(passwordInput, { target: { value: 'newpassword123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({ password: 'newpassword123' })
    })
    
    await waitFor(() => {
      expect(screen.getByText('Password updated! Redirecting to sign in…')).toBeInTheDocument()
    })
    
    // Should sign out and redirect after delay
    await waitFor(() => {
      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
    })
  })

  it('handles invalid or expired reset link', async () => {
    // Mock no session (invalid/expired link)
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
    })
    
    render(<ResetPasswordClient />)
    
    await waitFor(() => {
      expect(screen.getByText('Reset link is invalid or expired. Please request a new one.')).toBeInTheDocument()
    })
  })

  it('handles code exchange from email link', async () => {
    mockSearchParams.get.mockReturnValue('test-code')
    mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({ error: null })
    
    render(<ResetPasswordClient />)
    
    await waitFor(() => {
      expect(mockSupabase.auth.exchangeCodeForSession).toHaveBeenCalledWith('test-code')
    })
  })

  it('handles update user errors', async () => {
    mockSupabase.auth.updateUser.mockResolvedValue({ 
      error: { message: 'Password update failed' } 
    })
    
    render(<ResetPasswordClient />)
    
    const passwordInput = screen.getByLabelText('New Password')
    const confirmPasswordInput = screen.getByLabelText('Confirm Password')
    const submitButton = screen.getByRole('button', { name: 'Update Password' })
    
    fireEvent.change(passwordInput, { target: { value: 'newpassword123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText((content) => 
        content.includes('Password update failed')
      )).toBeInTheDocument()
    })
  })
})