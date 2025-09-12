import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getSupabaseClient } from '@/lib/supabase/helpers'
import { createAdminClient } from '@/lib/supabase/server'
import { validateCollectionData } from '@/lib/validation'

// GET /api/collections/[id] - Get collection with items
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = await getSupabaseClient()

    // Get collection with items and related data
    const { data: collection, error } = await supabase
      .from('collections')
      .select(`
        id,
        name,
        description,
        created_at,
        updated_at,
        collection_items (
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
            country
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
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
      }
      console.error('Error fetching collection:', error)
      return NextResponse.json({ error: 'Error fetching collection' }, { status: 500 })
    }

    return NextResponse.json(collection)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

// PUT /api/collections/[id] - Update collection
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    
    // Validate collection data
    const validationErrors = validateCollectionData(body)
    if (validationErrors.length > 0) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validationErrors 
      }, { status: 400 })
    }

    const supabase = await getSupabaseClient()

    // Check if collection exists (RLS will handle user ownership)
    const { error: checkError } = await supabase
      .from('collections')
      .select('id')
      .eq('id', id)
      .single()

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
      }
      console.error('Error checking collection:', checkError)
      return NextResponse.json({ error: 'Error checking collection' }, { status: 500 })
    }

    const updateData = {
      name: body.name.trim(),
      description: body.description?.trim() || null,
    }
    
    // Only include description in update if it's not empty
    if (updateData.description === null) {
      delete updateData.description
    }

    // Use admin client to bypass RLS for update, fallback to regular client in tests
    let updateClient
    try {
      updateClient = createAdminClient()
    } catch {
      // Fallback to regular client in test environment
      updateClient = supabase
    }
    
    const { data, error } = await updateClient
      .from('collections')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id) // Still check user ownership for security
      .select()

    if (error) {
      console.error('Error updating collection:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data || data.length === 0) {
      // If no data returned from update, fetch the updated collection
      const { data: updatedCollection, error: fetchError } = await updateClient
        .from('collections')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (fetchError) {
        console.error('Error fetching updated collection:', fetchError)
        return NextResponse.json({ error: 'Update successful but could not fetch result' }, { status: 500 })
      }

      if (!updatedCollection) {
        return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
      }

      return NextResponse.json(updatedCollection)
    }

    return NextResponse.json(data[0])
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

// DELETE /api/collections/[id] - Delete collection
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = await getSupabaseClient()

    // Check if collection exists (RLS will handle user ownership)
    const { error: checkError } = await supabase
      .from('collections')
      .select('id')
      .eq('id', id)
      .single()

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
      }
      console.error('Error checking collection:', checkError)
      return NextResponse.json({ error: 'Error checking collection' }, { status: 500 })
    }

    // Delete collection (items will be deleted automatically due to CASCADE)
    const { data, error } = await supabase
      .from('collections')
      .delete()
      .eq('id', id)
      .select()

    if (error) {
      console.error('Error deleting collection:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Collection deleted successfully' })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
