import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    // Get popular programs based on ratings (programs with reviews)
    const { data: programs, error } = await supabase
      .from('programs')
      .select(`
        id,
        name,
        initial,
        degree,
        duration_years,
        total_tuition,
        currency,
        is_stem,
        description,
        application_difficulty,
        schools (
          id,
          name,
          initial,
          region,
          location,
          qs_ranking
        ),
        program_reviews (
          rating
        )
      `)
      .not('program_reviews', 'is', null)

    if (error) {
      console.error('Error fetching popular programs:', error)
      return NextResponse.json(
        { error: 'Failed to fetch popular programs' },
        { status: 500 }
      )
    }

    // Calculate average rating and filter programs with ratings
    const programsWithRatings = programs
      ?.map(program => ({
        ...program,
        average_rating: program.program_reviews?.length > 0 
          ? program.program_reviews.reduce((sum, review) => sum + review.rating, 0) / program.program_reviews.length
          : 0,
        review_count: program.program_reviews?.length || 0
      }))
      .filter(program => program.review_count > 0)
      .sort((a, b) => b.average_rating - a.average_rating)
      .slice(0, 10)

    return NextResponse.json({
      success: true,
      data: programsWithRatings
    })

  } catch (error) {
    console.error('Unexpected error in popular programs API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
