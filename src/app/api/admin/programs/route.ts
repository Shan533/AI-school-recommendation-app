import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, isAdmin, getSupabaseClient, createAdminClient } from '@/lib/supabase/helpers'
import { EnhancedProgram, ProgramCategory, Career } from '@/lib/types/schema-enhancements'

// Type for program with related data from Supabase
interface ProgramWithRelations {
  id: string
  name: string
  school_id: string
  schools?: { name: string }
  program_category_mapping?: Array<{
    category_id: string
    is_primary: boolean
    program_categories: ProgramCategory
  }>
  program_career_mapping?: Array<{
    career_id: string
    is_custom: boolean
    careers: Career
  }>
  [key: string]: unknown
}

// GET /api/admin/programs - List programs with optional category information
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userIsAdmin = await isAdmin(user.id)
    
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const includeCategories = searchParams.get('include_categories') === 'true'
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search')

    const supabase = await createAdminClient()

    let selectFields = `
      *,
      schools!inner(name)
    `
    
    if (includeCategories) {
      selectFields += `,
        program_category_mapping(
          category_id,
          is_primary,
          program_categories(
            id,
            name,
            abbreviation,
            description
          )
        ),
        program_career_mapping(
          career_id,
          is_custom,
          careers(
            id,
            name,
            abbreviation,
            description
          )
        )`
    }

    let query = supabase
      .from('programs')
      .select(selectFields)
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1)

    if (search) {
      query = query.or(`name.ilike.%${search}%,schools.name.ilike.%${search}%`)
    }

    const { data: programs, error, count } = await query

    if (error) {
      console.error('Error fetching programs:', error)
      return NextResponse.json(
        { error: 'Failed to fetch programs' },
        { status: 500 }
      )
    }

    // Transform programs to include school_name and related data
    const transformedPrograms: EnhancedProgram[] = (programs as unknown as ProgramWithRelations[] || []).map(program => {
      const transformed: Partial<EnhancedProgram> = {
        ...program,
        school_name: program.schools?.name
      }

      if (includeCategories) {
        // Extract categories from program_category_mapping
        const programCategories = program.program_category_mapping || []
        transformed.categories = programCategories.map(mapping => mapping.program_categories).filter(Boolean)
        transformed.category_ids = programCategories.map(mapping => mapping.category_id)
        
        // Find primary category
        const primaryMapping = programCategories.find(mapping => mapping.is_primary)
        if (primaryMapping) {
          transformed.primary_category_id = primaryMapping.category_id
        }

        // Extract careers from program_career_mapping
        const programCareers = program.program_career_mapping || []
        transformed.careers = programCareers.map(mapping => mapping.careers).filter(Boolean)
        transformed.career_paths = programCareers.map(mapping => mapping.careers?.name).filter(Boolean)
      }

      return transformed as EnhancedProgram
    })

    return NextResponse.json({
      programs: transformedPrograms,
      total: count || 0
    })
  } catch (error) {
    console.error('Programs API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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