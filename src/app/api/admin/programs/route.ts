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

    const programData = {
      name: body.name,
      initial: body.initial || null,
      school_id: body.school_id,
      degree: body.degree,
      website_url: body.website_url || null,
      duration_months: body.duration_months || null,
      currency: body.currency || null,
      total_tuition: body.total_tuition || null,
      is_stem: body.is_stem || false,
      description: body.description || null,
      created_by: user.id,
    }

    // Validate required fields
    if (!programData.name) {
      return NextResponse.json({ error: 'Program name is required' }, { status: 400 })
    }
    
    if (!programData.school_id) {
      return NextResponse.json({ error: 'School ID is required' }, { status: 400 })
    }
    
    if (!programData.degree) {
      return NextResponse.json({ error: 'Degree is required' }, { status: 400 })
    }

    // Verify the school exists
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .select('id')
      .eq('id', programData.school_id)
      .single()

    if (schoolError || !school) {
      return NextResponse.json({ error: 'Invalid school ID' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('programs')
      .insert([programData])
      .select()
      .single()

    if (error) {
      console.error('Error creating program:', error)
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