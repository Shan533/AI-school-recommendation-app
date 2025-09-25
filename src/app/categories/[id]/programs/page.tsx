import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CareerProgramsList } from '@/components/careers/career-programs-list'
import { Program } from '@/lib/types/program-types'

interface CategoryData {
  category: {
    id: string
    name: string
  }
  programs: Program[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

async function getCategoryPrograms(categoryId: string, page: number = 1): Promise<CategoryData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
    const response = await fetch(
      `${baseUrl}/api/categories/${categoryId}/programs?page=${page}&limit=25`,
      {
        cache: 'no-store'
      }
    )
    
    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error('Failed to fetch category programs')
    }
    
    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('Error fetching category programs:', error)
    return null
  }
}

interface CategoryProgramsPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ page?: string }>
}

export default async function CategoryProgramsPage({ 
  params, 
  searchParams 
}: CategoryProgramsPageProps) {
  const { id } = await params
  const { page } = await searchParams
  const currentPage = parseInt(page || '1')
  
  const categoryData = await getCategoryPrograms(id, currentPage)

  if (!categoryData) {
    notFound()
  }

  const { category, programs, pagination } = categoryData

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-700">Home</Link>
          <span>/</span>
          <Link href="/categories" className="hover:text-gray-700">Categories</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{category.name}</span>
        </div>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-3xl font-bold text-gray-900">
            {category.name} Programs
          </h1>
          <Badge variant="secondary">
            {pagination.total} programs
          </Badge>
        </div>
        <p className="text-gray-600">
          Explore programs in the {category.name} category. These programs are designed to prepare you for careers in this field.
        </p>
      </div>

      {/* Programs List */}
      {programs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No programs found in this category.</p>
          <Link href="/categories">
            <Button variant="outline" className="mt-4">
              Back to Categories
            </Button>
          </Link>
        </div>
      ) : (
        <CareerProgramsList 
          programs={programs}
          showFilters={true}
          pagination={pagination}
          baseUrl={`/categories/${id}/programs`}
        />
      )}
    </div>
  )
}
