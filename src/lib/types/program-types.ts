// Shared Program types for consistency across components

export interface Program {
  [key: string]: unknown
  id: string
  name: string
  initial?: string | null
  school_id?: string | null
  schools?: {
    id?: string | null
    name?: string | null
    initial?: string | null
    location?: string | null
    region?: string | null
    qs_ranking?: number | null
  } | null
  degree?: string | null
  duration_years?: number | null
  currency?: string | null
  total_tuition?: number | null
  website_url?: string | null
  application_difficulty?: string | null
  delivery_method?: string | null
  is_stem?: boolean | null
  description?: string | null
  schedule_type?: string | null
  location?: string | null
  difficulty_description?: string | null
  is_primary_category?: boolean | null
  program_category_mapping?: Array<{
    is_primary?: boolean | null
    program_categories?: {
      id?: string | null
      name?: string | null
      abbreviation?: string | null
    } | null
  }> | null
}

export interface Category {
  id: string
  name: string
}
