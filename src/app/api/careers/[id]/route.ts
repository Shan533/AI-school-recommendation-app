import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase/helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const offset = (page - 1) * limit

    const supabase = await getSupabaseClient()
    
    // Get career details
    const { data: career, error: careerError } = await supabase
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
      .eq('id', id)
      .single()

    if (careerError) {
      console.error('Error fetching career:', careerError)
      return NextResponse.json(
        { error: 'Career not found' },
        { status: 404 }
      )
    }

    // Get related programs through both category mapping and direct program mapping
    const { data: categoryPrograms } = await supabase
      .from('category_career_mapping')
      .select(`
        program_categories!inner (
          program_category_mapping (
            programs (
              id,
              name,
              initial,
              degree,
              duration_years,
              total_tuition,
              currency,
              is_stem,
              description,
              delivery_method,
              schedule_type,
              location,
              application_difficulty,
              schools (
                id,
                name,
                initial,
                region,
                location,
                qs_ranking
              )
            )
          )
        )
      `)
      .eq('career_id', id)
      .eq('is_default', true)

    const { data: directPrograms } = await supabase
      .from('program_career_mapping')
      .select(`
        programs (
          id,
          name,
          initial,
          degree,
          duration_years,
          total_tuition,
          currency,
          is_stem,
          description,
          delivery_method,
          schedule_type,
          location,
          application_difficulty,
          schools (
            id,
            name,
            initial,
            region,
            location,
            qs_ranking
          )
        )
      `)
      .eq('career_id', id)

    // Combine and deduplicate programs
    const allPrograms = [
      ...(categoryPrograms?.flatMap(cp => 
        (cp.program_categories as unknown as {program_category_mapping?: Array<{programs: unknown}>}).program_category_mapping?.map((pcm) => pcm.programs) || []
      ) || []),
      ...(directPrograms?.map(dp => dp.programs) || [])
    ]

    // Remove duplicates based on program ID
    const uniquePrograms = allPrograms.filter((program, index, self) => 
      index === self.findIndex(p => (p as unknown as {id: string}).id === (program as unknown as {id: string}).id)
    )

    // Apply pagination
    const paginatedPrograms = uniquePrograms.slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      data: {
        career,
        programs: paginatedPrograms,
        pagination: {
          page,
          limit,
          total: uniquePrograms.length,
          total_pages: Math.ceil(uniquePrograms.length / limit)
        }
      }
    })

  } catch (error) {
    console.error('Unexpected error in career API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
