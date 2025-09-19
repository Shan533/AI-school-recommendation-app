import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() })
}))

// Mock dropdown menu to render content inline for easier testing
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuItem: ({ children, asChild, ...props }: any) =>
    asChild ? <>{children}</> : <button {...props}>{children}</button>,
}))

// Mock Supabase client used inside NavigationClient
const mockGetUser = vi.fn()
const mockFrom = vi.fn()
const mockOnAuthStateChange = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
      onAuthStateChange: mockOnAuthStateChange
    },
    from: mockFrom
  })
}))

import { NavigationClient } from '@/components/navigation-client'

const makeAuthMocks = (opts: { hasUser: boolean; isAdmin?: boolean }) => {
  mockGetUser.mockResolvedValueOnce({ data: { user: opts.hasUser ? { id: 'user-1' } : null } })
  if (opts.hasUser) {
    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { is_admin: !!opts.isAdmin } })
    })
  }
  mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: () => {} } } })
}

describe('NavigationClient - Account/Logout', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('does not submit logout form when confirmation is cancelled', async () => {
    makeAuthMocks({ hasUser: true, isAdmin: false })
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const submitSpy = vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => {})

    render(<NavigationClient />)

    // Wait for loading state to clear
    await waitFor(() => expect(screen.queryByText('Account')).toBeInTheDocument())

    // Open Account menu
    fireEvent.click(screen.getByRole('button', { name: 'Account' }))

    // Click Logout
    const logoutBtn = await screen.findByRole('button', { name: /logout/i })
    fireEvent.click(logoutBtn)

    expect(confirmSpy).toHaveBeenCalled()
    expect(submitSpy).not.toHaveBeenCalled()
  })

  it('submits logout form when confirmation is accepted', async () => {
    makeAuthMocks({ hasUser: true, isAdmin: false })
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const submitSpy = vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => {})

    render(<NavigationClient />)
    await waitFor(() => expect(screen.queryByText('Account')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Account' }))
    const logoutBtn = await screen.findByRole('button', { name: /logout/i })
    fireEvent.click(logoutBtn)

    expect(submitSpy).toHaveBeenCalled()
  })

  it('shows Admin item only for admin users', async () => {
    // Non-admin
    makeAuthMocks({ hasUser: true, isAdmin: false })
    const { unmount } = render(<NavigationClient />)
    await waitFor(() => expect(screen.queryByText('Account')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Account' }))
    expect(screen.queryByText('Admin')).not.toBeInTheDocument()
    unmount()

    // Admin
    makeAuthMocks({ hasUser: true, isAdmin: true })
    render(<NavigationClient />)
    await waitFor(() => expect(screen.queryByText('Account')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Account' }))
    expect(await screen.findByText('Admin')).toBeInTheDocument()
  })
})


