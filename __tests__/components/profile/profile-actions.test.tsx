import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import ProfileActions from '@/components/profile/profile-actions'

// Mock scrollIntoView
const mockScrollIntoView = vi.fn()
Object.defineProperty(window, 'scrollIntoView', {
  writable: true,
  value: mockScrollIntoView,
})

// Mock getElementById
const mockGetElementById = vi.fn(() => ({
  scrollIntoView: mockScrollIntoView,
}))
// @ts-ignore - Mock for testing purposes
document.getElementById = mockGetElementById

// Mock window.location.href
delete (window as any).location
window.location = { href: '' } as any

describe('ProfileActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.location.href = ''
  })

  it('renders email and both buttons', () => {
    render(<ProfileActions userEmail="test@example.com" />)
    
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Change Email' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reset Password' })).toBeInTheDocument()
  })

  it('scrolls to email update section when change email button is clicked', () => {
    render(<ProfileActions userEmail="test@example.com" />)
    
    const changeEmailButton = screen.getByRole('button', { name: 'Change Email' })
    fireEvent.click(changeEmailButton)
    
    expect(mockGetElementById).toHaveBeenCalledWith('email-update-section')
    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' })
  })

  it('renders reset password button', () => {
    render(<ProfileActions userEmail="test@example.com" />)
    
    const resetPasswordButton = screen.getByRole('button', { name: 'Reset Password' })
    expect(resetPasswordButton).toBeInTheDocument()
  })
})
