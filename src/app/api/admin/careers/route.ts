import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { validateCareerData } from '@/lib/validation'

export async function GET() {
  try {
    const supabase = await createAdminClient()
    
    const { data: careers, error } = await supabase
      .from('careers')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching careers:', error)
      return NextResponse.json(
        { error: 'Failed to fetch careers' },
        { status: 500 }
      )
    }

    return NextResponse.json(careers || [])
  } catch (error) {
    console.error('Error in careers API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient()
    const body = await request.json()

    // Validate career data
    const validation = validateCareerData(body)
    if (!validation.valid) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validation.errors 
        },
        { status: 400 }
      )
    }

    // Check for duplicate name or abbreviation
    const { data: existing } = await supabase
      .from('careers')
      .select('id')
      .or(`name.eq.${body.name},abbreviation.eq.${body.abbreviation}`)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Career with this name or abbreviation already exists' },
        { status: 409 }
      )
    }

    const { data: career, error } = await supabase
      .from('careers')
      .insert([{
        name: body.name,
        abbreviation: body.abbreviation,
        description: body.description || null,
        industry: body.industry || null,
        career_type: body.career_type
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating career:', error)
      return NextResponse.json(
        { error: 'Failed to create career' },
        { status: 500 }
      )
    }

    return NextResponse.json(career, { status: 201 })
  } catch (error) {
    console.error('Create career API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
