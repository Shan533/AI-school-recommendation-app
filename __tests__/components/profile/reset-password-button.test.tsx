import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import ResetPasswordButton from '@/components/profile/reset-password-button'

// Mock window.location.href
delete (window as any).location
window.location = { href: '' } as any

describe('ResetPasswordButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.location.href = ''
  })

  it('renders reset password button', () => {
    render(<ResetPasswordButton />)
    
    expect(screen.getByRole('button', { name: 'Reset Password' })).toBeInTheDocument()
  })

  it('renders reset password button with correct text', () => {
    render(<ResetPasswordButton />)
    
    const resetButton = screen.getByRole('button', { name: 'Reset Password' })
    expect(resetButton).toBeInTheDocument()
    expect(resetButton).toHaveTextContent('Reset Password')
  })
})
