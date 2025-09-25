import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

interface ProgramCategory {
  id: string
  name: string
  abbreviation: string
  description?: string
  created_at: string
  updated_at: string
  related_careers: Array<{
    id: string
    name: string
    abbreviation: string
    career_type?: string
    industry?: string
  }>
}

async function getCategories(): Promise<ProgramCategory[]> {
  try {
    // Use absolute URL for server-side fetch in production
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
    const response = await fetch(`${baseUrl}/api/categories`, {
      cache: 'no-store' // Always get fresh data
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch categories')
    }
    
    const result = await response.json()
    return result.data || []
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

export default async function CategoriesPage({ 
  searchParams 
}: { 
  searchParams: Promise<Record<string, string | string[] | undefined>> 
}) {
  const params = await searchParams
  const search = typeof params.search === 'string' ? params.search : undefined
  const categories = await getCategories()
  
  // Filter categories if search is provided
  const filteredCategories = search 
    ? categories.filter(category => 
        category.name.toLowerCase().includes(search.toLowerCase())
      )
    : categories

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Program Categories
        </h1>
        <p className="text-gray-600">
          Explore academic categories and discover programs that align with your career goals.
        </p>
      </div>

      {search && (
        <div className="mb-6">
          <nav className="flex items-center space-x-2 text-sm">
            <Link href="/categories" className="text-gray-500 hover:text-gray-700">
              All Categories
            </Link>
            <span className="text-gray-400">›</span>
            <span className="text-gray-900 font-medium">
              {search}
            </span>
          </nav>
        </div>
      )}

      {filteredCategories.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {search ? `No categories found for "${search}".` : "No categories available at the moment."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCategories.map((category) => (
            <Card key={category.id} className="hover:shadow-md transition-shadow">
              <CardContent className="px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {category.name}
                      </h3>
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {category.abbreviation}
                      </Badge>
                    </div>
                    
                    {category.description && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {category.description}
                      </p>
                    )}
                    
                    {category.related_careers.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500 shrink-0">Career Paths:</span>
                        <div className="flex flex-wrap gap-1">
                          {category.related_careers.map((career) => (
                            <Badge key={career.id} variant="outline" className="text-xs hover:bg-accent hover:border-accent transition-colors">
                              {career.abbreviation}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4 shrink-0">
                    <Link
                      href={`/categories/${category.id}/programs`}
                      className="inline-flex items-center px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
                    >
                      View Programs
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
