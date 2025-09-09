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
      ),
      requirements (
        *
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
  
  // First, get the reviews
  const { data: reviews, error } = await supabase
    .from('program_reviews')
    .select(`
      id,
      rating,
      comment,
      created_at,
      user_id
    `)
    .eq('program_id', programId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching program reviews:', error)
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

async function getUserReviews(programId: string, userId?: string) {
  if (!userId) return []
  
  const supabase = await getSupabaseClient()
  const { data: reviews, error } = await supabase
    .from('program_reviews')
    .select(`
      id,
      rating,
      comment,
      created_at,
      user_id
    `)
    .eq('program_id', programId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching user reviews:', error)
    return []
  }
  
  return reviews || []
}

async function getProgramRatingStats(programId: string) {
  const supabase = await getSupabaseClient()
  
  // Get latest rating from each user (only the most recent rating counts)
  const { data, error } = await supabase
    .from('program_reviews')
    .select('user_id, rating, created_at')
    .eq('program_id', programId)
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

export default async function ProgramDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const program = await getProgram(id)
  
  if (!program) {
    notFound()
  }

  const user = await getCurrentUser()
  const [reviews, userReviews, ratingStats] = await Promise.all([
    getProgramReviews(program.id),
    getUserReviews(program.id, user?.id),
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
          {/* Mobile-first layout: stack vertically on small screens */}
          <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-start">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-2xl md:text-3xl mb-2 leading-tight">
                {program.name}
                {program.initial && <span className="text-gray-600 ml-2">({program.initial})</span>}
              </CardTitle>
              <p className="text-base md:text-lg text-gray-600">{program.degree} Program</p>
              
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
            
            {/* Badges section - stack on mobile, inline on desktop */}
            <div className="flex flex-wrap gap-2 justify-start md:justify-end md:flex-shrink-0">
              {program.is_stem && (
                <span className="bg-green-100 text-green-800 px-2 md:px-3 py-1 rounded-lg font-medium text-sm whitespace-nowrap">
                  STEM Designated
                </span>
              )}
              <span className="bg-blue-100 text-blue-800 px-2 md:px-3 py-1 rounded-lg font-medium text-sm whitespace-nowrap">
                {program.degree}
              </span>
              {ratingStats.totalReviews > 0 && (
                <div className="bg-yellow-100 text-yellow-800 px-2 md:px-3 py-1 rounded-lg text-center text-sm whitespace-nowrap">
                  <span className="font-medium">★ {ratingStats.averageRating.toFixed(1)}</span>
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
            {(program.duration_years || program.duration_months) && (
              <div>
                <h4 className="font-semibold text-gray-700">Duration</h4>
                <p>
                  {program.duration_years ? `${program.duration_years} years` : 
                   program.duration_months ? `${program.duration_months} months` : ''}
                </p>
              </div>
            )}
            {program.credits && (
              <div>
                <h4 className="font-semibold text-gray-700">Credits</h4>
                <p>{program.credits} credits</p>
              </div>
            )}
            {program.delivery_method && (
              <div>
                <h4 className="font-semibold text-gray-700">Delivery Method</h4>
                <p>{program.delivery_method}</p>
              </div>
            )}
            {program.schedule_type && (
              <div>
                <h4 className="font-semibold text-gray-700">Schedule</h4>
                <p>{program.schedule_type}</p>
              </div>
            )}
            {program.location && (
              <div>
                <h4 className="font-semibold text-gray-700">Program Location</h4>
                <p>{program.location}</p>
              </div>
            )}
            {program.start_date && (
              <div>
                <h4 className="font-semibold text-gray-700">Start Date</h4>
                <p>{new Date(program.start_date).toLocaleDateString()}</p>
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
          
          <div className="flex flex-col sm:flex-row gap-3">
            {user && (
              <div className="w-full sm:w-auto">
                <AddToCollectionButton
                  programId={program.id}
                  itemName={program.name}
                  className="w-full sm:w-auto"
                />
              </div>
            )}
            <div className="flex flex-wrap gap-3 flex-1">
              {program.website_url && (
                <Button asChild className="flex-1 sm:flex-initial">
                  <a href={program.website_url} target="_blank" rel="noopener noreferrer">
                    Visit Site
                  </a>
                </Button>
              )}
              <Button asChild variant="outline" className="flex-1 sm:flex-initial">
                <Link href={`/schools/${program.schools?.id}`}>View School Details</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* School Information */}
      {program.schools && (
        <Card className="mb-8">
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
                <Link href={`/schools/${program.schools.id}`}>View School</Link>
              </Button>
              {program.schools.website_url && (
                <Button asChild variant="outline">
                  <a href={program.schools.website_url} target="_blank" rel="noopener noreferrer">
                    School Site
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Requirements Section */}
      {program.requirements && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Admission Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Test Scores */}
              {(program.requirements.ielts_score || program.requirements.toefl_score || program.requirements.gre_score) && (
                <div className="md:col-span-1">
                  <h4 className="font-semibold text-gray-700 mb-3">Test Scores</h4>
                  <div className="space-y-2">
                    {program.requirements.ielts_score && (
                      <div className="flex justify-between">
                        <span>IELTS:</span>
                        <span className="font-medium">{program.requirements.ielts_score}</span>
                      </div>
                    )}
                    {program.requirements.toefl_score && (
                      <div className="flex justify-between">
                        <span>TOEFL:</span>
                        <span className="font-medium">{program.requirements.toefl_score}</span>
                      </div>
                    )}
                    {program.requirements.gre_score && (
                      <div className="flex justify-between">
                        <span>GRE:</span>
                        <span className="font-medium">{program.requirements.gre_score}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Academic Requirements */}
              <div className="md:col-span-1">
                <h4 className="font-semibold text-gray-700 mb-3">Academic</h4>
                <div className="space-y-2">
                  {program.requirements.min_gpa && (
                    <div className="flex justify-between">
                      <span>Minimum GPA:</span>
                      <span className="font-medium">{program.requirements.min_gpa}</span>
                    </div>
                  )}
                  {program.requirements.other_tests && (
                    <div className="flex justify-between">
                      <span>Other Tests:</span>
                      <span className="font-medium">{program.requirements.other_tests}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Application Requirements */}
              <div className="md:col-span-1">
                <h4 className="font-semibold text-gray-700 mb-3">Application</h4>
                <div className="space-y-2">
                  {program.requirements.letters_of_recommendation && (
                    <div className="flex justify-between">
                      <span>Letters of Recommendation:</span>
                      <span className="font-medium">{program.requirements.letters_of_recommendation}</span>
                    </div>
                  )}
                  {program.requirements.application_fee && (
                    <div className="flex justify-between">
                      <span>Application Fee:</span>
                      <span className="font-medium">${program.requirements.application_fee}</span>
                    </div>
                  )}
                  {program.requirements.application_deadline && (
                    <div className="flex justify-between">
                      <span>Deadline:</span>
                      <span className="font-medium">
                        {new Date(program.requirements.application_deadline).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Required Documents */}
            {(program.requirements.requires_personal_statement || 
              program.requirements.requires_portfolio || 
              program.requirements.requires_cv) && (
              <div className="mt-6 pt-4 border-t">
                <h4 className="font-semibold text-gray-700 mb-3">Required Documents</h4>
                <div className="flex flex-wrap gap-2">
                  {program.requirements.requires_personal_statement && (
                    <Badge variant="outline">Personal Statement</Badge>
                  )}
                  {program.requirements.requires_portfolio && (
                    <Badge variant="outline">Portfolio</Badge>
                  )}
                  {program.requirements.requires_cv && (
                    <Badge variant="outline">CV/Resume</Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add-ons Section */}
      {program.add_ons && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Program Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {program.add_ons.scholarships && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Available Scholarships</h4>
                  <div className="flex flex-wrap gap-2">
                    {program.add_ons.scholarships.map((scholarship: string, index: number) => (
                      <Badge key={index} variant="secondary">{scholarship}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {program.add_ons.features && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Special Features</h4>
                  <div className="flex flex-wrap gap-2">
                    {program.add_ons.features.map((feature: string, index: number) => (
                      <Badge key={index} variant="outline">{feature}</Badge>
                    ))}
                  </div>
                </div>
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
            type="program"
            averageRating={ratingStats.averageRating}
            totalReviews={ratingStats.totalReviews}
          />
        </div>
      </div>
    </div>
  )
}