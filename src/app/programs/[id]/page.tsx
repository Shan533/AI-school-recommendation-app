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

async function getProgram(id: string) {
  const supabase = await getSupabaseClient()
  const { data: program, error } = await supabase
    .from('programs')
    .select(`
      *,
      schools (
        id,
        name,
        initial,
        type,
        location,
        country,
        qs_ranking,
        website_url
      )
    `)
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Error fetching program:', error)
    return null
  }
  
  return program
}

async function getProgramReviews(programId: string) {
  const supabase = await getSupabaseClient()
  const { data: reviews, error } = await supabase
    .from('program_reviews')
    .select(`
      id,
      rating,
      comment,
      created_at,
      profiles!inner (
        name
      )
    `)
    .eq('program_id', programId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching program reviews:', error)
    return []
  }
  
  return transformReviews((reviews || []) as unknown as SupabaseReview[])
}

async function getUserReview(programId: string, userId?: string) {
  if (!userId) return null
  
  const supabase = await getSupabaseClient()
  const { data: review, error } = await supabase
    .from('program_reviews')
    .select('id, rating, comment')
    .eq('program_id', programId)
    .eq('user_id', userId)
    .single()
  
  if (error) {
    return null
  }
  
  return review
}

async function getProgramRatingStats(programId: string) {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('program_reviews')
    .select('rating')
    .eq('program_id', programId)
  
  if (error || !data || data.length === 0) {
    return { averageRating: 0, totalReviews: 0 }
  }
  
  const totalReviews = data.length
  const averageRating = data.reduce((sum, review) => sum + review.rating, 0) / totalReviews
  
  return { averageRating, totalReviews }
}

export default async function ProgramDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const program = await getProgram(id)
  
  if (!program) {
    notFound()
  }

  const user = await getCurrentUser()
  const [reviews, userReview, ratingStats] = await Promise.all([
    getProgramReviews(program.id),
    getUserReview(program.id, user?.id),
    getProgramRatingStats(program.id)
  ])

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <Button asChild variant="outline">
          <Link href="/programs">← Back to Programs</Link>
        </Button>
      </div>

      {/* Program Header */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl mb-2">
                {program.name}
                {program.initial && <span className="text-gray-600 ml-2">({program.initial})</span>}
              </CardTitle>
              <p className="text-lg text-gray-600">{program.degree} Program</p>
              
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
            <div className="flex gap-2">
              {program.is_stem && (
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-lg font-medium">
                  STEM Designated
                </span>
              )}
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg font-medium">
                {program.degree}
              </span>
              {ratingStats.totalReviews > 0 && (
                <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-lg text-center">
                  <span className="text-sm font-medium">★ {ratingStats.averageRating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {program.description && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-700 mb-2">Program Description</h4>
              <p className="text-gray-700 leading-relaxed">{program.description}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {program.duration_months && (
              <div>
                <h4 className="font-semibold text-gray-700">Duration</h4>
                <p>{program.duration_months} months</p>
              </div>
            )}
            {program.total_tuition && program.currency && (
              <div>
                <h4 className="font-semibold text-gray-700">Total Tuition</h4>
                <p>{program.currency} {program.total_tuition.toLocaleString()}</p>
              </div>
            )}
            {program.currency && !program.total_tuition && (
              <div>
                <h4 className="font-semibold text-gray-700">Currency</h4>
                <p>{program.currency}</p>
              </div>
            )}
          </div>
          
          <div className="flex gap-3">
            {program.website_url && (
              <Button asChild>
                <a href={program.website_url} target="_blank" rel="noopener noreferrer">
                  Visit Program Website
                </a>
              </Button>
            )}
            <Button asChild variant="outline">
              <Link href={`/schools/${program.schools?.id}`}>View School Details</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* School Information */}
      {program.schools && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>School Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold mb-1">
                  {program.schools.name}
                  {program.schools.initial && (
                    <span className="text-gray-600 ml-2">({program.schools.initial})</span>
                  )}
                </h3>
                {program.schools.type && (
                  <p className="text-gray-600">{program.schools.type}</p>
                )}
              </div>
              {program.schools.qs_ranking && (
                <div className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-center">
                  <p className="text-xs font-medium">QS Ranking</p>
                  <p className="text-lg font-bold">#{program.schools.qs_ranking}</p>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {program.schools.location && (
                <div>
                  <h4 className="font-semibold text-gray-700">Location</h4>
                  <p>{program.schools.location}</p>
                </div>
              )}
              {program.schools.country && (
                <div>
                  <h4 className="font-semibold text-gray-700">Country</h4>
                  <p>{program.schools.country}</p>
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button asChild>
                <Link href={`/schools/${program.schools.id}`}>View All School Programs</Link>
              </Button>
              {program.schools.website_url && (
                <Button asChild variant="outline">
                  <a href={program.schools.website_url} target="_blank" rel="noopener noreferrer">
                    School Website
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews Section */}
      <div className="space-y-8">
        {/* Review Form */}
        {user && (
          <ReviewForm
            type="program"
            itemId={program.id}
            itemName={program.name}
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
            type="program"
            averageRating={ratingStats.averageRating}
            totalReviews={ratingStats.totalReviews}
          />
        </div>
      </div>
    </div>
  )
}