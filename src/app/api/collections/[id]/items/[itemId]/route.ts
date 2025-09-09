import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getSupabaseClient } from '@/lib/supabase/helpers'


// DELETE /api/collections/[id]/items/[itemId] - Remove item from collection
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: collectionId, itemId } = await params
    const supabase = await getSupabaseClient()

    // Check if collection belongs to user and item exists in collection
    const { data: item, error: itemError } = await supabase
      .from('collection_items')
      .select(`
        id,
        collections!inner (
          user_id
        )
      `)
      .eq('id', itemId)
      .eq('collection_id', collectionId)
      .single()

    if (itemError) {
      if (itemError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 })
      }
      console.error('Error checking item:', itemError)
      return NextResponse.json({ error: 'Error checking item' }, { status: 500 })
    }

    // Check if collection belongs to current user
    // Note: Supabase returns collections as array due to join, but we know it's single due to !inner
    const collections = item.collections as unknown as { user_id: string }
    if (collections.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete the item
    const { error } = await supabase
      .from('collection_items')
      .delete()
      .eq('id', itemId)
      .eq('collection_id', collectionId)

    if (error) {
      console.error('Error removing item from collection:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Item removed from collection successfully' })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

// PUT /api/collections/[id]/items/[itemId] - Update item notes
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: collectionId, itemId } = await params
    const body = await request.json()
    const supabase = await getSupabaseClient()

    // Validate notes
    if (body.notes && typeof body.notes === 'string' && body.notes.length > 500) {
      return NextResponse.json({ 
        error: 'Notes must be less than 500 characters' 
      }, { status: 400 })
    }

    // Check if collection belongs to user and item exists in collection
    const { data: item, error: itemError } = await supabase
      .from('collection_items')
      .select(`
        id,
        collections!inner (
          user_id
        )
      `)
      .eq('id', itemId)
      .eq('collection_id', collectionId)
      .single()

    if (itemError) {
      if (itemError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Item not found in this collection' }, { status: 404 })
      }
      console.error('Error checking item:', itemError)
      return NextResponse.json({ error: 'Error checking item' }, { status: 500 })
    }

    // Check if collection belongs to current user
    // Note: Supabase returns collections as array due to join, but we know it's single due to !inner
    const collections = item.collections as unknown as { user_id: string }
    if (collections.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update the item notes
    const { data, error } = await supabase
      .from('collection_items')
      .update({ notes: body.notes?.trim() || null })
      .eq('id', itemId)
      .eq('collection_id', collectionId)
      .select()

    if (error) {
      console.error('Error updating item notes:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Check if we got any results
    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Update failed - no rows affected' }, { status: 500 })
    }
    
    const updatedItem = data[0]

    // Get the complete item data with relations after successful update
    const { data: completeItem, error: fetchError } = await supabase
      .from('collection_items')
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
          country
        ),
        programs (
          id,
          name,
          initial,
          degree,
          schools (
            name,
            initial
          )
        )
      `)
      .eq('id', updatedItem.id)
      .single()

    if (fetchError) {
      console.error('Error fetching updated item:', fetchError)
      // Return basic update result if fetch fails
      return NextResponse.json(updatedItem)
    }

    return NextResponse.json(completeItem)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
