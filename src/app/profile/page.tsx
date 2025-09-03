import { redirect } from 'next/navigation'
import { getCurrentUser, getUserProfile, getSupabaseClient } from '@/lib/supabase/helpers'

import ProfileContent from '@/components/profile/profile-content'

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
    <ProfileContent 
      profile={profile}
      user={user}
      schoolReviews={schoolReviews}
      programReviews={programReviews}
      stats={stats}
    />
  )
}