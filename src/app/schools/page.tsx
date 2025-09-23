import { getSupabaseClient } from '@/lib/supabase/helpers'
import SchoolsPageClient from '@/components/schools/schools-page-client'

async function getSchoolsWithRatings() {
  const supabase = await getSupabaseClient()
  
  // Get schools (include fields needed by table)
  const { data: schools, error: schoolsError } = await supabase
    .from('schools')
    .select(`
      id,
      name,
      initial,
      type,
      location,
      qs_ranking,
      year_founded,
      region,
      website_url
    `)
    .order('name')
  
  if (schoolsError) {
    console.error('Error fetching schools:', schoolsError)
    return []
  }
  
  if (!schools) return []
  
  // For public table view we do not need rating aggregation now
  return schools
}

export default async function SchoolsPage() {
  const schools = await getSchoolsWithRatings()

  return <SchoolsPageClient initialSchools={schools} />
}