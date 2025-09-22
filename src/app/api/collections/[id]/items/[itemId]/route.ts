import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getSupabaseClient } from '@/lib/supabase/helpers'
import { 
  logError,
  logApiRequest,
  isValidUUID,
  validateNotes,
  addSecurityHeaders
} from '@/lib/api-utils-conservative'


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
    
    // Validate UUID format (production only)
    if (!isValidUUID(collectionId) || !isValidUUID(itemId)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    logApiRequest('DELETE', `/api/collections/${collectionId}/items/${itemId}`, user.id)
    
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
      logError('Error checking item', itemError)
      return NextResponse.json({ error: 'Error checking item' }, { status: 500 })
    }

    // Check if collection belongs to current user
    // Handle both array and single object cases from Supabase inner join
    const collections = Array.isArray(item.collections) ? item.collections[0] : item.collections
    if (!collections || collections.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete the item
    const { error } = await supabase
      .from('collection_items')
      .delete()
      .eq('id', itemId)
      .eq('collection_id', collectionId)

    if (error) {
      logError('Error removing item from collection', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const response = NextResponse.json({ message: 'Item removed from collection successfully' })
    return addSecurityHeaders(response)
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
    
    // Validate UUID format (production only)
    if (!isValidUUID(collectionId) || !isValidUUID(itemId)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }
    
    const body = await request.json()
    
    logApiRequest('PUT', `/api/collections/${collectionId}/items/${itemId}`, user.id, { 
      notesLength: body.notes?.length || 0 
    })
    
    const supabase = await getSupabaseClient()

    // Validate notes with enhanced security
    let validatedNotes: string | null
    try {
      validatedNotes = validateNotes(body.notes)
    } catch (error: unknown) {
      return NextResponse.json({ 
        error: error instanceof Error ? error.message : 'Validation failed' 
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
      logError('Error checking item', itemError)
      return NextResponse.json({ error: 'Error checking item' }, { status: 500 })
    }

    // Check if collection belongs to current user
    // Handle both array and single object cases from Supabase inner join
    const collections = Array.isArray(item.collections) ? item.collections[0] : item.collections
    if (!collections || collections.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update the item notes and return complete data in one query
    const { data, error } = await supabase
      .from('collection_items')
      .update({ notes: validatedNotes })
      .eq('id', itemId)
      .eq('collection_id', collectionId)
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
          schools (
            name,
            initial
          )
        )
      `)

    if (error) {
      logError('Error updating item notes', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Check if we got any results
    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Update failed - no rows affected' }, { status: 500 })
    }

    const response = NextResponse.json(data[0])
    return addSecurityHeaders(response)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
