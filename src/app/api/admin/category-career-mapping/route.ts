import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// GET /api/admin/category-career-mapping - Get all category-career mappings
export async function GET() {
  try {
    const supabase = await createAdminClient()
    
    const { data: mappings, error } = await supabase
      .from('category_career_mapping')
      .select(`
        category_id,
        career_id,
        is_default,
        program_categories(
          id,
          name,
          abbreviation
        ),
        careers(
          id,
          name,
          abbreviation
        )
      `)
      .eq('is_default', true)
      .order('category_id, career_id')

    if (error) {
      console.error('Error fetching category-career mappings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch category-career mappings' },
        { status: 500 }
      )
    }

    // Transform the data to a more useful format
    const categoryCareerMap: Record<string, Array<{ id: string; name: string; abbreviation: string }>> = {}
    
    mappings?.forEach((mapping: Record<string, unknown>) => {
      const categoryId = mapping.category_id as string
      const career = mapping.careers as Record<string, unknown>
      
      if (career) {
        if (!categoryCareerMap[categoryId]) {
          categoryCareerMap[categoryId] = []
        }
        categoryCareerMap[categoryId].push({
          id: career.id as string,
          name: career.name as string,
          abbreviation: career.abbreviation as string
        })
      }
    })

    return NextResponse.json({
      mappings: categoryCareerMap,
      raw: mappings
    })
  } catch (error) {
    console.error('Error in category-career mapping API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/admin/category-career-mapping - Add a career to a category
export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient()
    const body = await request.json()

    const { category_id, career_id } = body

    if (!category_id || !career_id) {
      return NextResponse.json(
        { error: 'category_id and career_id are required' },
        { status: 400 }
      )
    }

    // Check if mapping already exists
    const { data: existing } = await supabase
      .from('category_career_mapping')
      .select('id')
      .eq('category_id', category_id)
      .eq('career_id', career_id)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'This career is already mapped to this category' },
        { status: 409 }
      )
    }

    const { data: mapping, error } = await supabase
      .from('category_career_mapping')
      .insert([{
        category_id,
        career_id,
        is_default: true
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating category-career mapping:', error)
      return NextResponse.json(
        { error: 'Failed to create mapping' },
        { status: 500 }
      )
    }

    return NextResponse.json(mapping, { status: 201 })
  } catch (error) {
    console.error('Create mapping API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/category-career-mapping - Remove a career from a category
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createAdminClient()
    const { searchParams } = new URL(request.url)
    
    const category_id = searchParams.get('category_id')
    const career_id = searchParams.get('career_id')

    if (!category_id || !career_id) {
      return NextResponse.json(
        { error: 'category_id and career_id are required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('category_career_mapping')
      .delete()
      .eq('category_id', category_id)
      .eq('career_id', career_id)

    if (error) {
      console.error('Error deleting category-career mapping:', error)
      return NextResponse.json(
        { error: 'Failed to delete mapping' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete mapping API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}