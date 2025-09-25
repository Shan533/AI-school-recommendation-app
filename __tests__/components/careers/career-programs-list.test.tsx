import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CareerProgramsList } from '@/components/careers/career-programs-list'

// Mock the view toggle component
vi.mock('@/components/ui/view-toggle', () => ({
  ViewToggle: ({ onChange }: { onChange: (view: string) => void }) => (
    <button onClick={() => onChange('table')}>Toggle View</button>
  ),
  useViewPreference: () => ['table', vi.fn()],
}))

// Mock the table view component
vi.mock('@/components/ui/table-view', () => ({
  TableView: ({ data, onRowClick }: { data: any[], onRowClick: (row: any) => void }) => (
    <div data-testid="table-view">
      {data.map((row) => (
        <div key={row.id} onClick={() => onRowClick(row)}>
          {row.name}
        </div>
      ))}
    </div>
  ),
}))

const mockPrograms = [
  {
    id: '1',
    name: 'Computer Science',
    initial: 'CS',
    degree: 'Bachelor',
    duration_years: 4,
    total_tuition: 50000,
    currency: 'USD',
    is_stem: true,
    application_difficulty: 'R',
    schools: {
      id: '1',
      name: 'MIT',
      region: 'United States',
      qs_ranking: 1,
    },
  },
  {
    id: '2',
    name: 'Data Science',
    initial: 'DS',
    degree: 'Master',
    duration_years: 2,
    total_tuition: 80000,
    currency: 'USD',
    is_stem: true,
    application_difficulty: 'SR',
    schools: {
      id: '2',
      name: 'Stanford',
      region: 'United States',
      qs_ranking: 2,
    },
  },
]

const mockPagination = {
  page: 1,
  limit: 25,
  total: 2,
  total_pages: 1,
}

describe('CareerProgramsList', () => {
  it('renders programs in table view by default', () => {
    render(
      <CareerProgramsList
        programs={mockPrograms}
        pagination={mockPagination}
        baseUrl="/careers/1"
      />
    )

    expect(screen.getByTestId('table-view')).toBeInTheDocument()
    expect(screen.getByText('Computer Science')).toBeInTheDocument()
    expect(screen.getByText('Data Science')).toBeInTheDocument()
  })

  it('renders programs in card view when view is set to cards', () => {
    // Mock useViewPreference to return cards view
    vi.doMock('@/components/ui/view-toggle', () => ({
      ViewToggle: ({ onChange }: { onChange: (view: string) => void }) => (
        <button onClick={() => onChange('cards')}>Toggle View</button>
      ),
      useViewPreference: () => ['cards', vi.fn()],
    }))

    render(
      <CareerProgramsList
        programs={mockPrograms}
        pagination={mockPagination}
        baseUrl="/careers/1"
      />
    )

    // In card view, we should see the program names
    expect(screen.getByText('Computer Science')).toBeInTheDocument()
    expect(screen.getByText('Data Science')).toBeInTheDocument()
  })

  it('displays pagination when there are multiple pages', () => {
    const paginationWithMultiplePages = {
      page: 1,
      limit: 25,
      total: 50,
      total_pages: 2,
    }

    render(
      <CareerProgramsList
        programs={mockPrograms}
        pagination={paginationWithMultiplePages}
        baseUrl="/careers/1"
      />
    )

    expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument()
  })

  it('handles empty programs list', () => {
    render(
      <CareerProgramsList
        programs={[]}
        pagination={mockPagination}
        baseUrl="/careers/1"
      />
    )

    // Should still render the component structure
    expect(screen.getByText('Programs')).toBeInTheDocument()
  })
})
