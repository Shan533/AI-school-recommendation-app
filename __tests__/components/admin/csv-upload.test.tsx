import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import CSVUpload from '@/app/admin/csv-upload/page'

// Mock fetch
global.fetch = vi.fn()

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}))

// Mock Papa Parse
vi.mock('papaparse', () => ({
  default: {
    parse: vi.fn()
  }
}))

describe('CSV Upload Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock successful fetch responses by default
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ schools: [], programs: [] })
    })
  })

  describe('UI Components', () => {
    it('should render upload forms for both schools and programs', () => {
      render(<CSVUpload />)
      
      expect(screen.getByText(/upload schools csv/i)).toBeInTheDocument()
      expect(screen.getByText(/upload programs csv/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/select schools csv file/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/select programs csv file/i)).toBeInTheDocument()
    })

    it('should show expected CSV format documentation', () => {
      render(<CSVUpload />)
      
      expect(screen.getByText(/expected csv format for schools/i)).toBeInTheDocument()
      expect(screen.getByText(/expected csv format for programs/i)).toBeInTheDocument()
      expect(screen.getByText(/public, private, art & design, community college/i)).toBeInTheDocument()
      expect(screen.getByText(/bachelor, master, phd, associate, certificate, diploma/i)).toBeInTheDocument()
    })
  })
})
