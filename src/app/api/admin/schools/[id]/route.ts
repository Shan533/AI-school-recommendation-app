import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, isAdmin, getSupabaseClient } from '@/lib/supabase/helpers'
import { createAdminClient } from '@/lib/supabase/server'
import { validateSchoolData } from '@/lib/validation'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const { data: schools, error } = await supabase
      .from('schools')
      .select('*')
      .eq('id', id)

    if (error) {
      console.error('Error fetching school:', error)
      return NextResponse.json({ error: 'Error fetching school' }, { status: 500 })
    }

    if (!schools || schools.length === 0) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }

    return NextResponse.json(schools[0])
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
  { params }: { params: { id: string } }
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
    const body = await request.json()
    const supabase = await getSupabaseClient()

    // Check if school exists
    const { data: existingSchools, error: checkError } = await supabase
      .from('schools')
      .select('id')
      .eq('id', id)

    if (checkError) {
      console.error('Error checking school:', checkError)
      return NextResponse.json({ error: 'Error checking school' }, { status: 500 })
    }

    if (!existingSchools || existingSchools.length === 0) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }

    const schoolData = {
      name: body.name,
      initial: body.initial || null,
      type: body.type || null,
      country: body.country || null,
      location: body.location || null,
      year_founded: body.year_founded || null,
      qs_ranking: body.qs_ranking || null,
      website_url: body.website_url || null,
    }

    // Validate required fields
    if (!schoolData.name) {
      return NextResponse.json({ error: 'School name is required' }, { status: 400 })
    }

    // Validate numeric ranges
    const validationErrors = validateSchoolData(schoolData)
    if (validationErrors.length > 0) {
      return NextResponse.json({ error: validationErrors.join(', ') }, { status: 400 })
    }

    // Use admin client to bypass RLS policies
    const adminClient = createAdminClient()
    const { data: schools, error } = await adminClient
      .from('schools')
      .update(schoolData)
      .eq('id', id)
      .select()

    if (error) {
      console.error('Error updating school:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!schools || schools.length === 0) {
      return NextResponse.json({ error: 'School not found or update failed' }, { status: 404 })
    }

    return NextResponse.json(schools[0])
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Check if school exists
    const { data: existingSchools, error: checkError } = await supabase
      .from('schools')
      .select('id')
      .eq('id', id)

    if (checkError) {
      console.error('Error checking school:', checkError)
      return NextResponse.json({ error: 'Error checking school' }, { status: 500 })
    }

    if (!existingSchools || existingSchools.length === 0) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }

    // Check if school has any programs
    const { data: programs, error: programsError } = await supabase
      .from('programs')
      .select('id')
      .eq('school_id', id)
      .limit(1)

    if (programsError) {
      console.error('Error checking programs:', programsError)
      return NextResponse.json({ error: 'Error checking school dependencies' }, { status: 500 })
    }

    if (programs && programs.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete school with existing programs. Please delete or reassign programs first.' 
      }, { status: 400 })
    }

    // Use admin client to bypass RLS policies
    const adminClient = createAdminClient()
    const { error } = await adminClient
      .from('schools')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting school:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'School deleted successfully' })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
