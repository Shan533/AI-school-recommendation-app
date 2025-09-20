import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CareerEditPopup } from '@/components/admin/career-edit-popup'
import { Career } from '@/lib/types'

// Mock fetch
global.fetch = vi.fn()

const mockCareer: Career = {
  id: 'career-1',
  name: 'Software Engineer',
  abbreviation: 'SWE',
  description: 'Software development',
  industry: 'Technology',
  career_type: 'Software',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

const mockProps = {
  career: mockCareer,
  isOpen: true,
  onClose: vi.fn(),
  onSave: vi.fn(),
  onDelete: vi.fn()
}

describe('CareerEditPopup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with career information', () => {
    render(<CareerEditPopup {...mockProps} />)
    
    expect(screen.getByText('Edit Career')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Software Engineer')).toBeInTheDocument()
    expect(screen.getByDisplayValue('SWE')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Software development')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Technology')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Software')).toBeInTheDocument()
  })

  it('allows editing career information', async () => {
    render(<CareerEditPopup {...mockProps} />)
    
    const nameInput = screen.getByDisplayValue('Software Engineer')
    fireEvent.change(nameInput, { target: { value: 'Senior Software Engineer' } })
    
    const saveButton = screen.getByText('Save Changes')
    fireEvent.click(saveButton)
    
    expect(mockProps.onSave).toHaveBeenCalledWith({
      id: 'career-1',
      name: 'Senior Software Engineer',
      abbreviation: 'SWE',
      description: 'Software development',
      industry: 'Technology',
      career_type: 'Software'
    })
  })

  it('shows delete confirmation when delete button is clicked', () => {
    render(<CareerEditPopup {...mockProps} />)
    
    const deleteButton = screen.getByText('Delete')
    fireEvent.click(deleteButton)
    
    expect(screen.getByText('Delete Career')).toBeInTheDocument()
    expect(screen.getByText('Are you sure you want to delete "Software Engineer"? This action cannot be undone.')).toBeInTheDocument()
  })

  it('calls onDelete when delete is confirmed', async () => {
    render(<CareerEditPopup {...mockProps} />)
    
    const deleteButton = screen.getByText('Delete')
    fireEvent.click(deleteButton)
    
    const confirmDeleteButton = screen.getAllByText('Delete')[1]
    fireEvent.click(confirmDeleteButton)
    
    expect(mockProps.onDelete).toHaveBeenCalledWith('career-1')
  })

  it('cancels delete when cancel is clicked', () => {
    render(<CareerEditPopup {...mockProps} />)
    
    const deleteButton = screen.getByText('Delete')
    fireEvent.click(deleteButton)
    
    const cancelButton = screen.getAllByText('Cancel')[0]
    fireEvent.click(cancelButton)
    
    expect(screen.queryByText('Delete Career')).not.toBeInTheDocument()
  })

  it('validates required fields', async () => {
    render(<CareerEditPopup {...mockProps} />)
    
    const nameInput = screen.getByLabelText('Career Name *')
    fireEvent.change(nameInput, { target: { value: '' } })
    
    const form = nameInput.closest('form')
    fireEvent.submit(form!)
    
    await waitFor(() => {
      expect(screen.getByText('Career name is required')).toBeInTheDocument()
    })
    
    expect(mockProps.onSave).not.toHaveBeenCalled()
  })

  it('handles save errors', async () => {
    mockProps.onSave.mockRejectedValueOnce(new Error('Save failed'))
    
    render(<CareerEditPopup {...mockProps} />)
    
    const saveButton = screen.getByText('Save Changes')
    fireEvent.click(saveButton)
    
    await waitFor(() => {
      expect(screen.getByText('Save failed')).toBeInTheDocument()
    })
  })

  it('handles delete errors', async () => {
    mockProps.onDelete.mockRejectedValueOnce(new Error('Delete failed'))
    
    render(<CareerEditPopup {...mockProps} />)
    
    const deleteButton = screen.getByText('Delete')
    fireEvent.click(deleteButton)
    
    const confirmDeleteButton = screen.getAllByText('Delete')[1]
    fireEvent.click(confirmDeleteButton)
    
    await waitFor(() => {
      expect(screen.getByText('Delete failed')).toBeInTheDocument()
    })
  })

  it('closes popup when close button is clicked', () => {
    render(<CareerEditPopup {...mockProps} />)
    
    const cancelButton = screen.getAllByText('Cancel')[0]
    fireEvent.click(cancelButton)
    
    expect(mockProps.onClose).toHaveBeenCalled()
  })

  it('does not render when career is null', () => {
    render(<CareerEditPopup {...mockProps} career={null} />)
    
    expect(screen.queryByText('Edit Career')).not.toBeInTheDocument()
  })
})
