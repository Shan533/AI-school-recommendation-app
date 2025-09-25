import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    // Get all careers
    const { data: careers, error } = await supabase
      .from('careers')
      .select(`
        id,
        name,
        abbreviation,
        description,
        industry,
        career_type,
        created_at,
        updated_at
      `)
      .order('name')

    if (error) {
      console.error('Error fetching careers:', error)
      return NextResponse.json(
        { error: 'Failed to fetch careers' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: careers
    })

  } catch (error) {
    console.error('Unexpected error in careers API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
