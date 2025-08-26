import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, isAdmin, getSupabaseClient } from '@/lib/supabase/helpers'
import { createAdminClient } from '@/lib/supabase/server'
import { validateProgramData, validateRequirementsData } from '@/lib/validation'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userIsAdmin = await isAdmin(user.id)
    
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const supabase = await getSupabaseClient()

    const { data: programs, error } = await supabase
      .from('programs')
      .select(`
        *,
        schools (
          name,
          initial
        ),
        requirements (
          *
        )
      `)
      .eq('id', id)

    if (error) {
      console.error('Error fetching program:', error)
      return NextResponse.json({ error: 'Error fetching program' }, { status: 500 })
    }

    if (!programs || programs.length === 0) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    return NextResponse.json(programs[0])
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Authentication
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userIsAdmin = await isAdmin(user.id)
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get request body
    const body = await request.json()

    const supabase = await getSupabaseClient()

    // Check if program exists
    const { data: existingPrograms, error: checkError } = await supabase
      .from('programs')
      .select('id')
      .eq('id', id)

    if (checkError) {
      console.error('Error checking program:', checkError)
      return NextResponse.json({ error: 'Error checking program' }, { status: 500 })
    }

    if (!existingPrograms || existingPrograms.length === 0) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

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

    // Helper function to clean string values
    const cleanString = (value: unknown): string | null => {
      if (typeof value !== 'string') return value as string | null
      const trimmed = value.trim()
      return trimmed === '' ? null : trimmed
    }

    // Helper function to clean numeric values with validation
    const cleanNumber = (value: unknown): number | null => {
      if (value === null || value === undefined || value === '') return null
      const num = typeof value === 'string' ? parseFloat(value) : value as number
      return isNaN(num) ? null : num
    }



    // Complete update data with all fields
    const updateData = {
      name: body.name?.trim() || null,
      initial: cleanString(body.initial),
      school_id: body.school_id?.trim() || null,
      degree: body.degree?.trim() || null,
      website_url: cleanString(body.website_url),
      duration_years: cleanNumber(body.duration_years),
      currency: cleanString(body.currency),
      total_tuition: cleanNumber(body.total_tuition),
      is_stem: Boolean(body.is_stem),
      description: cleanString(body.description),
      credits: cleanNumber(body.credits),
      delivery_method: cleanString(body.delivery_method),
      schedule_type: cleanString(body.schedule_type),
      location: cleanString(body.location),
      add_ons: addOns,
      start_date: cleanString(body.start_date),
    }

    // Validate required fields
    if (!updateData.name || !updateData.degree || !updateData.school_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate numeric ranges
    const validationErrors = validateProgramData(updateData)
    if (validationErrors.length > 0) {
      return NextResponse.json({ error: validationErrors.join(', ') }, { status: 400 })
    }

    // Verify the school exists
    const { data: schools, error: schoolError } = await supabase
      .from('schools')
      .select('id')
      .eq('id', updateData.school_id)

    if (schoolError) {
      console.error('Error verifying school:', schoolError)
      return NextResponse.json({ error: 'Error verifying school' }, { status: 500 })
    }

    if (!schools || schools.length === 0) {
      return NextResponse.json({ error: 'Invalid school ID' }, { status: 400 })
    }

    // Perform update using admin client to bypass RLS policies
    const adminClient = createAdminClient()
    const { data: programs, error: programError } = await adminClient
      .from('programs')
      .update(updateData)
      .eq('id', id)
      .select()

    if (programError) {
      console.error('Error updating program:', programError)
      return NextResponse.json({ error: programError.message }, { status: 500 })
    }

    if (!programs || programs.length === 0) {
      return NextResponse.json({ error: 'Program not found or update failed' }, { status: 404 })
    }

    const program = programs[0]

    // Handle requirements update
    const requirementsData = {
      ielts_score: cleanNumber(body.ielts_score),
      toefl_score: cleanNumber(body.toefl_score),
      gre_score: cleanNumber(body.gre_score),
      min_gpa: cleanNumber(body.min_gpa),
      other_tests: cleanString(body.other_tests),
      requires_personal_statement: Boolean(body.requires_personal_statement),
      requires_portfolio: Boolean(body.requires_portfolio),
      requires_cv: Boolean(body.requires_cv),
      letters_of_recommendation: cleanNumber(body.letters_of_recommendation),
      application_fee: cleanNumber(body.application_fee),
      application_deadline: cleanString(body.application_deadline),
    }

    // Validate requirements ranges
    const reqValidationErrors = validateRequirementsData(requirementsData)
    if (reqValidationErrors.length > 0) {
      return NextResponse.json({ error: reqValidationErrors.join(', ') }, { status: 400 })
    }

    // Check if requirements exist for this program
    const { data: existingReq } = await adminClient
      .from('requirements')
      .select('id')
      .eq('program_id', id)

    // Only update/insert requirements if at least one field is provided
    const hasRequirements = Object.entries(requirementsData).some(([, value]) => 
      value !== null && value !== '' && value !== false
    )

    if (hasRequirements) {
      if (existingReq && existingReq.length > 0) {
        // Update existing requirements
        const { error: reqUpdateError } = await adminClient
          .from('requirements')
          .update(requirementsData)
          .eq('program_id', id)

        if (reqUpdateError) {
          console.error('Error updating requirements:', reqUpdateError)
        }
      } else {
        // Insert new requirements
        const { error: reqInsertError } = await adminClient
          .from('requirements')
          .insert([{ ...requirementsData, program_id: id }])

        if (reqInsertError) {
          console.error('Error creating requirements:', reqInsertError)
        }
      }
    } else if (existingReq && existingReq.length > 0) {
      // Delete requirements if no fields are provided
      const { error: reqDeleteError } = await adminClient
        .from('requirements')
        .delete()
        .eq('program_id', id)

      if (reqDeleteError) {
        console.error('Error deleting requirements:', reqDeleteError)
      }
    }

    return NextResponse.json(program)
    
  } catch (error) {
    console.error('PUT API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}



export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userIsAdmin = await isAdmin(user.id)
    
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const supabase = await getSupabaseClient()

    // Check if program exists
    const { data: existingPrograms, error: checkError } = await supabase
      .from('programs')
      .select('id')
      .eq('id', id)

    if (checkError) {
      console.error('Error checking program:', checkError)
      return NextResponse.json({ error: 'Error checking program' }, { status: 500 })
    }

    if (!existingPrograms || existingPrograms.length === 0) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    // Delete requirements first (due to foreign key constraint)
    const { error: reqDeleteError } = await supabase
      .from('requirements')
      .delete()
      .eq('program_id', id)

    if (reqDeleteError) {
      console.error('Error deleting requirements:', reqDeleteError)
      // Continue with program deletion even if requirements deletion fails
    }

    // Delete program
    const { error } = await supabase
      .from('programs')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting program:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Program deleted successfully' })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
