import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    // Get all categories with their related careers
    const { data: categories, error } = await supabase
      .from('program_categories')
      .select(`
        id,
        name,
        abbreviation,
        description,
        created_at,
        updated_at
      `)
      .order('created_at') // We'll sort manually below

    if (error) {
      console.error('Error fetching categories:', error)
      return NextResponse.json(
        { error: 'Failed to fetch categories' },
        { status: 500 }
      )
    }

    // Define custom sort order for categories
    const categorySortOrder = [
      'Computer Science',
      'Data Science', 
      'Human-Computer Interaction',
      'Machine Learning',
      'Software Engineering',
      'Computer Vision',
      'Cybersecurity',
      'Data Engineering',
      'Mobile Development',
      'Product Management',
      'Robotics'
    ]

    // Sort categories by custom order, then by name for any not in the list
    const sortedCategories = categories.sort((a, b) => {
      const aIndex = categorySortOrder.indexOf(a.name)
      const bIndex = categorySortOrder.indexOf(b.name)
      
      // If both are in the custom order, sort by their position
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex
      }
      
      // If only one is in the custom order, prioritize it
      if (aIndex !== -1) return -1
      if (bIndex !== -1) return 1
      
      // If neither is in the custom order, sort alphabetically
      return a.name.localeCompare(b.name)
    })

    // For each category, get related careers
    const categoriesWithCareers = await Promise.all(
      sortedCategories.map(async (category) => {
        const { data: careers } = await supabase
          .from('category_career_mapping')
          .select(`
            careers (
              id,
              name,
              abbreviation,
              career_type,
              industry
            )
          `)
          .eq('category_id', category.id)
          .eq('is_default', true)

        return {
          ...category,
          related_careers: careers?.map(c => c.careers) || []
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: categoriesWithCareers
    })

  } catch (error) {
    console.error('Unexpected error in categories API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
