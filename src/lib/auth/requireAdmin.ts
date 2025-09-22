import { createClient } from '@supabase/supabase-js'

// here use "user" client to read current logged in user, and check profile.role === 'admin'
export async function requireAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabase = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      detectSessionInUrl: false,
      // let Supabase read Next's cookie
      flowType: 'pkce',
    },
    global: {
      headers: {
        // if you use @supabase/ssr, you can inject cookies directly; here is omitted
      },
    },
  })

  // get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // check profile (or your role table)
  const { data: profile } = await supabase
    .from('profiles').select('id, role').eq('id', user.id).single()

  if (!profile || profile.role !== 'admin') return null
  return user
}
