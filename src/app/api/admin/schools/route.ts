import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, isAdmin, getSupabaseClient } from '@/lib/supabase/helpers'

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

    const body = await request.json()
    const supabase = await getSupabaseClient()

    const schoolData = {
      name: body.name,
      initial: body.initial || null,
      type: body.type || null,
      region: body.region || (body.country ?? null),
      location: body.location || null,
      year_founded: body.year_founded || null,
      qs_ranking: body.qs_ranking || null,
      website_url: body.website_url || null,
      created_by: user.id,
    }

    // Validate required fields
    if (!schoolData.name) {
      return NextResponse.json({ error: 'School name is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('schools')
      .insert([schoolData])
      .select()
      .single()

    if (error) {
      console.error('Error creating school:', error)
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