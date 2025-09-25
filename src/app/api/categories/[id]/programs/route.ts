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
    
    // First verify category exists
    const { data: category, error: categoryError } = await supabase
      .from('program_categories')
      .select('id, name')
      .eq('id', id)
      .single()

    if (categoryError || !category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Get programs for this category
    const { data: programs, error: programsError } = await supabase
      .from('program_category_mapping')
      .select(`
        is_primary,
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
          difficulty_description,
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
      .eq('category_id', id)
      .order('is_primary', { ascending: false })
      .range(offset, offset + limit - 1)

    if (programsError) {
      console.error('Error fetching category programs:', programsError)
      return NextResponse.json(
        { error: 'Failed to fetch programs' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('program_category_mapping')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id)

    return NextResponse.json({
      success: true,
      data: {
        category: {
          id: category.id,
          name: category.name
        },
        programs: programs?.map(p => ({
          ...p.programs,
          is_primary_category: p.is_primary
        })) || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / limit)
        }
      }
    })

  } catch (error) {
    console.error('Unexpected error in category programs API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}