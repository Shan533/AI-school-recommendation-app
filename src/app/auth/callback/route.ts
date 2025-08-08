import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      let shouldSetupUsername = false

      if (!existingProfile) {
        // Create basic profile for new OAuth user
        const defaultName = data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User'
        
        await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              name: defaultName,
              is_admin: false,
            },
          ])

        // New user should set up username
        shouldSetupUsername = true
      } else {
        // Check if existing user needs to set up username
        // If name is just email prefix, they should customize it
        const emailPrefix = data.user.email?.split('@')[0]
        if (existingProfile.name === emailPrefix) {
          shouldSetupUsername = true
        }
      }

      // Redirect to username setup if needed, otherwise to requested page
      if (shouldSetupUsername) {
        return NextResponse.redirect(`${origin}/auth/setup-username`)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}