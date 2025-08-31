import { redirect } from 'next/navigation'
import { getCurrentUser, isAdmin } from '@/lib/supabase/helpers'
import { createAdminClient } from '@/lib/supabase/server'
import { getSupabaseClient } from '@/lib/supabase/helpers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StarRating } from '@/components/ui/star-rating'

import { DeleteReviewButton } from '@/components/admin/delete-review-button'
import { AdminSearchCard } from '@/components/admin/admin-search-card'
import { searchConfigs } from '@/lib/admin-search'

interface ReviewWithDetails {
  id: string
  rating: number
  comment: string
  created_at: string
  user_id: string
  school_id?: string
  program_id?: string
  profiles: {
    name: string
  } | null
  schools?: {
    name: string
    initial?: string
  } | null
  programs?: {
    name: string
    initial?: string
    schools: {
      name: string
      initial?: string
    } | null
  } | null
}

async function getAllReviews(searchTerm?: string) {
  try {
    const supabase = await getSupabaseClient()
    
    // Get school reviews using the same pattern as existing pages
    const { data: schoolReviews, error: schoolError } = await supabase
      .from('school_reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        user_id,
        school_id
      `)
      .order('created_at', { ascending: false })

    const { data: programReviews, error: programError } = await supabase
      .from('program_reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        user_id,
        program_id
      `)
      .order('created_at', { ascending: false })

    console.log('School reviews count:', schoolReviews?.length || 0)
    console.log('Program reviews count:', programReviews?.length || 0)

    if (schoolError) {
      console.error('School reviews error:', schoolError)
    }
    if (programError) {
      console.error('Program reviews error:', programError)
    }

    const allReviews = [
      ...(schoolReviews || []),
      ...(programReviews || [])
    ]

    if (allReviews.length === 0) {
      console.log('No reviews found in database')
      return []
    }

    // Get all unique user IDs
    const userIds = [...new Set(allReviews.map(review => review.user_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', userIds)

    // Get school names for school reviews
    const schoolIds = [...new Set(schoolReviews?.map(review => review.school_id).filter(Boolean) || [])]
    const { data: schools } = schoolIds.length > 0 ? await supabase
      .from('schools')
      .select('id, name, initial')
      .in('id', schoolIds) : { data: [] }

    // Get program names and school names for program reviews
    const programIds = [...new Set(programReviews?.map(review => review.program_id).filter(Boolean) || [])]
    const { data: programs } = programIds.length > 0 ? await supabase
      .from('programs')
      .select(`
        id,
        name,
        initial,
        schools:school_id (id, name, initial)
      `)
      .in('id', programIds) : { data: [] }

    // Combine all data
    const reviewsWithDetails: ReviewWithDetails[] = allReviews.map(review => {
      const profile = profiles?.find(p => p.id === review.user_id)
      
      if ('school_id' in review && review.school_id) {
        // School review
        const school = schools?.find(s => s.id === review.school_id)
        return {
          ...review,
          profiles: profile || null,
          schools: school || null
        } as ReviewWithDetails
      } else if ('program_id' in review && review.program_id) {
        // Program review
        const program = programs?.find(p => p.id === review.program_id)
        return {
          ...review,
          profiles: profile || null,
          programs: program || null
        } as ReviewWithDetails
      }
      
      return review as ReviewWithDetails
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // Apply search filter if searchTerm is provided
    let filteredReviews = reviewsWithDetails
    if (searchTerm && searchTerm.trim()) {
      const searchLower = searchTerm.trim().toLowerCase()
      console.log('Applying search filter for:', searchLower)
      
      filteredReviews = reviewsWithDetails.filter(review => {
        // Search in comment (handle null/undefined)
        const commentMatch = review.comment && review.comment.toLowerCase().includes(searchLower)
        
        // Search in user name (handle null/undefined)
        const userNameMatch = review.profiles?.name && review.profiles.name.toLowerCase().includes(searchLower)
        
        // Search in school name and initial (handle null/undefined)
        const schoolNameMatch = review.schools?.name && review.schools.name.toLowerCase().includes(searchLower)
        const schoolInitialMatch = review.schools?.initial && review.schools.initial.toLowerCase().includes(searchLower)
        
        // Search in program name and initial (handle null/undefined)
        const programNameMatch = review.programs?.name && review.programs.name.toLowerCase().includes(searchLower)
        const programInitialMatch = review.programs?.initial && review.programs.initial.toLowerCase().includes(searchLower)
        
        // Search in program's school name and initial (handle nested null/undefined)
        const programSchoolNameMatch = review.programs?.schools && (
          Array.isArray(review.programs.schools) 
            ? review.programs.schools.some(s => s?.name && s.name.toLowerCase().includes(searchLower))
            : review.programs.schools?.name && review.programs.schools.name.toLowerCase().includes(searchLower)
        )
        
        const programSchoolInitialMatch = review.programs?.schools && (
          Array.isArray(review.programs.schools) 
            ? review.programs.schools.some(s => s?.initial && s.initial.toLowerCase().includes(searchLower))
            : review.programs.schools?.initial && review.programs.schools.initial.toLowerCase().includes(searchLower)
        )
        
        const matches = commentMatch || userNameMatch || schoolNameMatch || schoolInitialMatch || 
                       programNameMatch || programInitialMatch || programSchoolNameMatch || programSchoolInitialMatch
        
        if (matches) {
          console.log('Match found in review:', review.id, {
            commentMatch: !!commentMatch,
            userNameMatch: !!userNameMatch,
            schoolNameMatch: !!schoolNameMatch,
            schoolInitialMatch: !!schoolInitialMatch,
            programNameMatch: !!programNameMatch,
            programInitialMatch: !!programInitialMatch,
            programSchoolNameMatch: !!programSchoolNameMatch,
            programSchoolInitialMatch: !!programSchoolInitialMatch
          })
        }
        
        return matches
      })
    }

    console.log('Total reviews with details:', reviewsWithDetails.length)
    console.log('Filtered reviews:', filteredReviews.length)
    console.log('Search term:', searchTerm)
    
    return filteredReviews
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return []
  }
}

async function getReviewStats() {
  try {
    const supabase = await getSupabaseClient()
    
    const [schoolReviews, programReviews] = await Promise.all([
      supabase.from('school_reviews').select('id, rating'),
      supabase.from('program_reviews').select('id, rating')
    ])

    console.log('School reviews stats:', schoolReviews.data?.length || 0)
    console.log('Program reviews stats:', programReviews.data?.length || 0)

    const totalReviews = (schoolReviews.data?.length || 0) + (programReviews.data?.length || 0)
    const allRatings = [
      ...(schoolReviews.data || []).map(r => r.rating),
      ...(programReviews.data || []).map(r => r.rating)
    ]
    const averageRating = allRatings.length > 0 
      ? allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length 
      : 0

    return {
      totalReviews,
      averageRating,
      schoolReviews: schoolReviews.data?.length || 0,
      programReviews: programReviews.data?.length || 0
    }
  } catch (error) {
    console.error('Error fetching review stats:', error)
    return {
      totalReviews: 0,
      averageRating: 0,
      schoolReviews: 0,
      programReviews: 0
    }
  }
}

async function deleteReview(formData: FormData) {
  'use server'
  
  const reviewId = formData.get('reviewId') as string
  const reviewType = formData.get('reviewType') as string
  
  if (!reviewId || !reviewType) {
    return
  }

  const supabaseAdmin = createAdminClient()
  const tableName = reviewType === 'school' ? 'school_reviews' : 'program_reviews'
  
  const { error } = await supabaseAdmin
    .from(tableName)
    .delete()
    .eq('id', reviewId)
  
  if (error) {
    console.error('Error deleting review:', error)
  }
  
  redirect('/admin/reviews')
}

export default async function AdminReviewsPage({
  searchParams
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

  const userIsAdmin = await isAdmin(user.id)
  
  if (!userIsAdmin) {
    redirect('/')
  }

  const { search } = await searchParams
  const [reviews, stats] = await Promise.all([
    getAllReviews(search),
    getReviewStats()
  ])

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Reviews Management</h1>
        <Button asChild>
          <a href="/admin/dashboard">Back to Dashboard</a>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.totalReviews}</div>
            <p className="text-sm text-gray-600">Total Reviews</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
            <p className="text-sm text-gray-600">Average Rating</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.schoolReviews}</div>
            <p className="text-sm text-gray-600">School Reviews</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.programReviews}</div>
            <p className="text-sm text-gray-600">Program Reviews</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <AdminSearchCard 
        placeholder={searchConfigs.reviews.placeholder}
        helpText={searchConfigs.reviews.helpText}
      />

      {/* Reviews List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              All Reviews ({reviews.length})
              {search && <span className="text-sm font-normal text-gray-500 ml-2">- Search: &ldquo;{search}&rdquo;</span>}
            </span>
            {search && reviews.length === 0 && (
              <Badge variant="outline" className="text-xs">
                No matches found
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              {search ? 'No reviews found matching your search.' : 'No reviews found.'}
            </p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => {
                const isSchoolReview = !!review.school_id
                
                // Get display names
                const profileName = review.profiles?.name
                const schoolName = review.schools?.name
                const programName = review.programs?.name
                const programSchoolName = Array.isArray(review.programs?.schools) 
                  ? review.programs?.schools[0]?.name 
                  : review.programs?.schools?.name
                
                const itemName = isSchoolReview 
                  ? schoolName 
                  : `${programName} (${programSchoolName})`

                return (
                  <div key={review.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-2">
                          <StarRating rating={review.rating} readonly size="sm" />
                          <span className="font-medium">{review.rating.toFixed(1)} stars</span>
                          <Badge variant={isSchoolReview ? "default" : "secondary"}>
                            {isSchoolReview ? "School" : "Program"}
                          </Badge>
                        </div>

                        {/* Item and User Info */}
                        <div className="mb-2">
                          <p className="font-semibold text-gray-900">{itemName || 'Unknown Item'}</p>
                          <p className="text-sm text-gray-600">
                            By: {profileName || 'Anonymous'} • {new Date(review.created_at).toLocaleDateString()}
                          </p>
                        </div>

                        {/* Comment */}
                        {review.comment ? (
                          <p className="text-gray-700 text-sm leading-relaxed">{review.comment}</p>
                        ) : (
                          <p className="text-gray-500 italic text-sm">Rating only review</p>
                        )}
                      </div>

                      {/* Delete Button */}
                      <div className="ml-4">
                        <DeleteReviewButton
                          reviewId={review.id}
                          reviewType={isSchoolReview ? 'school' : 'program'}
                          onDelete={deleteReview}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}