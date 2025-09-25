import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    // Get top schools by QS ranking (where ranking exists and is <= 100)
    const { data: schools, error } = await supabase
      .from('schools')
      .select(`
        id,
        name,
        initial,
        region,
        location,
        qs_ranking,
        website_url
      `)
      .not('qs_ranking', 'is', null)
      .lte('qs_ranking', 100)
      .order('qs_ranking')
      .limit(10)

    if (error) {
      console.error('Error fetching top schools:', error)
      return NextResponse.json(
        { error: 'Failed to fetch top schools' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: schools
    })

  } catch (error) {
    console.error('Unexpected error in top schools API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
