import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Career {
  id: string
  name: string
  abbreviation: string
  description: string
  industry: string
  career_type: string
}

async function getCareers(): Promise<Career[]> {
  try {
    // Use absolute URL for server-side fetch in production
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
    const response = await fetch(`${baseUrl}/api/careers`, {
      cache: 'no-store' // Always get fresh data
    })
    
    if (!response.ok) {
      console.error('Error fetching careers:', response.statusText)
      return []
    }
    
    const result = await response.json()
    return result.data || []
  } catch (error) {
    console.error('Error fetching careers:', error)
    return []
  }
}

export default async function CareersPage({ 
  searchParams 
}: { 
  searchParams: Promise<Record<string, string | string[] | undefined>> 
}) {
  const params = await searchParams
  const search = typeof params.search === 'string' ? params.search : undefined
  const type = typeof params.type === 'string' ? params.type : undefined
  const careers = await getCareers()
  
  // Map dropdown type parameter to actual career_type values and display names
  const typeMapping: Record<string, { careerType: string, displayName: string }> = {
    'software engineering': { careerType: 'Software', displayName: 'Software Engineering' },
    'data & analytics': { careerType: 'Data', displayName: 'Data & Analytics' },
    'ai & machine learning': { careerType: 'AI', displayName: 'AI & Machine Learning' },
    'product & design': { careerType: 'Product', displayName: 'Product & Design' }
  }
  
  // Filter careers based on search or type
  const filteredCareers = search 
    ? careers.filter(career => 
        career.name.toLowerCase().includes(search.toLowerCase())
      )
    : type
    ? careers.filter(career => {
        const mapping = typeMapping[type]
        return mapping ? career.career_type === mapping.careerType : false
      })
    : careers

  // Map search terms to display names
  const searchToDisplayMap: Record<string, string> = {
    'Research': 'Researcher',
    'Software': 'Software Engineer',
    'Data Scientist': 'Data Scientist',
    'Product Manager': 'Product Manager',
    'Designer': 'Designer'
  }
  
  const displayName = search 
    ? (searchToDisplayMap[search] || search) 
    : type 
    ? (typeMapping[type]?.displayName || type)
    : undefined

  // Group careers by type if no search is provided
  const groupedCareers = search 
    ? null 
    : filteredCareers.reduce((groups, career) => {
        const careerType = career.career_type || 'Other'
        if (!groups[careerType]) {
          groups[careerType] = []
        }
        groups[careerType].push(career)
        return groups
      }, {} as Record<string, Career[]>)

  // Define type display order and names
  const typeOrder = [
    'Software',
    'Data', 
    'AI',
    'Product',
    'Design',
    'Security',
    'Infrastructure',
    'Management',
    'Research',
    'Other'
  ]

  const typeDisplayNames: Record<string, string> = {
    'Software': 'Software Engineering',
    'Data': 'Data & Analytics',
    'AI': 'Artificial Intelligence',
    'Product': 'Product Management',
    'Design': 'Design & UX',
    'Security': 'Cybersecurity',
    'Infrastructure': 'Infrastructure & DevOps',
    'Management': 'Management & Leadership',
    'Research': 'Research & Development',
    'Other': 'Other Careers'
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Career Paths
        </h1>
        <p className="text-gray-600">
          Explore different career paths in technology and discover programs that align with your professional goals.
        </p>
      </div>

      {(search || type) && (
        <div className="mb-6">
          <nav className="flex items-center space-x-2 text-sm">
            <Link href="/careers" className="text-gray-500 hover:text-gray-700">
              All Careers
            </Link>
            <span className="text-gray-400">›</span>
            <span className="text-gray-900 font-medium">
              {displayName}
            </span>
          </nav>
        </div>
      )}

      {filteredCareers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {search ? `No careers found for "${displayName}".` : "No careers available at the moment."}
          </p>
        </div>
      ) : (search || type) ? (
        // Show simple grid for search results or type filtered results
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCareers.map((career) => (
            <Card key={career.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="text-xl">{career.name}</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {career.abbreviation}
                  </Badge>
                </div>
                {career.description && (
                  <p className="text-sm text-gray-600">
                    {career.description}
                  </p>
                )}
              </CardHeader>
              
              <CardContent>
                <div className="space-y-2 mb-4">
                  {career.industry && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">Industry:</span>
                      <Badge variant="outline" className="text-xs">
                        {career.industry}
                      </Badge>
                    </div>
                  )}
                  {career.career_type && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">Type:</span>
                      <Badge variant="outline" className="text-xs">
                        {career.career_type}
                      </Badge>
                    </div>
                  )}
                </div>
                
                <Link
                  href={`/careers/${career.id}`}
                  className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
                >
                  View Programs
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        // Show grouped view for all careers
        <div className="space-y-8">
          {typeOrder.map((type) => {
            const careersInType = groupedCareers?.[type] || []
            if (careersInType.length === 0) return null
            
            return (
              <div key={type} className="space-y-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {typeDisplayNames[type]}
                  </h2>
                  <Badge variant="secondary" className="text-xs">
                    {careersInType.length} career{careersInType.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {careersInType.map((career) => (
                    <Card key={career.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between mb-2">
                          <CardTitle className="text-lg">{career.name}</CardTitle>
                          <Badge variant="secondary" className="text-xs">
                            {career.abbreviation}
                          </Badge>
                        </div>
                        {career.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {career.description}
                          </p>
                        )}
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        <div className="space-y-2 mb-4">
                          {career.industry && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-500">Industry:</span>
                              <Badge variant="outline" className="text-xs">
                                {career.industry}
                              </Badge>
                            </div>
                          )}
                        </div>
                        
                        <Link
                          href={`/careers/${career.id}`}
                          className="inline-flex items-center px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
                        >
                          View Programs
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
