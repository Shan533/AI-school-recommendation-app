import { createClient } from '@/lib/supabase/server'
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