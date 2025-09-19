import { notFound } from 'next/navigation'
import { getSupabaseClient, getCurrentUser } from '@/lib/supabase/helpers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StarRating } from '@/components/ui/star-rating'
import { ReviewForm } from '@/components/review-form'
import { ReviewsList } from '@/components/reviews-list'
import AddToCollectionButton from '@/components/collections/add-to-collection-button'
import Link from 'next/link'

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
  
  // First, get the reviews
  const { data: reviews, error } = await supabase
    .from('school_reviews')
    .select(`
      id,
      rating,
      comment,
      created_at,
      user_id
    `)
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching school reviews:', error)
    return []
  }
  
  if (!reviews || reviews.length === 0) {
    return []
  }
  
  // Get user profiles for each review
  const userIds = reviews.map(review => review.user_id)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name')
    .in('id', userIds)
  
  // Combine reviews with profile data
  const reviewsWithProfiles = reviews.map(review => ({
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    created_at: review.created_at,
    profiles: profiles?.find(profile => profile.id === review.user_id) || null
  }))
  
  return reviewsWithProfiles as Review[]
}

async function getUserReviews(schoolId: string, userId?: string) {
  if (!userId) return []
  
  const supabase = await getSupabaseClient()
  const { data: reviews, error } = await supabase
    .from('school_reviews')
    .select(`
      id,
      rating,
      comment,
      created_at,
      user_id
    `)
    .eq('school_id', schoolId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching user reviews:', error)
    return []
  }
  
  return reviews || []
}

async function getSchoolRatingStats(schoolId: string) {
  const supabase = await getSupabaseClient()
  
  // Get latest rating from each user (only the most recent rating counts)
  const { data, error } = await supabase
    .from('school_reviews')
    .select('user_id, rating, created_at')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })
  
  if (error || !data || data.length === 0) {
    return { averageRating: 0, totalReviews: 0 }
  }
  
  // Get only the latest rating from each user
  const userLatestRatings = new Map()
  data.forEach(review => {
    if (!userLatestRatings.has(review.user_id)) {
      userLatestRatings.set(review.user_id, review.rating)
    }
  })
  
  const latestRatings = Array.from(userLatestRatings.values())
  const totalReviews = latestRatings.length
  const averageRating = totalReviews > 0 
    ? latestRatings.reduce((sum, rating) => sum + rating, 0) / totalReviews 
    : 0
  
  return { averageRating, totalReviews }
}

export default async function SchoolDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const school = await getSchool(id)
  
  if (!school) {
    notFound()
  }
  
  const user = await getCurrentUser()
  const [programs, reviews, userReviews, ratingStats] = await Promise.all([
    getSchoolPrograms(school.id),
    getSchoolReviews(school.id),
    getUserReviews(school.id, user?.id),
    getSchoolRatingStats(school.id)
  ])

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-end items-center mb-6">
        <Button asChild variant="outline" className="cursor-pointer">
          <Link href="/schools">← Back to Schools</Link>
        </Button>
      </div>

      {/* School Header */}
      <Card className="mb-8">
        <CardHeader>
          {/* Mobile-first layout: stack vertically on small screens */}
          <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-start">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-2xl md:text-3xl mb-2 leading-tight">
                {school.name}
                {school.initial && <span className="text-gray-600 ml-2">({school.initial})</span>}
              </CardTitle>
              {school.type && (
                <p className="text-base md:text-lg text-gray-600">{school.type}</p>
              )}
              
              {/* Rating Display */}
              {ratingStats.totalReviews > 0 && (
                <div className="flex items-center gap-2 md:gap-4 mt-3 flex-wrap">
                  <StarRating rating={ratingStats.averageRating} readonly />
                  <Badge variant="secondary" className="whitespace-nowrap">
                    {ratingStats.totalReviews} {ratingStats.totalReviews === 1 ? 'Review' : 'Reviews'}
                  </Badge>
                </div>
              )}
            </div>
            
            {/* Stats section - stack on mobile, inline on desktop */}
            <div className="flex flex-wrap gap-2 justify-start md:justify-end md:flex-shrink-0">
              {school.qs_ranking && (
                <div className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-center min-w-fit">
                  <p className="text-xs font-medium whitespace-nowrap">QS World Ranking</p>
                  <p className="text-lg md:text-xl font-bold">#{school.qs_ranking}</p>
                </div>
              )}
              {ratingStats.totalReviews > 0 && (
                <div className="bg-green-100 text-green-800 px-3 py-2 rounded-lg text-center min-w-fit">
                  <p className="text-xs font-medium whitespace-nowrap">User Rating</p>
                  <p className="text-lg md:text-xl font-bold">{ratingStats.averageRating.toFixed(1)}</p>
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
            {school.region && (
              <div>
                <h4 className="font-semibold text-gray-700">Region</h4>
                <p>{school.region}</p>
              </div>
            )}
            {school.year_founded && (
              <div>
                <h4 className="font-semibold text-gray-700">Founded</h4>
                <p>{school.year_founded}</p>
              </div>
            )}
            {school.type && (
              <div>
                <h4 className="font-semibold text-gray-700">Institution Type</h4>
                <p>{school.type}</p>
              </div>
            )}
            {programs.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-700">STEM Programs</h4>
                <p>{programs.filter(p => p.is_stem).length} of {programs.length}</p>
              </div>
            )}
            {programs.length > 0 && programs.some(p => p.total_tuition) && (
              <div>
                <h4 className="font-semibold text-gray-700">Tuition Range</h4>
                <p>
                  {(() => {
                    const tuitions = programs
                      .filter(p => p.total_tuition && p.currency)
                      .map(p => ({ amount: p.total_tuition, currency: p.currency }))
                    
                    if (tuitions.length === 0) return 'N/A'
                    
                    const minTuition = Math.min(...tuitions.map(t => t.amount))
                    const maxTuition = Math.max(...tuitions.map(t => t.amount))
                    const currency = tuitions[0].currency // Assume same currency for all programs
                    
                    if (minTuition === maxTuition) {
                      return `${currency} ${minTuition.toLocaleString()}`
                    } else {
                      return `${currency} ${minTuition.toLocaleString()} - ${maxTuition.toLocaleString()}`
                    }
                  })()}
                </p>
              </div>
            )}
            {programs.length > 0 && programs.some(p => p.duration_months) && (
              <div>
                <h4 className="font-semibold text-gray-700">Duration Range</h4>
                <p>
                  {(() => {
                    const durations = programs
                      .filter(p => p.duration_months)
                      .map(p => p.duration_months)
                    
                    if (durations.length === 0) return 'N/A'
                    
                    const minDuration = Math.min(...durations)
                    const maxDuration = Math.max(...durations)
                    
                    if (minDuration === maxDuration) {
                      return `${minDuration} month${minDuration !== 1 ? 's' : ''}`
                    } else {
                      return `${minDuration} - ${maxDuration} months`
                    }
                  })()}
                </p>
              </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {user && (
              <div className="w-full sm:w-auto">
                <AddToCollectionButton
                  schoolId={school.id}
                  itemName={school.name}
                  className="w-full sm:w-auto"
                />
              </div>
            )}
            {school.website_url && (
              <div className="flex-1">
                <Button asChild className="w-full sm:w-auto">
                  <a href={school.website_url} target="_blank" rel="noopener noreferrer">
                    Visit Site
                  </a>
                </Button>
              </div>
            )}
          </div>
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
            userReviews={userReviews}
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