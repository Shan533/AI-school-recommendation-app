// Shared validation functions for numerical ranges

export function validateRange(value: number | null, min: number, max: number, fieldName: string): string | null {
  if (value === null) return null
  if (value < min || value > max) {
    return `${fieldName} must be between ${min} and ${max}`
  }
  return null
}

export function validateProgramData(data: Record<string, unknown>): string[] {
  const errors: string[] = []
  
  // Duration validation
  const durationError = validateRange(data.duration_years as number | null, 0.5, 8.0, 'Duration')
  if (durationError) errors.push(durationError)
  
  // Credits validation
  const creditsError = validateRange(data.credits as number | null, 1, 200, 'Credits')
  if (creditsError) errors.push(creditsError)
  
  // Tuition validation (only check if not null)
  if (data.total_tuition !== null && (data.total_tuition as number) < 0) {
    errors.push('Total tuition must be non-negative')
  }
  
  return errors
}

export function validateRequirementsData(data: Record<string, unknown>): string[] {
  const errors: string[] = []
  
  // IELTS validation
  const ieltsError = validateRange(data.ielts_score as number | null, 0, 9, 'IELTS Score')
  if (ieltsError) errors.push(ieltsError)
  
  // TOEFL validation
  const toeflError = validateRange(data.toefl_score as number | null, 0, 120, 'TOEFL Score')
  if (toeflError) errors.push(toeflError)
  
  // GRE validation
  const greError = validateRange(data.gre_score as number | null, 260, 340, 'GRE Score')
  if (greError) errors.push(greError)
  
  // GPA validation
  const gpaError = validateRange(data.min_gpa as number | null, 0, 4.0, 'GPA')
  if (gpaError) errors.push(gpaError)
  
  // Letters of recommendation validation
  const lettersError = validateRange(data.letters_of_recommendation as number | null, 0, 10, 'Letters of Recommendation')
  if (lettersError) errors.push(lettersError)
  
  // Application fee validation
  if (data.application_fee !== null && (data.application_fee as number) < 0) {
    errors.push('Application fee must be non-negative')
  }
  
  return errors
}

export function validateSchoolData(data: Record<string, unknown>): string[] {
  const errors: string[] = []
  
  // Year founded validation
  if (data.year_founded !== null && ((data.year_founded as number) < 1000 || (data.year_founded as number) > 2025)) {
    errors.push('Year founded must be between 1000 and 2025')
  }
  
  // QS ranking validation
  if (data.qs_ranking !== null && ((data.qs_ranking as number) < 1 || (data.qs_ranking as number) > 2000)) {
    errors.push('QS ranking must be between 1 and 2000')
  }
  
  return errors
}

// Collections validation
export function validateCollectionData(data: Record<string, unknown>): string[] {
  const errors: string[] = []
  
  // Name validation
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('Collection name is required')
  } else if (data.name.length > 100) {
    errors.push('Collection name must be less than 100 characters')
  }
  
  // Description validation (optional)
  if (data.description && typeof data.description === 'string' && data.description.length > 500) {
    errors.push('Collection description must be less than 500 characters')
  }
  
  return errors
}

export function validateCollectionItemData(data: Record<string, unknown>): string[] {
  const errors: string[] = []
  
  // Must have either school_id or program_id, but not both
  const hasSchoolId = data.school_id && typeof data.school_id === 'string'
  const hasProgramId = data.program_id && typeof data.program_id === 'string'
  
  if (!hasSchoolId && !hasProgramId) {
    errors.push('Either school_id or program_id is required')
  } else if (hasSchoolId && hasProgramId) {
    errors.push('Cannot specify both school_id and program_id')
  }
  
  // Notes validation (optional)
  if (data.notes && typeof data.notes === 'string' && data.notes.length > 500) {
    errors.push('Notes must be less than 500 characters')
  }
  
  return errors
}

// Import types from centralized location
import type { ValidationError, ValidationResult } from './types'

// ============================================================================
// ENHANCED VALIDATION FUNCTIONS
// ============================================================================

export function validateCareerData(data: Record<string, unknown>): ValidationResult {
  const errors: ValidationError[] = []
  
  // Name validation
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Career name is required' })
  } else if (data.name.length > 50) {
    errors.push({ field: 'name', message: 'Career name must be less than 50 characters' })
  }
  
  // Abbreviation validation
  if (!data.abbreviation || typeof data.abbreviation !== 'string' || data.abbreviation.trim().length === 0) {
    errors.push({ field: 'abbreviation', message: 'Abbreviation is required' })
  } else if (data.abbreviation.length > 10) {
    errors.push({ field: 'abbreviation', message: 'Abbreviation must be less than 10 characters' })
  }
  
  // Career type validation
  const validCareerTypes = ['Software', 'Data', 'AI', 'Hardware', 'Product', 'Design', 'Security', 'Infrastructure', 'Management', 'Finance', 'Healthcare', 'Research']
  if (!data.career_type || !validCareerTypes.includes(data.career_type as string)) {
    errors.push({ field: 'career_type', message: 'Valid career type is required' })
  }
  
  // Industry validation (optional)
  if (data.industry && typeof data.industry === 'string' && data.industry.length > 50) {
    errors.push({ field: 'industry', message: 'Industry must be less than 50 characters' })
  }
  
  // Description validation (optional)
  if (data.description && typeof data.description === 'string' && data.description.length > 500) {
    errors.push({ field: 'description', message: 'Description must be less than 500 characters' })
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

export function validateCategoryData(data: Record<string, unknown>): ValidationResult {
  const errors: ValidationError[] = []
  
  // Name validation
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Category name is required' })
  } else if (data.name.length > 50) {
    errors.push({ field: 'name', message: 'Category name must be less than 50 characters' })
  }
  
  // Abbreviation validation
  if (!data.abbreviation || typeof data.abbreviation !== 'string' || data.abbreviation.trim().length === 0) {
    errors.push({ field: 'abbreviation', message: 'Abbreviation is required' })
  } else if (data.abbreviation.length > 10) {
    errors.push({ field: 'abbreviation', message: 'Abbreviation must be less than 10 characters' })
  }
  
  // Description validation (optional)
  if (data.description && typeof data.description === 'string' && data.description.length > 500) {
    errors.push({ field: 'description', message: 'Description must be less than 500 characters' })
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}
