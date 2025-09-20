import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChangeUsernameForm from '@/components/profile/change-username-form'

// Mock the auth action
vi.mock('@/lib/auth-actions', () => ({
  updateUsernameAction: vi.fn()
}))

// Mock the auth action
import { updateUsernameAction } from '@/lib/auth-actions'
const mockUpdateUsernameAction = vi.mocked(updateUsernameAction)

describe('ChangeUsernameForm', () => {
  const defaultProps = {
    currentUsername: 'testuser',
    onUsernameChange: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders current username and edit button', () => {
    render(<ChangeUsernameForm {...defaultProps} />)
    
    expect(screen.getByText('testuser')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
  })

  it('shows edit form when edit button is clicked', async () => {
    const user = userEvent.setup()
    render(<ChangeUsernameForm {...defaultProps} />)
    
    const editButton = screen.getByRole('button', { name: /edit/i })
    await user.click(editButton)
    
    expect(screen.getByLabelText(/new username/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('validates username length', async () => {
    const user = userEvent.setup()
    // Mock the action to return a failure result for validation errors
    mockUpdateUsernameAction.mockResolvedValue({
      success: false,
      error: 'Username must be at least 3 characters'
    })
    
    render(<ChangeUsernameForm {...defaultProps} />)
    
    // Open edit form
    const editButton = screen.getByRole('button', { name: /edit/i })
    await user.click(editButton)
    
    // Try to save with short username
    const usernameInput = screen.getByLabelText(/new username/i)
    await user.type(usernameInput, 'ab')
    
    const saveButton = screen.getByRole('button', { name: /save/i })
    await user.click(saveButton)
    
    expect(screen.getByText('Username must be at least 3 characters')).toBeInTheDocument()
  })

  it('validates username format', async () => {
    const user = userEvent.setup()
    // Mock the action to return a failure result for validation errors
    mockUpdateUsernameAction.mockResolvedValue({
      success: false,
      error: 'Username can only contain letters, numbers, and underscores'
    })
    
    render(<ChangeUsernameForm {...defaultProps} />)
    
    // Open edit form
    const editButton = screen.getByRole('button', { name: /edit/i })
    await user.click(editButton)
    
    // Try to save with invalid username
    const usernameInput = screen.getByLabelText(/new username/i)
    await user.clear(usernameInput)
    await user.type(usernameInput, 'user@name')
    
    // Verify the input value is correct
    expect(usernameInput).toHaveValue('user@name')
    
    const saveButton = screen.getByRole('button', { name: /save/i })
    await user.click(saveButton)
    
    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText(/username can only contain letters, numbers, and underscores/i)).toBeInTheDocument()
    }, { timeout: 5000 })
  })

  it('calls updateUsernameAction when form is submitted with valid data', async () => {
    const user = userEvent.setup()
    mockUpdateUsernameAction.mockResolvedValue({
      success: true,
      error: 'Username updated successfully!'
    })
    
    render(<ChangeUsernameForm {...defaultProps} />)
    
    // Open edit form
    const editButton = screen.getByRole('button', { name: /edit/i })
    await user.click(editButton)
    
    // Enter new username
    const usernameInput = screen.getByLabelText(/new username/i)
    await user.clear(usernameInput)
    await user.type(usernameInput, 'newusername')
    
    // Submit form
    const saveButton = screen.getByRole('button', { name: /save/i })
    await user.click(saveButton)
    
    await waitFor(() => {
      expect(mockUpdateUsernameAction).toHaveBeenCalledWith(
        expect.any(FormData)
      )
    })
  })

  it('shows success message and calls onUsernameChange when update succeeds', async () => {
    const user = userEvent.setup()
    const onUsernameChange = vi.fn()
    mockUpdateUsernameAction.mockResolvedValue({
      success: true,
      error: 'Username updated successfully!'
    })
    
    render(<ChangeUsernameForm {...defaultProps} onUsernameChange={onUsernameChange} />)
    
    // Open edit form
    const editButton = screen.getByRole('button', { name: /edit/i })
    await user.click(editButton)
    
    // Enter new username
    const usernameInput = screen.getByLabelText(/new username/i)
    await user.clear(usernameInput)
    await user.type(usernameInput, 'newusername')
    
    // Submit form
    const saveButton = screen.getByRole('button', { name: /save/i })
    await user.click(saveButton)
    
    await waitFor(() => {
      expect(screen.getByText(/username updated successfully/i)).toBeInTheDocument()
      expect(onUsernameChange).toHaveBeenCalledWith('newusername')
    })
  })

  it('shows error message when update fails', async () => {
    const user = userEvent.setup()
    mockUpdateUsernameAction.mockResolvedValue({
      success: false,
      error: 'Username already taken'
    })
    
    render(<ChangeUsernameForm {...defaultProps} />)
    
    // Open edit form
    const editButton = screen.getByRole('button', { name: /edit/i })
    await user.click(editButton)
    
    // Enter new username
    const usernameInput = screen.getByLabelText(/new username/i)
    await user.clear(usernameInput)
    await user.type(usernameInput, 'newusername')
    
    // Submit form
    const saveButton = screen.getByRole('button', { name: /save/i })
    await user.click(saveButton)
    
    await waitFor(() => {
      expect(screen.getByText(/username already taken/i)).toBeInTheDocument()
    })
  })

  it('cancels edit mode when cancel button is clicked', async () => {
    const user = userEvent.setup()
    render(<ChangeUsernameForm {...defaultProps} />)
    
    // Open edit form
    const editButton = screen.getByRole('button', { name: /edit/i })
    await user.click(editButton)
    
    // Cancel edit
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)
    
    // Should be back to view mode
    expect(screen.queryByLabelText(/new username/i)).not.toBeInTheDocument()
    expect(screen.getByText('testuser')).toBeInTheDocument()
  })

  it('prevents editing if username is same as current', async () => {
    const user = userEvent.setup()
    render(<ChangeUsernameForm {...defaultProps} />)
    
    // Open edit form
    const editButton = screen.getByRole('button', { name: /edit/i })
    await user.click(editButton)
    
    // Enter same username
    const usernameInput = screen.getByLabelText(/new username/i)
    await user.clear(usernameInput)
    await user.type(usernameInput, 'testuser')
    
    // Submit form
    const saveButton = screen.getByRole('button', { name: /save/i })
    await user.click(saveButton)
    
    expect(screen.getByText(/new username must be different from current username/i)).toBeInTheDocument()
  })
})
