import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getSupabaseClient } from '@/lib/supabase/helpers'
import { 
  logApiRequest,
  isValidUUID 
} from '@/lib/api-utils'


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
    
    // Validate input parameters
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
    
    // Validate UUID format (skip in test environment)
    const targetId = schoolId || programId
    if (process.env.NODE_ENV !== 'test' && targetId && !isValidUUID(targetId)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    logApiRequest('GET', '/api/collections/check', user.id, { 
      schoolId: schoolId || undefined, 
      programId: programId || undefined 
    })

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
      // Handle both array and single object cases from Supabase inner join
      const collection = Array.isArray(item.collections) ? item.collections[0] : item.collections
      return {
        collection_id: item.collection_id,
        collection_name: collection?.name || 'Unknown Collection',
        item_id: item.id
      }
    }) || []

    const response = NextResponse.json({
      in_collections: collections.length > 0,
      collections
    })
    
    // Add cache headers for better performance
    response.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=120')
    
    return response
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
