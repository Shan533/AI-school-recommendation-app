import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, isAdmin } from '@/lib/supabase/helpers'
import { createAdminClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

// POST /api/admin/users/invite - Invite a new user
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userIsAdmin = await isAdmin(user.id)
    
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { email, isAdminUser = false } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()

    // Check if user already exists
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      console.error('Error checking existing users:', listError)
      return NextResponse.json({ error: 'Failed to check existing users' }, { status: 500 })
    }
    
    const existingUser = users.find(u => u.email === email)
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 })
    }

    // Get the site URL for redirect
    const headersList = await headers()
    let siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    
    if (!siteUrl) {
      const host = headersList.get('host')
      const protocol = headersList.get('x-forwarded-proto') || 'http'
      
      if (host) {
        siteUrl = `${protocol}://${host}`
      } else if (process.env.VERCEL_URL) {
        siteUrl = `https://${process.env.VERCEL_URL}`
      } else {
        siteUrl = 'http://localhost:3000'
      }
    }

    // Generate invite link
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${siteUrl}/auth/callback`,
      data: {
        is_admin: isAdminUser,
        invited_by: user.id
      }
    })

    if (error) {
      console.error('Error inviting user:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'User invited successfully',
      user: data.user 
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
