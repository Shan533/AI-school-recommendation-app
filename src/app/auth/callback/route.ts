import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'
    const oauthError = searchParams.get('error')

    // Handle OAuth provider errors
    if (oauthError) {
      return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${oauthError}`)
    }

    if (!code) {
      return NextResponse.redirect(`${origin}/auth/auth-code-error?error=no_code`)
    }

    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Exchange code for session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error || !data.user) {
      console.error('Session exchange error:', error)
      return NextResponse.redirect(`${origin}/auth/auth-code-error?error=session_exchange`)
    }

    // Handle user profile
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

      shouldSetupUsername = true
    } else {
      // Check if existing user needs to set up username
      const emailPrefix = data.user.email?.split('@')[0]
      if (existingProfile.name === emailPrefix) {
        shouldSetupUsername = true
      }
    }

    // Redirect with proper cache headers
    const redirectUrl = shouldSetupUsername 
      ? `${origin}/auth/setup-username`
      : `${origin}${next}`

    const response = NextResponse.redirect(redirectUrl)
    response.headers.set('Cache-Control', 'no-cache, no-store, max-age=0')
    return response

  } catch (error) {
    console.error('Auth callback error:', error)
    const { origin } = new URL(request.url)
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=unexpected`)
  }
}