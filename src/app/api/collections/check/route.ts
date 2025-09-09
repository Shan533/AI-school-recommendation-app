import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getSupabaseClient } from '@/lib/supabase/helpers'


// GET /api/collections/check?school_id=xxx or ?program_id=xxx
// Check if school or program is in any of user's collections
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('school_id')
    const programId = searchParams.get('program_id')

    if (!schoolId && !programId) {
      return NextResponse.json({ 
        error: 'Either school_id or program_id is required' 
      }, { status: 400 })
    }

    if (schoolId && programId) {
      return NextResponse.json({ 
        error: 'Cannot specify both school_id and program_id' 
      }, { status: 400 })
    }

    const supabase = await getSupabaseClient()

    // Find collections containing the item
    let query = supabase
      .from('collection_items')
      .select(`
        id,
        collection_id,
        collections!inner (
          id,
          name,
          user_id
        )
      `)
      .eq('collections.user_id', user.id)

    if (schoolId) {
      query = query.eq('school_id', schoolId)
    } else {
      query = query.eq('program_id', programId)
    }

    const { data: items, error } = await query

    if (error) {
      console.error('Error checking collections:', error)
      return NextResponse.json({ error: 'Error checking collections' }, { status: 500 })
    }

    const collections = items?.map(item => {
      // Note: Supabase returns collections as array due to join, but we know it's single due to !inner
      const collection = item.collections as unknown as { id: string; name: string; user_id: string }
      return {
        collection_id: item.collection_id,
        collection_name: collection.name,
        item_id: item.id
      }
    }) || []

    return NextResponse.json({
      in_collections: collections.length > 0,
      collections
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
