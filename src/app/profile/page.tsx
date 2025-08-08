import { redirect } from 'next/navigation'
import { getCurrentUser, getUserProfile, getSupabaseClient } from '@/lib/supabase/helpers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StarRating } from '@/components/ui/star-rating'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import Link from 'next/link'

// Define types for profile page data
type SchoolData = {
  id: string
  name: string
  initial: string | null
}

type ProgramData = {
  id: string
  name: string
  initial: string | null
  schools: {
    name: string
    initial: string | null
  }
}

async function getUserReviews(userId: string) {
  const supabase = await getSupabaseClient()
  
  // Get school reviews
  const { data: schoolReviews, error: schoolError } = await supabase
    .from('school_reviews')
    .select(`
      id,
      rating,
      comment,
      created_at,
      schools!inner (
        id,
        name,
        initial
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  // Get program reviews
  const { data: programReviews, error: programError } = await supabase
    .from('program_reviews')
    .select(`
      id,
      rating,
      comment,
      created_at,
      programs!inner (
        id,
        name,
        initial,
        schools!inner (
          name,
          initial
        )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (schoolError) {
    console.error('Error fetching school reviews:', schoolError)
  }
  
  if (programError) {
    console.error('Error fetching program reviews:', programError)
  }
  
  return {
    schoolReviews: schoolReviews || [],
    programReviews: programReviews || []
  }
}

async function getReviewStats(userId: string) {
  const supabase = await getSupabaseClient()
  
  const [schoolReviews, programReviews] = await Promise.all([
    supabase.from('school_reviews').select('rating').eq('user_id', userId),
    supabase.from('program_reviews').select('rating').eq('user_id', userId)
  ])
  
  const totalSchoolReviews = schoolReviews.data?.length || 0
  const totalProgramReviews = programReviews.data?.length || 0
  const totalReviews = totalSchoolReviews + totalProgramReviews
  
  const allRatings = [
    ...(schoolReviews.data || []),
    ...(programReviews.data || [])
  ].map(r => r.rating)
  
  const averageRating = allRatings.length > 0 
    ? allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length
    : 0
  
  return {
    totalReviews,
    totalSchoolReviews,
    totalProgramReviews,
    averageRating
  }
}

export default async function ProfilePage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }
  
  const profile = await getUserProfile(user.id)
  const { schoolReviews, programReviews } = await getUserReviews(user.id)
  const stats = await getReviewStats(user.id)

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <Button asChild variant="outline">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>

      {/* Profile Header */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-2xl">
                {profile?.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">
                {profile?.name || 'User'}
              </CardTitle>
              <p className="text-gray-600">{user.email}</p>
              {profile?.is_admin && (
                <Badge className="mt-2">Administrator</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalReviews}</div>
              <div className="text-sm text-gray-600">Total Reviews</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.totalSchoolReviews}</div>
              <div className="text-sm text-gray-600">School Reviews</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.totalProgramReviews}</div>
              <div className="text-sm text-gray-600">Program Reviews</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '—'}
              </div>
              <div className="text-sm text-gray-600">Average Rating</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews Section */}
      <div className="space-y-8">
        {/* School Reviews */}
        <Card>
          <CardHeader>
            <CardTitle>My School Reviews ({schoolReviews.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {schoolReviews.length > 0 ? (
              <div className="space-y-4">
                {schoolReviews.map((review) => (
                  <div key={review.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-lg">
                          <Link 
                            href={`/schools/${(review.schools as unknown as SchoolData)?.id}`}
                            className="hover:text-blue-600 transition-colors"
                          >
                            {(review.schools as unknown as SchoolData)?.name}
                            {(review.schools as unknown as SchoolData)?.initial && ` (${(review.schools as unknown as SchoolData).initial})`}
                          </Link>
                        </h4>
                        <div className="flex items-center gap-3 mt-1">
                          <StarRating rating={review.rating} readonly size="sm" />
                          <span className="text-sm text-gray-500">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/schools/${(review.schools as unknown as SchoolData)?.id}`}>
                          Edit Review
                        </Link>
                      </Button>
                    </div>
                    <p className="text-gray-700">{review.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">You haven&apos;t reviewed any schools yet.</p>
                <Button asChild>
                  <Link href="/schools">Browse Schools</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Program Reviews */}
        <Card>
          <CardHeader>
            <CardTitle>My Program Reviews ({programReviews.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {programReviews.length > 0 ? (
              <div className="space-y-4">
                {programReviews.map((review) => (
                  <div key={review.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-lg">
                          <Link 
                            href={`/programs/${(review.programs as unknown as ProgramData)?.id}`}
                            className="hover:text-blue-600 transition-colors"
                          >
                            {(review.programs as unknown as ProgramData)?.name}
                            {(review.programs as unknown as ProgramData)?.initial && ` (${(review.programs as unknown as ProgramData).initial})`}
                          </Link>
                        </h4>
                        <p className="text-sm text-gray-600">
                          at {(review.programs as unknown as ProgramData)?.schools?.name}
                          {(review.programs as unknown as ProgramData)?.schools?.initial && ` (${(review.programs as unknown as ProgramData).schools.initial})`}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <StarRating rating={review.rating} readonly size="sm" />
                          <span className="text-sm text-gray-500">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/programs/${(review.programs as unknown as ProgramData)?.id}`}>
                          Edit Review
                        </Link>
                      </Button>
                    </div>
                    <p className="text-gray-700">{review.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">You haven&apos;t reviewed any programs yet.</p>
                <Button asChild>
                  <Link href="/programs">Browse Programs</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button asChild>
              <Link href="/schools">Browse Schools</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/programs">Browse Programs</Link>
            </Button>
            {profile?.is_admin && (
              <Button asChild variant="secondary">
                <Link href="/admin/dashboard">Admin Dashboard</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}