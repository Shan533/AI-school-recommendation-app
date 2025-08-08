import { notFound } from 'next/navigation'
import { getSupabaseClient, getCurrentUser } from '@/lib/supabase/helpers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StarRating } from '@/components/ui/star-rating'
import { ReviewForm } from '@/components/review-form'
import { ReviewsList } from '@/components/reviews-list'
import Link from 'next/link'

// Define the exact type returned by Supabase
type SupabaseReview = {
  id: string
  rating: number
  comment: string
  created_at: string
  profiles: {
    name: string
  }
}

// Define the expected Review type
interface Review {
  id: string
  rating: number
  comment: string
  created_at: string
  profiles: {
    name: string
  } | null
}

// Transform function to ensure type safety
function transformReviews(supabaseReviews: SupabaseReview[]): Review[] {
  return supabaseReviews.map(review => ({
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    created_at: review.created_at,
    profiles: review.profiles || null
  }))
}

async function getSchool(id: string) {
  const supabase = await getSupabaseClient()
  const { data: school, error } = await supabase
    .from('schools')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Error fetching school:', error)
    return null
  }
  
  return school
}

async function getSchoolPrograms(schoolId: string) {
  const supabase = await getSupabaseClient()
  const { data: programs, error } = await supabase
    .from('programs')
    .select('*')
    .eq('school_id', schoolId)
    .order('name')
  
  if (error) {
    console.error('Error fetching school programs:', error)
    return []
  }
  
  return programs || []
}

async function getSchoolReviews(schoolId: string) {
  const supabase = await getSupabaseClient()
  const { data: reviews, error } = await supabase
    .from('school_reviews')
    .select(`
      id,
      rating,
      comment,
      created_at,
      profiles!inner (
        name
      )
    `)
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching school reviews:', error)
    return []
  }
  
  return transformReviews((reviews || []) as unknown as SupabaseReview[])
}

async function getUserReview(schoolId: string, userId?: string) {
  if (!userId) return null
  
  const supabase = await getSupabaseClient()
  const { data: review, error } = await supabase
    .from('school_reviews')
    .select('id, rating, comment')
    .eq('school_id', schoolId)
    .eq('user_id', userId)
    .single()
  
  if (error) {
    return null
  }
  
  return review
}

async function getSchoolRatingStats(schoolId: string) {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('school_reviews')
    .select('rating')
    .eq('school_id', schoolId)
  
  if (error || !data || data.length === 0) {
    return { averageRating: 0, totalReviews: 0 }
  }
  
  const totalReviews = data.length
  const averageRating = data.reduce((sum, review) => sum + review.rating, 0) / totalReviews
  
  return { averageRating, totalReviews }
}

export default async function SchoolDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const school = await getSchool(id)
  
  if (!school) {
    notFound()
  }
  
  const user = await getCurrentUser()
  const [programs, reviews, userReview, ratingStats] = await Promise.all([
    getSchoolPrograms(school.id),
    getSchoolReviews(school.id),
    getUserReview(school.id, user?.id),
    getSchoolRatingStats(school.id)
  ])

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <Button asChild variant="outline">
          <Link href="/schools">← Back to Schools</Link>
        </Button>
      </div>

      {/* School Header */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl mb-2">
                {school.name}
                {school.initial && <span className="text-gray-600 ml-2">({school.initial})</span>}
              </CardTitle>
              {school.type && (
                <p className="text-lg text-gray-600">{school.type}</p>
              )}
              
              {/* Rating Display */}
              {ratingStats.totalReviews > 0 && (
                <div className="flex items-center gap-4 mt-3">
                  <StarRating rating={ratingStats.averageRating} readonly />
                  <Badge variant="secondary">
                    {ratingStats.totalReviews} {ratingStats.totalReviews === 1 ? 'Review' : 'Reviews'}
                  </Badge>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {school.qs_ranking && (
                <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg text-center">
                  <p className="text-sm font-medium">QS World Ranking</p>
                  <p className="text-2xl font-bold">#{school.qs_ranking}</p>
                </div>
              )}
              {ratingStats.totalReviews > 0 && (
                <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg text-center">
                  <p className="text-sm font-medium">User Rating</p>
                  <p className="text-2xl font-bold">{ratingStats.averageRating.toFixed(1)}</p>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {school.location && (
              <div>
                <h4 className="font-semibold text-gray-700">Location</h4>
                <p>{school.location}</p>
              </div>
            )}
            {school.country && (
              <div>
                <h4 className="font-semibold text-gray-700">Country</h4>
                <p>{school.country}</p>
              </div>
            )}
            {school.year_founded && (
              <div>
                <h4 className="font-semibold text-gray-700">Founded</h4>
                <p>{school.year_founded}</p>
              </div>
            )}
          </div>
          
          {school.website_url && (
            <Button asChild>
              <a href={school.website_url} target="_blank" rel="noopener noreferrer">
                Visit Official Website
              </a>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Programs Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Programs Offered ({programs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {programs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {programs.map((program) => (
                <Card key={program.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{program.name}</h4>
                        {program.initial && (
                          <span className="text-sm text-gray-600">({program.initial})</span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {program.is_stem && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            STEM
                          </span>
                        )}
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {program.degree}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-1 text-sm text-gray-600 mb-3">
                      {program.duration_months && (
                        <p><strong>Duration:</strong> {program.duration_months} months</p>
                      )}
                      {program.total_tuition && program.currency && (
                        <p><strong>Tuition:</strong> {program.currency} {program.total_tuition.toLocaleString()}</p>
                      )}
                    </div>
                    
                    <Button asChild size="sm" className="w-full">
                      <Link href={`/programs/${program.id}`}>View Program Details</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">
              No programs available for this school yet.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Reviews Section */}
      <div className="space-y-8">
        {/* Review Form */}
        {user && (
          <ReviewForm
            type="school"
            itemId={school.id}
            itemName={school.name}
            existingReview={userReview}
          />
        )}

        {!user && (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-600 mb-4">Please log in to write a review</p>
              <Button asChild>
                <Link href="/login">Login to Review</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Reviews List */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Reviews</h2>
          <ReviewsList
            reviews={reviews}
            type="school"
            averageRating={ratingStats.averageRating}
            totalReviews={ratingStats.totalReviews}
          />
        </div>
      </div>
    </div>
  )
}