import { getSupabaseClient } from '@/lib/supabase/helpers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import Link from 'next/link'

async function getSchoolsWithRatings() {
  const supabase = await getSupabaseClient()
  
  // Get schools
  const { data: schools, error: schoolsError } = await supabase
    .from('schools')
    .select('*')
    .order('name')
  
  if (schoolsError) {
    console.error('Error fetching schools:', schoolsError)
    return []
  }
  
  if (!schools) return []
  
  // Get latest ratings for all schools (only latest review per user counts)
  const { data: reviews, error: reviewsError } = await supabase
    .from('school_reviews')
    .select('school_id, rating, user_id, created_at')
    .order('created_at', { ascending: false })
  
  if (reviewsError) {
    console.error('Error fetching reviews:', reviewsError)
    return schools.map(school => ({ ...school, averageRating: 0, totalReviews: 0 }))
  }
  
  // Calculate average ratings using only latest review per user per school
  const schoolRatings = reviews?.reduce((acc: Record<string, { ratings: number[]; count: number; userLatestReviews: Map<string, { rating: number; user_id: string; created_at: string }> }>, review) => {
    if (!acc[review.school_id]) {
      acc[review.school_id] = { ratings: [], count: 0, userLatestReviews: new Map() }
    }
    
    const schoolData = acc[review.school_id]
    const existingReview = schoolData.userLatestReviews.get(review.user_id)
    
    // Only keep the latest review per user (reviews are ordered by created_at desc)
    if (!existingReview) {
      schoolData.userLatestReviews.set(review.user_id, review)
      schoolData.ratings.push(review.rating)
      schoolData.count++
    }
    
    return acc
  }, {}) || {}
  
  return schools.map(school => {
    const schoolRating = schoolRatings[school.id]
    const averageRating = schoolRating 
      ? schoolRating.ratings.reduce((sum: number, rating: number) => sum + rating, 0) / schoolRating.count
      : 0
    const totalReviews = schoolRating ? schoolRating.count : 0
    
    return {
      ...school,
      averageRating,
      totalReviews
    }
  })
}

export default async function SchoolsPage() {
  const schools = await getSchoolsWithRatings()

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Schools</h1>
        <Button asChild>
          <Link href="/">Back to Home</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schools.length > 0 ? (
          schools.map((school) => (
            <Card key={school.id} className="hover:shadow-lg transition-shadow flex flex-col h-full">
              <CardHeader>
                <CardTitle className="flex justify-between items-start gap-2 min-w-0">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold leading-tight truncate pr-2">{school.name}</h3>
                    {school.initial && (
                      <span className="text-sm text-gray-600">({school.initial})</span>
                    )}
                  </div>
                  <div className="flex gap-1 flex-wrap justify-end flex-shrink-0 min-w-fit max-w-[50%]">
                    {school.qs_ranking && (
                      <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded whitespace-nowrap">
                        QS #{school.qs_ranking}
                      </span>
                    )}
                    {school.totalReviews > 0 && (
                      <Badge variant="secondary" className="text-xs whitespace-nowrap">
                        ★ {school.averageRating.toFixed(1)} ({school.totalReviews})
                      </Badge>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col flex-grow">
                <div className="space-y-2 text-sm text-gray-600 mb-4 flex-grow">
                  {school.type && <p><strong>Type:</strong> {school.type}</p>}
                  {school.location && <p><strong>Location:</strong> {school.location}</p>}
                  {school.country && <p><strong>Country:</strong> {school.country}</p>}
                  {school.year_founded && <p><strong>Founded:</strong> {school.year_founded}</p>}
                </div>
                
                <div className="flex gap-2 mt-auto">
                  <Button asChild className="flex-1">
                    <Link href={`/schools/${school.id}`}>Details</Link>
                  </Button>
                  {school.website_url && (
                    <Button variant="outline" asChild>
                      <a href={school.website_url} target="_blank" rel="noopener noreferrer">
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
            <p className="text-gray-500 text-lg">No schools found.</p>
            <p className="text-gray-400 mt-2">Schools will appear here once they are added by administrators.</p>
          </div>
        )}
      </div>

      <div className="mt-8 text-center">
        <Button asChild variant="outline">
          <Link href="/programs">View Programs</Link>
        </Button>
      </div>
    </div>
  )
}