/**
 * TypeScript types and interfaces
 * Includes program categories, multiple rankings, and application difficulty
 */


// ============================================================================
// APPLICATION DIFFICULTY
// ============================================================================

export type ApplicationDifficulty = 'SSR' | 'SR' | 'R' | 'N'

export interface DifficultyInfo {
  level: ApplicationDifficulty
  label: string
  description: string
  color: string
  acceptanceRate: string
}

export const DIFFICULTY_LEVELS: Record<ApplicationDifficulty, DifficultyInfo> = {
  SSR: {
    level: 'SSR',
    label: 'Super Super Rare',
    description: 'Extremely competitive programs with < 5% acceptance rate',
    color: '#FF6B6B',
    acceptanceRate: '< 5%'
  },
  SR: {
    level: 'SR',
    label: 'Super Rare',
    description: 'Highly competitive programs with 5-15% acceptance rate',
    color: '#4ECDC4',
    acceptanceRate: '5-15%'
  },
  R: {
    level: 'R',
    label: 'Rare',
    description: 'Competitive programs with 15-30% acceptance rate',
    color: '#45B7D1',
    acceptanceRate: '15-30%'
  },
  N: {
    level: 'N',
    label: 'Normal',
    description: 'Standard programs with > 30% acceptance rate',
    color: '#96CEB4',
    acceptanceRate: '> 30%'
  }
}

// ============================================================================
// ENHANCED PROGRAM INTERFACE
// ============================================================================

export interface EnhancedProgram {
  id: string
  name: string
  initial?: string
  school_id: string
  degree: string
  website_url?: string
  duration_years?: number
  currency?: string
  total_tuition?: number
  is_stem: boolean
  description?: string
  credits?: number
  delivery_method?: string
  schedule_type?: string
  location?: string
  add_ons?: Record<string, unknown>
  start_date?: string
  
  // New fields for Issue #69
  application_difficulty?: ApplicationDifficulty
  difficulty_description?: string
  
  // Related data
  school?: {
    id: string
    name: string
    initial?: string
    location?: string
    country?: string
  }
  requirements?: {
    id: string
    ielts_score?: number
    toefl_score?: number
    gre_score?: number
    min_gpa?: number
    other_tests?: string
    requires_personal_statement?: boolean
    requires_portfolio?: boolean
    requires_cv?: boolean
    letters_of_recommendation?: number
    application_fee?: number
    application_deadline?: string
  }
  
  created_by?: string
  created_at: string
}

// ============================================================================
// ENHANCED SCHOOL INTERFACE
// ============================================================================

export interface EnhancedSchool {
  id: string
  name: string
  initial?: string
  type?: string
  region?: string
  location?: string
  year_founded?: number
  qs_ranking?: number // Keep for backward compatibility
  website_url?: string
  
  created_by?: string
  created_at: string
}

// ============================================================================
// FORM DATA TYPES
// ============================================================================

export interface ProgramCategoryFormData {
  name: string
  description?: string
  career_path?: string
  icon?: string
  color?: string
}

export interface ProgramFormData {
  name: string
  initial?: string
  school_id: string
  degree: string
  website_url?: string
  duration_years?: number
  currency?: string
  total_tuition?: number
  is_stem: boolean
  description?: string
  credits?: number
  delivery_method?: string
  schedule_type?: string
  location?: string
  add_ons?: Record<string, unknown>
  start_date?: string
  
  // New fields for Issue #69
  application_difficulty?: ApplicationDifficulty
  difficulty_description?: string
}

// 暂时不实现多排名源系统

// ============================================================================
// SEARCH AND FILTER TYPES
// ============================================================================

export interface ProgramSearchFilters {
  search?: string
  difficulty?: ApplicationDifficulty[]
  degree?: string[]
  delivery_method?: string[]
  schedule_type?: string[]
  is_stem?: boolean
  min_tuition?: number
  max_tuition?: number
  min_duration?: number
  max_duration?: number
  region?: string[]
}

export interface SchoolSearchFilters {
  search?: string
  country?: string[]
  type?: string[]
  year_founded_min?: number
  year_founded_max?: number
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

// (Phase 2 categories response removed)

// 暂时不实现多排名源系统

export interface EnhancedProgramsResponse {
  programs: EnhancedProgram[]
  total: number
  filters: ProgramSearchFilters
}

export interface EnhancedSchoolsResponse {
  schools: EnhancedSchool[]
  total: number
  filters: SchoolSearchFilters
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

// (Phase 2 category stats removed)

export interface DifficultyStats {
  difficulty: ApplicationDifficulty
  count: number
  percentage: number
}

// ============================================================================
// VALIDATION SCHEMAS (for use with Zod)
// ============================================================================

export const APPLICATION_DIFFICULTY_VALUES = ['SSR', 'SR', 'R', 'N'] as const

// (Phase 2 career paths constants removed)

export const DELIVERY_METHODS = [
  'Onsite',
  'Online', 
  'Hybrid'
] as const

export const SCHEDULE_TYPES = [
  'Full-time',
  'Part-time',
  'Flexible'
] as const

export const DEGREE_TYPES = [
  'Bachelor',
  'Master',
  'PhD',
  'Associate',
  'Certificate',
  'Diploma'
] as const
