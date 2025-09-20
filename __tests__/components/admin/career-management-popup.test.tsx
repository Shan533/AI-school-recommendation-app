import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { CareerManagementPopup } from '@/components/admin/career-management-popup'
import { ProgramCategory, Career } from '@/lib/types'

// Mock fetch
global.fetch = vi.fn()

const mockCategory: ProgramCategory = {
  id: 'cat-1',
  name: 'Computer Science',
  abbreviation: 'CS',
  description: 'Computer Science programs',
  career_paths: ['Software Engineer', 'Data Scientist'],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

const mockCareers: Career[] = [
  {
    id: 'career-1',
    name: 'Software Engineer',
    abbreviation: 'SWE',
    description: 'Software development',
    industry: 'Technology',
    career_type: 'Software',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'career-2',
    name: 'Data Scientist',
    abbreviation: 'DS',
    description: 'Data analysis',
    industry: 'Technology',
    career_type: 'Data',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'career-3',
    name: 'UX Designer',
    abbreviation: 'UX',
    description: 'User experience design',
    industry: 'Technology',
    career_type: 'Design',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]

const mockProps = {
  category: mockCategory,
  isOpen: true,
  onClose: vi.fn(),
  onAddCareer: vi.fn(),
  onRemoveCareer: vi.fn(),
  onCreateCareer: vi.fn()
}

describe('CareerManagementPopup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockCareers)
    })
  })

  it('renders with category information', () => {
    render(<CareerManagementPopup {...mockProps} />)
    
    expect(screen.getByText('Manage Career Paths - Computer Science')).toBeInTheDocument()
    expect(screen.getByText('Add or remove career paths for this category. You can also create new careers.')).toBeInTheDocument()
  })

  it('displays assigned career paths', async () => {
    render(<CareerManagementPopup {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('Assigned Career Paths')).toBeInTheDocument()
    })
    
    // Should show assigned careers with abbreviations
    expect(screen.getByText('SWE')).toBeInTheDocument()
    expect(screen.getByText('DS')).toBeInTheDocument()
  })

  it('displays available careers', async () => {
    render(<CareerManagementPopup {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('Available Careers')).toBeInTheDocument()
    })
    
    // Should show available career with abbreviation
    expect(screen.getByText('UX')).toBeInTheDocument()
  })

  it('allows adding careers', async () => {
    render(<CareerManagementPopup {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('UX')).toBeInTheDocument()
    })
    
    // Click on the career tag to add it
    const careerTag = screen.getByText('UX').closest('div')
    
    await act(async () => {
      fireEvent.click(careerTag!)
    })
    
    expect(mockProps.onAddCareer).toHaveBeenCalledWith('cat-1', 'career-3')
  })

  it('allows removing careers', async () => {
    render(<CareerManagementPopup {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('SWE')).toBeInTheDocument()
    })
    
    // Find the X button in the assigned careers section
    const removeButtons = screen.getAllByRole('button')
    const removeButton = removeButtons.find(button => 
      button.querySelector('svg') && 
      button.closest('[data-slot="card-content"]') &&
      button.className.includes('hover:text-destructive')
    )
    
    expect(removeButton).toBeInTheDocument()
    
    await act(async () => {
      fireEvent.click(removeButton!)
    })
    
    expect(mockProps.onRemoveCareer).toHaveBeenCalledWith('cat-1', 'career-1')
  })

  it('shows create career form when new career button is clicked', async () => {
    render(<CareerManagementPopup {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('New Career')).toBeInTheDocument()
    })
    
    const newCareerButton = screen.getByText('New Career')
    fireEvent.click(newCareerButton)
    
    // The form is now in a separate popup, so we need to wait for it to appear
    await waitFor(() => {
      expect(screen.getByText('Add New Career')).toBeInTheDocument()
    })
    expect(screen.getByLabelText('Career Name *')).toBeInTheDocument()
    expect(screen.getByLabelText('Abbreviation *')).toBeInTheDocument()
    expect(screen.getByLabelText('Career Type')).toBeInTheDocument()
  })

  it('allows creating new careers', async () => {
    render(<CareerManagementPopup {...mockProps} />)
    
    // Open create form
    await waitFor(() => {
      expect(screen.getByText('New Career')).toBeInTheDocument()
    })
    
    const newCareerButton = screen.getByText('New Career')
    fireEvent.click(newCareerButton)
    
    // Wait for the popup to appear
    await waitFor(() => {
      expect(screen.getByText('Add New Career')).toBeInTheDocument()
    })
    
    // Fill form
    fireEvent.change(screen.getByLabelText('Career Name *'), { target: { value: 'Product Manager' } })
    fireEvent.change(screen.getByLabelText('Abbreviation *'), { target: { value: 'PM' } })
    fireEvent.change(screen.getByLabelText('Career Type'), { target: { value: 'Management' } })
    
    // Submit form
    const createButton = screen.getByText('Create Career')
    fireEvent.click(createButton)
    
    expect(mockProps.onCreateCareer).toHaveBeenCalledWith({
      name: 'Product Manager',
      abbreviation: 'PM',
      career_type: 'Management',
      description: '',
      industry: ''
    })
  })

  it('filters careers based on search term', async () => {
    render(<CareerManagementPopup {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('UX')).toBeInTheDocument()
    })
    
    const searchInput = screen.getByPlaceholderText('Search careers...')
    fireEvent.change(searchInput, { target: { value: 'Design' } })
    
    await waitFor(() => {
      expect(screen.getByText('UX')).toBeInTheDocument()
      // SWE should still be visible in the assigned careers section
      expect(screen.getByText('SWE')).toBeInTheDocument()
    })
  })

  it('handles empty career paths', () => {
    const emptyCategory = { ...mockCategory, career_paths: [] }
    render(<CareerManagementPopup {...mockProps} category={emptyCategory} />)
    
    expect(screen.getByText('No career paths assigned')).toBeInTheDocument()
  })

  it('handles loading state', () => {
    ;(fetch as any).mockImplementation(() => new Promise(() => {})) // Never resolves
    
    render(<CareerManagementPopup {...mockProps} />)
    
    expect(screen.getByText('Available Careers')).toBeInTheDocument()
    // Should show loading spinner
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('handles errors gracefully', async () => {
    ;(fetch as any).mockRejectedValue(new Error('Network error'))
    
    render(<CareerManagementPopup {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })

  it('closes popup when close button is clicked', () => {
    render(<CareerManagementPopup {...mockProps} />)
    
    const closeButtons = screen.getAllByText('Close')
    const footerCloseButton = closeButtons.find(button => 
      button.closest('[data-slot="dialog-footer"]')
    )
    
    expect(footerCloseButton).toBeInTheDocument()
    fireEvent.click(footerCloseButton!)
    
    expect(mockProps.onClose).toHaveBeenCalled()
  })
})
