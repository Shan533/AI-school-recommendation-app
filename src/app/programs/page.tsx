import { getSupabaseClient } from '@/lib/supabase/helpers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PublicSearchCard } from '@/components/ui/public-search-card'
import { filterItems, searchConfigs } from '@/lib/admin-search'
import Link from 'next/link'

async function getProgramsWithRatings() {
  const supabase = await getSupabaseClient()
  
  // Get programs
  const { data: programs, error: programsError } = await supabase
    .from('programs')
    .select(`
      *,
      schools (
        name,
        initial,
        location,
        country
      )
    `)
    .order('name')
  
  if (programsError) {
    console.error('Error fetching programs:', programsError)
    return []
  }
  
  if (!programs) return []
  
  // Get latest ratings for all programs (only latest review per user counts)
  const { data: reviews, error: reviewsError } = await supabase
    .from('program_reviews')
    .select('program_id, rating, user_id, created_at')
    .order('created_at', { ascending: false })
  
  if (reviewsError) {
    console.error('Error fetching reviews:', reviewsError)
    return programs.map(program => ({ ...program, averageRating: 0, totalReviews: 0 }))
  }
  
  // Calculate average ratings using only latest review per user per program
  const programRatings = reviews?.reduce((acc: Record<string, { ratings: number[]; count: number; userLatestReviews: Map<string, { rating: number; user_id: string; created_at: string }> }>, review) => {
    if (!acc[review.program_id]) {
      acc[review.program_id] = { ratings: [], count: 0, userLatestReviews: new Map() }
    }
    
    const programData = acc[review.program_id]
    const existingReview = programData.userLatestReviews.get(review.user_id)
    
    // Only keep the latest review per user (reviews are ordered by created_at desc)
    if (!existingReview) {
      programData.userLatestReviews.set(review.user_id, review)
      programData.ratings.push(review.rating)
      programData.count++
    }
    
    return acc
  }, {}) || {}
  
  return programs.map(program => {
    const programRating = programRatings[program.id]
    const averageRating = programRating 
      ? programRating.ratings.reduce((sum: number, rating: number) => sum + rating, 0) / programRating.count
      : 0
    const totalReviews = programRating ? programRating.count : 0
    
    return {
      ...program,
      averageRating,
      totalReviews
    }
  })
}

export default async function ProgramsPage(props: {
  searchParams?: Promise<{ search?: string }>
}) {
  const searchParams = await props.searchParams
  const search = searchParams?.search

  const allPrograms = await getProgramsWithRatings()
  
  // Filter programs based on search
  const programs = filterItems(allPrograms, {
    fields: searchConfigs.programs.fields,
    searchTerm: search || ''
  })

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          {search ? `Search Results (${programs.length})` : `Programs (${programs.length})`}
        </h1>
        <Button asChild variant="outline" className="cursor-pointer">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>

      {/* Search Programs */}
      <PublicSearchCard 
        placeholder={searchConfigs.programs.placeholder}
        helpText={searchConfigs.programs.helpText}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {programs.length > 0 ? (
          programs.map((program) => (
            <Card key={program.id} className="hover:shadow-lg transition-shadow flex flex-col h-full">
              <CardHeader>
                <CardTitle className="flex justify-between items-start gap-2 min-w-0">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold leading-tight truncate pr-2">{program.name}</h3>
                    {program.initial && (
                      <span className="text-sm text-gray-600">({program.initial})</span>
                    )}
                  </div>
                  <div className="flex gap-1 flex-wrap justify-end flex-shrink-0 min-w-fit max-w-[50%]">
                    {program.totalReviews > 0 && (
                      <Badge variant="secondary" className="text-xs whitespace-nowrap">
                        ★ {program.averageRating.toFixed(1)} ({program.totalReviews})
                      </Badge>
                    )}
                    {program.is_stem && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded whitespace-nowrap">
                        STEM
                      </span>
                    )}
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded whitespace-nowrap">
                      {program.degree}
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col flex-grow">
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <p><strong>School:</strong> {program.schools?.name}</p>
                  {program.schools?.location && (
                    <p><strong>Location:</strong> {program.schools.location}</p>
                  )}
                  {program.duration_months && (
                    <p><strong>Duration:</strong> {program.duration_months} months</p>
                  )}
                  {program.total_tuition && program.currency && (
                    <p><strong>Tuition:</strong> {program.currency} {program.total_tuition.toLocaleString()}</p>
                  )}
                </div>
                
                {program.description && (
                  <p className="text-sm text-gray-700 mb-4 line-clamp-3 flex-grow">
                    {program.description}
                  </p>
                )}
                
                <div className="flex gap-2 mt-auto">
                  <Button asChild className="flex-1">
                    <Link href={`/programs/${program.id}`}>Details</Link>
                  </Button>
                  {program.website_url && (
                    <Button variant="outline" asChild>
                      <a href={program.website_url} target="_blank" rel="noopener noreferrer">
                        Visit
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 text-lg">No programs found.</p>
            <p className="text-gray-400 mt-2">Programs will appear here once they are added by administrators.</p>
          </div>
        )}
      </div>

      <div className="mt-8 text-center">
        <Button asChild variant="outline">
          <Link href="/schools">View Schools</Link>
        </Button>
      </div>
    </div>
  )
}