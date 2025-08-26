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

    // Parse add-ons JSON if provided
    let addOns = null
    if (body.add_ons && typeof body.add_ons === 'string') {
      try {
        addOns = JSON.parse(body.add_ons)
      } catch (e) {
        console.error('Invalid JSON in add_ons:', e)
      }
    } else if (body.add_ons && typeof body.add_ons === 'object') {
      addOns = body.add_ons
    }

    const programData = {
      name: body.name,
      initial: body.initial || null,
      school_id: body.school_id,
      degree: body.degree,
      website_url: body.website_url || null,
      duration_years: body.duration_years || null,
      currency: body.currency || null,
      total_tuition: body.total_tuition || null,
      is_stem: body.is_stem || false,
      description: body.description || null,
      credits: body.credits || null,
      delivery_method: body.delivery_method || null,
      schedule_type: body.schedule_type || null,
      location: body.location || null,
      add_ons: addOns,
      start_date: body.start_date || null,
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

    // Insert program first
    const { data: program, error: programError } = await supabase
      .from('programs')
      .insert([programData])
      .select()
      .single()

    if (programError) {
      console.error('Error creating program:', programError)
      return NextResponse.json({ error: programError.message }, { status: 500 })
    }

    // Insert requirements if any are provided
    const requirementsData = {
      program_id: program.id,
      ielts_score: body.ielts_score || null,
      toefl_score: body.toefl_score || null,
      gre_score: body.gre_score || null,
      min_gpa: body.min_gpa || null,
      other_tests: body.other_tests || null,
      requires_personal_statement: body.requires_personal_statement || false,
      requires_portfolio: body.requires_portfolio || false,
      requires_cv: body.requires_cv || false,
      letters_of_recommendation: body.letters_of_recommendation || null,
      application_fee: body.application_fee || null,
      application_deadline: body.application_deadline || null,
    }

    // Only insert requirements if at least one field is provided
    const hasRequirements = Object.entries(requirementsData).some(([key, value]) => 
      key !== 'program_id' && value !== null && value !== '' && value !== false
    )

    if (hasRequirements) {
      const { error: reqError } = await supabase
        .from('requirements')
        .insert([requirementsData])

      if (reqError) {
        console.error('Error creating requirements:', reqError)
        // Don't fail the whole operation if requirements fail
      }
    }

    return NextResponse.json(program, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}