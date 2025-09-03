import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock the auth action first
vi.mock('@/lib/auth-actions', () => ({
  updateEmailAction: vi.fn(),
}))

// Import after mocking
import UpdateEmailForm from '@/components/auth/update-email-form'
import { updateEmailAction } from '@/lib/auth-actions'

const mockUpdateEmailAction = vi.mocked(updateEmailAction)

describe('UpdateEmailForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders update email form correctly', () => {
    render(<UpdateEmailForm currentEmail="old@example.com" />)
    
    expect(screen.getByText('Update Email Address')).toBeInTheDocument()
    expect(screen.getByText(/Current email:/)).toBeInTheDocument()
    expect(screen.getByText('old@example.com')).toBeInTheDocument()
    expect(screen.getByLabelText('New Email Address')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Update Email' })).toBeInTheDocument()
  })

  it('shows error when new email is same as current', async () => {
    render(<UpdateEmailForm currentEmail="old@example.com" />)
    
    const emailInput = screen.getByLabelText('New Email Address')
    const submitButton = screen.getByRole('button', { name: 'Update Email' })
    
    fireEvent.change(emailInput, { target: { value: 'old@example.com' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('New email must be different from current email')).toBeInTheDocument()
    })
  })

  it('submits form with valid email', async () => {
    mockUpdateEmailAction.mockResolvedValue({ success: true })
    
    render(<UpdateEmailForm currentEmail="old@example.com" />)
    
    const emailInput = screen.getByLabelText('New Email Address')
    const submitButton = screen.getByRole('button', { name: 'Update Email' })
    
    fireEvent.change(emailInput, { target: { value: 'new@example.com' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockUpdateEmailAction).toHaveBeenCalled()
    })
  })

  it('shows success message after successful update', async () => {
    mockUpdateEmailAction.mockResolvedValue({ success: true })
    
    render(<UpdateEmailForm currentEmail="old@example.com" />)
    
    const emailInput = screen.getByLabelText('New Email Address')
    const submitButton = screen.getByRole('button', { name: 'Update Email' })
    
    fireEvent.change(emailInput, { target: { value: 'new@example.com' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Email update initiated! Check your new email for confirmation.')).toBeInTheDocument()
    })
  })

  it('shows error message from server', async () => {
    mockUpdateEmailAction.mockResolvedValue({ 
      success: false, 
      error: 'Email already in use' 
    })
    
    render(<UpdateEmailForm currentEmail="old@example.com" />)
    
    const emailInput = screen.getByLabelText('New Email Address')
    const submitButton = screen.getByRole('button', { name: 'Update Email' })
    
    fireEvent.change(emailInput, { target: { value: 'new@example.com' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Email already in use')).toBeInTheDocument()
    })
  })
})
