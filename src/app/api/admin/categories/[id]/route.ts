import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/helpers'
import { CategoryManagementForm } from '@/lib/types/schema-enhancements'

// GET /api/admin/categories/[id] - Get a specific category
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createAdminClient()
    const resolvedParams = await params
    const { data: category, error } = await supabase
      .from('program_categories')
      .select('*')
      .eq('id', resolvedParams.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching category:', error)
      return NextResponse.json(
        { error: 'Failed to fetch category' },
        { status: 500 }
      )
    }

    return NextResponse.json(category)
  } catch (error) {
    console.error('Get category API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/categories/[id] - Update a category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createAdminClient()
    const body: CategoryManagementForm = await request.json()

    // Validate required fields
    if (!body.name || !body.abbreviation) {
      return NextResponse.json(
        { error: 'Name and abbreviation are required' },
        { status: 400 }
      )
    }

    const resolvedParams = await params
    // Check for duplicate name or abbreviation (excluding current category)
    const { data: existing } = await supabase
      .from('program_categories')
      .select('id')
      .or(`name.eq.${body.name},abbreviation.eq.${body.abbreviation}`)
      .neq('id', resolvedParams.id)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Category with this name or abbreviation already exists' },
        { status: 409 }
      )
    }

    const { data: category, error } = await supabase
      .from('program_categories')
      .update({
        name: body.name,
        abbreviation: body.abbreviation,
        description: body.description || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', resolvedParams.id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        )
      }
      console.error('Error updating category:', error)
      return NextResponse.json(
        { error: 'Failed to update category' },
        { status: 500 }
      )
    }

    return NextResponse.json(category)
  } catch (error) {
    console.error('Update category API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/categories/[id] - Delete a category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createAdminClient()

    const resolvedParams = await params
    // Check if category is being used by any programs
    const { data: mappings } = await supabase
      .from('program_category_mapping')
      .select('program_id')
      .eq('category_id', resolvedParams.id)
      .limit(1)

    if (mappings && mappings.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category that is assigned to programs' },
        { status: 409 }
      )
    }

    const { error } = await supabase
      .from('program_categories')
      .delete()
      .eq('id', resolvedParams.id)

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        )
      }
      console.error('Error deleting category:', error)
      return NextResponse.json(
        { error: 'Failed to delete category' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete category API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
