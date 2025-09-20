import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/helpers'
import { CategoryManagementForm } from '@/lib/types'
import { validateCategoryData } from '@/lib/validation'

// GET /api/admin/categories - List all categories
export async function GET(request: NextRequest) {
  try {
    const supabase = await createAdminClient()
    const { searchParams } = new URL(request.url)
    
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('program_categories')
      .select(`
        *,
        category_career_mapping!inner(
          career_id,
          is_default,
          careers(
            id,
            name,
            abbreviation,
            description,
            industry,
            career_type
          )
        )
      `)
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1)

    if (search) {
      query = query.or(`name.ilike.%${search}%,abbreviation.ilike.%${search}%`)
    }

    const { data: categories, error, count } = await query

    if (error) {
      console.error('Error fetching categories:', error)
      return NextResponse.json(
        { error: 'Failed to fetch categories' },
        { status: 500 }
      )
    }

    // Transform the data to include career_paths
    const transformedCategories = (categories || []).map((category: Record<string, unknown>) => {
      const careerPaths = (category.category_career_mapping as Array<Record<string, unknown>>)
        ?.filter((mapping: Record<string, unknown>) => mapping.is_default)
        ?.map((mapping: Record<string, unknown>) => (mapping.careers as Record<string, unknown>)?.name)
        ?.filter(Boolean) || []
      
      return {
        ...category,
        career_paths: careerPaths,
        // Remove the mapping data from the response
        category_career_mapping: undefined
      }
    })

    return NextResponse.json({
      categories: transformedCategories,
      total: count || 0
    })
  } catch (error) {
    console.error('Categories API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/admin/categories - Create a new category
export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient()
    const body: CategoryManagementForm = await request.json()

    // Validate category data
    const validation = validateCategoryData(body as unknown as Record<string, unknown>)
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
      .from('program_categories')
      .select('id')
      .or(`name.eq.${body.name},abbreviation.eq.${body.abbreviation}`)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Category with this name or abbreviation already exists' },
        { status: 409 }
      )
    }

    const { data: category, error } = await supabase
      .from('program_categories')
      .insert([{
        name: body.name,
        abbreviation: body.abbreviation,
        description: body.description || null
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating category:', error)
      return NextResponse.json(
        { error: 'Failed to create category' },
        { status: 500 }
      )
    }

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Create category API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
