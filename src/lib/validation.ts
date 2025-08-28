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
