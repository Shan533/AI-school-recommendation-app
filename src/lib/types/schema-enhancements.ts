/**
 * TypeScript type definitions for Issue #69 schema enhancements
 * Program categories, careers, and application difficulty system
 */

// ============================================================================
// PROGRAM CATEGORIES
// ============================================================================

export interface ProgramCategory {
  id: string
  name: string
  abbreviation: string
  description?: string
  created_at: string
  updated_at: string
  career_paths?: string[] // Optional field for UI display
}

export interface ProgramCategoryMapping {
  program_id: string
  category_id: string
  is_primary: boolean
  created_at: string
}

// ============================================================================
// CAREERS
// ============================================================================

export type CareerType = 
  | 'Software' 
  | 'Data' 
  | 'AI' 
  | 'Hardware' 
  | 'Product' 
  | 'Design' 
  | 'Security' 
  | 'Infrastructure' 
  | 'Management' 
  | 'Finance' 
  | 'Healthcare' 
  | 'Research'

export interface Career {
  id: string
  name: string
  abbreviation: string
  description?: string
  industry?: string
  career_type: CareerType
  created_at: string
  updated_at: string
}

export interface CategoryCareerMapping {
  category_id: string
  career_id: string
  is_default: boolean
  created_at: string
}

export interface ProgramCareerMapping {
  program_id: string
  career_id: string
  is_custom: boolean
  created_at: string
}

// ============================================================================
// ENHANCED PROGRAM INTERFACE
// ============================================================================

export interface EnhancedProgram {
  id: string
  name: string
  school_id: string
  school_name?: string
  description?: string
  degree?: string
  degree_type?: string
  duration_months?: number
  tuition_fee?: number
  application_deadline?: string
  start_date?: string
  location?: string
  language?: string
  online_available?: boolean
  is_stem?: boolean
  created_at: string
  updated_at: string
  
  // New fields from Issue #69
  category_ids?: string[]
  primary_category_id?: string
  difficulty_level?: ApplicationDifficulty
  career_paths?: string[]
  
  // Related data for display
  categories?: ProgramCategory[]
  careers?: Career[]
}

// ============================================================================
// APPLICATION DIFFICULTY
// ============================================================================

export type ApplicationDifficulty = 'Easy' | 'Medium' | 'Hard' | 'Very Hard'

export interface ApplicationDifficultyInfo {
  level: ApplicationDifficulty
  description: string
  acceptance_rate_range: string
  requirements: string[]
}

// ============================================================================
// CONSTANTS AND ENUMS
// ============================================================================

export const APPLICATION_DIFFICULTY_VALUES: ApplicationDifficulty[] = ['Easy', 'Medium', 'Hard', 'Very Hard']

export const DIFFICULTY_LEVELS = {
  Easy: {
    level: 'Easy' as ApplicationDifficulty,
    label: 'Easy',
    acceptanceRate: '80-100%',
    description: 'High acceptance rate, minimal requirements'
  },
  Medium: {
    level: 'Medium' as ApplicationDifficulty,
    label: 'Medium',
    acceptanceRate: '50-80%',
    description: 'Moderate requirements and competition'
  },
  Hard: {
    level: 'Hard' as ApplicationDifficulty,
    label: 'Hard',
    acceptanceRate: '20-50%',
    description: 'Competitive with high requirements'
  },
  'Very Hard': {
    level: 'Very Hard' as ApplicationDifficulty,
    label: 'Very Hard',
    acceptanceRate: '5-20%',
    description: 'Extremely competitive, top-tier requirements'
  }
}

export const DELIVERY_METHODS = ['Onsite', 'Online', 'Hybrid'] as const
export const SCHEDULE_TYPES = ['Full-time', 'Part-time', 'Flexible'] as const
export const DEGREE_TYPES = ['Bachelor', 'Master', 'PhD', 'Certificate', 'Diploma'] as const

export type DeliveryMethod = typeof DELIVERY_METHODS[number]
export type ScheduleType = typeof SCHEDULE_TYPES[number]
export type DegreeType = typeof DEGREE_TYPES[number]

export interface DifficultyInfo {
  level: ApplicationDifficulty
  label: string
  acceptanceRate: string
  description: string
}

// ============================================================================
// BULK ASSIGNMENT TYPES
// ============================================================================

export interface BulkAssignmentData {
  programIds: string[]
  categoryIds: string[]
  primaryCategoryId?: string
  careerPaths: string[]
}

export interface BulkAssignmentResult {
  success: boolean
  updatedCount: number
  errors: string[]
  message?: string
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ProgramCategoriesResponse {
  categories: ProgramCategory[]
  total: number
}

export interface CareersResponse {
  careers: Career[]
  total: number
}

export interface ProgramsWithCategoriesResponse {
  programs: EnhancedProgram[]
  categories: ProgramCategory[]
  total: number
}

// ============================================================================
// HELPER FUNCTION RETURN TYPES
// ============================================================================

export interface ProgramCategoryInfo {
  category_id: string
  category_name: string
  category_description?: string
  is_primary: boolean
}

export interface ProgramCareerInfo {
  career_id: string
  career_name: string
  career_abbreviation: string
  career_description?: string
  industry?: string
  career_type: CareerType
  is_custom: boolean
}

export interface ProgramsByCareerInfo {
  program_id: string
  program_name: string
  school_name: string
  primary_category_name?: string
}

// ============================================================================
// FORM TYPES
// ============================================================================

export interface CategoryAssignmentForm {
  selectedPrograms: string[]
  categories: {
    selected: string[]
    primary?: string
  }
  careers: {
    selected: string[]
    custom: string[]
  }
}

export interface CategoryManagementForm {
  name: string
  abbreviation: string
  description?: string
}

export interface CareerManagementForm {
  name: string
  abbreviation: string
  description?: string
  industry?: string
  career_type: CareerType
}

// ============================================================================
// SEARCH AND FILTER TYPES
// ============================================================================

export interface ProgramSearchFilters {
  search?: string
  categories?: string[]
  careers?: string[]
  difficulty?: ApplicationDifficulty[]
  schools?: string[]
  online_only?: boolean
  degree_types?: string[]
  region?: string[]
}

export interface SchoolSearchFilters {
  search?: string
  type?: string[]
  year_founded_min?: number
  year_founded_max?: number
}

export interface EnhancedSchool {
  id: string
  name: string
  created_at: string
  updated_at?: string
}

export interface CategorySearchFilters {
  search?: string
  career_types?: CareerType[]
}

export interface CareerSearchFilters {
  search?: string
  career_types?: CareerType[]
  industries?: string[]
}

// ============================================================================
// PAGINATION TYPES
// ============================================================================

export interface PaginationParams {
  page: number
  limit: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
    has_next: boolean
    has_prev: boolean
  }
}
