import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getSupabaseClient } from '@/lib/supabase/helpers'
import { validateCollectionData } from '@/lib/validation'

// GET /api/collections - Get user's collections
export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await getSupabaseClient()
    
    // Get collections with item counts
    const { data: collections, error } = await supabase
      .from('collections')
      .select(`
        id,
        name,
        description,
        created_at,
        updated_at,
        collection_items (
          id
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching collections:', error)
      return NextResponse.json({ error: 'Error fetching collections' }, { status: 500 })
    }

    // Transform data to include item counts
    const collectionsWithCounts = collections?.map(collection => ({
      id: collection.id,
      name: collection.name,
      description: collection.description,
      created_at: collection.created_at,
      updated_at: collection.updated_at,
      item_count: collection.collection_items?.length || 0
    })) || []

    return NextResponse.json(collectionsWithCounts)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

// POST /api/collections - Create new collection
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    const collectionData = {
      user_id: user.id,
      name: body.name.trim(),
      description: body.description?.trim() || null,
    }

    const { data, error } = await supabase
      .from('collections')
      .insert([collectionData])
      .select()
      .single()

    if (error) {
      console.error('Error creating collection:', error)
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
