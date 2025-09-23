import { getSupabaseClient } from '@/lib/supabase/helpers'
import ProgramsPageClient from '@/components/programs/programs-page-client'
import { Program, Category } from '@/lib/types/program-types'

async function getProgramsWithRatings() {
  const supabase = await getSupabaseClient()
  
  // Get programs (include fields needed by table)
  const { data: programs, error: programsError } = await supabase
    .from('programs')
    .select(`
      id,
      name,
      initial,
      school_id,
      degree,
      duration_years,
      currency,
      total_tuition,
      is_stem,
      website_url,
      application_difficulty,
      delivery_method,
      schools (
        name,
        initial,
        location,
        region
      ),
      program_category_mapping!program_category_mapping_program_id_fkey (
        is_primary,
        program_categories (
          id,
          name,
          abbreviation
        )
      )
    `)
    .order('name')
  
  if (programsError) {
    console.error('Error fetching programs:', programsError)
    return []
  }
  
  if (!programs) return []
  
  // For public table view we do not need rating aggregation now
  return programs as Program[]
}

async function getCategories() {
  const supabase = await getSupabaseClient()
  
  const { data: categories, error } = await supabase
    .from('program_categories')
    .select('id, name')
    .order('name')
  
  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }
  
  return (categories || []) as Category[]
}

export default async function ProgramsPage() {
  const [programs, categories] = await Promise.all([
    getProgramsWithRatings(),
    getCategories()
  ])

  return <ProgramsPageClient initialPrograms={programs} categories={categories} />
}