import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CareerProgramsList } from '@/components/careers/career-programs-list'
import { Program } from '@/lib/types/program-types'

interface CareerData {
  career: {
    id: string
    name: string
    abbreviation: string
    description?: string
    industry?: string
    career_type?: string
    created_at: string
    updated_at: string
  }
  programs: Program[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

async function getCareerData(careerId: string, page: number = 1): Promise<CareerData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const response = await fetch(
      `${baseUrl}/api/careers/${careerId}?page=${page}&limit=25`,
      {
        cache: 'no-store'
      }
    )
    
    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error('Failed to fetch career data')
    }
    
    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('Error fetching career data:', error)
    return null
  }
}

interface CareerDetailPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ page?: string }>
}

export default async function CareerDetailPage({ 
  params, 
  searchParams 
}: CareerDetailPageProps) {
  const { id } = await params
  const { page } = await searchParams
  const currentPage = parseInt(page || '1')
  
  const careerData = await getCareerData(id, currentPage)

  if (!careerData) {
    notFound()
  }

  const { career, programs, pagination } = careerData

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-700">Home</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{career.name}</span>
        </div>
      </nav>

      {/* Career Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-3xl font-bold text-gray-900">
            {career.name}
          </h1>
          <Badge variant="secondary">
            {career.abbreviation}
          </Badge>
        </div>

        {/* Career Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {career.industry && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Industry</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">{career.industry}</p>
              </CardContent>
            </Card>
          )}
          
          {career.career_type && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Career Type</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">{career.career_type}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Related Programs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">{pagination.total}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Growth Outlook</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-green-600">High Demand</p>
            </CardContent>
          </Card>
        </div>

        {/* Career Description */}
        {career.description && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>About This Career</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                {career.description}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Programs Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Programs Leading to {career.name}
          </h2>
          <Badge variant="outline">
            {pagination.total} programs available
          </Badge>
        </div>

        {programs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">
              No programs found that lead to this career path.
            </p>
            <Link href="/categories">
              <Button variant="outline">
                Explore Categories
              </Button>
            </Link>
          </div>
        ) : (
          <CareerProgramsList 
            programs={programs}
            showFilters={true}
            pagination={pagination}
            baseUrl={`/careers/${id}`}
          />
        )}
      </div>
    </div>
  )
}
