import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase/helpers'

export async function GET() {
  try {
    const supabase = await getSupabaseClient()
    
    // Get programs with related data
    const { data: programs, error } = await supabase
      .from('programs')
      .select(`
        id,
        name,
        initial,
        school_id,
        degree,
        duration_years,
        currency,
        total_tuition,
        is_stem,
        website_url,
        application_difficulty,
        delivery_method,
        schools (
          name,
          initial,
          location,
          region
        ),
        program_category_mapping!program_category_mapping_program_id_fkey (
          is_primary,
          program_categories (
            id,
            name,
            abbreviation
          )
        )
      `)
      .order('name')
    
    if (error) {
      console.error('Error fetching programs:', error)
      return NextResponse.json({ error: 'Failed to fetch programs' }, { status: 500 })
    }
    
    return NextResponse.json(programs || [])
  } catch (error) {
    console.error('Error in programs API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
