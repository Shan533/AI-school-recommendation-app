import { createClient } from '@/lib/supabase/server'
import { createAdminClient as createServerAdminClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function getSupabaseClient() {
  const cookieStore = await cookies()
  return createClient(cookieStore)
}

export async function getCurrentUser() {
  const supabase = await getSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export function createAdminClient() {
  return createServerAdminClient()
}

export async function getUserProfile(userId: string) {
  const supabase = await getSupabaseClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  return profile
}

export async function isAdmin(userId: string) {
  const profile = await getUserProfile(userId)
  return profile?.is_admin || false
}

export async function createDefaultCollection(userId: string) {
  const supabase = await getSupabaseClient()
  
  // Check if user already has a "My Favorites" collection
  const { data: existingCollection } = await supabase
    .from('collections')
    .select('id')
    .eq('user_id', userId)
    .eq('name', 'My Favorites')
    .single()

  if (existingCollection) {
    return existingCollection // Already exists
  }

  // Create default "My Favorites" collection
  const { data: newCollection, error } = await supabase
    .from('collections')
    .insert([
      {
        user_id: userId,
        name: 'My Favorites',
        description: 'My favorite schools and programs',
      },
    ])
    .select()
    .single()

  if (error) {
    console.error('Error creating default collection:', error)
    return null
  }

  return newCollection
}

// Collection helper functions
export async function getUserCollections(userId: string) {
  const supabase = await getSupabaseClient()
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
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching collections:', error)
    return []
  }
  
  // Transform data to include item counts
  return collections?.map(collection => ({
    id: collection.id,
    name: collection.name,
    description: collection.description,
    created_at: collection.created_at,
    updated_at: collection.updated_at,
    item_count: collection.collection_items?.length || 0
  })) || []
}

export async function getCollectionWithItems(collectionId: string, userId: string) {
  const supabase = await getSupabaseClient()
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
    .eq('id', collectionId)
    .eq('user_id', userId)
    .single()
  
  if (error) {
    console.error('Error fetching collection:', error)
    return null
  }
  
  return collection
}