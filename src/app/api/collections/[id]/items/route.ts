import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getSupabaseClient } from '@/lib/supabase/helpers'
import { validateCollectionItemData } from '@/lib/validation'

// POST /api/collections/[id]/items - Add item to collection
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: collectionId } = await params
    const body = await request.json()
    
    // Validate collection item data
    const validationErrors = validateCollectionItemData(body)
    if (validationErrors.length > 0) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validationErrors 
      }, { status: 400 })
    }

    const supabase = await getSupabaseClient()

    // Check if collection exists and belongs to user
    const { error: collectionError } = await supabase
      .from('collections')
      .select('id')
      .eq('id', collectionId)
      .eq('user_id', user.id)
      .single()

    if (collectionError) {
      if (collectionError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
      }
      console.error('Error checking collection:', collectionError)
      return NextResponse.json({ error: 'Error checking collection' }, { status: 500 })
    }

    // Check if item already exists in collection
    const existingItemQuery = supabase
      .from('collection_items')
      .select('id')
      .eq('collection_id', collectionId)

    if (body.school_id) {
      existingItemQuery.eq('school_id', body.school_id)
    } else {
      existingItemQuery.eq('program_id', body.program_id)
    }

    const { data: existingItem, error: existingError } = await existingItemQuery.single()

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error checking existing item:', existingError)
      return NextResponse.json({ error: 'Error checking existing item' }, { status: 500 })
    }

    if (existingItem) {
      return NextResponse.json({ 
        error: 'Item already exists in collection' 
      }, { status: 409 })
    }

    // Verify that the school or program exists
    if (body.school_id) {
      const { data: school, error: schoolError } = await supabase
        .from('schools')
        .select('id')
        .eq('id', body.school_id)
        .single()

      if (schoolError || !school) {
        return NextResponse.json({ error: 'School not found' }, { status: 404 })
      }
    } else {
      const { data: program, error: programError } = await supabase
        .from('programs')
        .select('id')
        .eq('id', body.program_id)
        .single()

      if (programError || !program) {
        return NextResponse.json({ error: 'Program not found' }, { status: 404 })
      }
    }

    const itemData = {
      collection_id: collectionId,
      school_id: body.school_id || null,
      program_id: body.program_id || null,
      notes: body.notes?.trim() || null,
    }

    const { data, error } = await supabase
      .from('collection_items')
      .insert([itemData])
      .select(`
        id,
        notes,
        created_at,
        school_id,
        program_id,
        schools (
          id,
          name,
          initial,
          location,
          region
        ),
        programs (
          id,
          name,
          initial,
          degree,
          schools!inner (
            name,
            initial
          )
        )
      `)
      .single()

    if (error) {
      console.error('Error adding item to collection:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
