import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { useSearchParams } from 'next/navigation'
import Home from '@/app/page'

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(),
}))

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(),
}

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabaseClient,
}))

// Mock FloatingAlert component
vi.mock('@/components/floating-alert', () => ({
  FloatingAlert: ({ title, description }: { title: string; description: string }) => (
    <div data-testid="floating-alert" role="alert">
      <div>{title}</div>
      <div>{description}</div>
    </div>
  ),
}))

describe('Homepage', () => {
  const mockUseSearchParams = vi.mocked(useSearchParams)
  
  // Helper function to render Home with default empty searchParams
  const renderHome = (searchParams = {}) => {
    const mockSearchParams = Promise.resolve(searchParams)
    return render(<Home searchParams={mockSearchParams} />)
  }

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    
    // Default mock for useSearchParams
    mockUseSearchParams.mockReturnValue({
      get: vi.fn().mockReturnValue(null),
    } as any)

    // Default mock for Supabase queries
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        not: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Hero Section', () => {
    test('should render hero title and subtitle', async () => {
      renderHome()

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Break Into Tech with theTop Program')
      expect(screen.getByText(/Find, rate, and review top CS, AI\/ML, HCI, Data, Cybersecurity/)).toBeInTheDocument()
    })

    test('should have proper heading hierarchy', async () => {
      renderHome()

      const h1 = screen.getByRole('heading', { level: 1 })
      expect(h1).toBeInTheDocument()
      expect(h1).toHaveClass('text-4xl', 'md:text-6xl')
    })
  })

  describe('Top Schools Table', () => {
    test('should render top schools section with empty state', async () => {
      renderHome()

      await waitFor(() => {
        expect(screen.getByText('Top Schools (QS Ranking)')).toBeInTheDocument()
      })

      expect(screen.getByText('No QS ranking data yet.')).toBeInTheDocument()
      expect(screen.getAllByRole('link', { name: 'View All' })[0]).toHaveAttribute('href', '/schools')
    })

    test('should render top schools with data', async () => {
      const mockSchools = [
        {
          id: 'school-1',
          name: 'MIT',
          initial: 'MIT',
          qs_ranking: 1,
          region: 'United States',
        },
        {
          id: 'school-2', 
          name: 'Stanford University',
          initial: 'Stanford',
          qs_ranking: 2,
          region: 'United States',
        },
      ]

      // Mock the schools query
      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'schools') {
          return {
            select: vi.fn().mockReturnValue({
              not: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: mockSchools,
                    error: null,
                  }),
                }),
              }),
            }),
          }
        }
        // Default for other tables
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }
      })

      renderHome()

      await waitFor(() => {
        expect(screen.getByText('MIT (MIT)')).toBeInTheDocument()
        expect(screen.getByText('Stanford University (Stanford)')).toBeInTheDocument()
        expect(screen.getByText('#1')).toBeInTheDocument()
        expect(screen.getByText('#2')).toBeInTheDocument()
      })

      // Check table headers
      expect(screen.getByText('QS')).toBeInTheDocument()
      expect(screen.getByText('School')).toBeInTheDocument()
      expect(screen.getByText('Region')).toBeInTheDocument()
    })

    test('should handle schools data fetch error', async () => {
      // Mock error response
      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'schools') {
          return {
            select: vi.fn().mockReturnValue({
              not: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'Database error' },
                  }),
                }),
              }),
            }),
          }
        }
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }
      })

      renderHome()

      await waitFor(() => {
        expect(screen.getByText('No QS ranking data yet.')).toBeInTheDocument()
      })
    })
  })

  describe('Popular Programs Table', () => {
    test('should render popular programs section with empty state', async () => {
      renderHome()

      await waitFor(() => {
        expect(screen.getByText('Popular Programs')).toBeInTheDocument()
      })

      expect(screen.getByText('No programs available.')).toBeInTheDocument()
      expect(screen.getAllByRole('link', { name: 'View All' })[1]).toHaveAttribute('href', '/programs')
    })

    test('should render popular programs with data', async () => {
      const mockPrograms = [
        {
          id: 'program-1',
          name: 'Computer Science',
          initial: 'CS',
          schools: { name: 'MIT' },
        },
        {
          id: 'program-2',
          name: 'Data Science',
          initial: 'DS', 
          schools: { name: 'Stanford University' },
        },
      ]

      // Mock the programs query
      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'programs') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: mockPrograms,
                  error: null,
                }),
              }),
            }),
          }
        }
        // Default for other tables
        return {
          select: vi.fn().mockReturnValue({
            not: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }
      })

      renderHome()

      await waitFor(() => {
        expect(screen.getByText('Computer Science (CS)')).toBeInTheDocument()
        expect(screen.getByText('Data Science (DS)')).toBeInTheDocument()
        expect(screen.getAllByText('MIT')[0]).toBeInTheDocument()
        expect(screen.getByText('Stanford University')).toBeInTheDocument()
      })

      // Check table headers
      expect(screen.getByText('Program')).toBeInTheDocument()
      expect(screen.getByText('School')).toBeInTheDocument()
    })

    test('should handle programs data fetch error', async () => {
      // Mock error response for programs
      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'programs') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Database error' },
                }),
              }),
            }),
          }
        }
        return {
          select: vi.fn().mockReturnValue({
            not: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }
      })

      renderHome()

      await waitFor(() => {
        expect(screen.getByText('No programs available.')).toBeInTheDocument()
      })
    })
  })

  describe('Career Explorer Section', () => {
    test('should render career explorer with empty state', async () => {
      renderHome()

      await waitFor(() => {
        expect(screen.getByText('No careers available.')).toBeInTheDocument()
      })
    })

    test('should render career explorer with data', async () => {
      const mockCareers = [
        {
          id: 'career-1',
          name: 'Software Engineer',
          abbreviation: 'SWE',
        },
        {
          id: 'career-2',
          name: 'Data Scientist',
          abbreviation: 'DS',
        },
        {
          id: 'career-3',
          name: 'Product Manager',
          abbreviation: 'PM',
        },
      ]

      // Mock the careers query
      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'careers') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: mockCareers,
                  error: null,
                }),
              }),
            }),
          }
        }
        // Default for other tables
        return {
          select: vi.fn().mockReturnValue({
            not: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }
      })

      renderHome()

      await waitFor(() => {
        expect(screen.getAllByText('Software Engineer')).toHaveLength(2) // Duplicated in marquee
        expect(screen.getAllByText('Data Scientist')).toHaveLength(2)
        expect(screen.getAllByText('Product Manager')).toHaveLength(2)
      })

      // Check that careers are rendered in animated marquee (duplicated for seamless scroll)
      const careerCards = screen.getAllByText(/Software Engineer|Data Scientist|Product Manager/)
      expect(careerCards.length).toBe(6) // 3 careers × 2 duplicates
    })

    test('should handle careers data fetch error', async () => {
      // Mock error response for careers
      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'careers') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Database error' },
                }),
              }),
            }),
          }
        }
        return {
          select: vi.fn().mockReturnValue({
            not: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }
      })

      renderHome()

      await waitFor(() => {
        expect(screen.getByText('No careers available.')).toBeInTheDocument()
      })
    })
  })

  describe('Success Messages', () => {
    test('should show logout success message when logout param is present', async () => {
      renderHome({ logout: '1' })

      await waitFor(() => {
        expect(screen.getByTestId('floating-alert')).toBeInTheDocument()
        expect(screen.getByText('Signed out')).toBeInTheDocument()
        expect(screen.getByText("You've been logged out successfully.")).toBeInTheDocument()
      })
    })

    test('should show login success message when login param is present', async () => {
      renderHome({ login: '1' })

      await waitFor(() => {
        expect(screen.getByTestId('floating-alert')).toBeInTheDocument()
        expect(screen.getByText('Welcome back! 🎉')).toBeInTheDocument()
        expect(screen.getByText("You're now signed in.")).toBeInTheDocument()
      })
    })

    test('should not show success messages when no params are present', async () => {
      renderHome({})

      await waitFor(() => {
        expect(screen.queryByTestId('floating-alert')).not.toBeInTheDocument()
      })
    })
  })

  describe('Responsive Design', () => {
    test('should have responsive grid layout for top lists', async () => {
      renderHome()

      const topListsSection = screen.getByText('Top Schools (QS Ranking)').closest('section')
      expect(topListsSection).toHaveClass('grid', 'grid-cols-1', 'lg:grid-cols-2')
    })

    test('should have responsive text sizes for hero', async () => {
      renderHome()

      const heroTitle = screen.getByRole('heading', { level: 1 })
      expect(heroTitle).toHaveClass('text-4xl', 'md:text-6xl')
    })
  })

  describe('Accessibility', () => {
    test('should have proper heading structure', async () => {
      renderHome()

      const h1 = screen.getByRole('heading', { level: 1 })
      expect(h1).toBeInTheDocument()

      await waitFor(() => {
        // CardTitle is actually a div, not a heading, but check for the h3 in Platform Overview
        const h3Element = screen.getByRole('heading', { level: 3 })
        expect(h3Element).toHaveTextContent('Platform Overview')
      })

      // Check that card titles exist as text (not headings)
      expect(screen.getByText('Top Schools (QS Ranking)')).toBeInTheDocument()
      expect(screen.getByText('Popular Programs')).toBeInTheDocument()
    })

    test('should have clickable table rows with proper cursor styling', async () => {
      const mockSchools = [
        {
          id: 'school-1',
          name: 'MIT',
          initial: 'MIT',
          qs_ranking: 1,
          region: 'United States',
        },
      ]

      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'schools') {
          return {
            select: vi.fn().mockReturnValue({
              not: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: mockSchools,
                    error: null,
                  }),
                }),
              }),
            }),
          }
        }
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }
      })

      renderHome()

      await waitFor(() => {
        const tableRow = screen.getByText('MIT (MIT)').closest('tr')
        expect(tableRow).toHaveClass('cursor-pointer', 'hover:bg-gray-50')
      })
    })
  })
})
