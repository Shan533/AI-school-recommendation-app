import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { validateCareerData } from '@/lib/validation'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createAdminClient()
    const { id } = await params
    
    const { data: career, error } = await supabase
      .from('careers')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching career:', error)
      return NextResponse.json(
        { error: 'Career not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(career)
  } catch (error) {
    console.error('Error in career GET API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createAdminClient()
    const { id } = await params
    const body = await request.json()

    // Validate career data
    const validation = validateCareerData(body)
    if (!validation.valid) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validation.errors 
        },
        { status: 400 }
      )
    }

    // Check for duplicate name or abbreviation (excluding current career)
    const { data: existing } = await supabase
      .from('careers')
      .select('id')
      .or(`name.eq.${body.name},abbreviation.eq.${body.abbreviation}`)
      .neq('id', id)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Career with this name or abbreviation already exists' },
        { status: 409 }
      )
    }

    const { data: career, error } = await supabase
      .from('careers')
      .update({
        name: body.name,
        abbreviation: body.abbreviation,
        description: body.description || null,
        industry: body.industry || null,
        career_type: body.career_type,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating career:', error)
      return NextResponse.json(
        { error: 'Failed to update career' },
        { status: 500 }
      )
    }

    return NextResponse.json(career)
  } catch (error) {
    console.error('Error in career PUT API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createAdminClient()
    const { id } = await params
    
    // First check if career exists
    const { data: career, error: fetchError } = await supabase
      .from('careers')
      .select('id, name')
      .eq('id', id)
      .single()

    if (fetchError || !career) {
      console.error('Career not found:', fetchError)
      return NextResponse.json(
        { error: 'Career not found' },
        { status: 404 }
      )
    }

    // Check if career is being used in any category-career mappings
    const { data: mappings, error: mappingError } = await supabase
      .from('category_career_mapping')
      .select('category_id, career_id')
      .eq('career_id', id)
      .limit(1)

    if (mappingError) {
      console.error('Error checking career mappings:', mappingError)
      return NextResponse.json(
        { error: 'Failed to check career dependencies' },
        { status: 500 }
      )
    }

    if (mappings && mappings.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete career that is assigned to categories' },
        { status: 409 }
      )
    }

    // Delete the career
    const { error: deleteError } = await supabase
      .from('careers')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting career:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete career' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Career deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in career DELETE API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
