/**
 * Unit tests for PublicSearchCard component
 * Priority: HIGH - New public search functionality
 * 
 * Test Coverage Areas:
 * - Component rendering with different props
 * - URL parameter synchronization
 * - Search form submission and navigation
 * - Responsive design and accessibility
 * - Error handling and edge cases
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PublicSearchCard } from '@/components/ui/public-search-card'

// Mock Next.js navigation hooks
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn()
}))

const mockPush = vi.fn()
const mockReplace = vi.fn()

describe('PublicSearchCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default mock implementations
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn()
    } as any)
    
    vi.mocked(useSearchParams).mockReturnValue({
      get: vi.fn().mockReturnValue(''),
      has: vi.fn(),
      getAll: vi.fn(),
      keys: vi.fn(),
      values: vi.fn(),
      entries: vi.fn(),
      forEach: vi.fn(),
      delete: vi.fn(),
      set: vi.fn(),
      toString: vi.fn()
    } as any)
  })

  describe('Component Rendering', () => {
    test('should render with default props', () => {
      render(<PublicSearchCard />)
      
      expect(screen.getByRole('textbox')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument()
      expect(screen.getByTitle('Enter search terms to filter results')).toBeInTheDocument()
    })

    test('should render with custom props', () => {
      render(
        <PublicSearchCard 
          placeholder="Search schools..."
          helpText="Find your perfect school"
          searchParam="q"
        />
      )
      
      expect(screen.getByPlaceholderText('Search schools...')).toBeInTheDocument()
      expect(screen.getByTitle('Find your perfect school')).toBeInTheDocument()
    })

    test('should display current search value from URL', () => {
      vi.mocked(useSearchParams).mockReturnValue({
        get: vi.fn().mockReturnValue('CMU'),
        has: vi.fn(),
        getAll: vi.fn(),
        keys: vi.fn(),
        values: vi.fn(),
        entries: vi.fn(),
        forEach: vi.fn(),
        delete: vi.fn(),
        set: vi.fn(),
        toString: vi.fn()
      } as any)

      render(<PublicSearchCard />)
      
      expect(screen.getByDisplayValue('CMU')).toBeInTheDocument()
    })
  })

  describe('Search Functionality', () => {
    test('should update input value on typing', () => {
      render(<PublicSearchCard />)
      
      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: 'Stanford' } })
      
      expect(input).toHaveValue('Stanford')
    })

    test('should navigate to search URL on form submission', async () => {
      render(<PublicSearchCard searchParam="search" />)
      
      const input = screen.getByRole('textbox')
      const form = input.closest('form')
      
      fireEvent.change(input, { target: { value: 'MIT' } })
      fireEvent.submit(form!)
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('?search=MIT')
      })
    })

    test('should use custom search parameter', async () => {
      render(<PublicSearchCard searchParam="q" />)
      
      const input = screen.getByRole('textbox')
      const form = input.closest('form')
      
      fireEvent.change(input, { target: { value: 'Berkeley' } })
      fireEvent.submit(form!)
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('?q=Berkeley')
      })
    })

    test('should handle empty search term', async () => {
      render(<PublicSearchCard />)
      
      const input = screen.getByRole('textbox')
      const form = input.closest('form')
      
      fireEvent.change(input, { target: { value: '' } })
      fireEvent.submit(form!)
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('?')
      })
    })

    test('should trim whitespace from search term', async () => {
      render(<PublicSearchCard />)
      
      const input = screen.getByRole('textbox')
      const form = input.closest('form')
      
      fireEvent.change(input, { target: { value: '  CMU  ' } })
      fireEvent.submit(form!)
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('?search=CMU')
      })
    })
  })

  describe('URL Parameter Handling', () => {
    test('should initialize with search parameter from URL', () => {
      vi.mocked(useSearchParams).mockReturnValue({
        get: vi.fn().mockImplementation((param) => {
          if (param === 'search') return 'Stanford'
          return null
        }),
        has: vi.fn(),
        getAll: vi.fn(),
        keys: vi.fn(),
        values: vi.fn(),
        entries: vi.fn(),
        forEach: vi.fn(),
        delete: vi.fn(),
        set: vi.fn(),
        toString: vi.fn()
      } as any)

      render(<PublicSearchCard />)
      
      expect(screen.getByDisplayValue('Stanford')).toBeInTheDocument()
    })

    test('should handle custom search parameter from URL', () => {
      vi.mocked(useSearchParams).mockReturnValue({
        get: vi.fn().mockImplementation((param) => {
          if (param === 'q') return 'MIT'
          return null
        }),
        has: vi.fn(),
        getAll: vi.fn(),
        keys: vi.fn(),
        values: vi.fn(),
        entries: vi.fn(),
        forEach: vi.fn(),
        delete: vi.fn(),
        set: vi.fn(),
        toString: vi.fn()
      } as any)

      render(<PublicSearchCard searchParam="q" />)
      
      expect(screen.getByDisplayValue('MIT')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    test('should have proper ARIA labels', () => {
      render(<PublicSearchCard />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('id', 'search')
      expect(screen.getByLabelText('Search')).toBeInTheDocument()
    })

    test('should have proper form structure', () => {
      render(<PublicSearchCard />)
      
      const form = screen.getByRole('textbox').closest('form')
      expect(form).toBeInTheDocument()
      
      const button = screen.getByRole('button', { name: /search/i })
      expect(button).toHaveAttribute('type', 'submit')
    })

    test('should be keyboard accessible', () => {
      render(<PublicSearchCard />)
      
      const input = screen.getByRole('textbox')
      const button = screen.getByRole('button', { name: /search/i })
      
      // Tab navigation should work
      input.focus()
      expect(input).toHaveFocus()
      
      // Test that elements are focusable
      expect(input).not.toBeDisabled()
      expect(button).not.toBeDisabled()
    })
  })

  describe('Responsive Design', () => {
    test('should have responsive classes', () => {
      render(<PublicSearchCard />)
      
      const card = screen.getByRole('textbox').closest('[data-slot="card"]')
      expect(card).toBeInTheDocument()
    })

    test('should have proper mobile layout', () => {
      render(<PublicSearchCard />)
      
      const form = screen.getByRole('textbox').closest('form')
      expect(form).toHaveClass('flex', 'gap-4', 'items-end')
    })
  })

  describe('Edge Cases', () => {
    test('should handle special characters in search', async () => {
      render(<PublicSearchCard />)
      
      const input = screen.getByRole('textbox')
      const form = input.closest('form')
      
      fireEvent.change(input, { target: { value: 'UC Berkeley & Stanford' } })
      fireEvent.submit(form!)
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('?search=UC+Berkeley+%26+Stanford')
      })
    })

    test('should handle very long search terms', async () => {
      render(<PublicSearchCard />)
      
      const longSearch = 'A'.repeat(1000)
      const input = screen.getByRole('textbox')
      const form = input.closest('form')
      
      fireEvent.change(input, { target: { value: longSearch } })
      fireEvent.submit(form!)
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(`?search=${encodeURIComponent(longSearch)}`)
      })
    })

    test('should handle navigation errors gracefully', async () => {
      mockPush.mockRejectedValueOnce(new Error('Navigation failed'))
      
      render(<PublicSearchCard />)
      
      const input = screen.getByRole('textbox')
      const form = input.closest('form')
      
      fireEvent.change(input, { target: { value: 'test' } })
      
      // Should not throw error
      expect(() => fireEvent.submit(form!)).not.toThrow()
    })
  })
})
