import { NextResponse } from 'next/server'
import { getCurrentUser, isAdmin } from '@/lib/supabase/helpers'
import { createAdminClient } from '@/lib/supabase/server'

// POST /api/admin/create-missing-collections - Create default collections for users who don't have any
export async function POST() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userIsAdmin = await isAdmin(user.id)
    
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminSupabase = createAdminClient()

    // Get all users who don't have a "My Favorites" collection
    const { data: usersWithoutFavorites, error: queryError } = await adminSupabase
      .from('profiles')
      .select(`
        id,
        name,
        collections!left (
          id,
          name
        )
      `)

    if (queryError) {
      console.error('Error querying users:', queryError)
      return NextResponse.json({ error: 'Failed to query users' }, { status: 500 })
    }

    // Filter users who don't have "My Favorites" collection
    const usersNeedingDefaults = usersWithoutFavorites.filter(user => {
      const hasFavorites = user.collections?.some((col: { name: string }) => col.name === 'My Favorites')
      return !hasFavorites
    })

    console.log(`Found ${usersNeedingDefaults.length} users needing default collections`)

    // Create default collections for users who need them
    const collectionsToCreate = usersNeedingDefaults.map(user => ({
      user_id: user.id,
      name: 'My Favorites',
      description: 'My favorite schools and programs',
    }))

    if (collectionsToCreate.length > 0) {
      const { data: newCollections, error: insertError } = await adminSupabase
        .from('collections')
        .insert(collectionsToCreate)
        .select()

      if (insertError) {
        console.error('Error creating collections:', insertError)
        return NextResponse.json({ error: 'Failed to create collections' }, { status: 500 })
      }

      return NextResponse.json({
        message: `Created ${newCollections.length} default collections`,
        created: newCollections.length,
        users: usersNeedingDefaults.map(u => ({ id: u.id, name: u.name }))
      })
    } else {
      return NextResponse.json({
        message: 'All users already have default collections',
        created: 0
      })
    }

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
