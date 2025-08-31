/**
 * Unit tests for validation utilities
 * Priority: HIGH - Core business logic validation
 * 
 * Test Coverage Areas:
 * - validateRange() - numerical range validation
 * - validateProgramData() - program data validation
 * - validateRequirementsData() - requirements validation
 * - validateSchoolData() - school data validation
 */

import { 
  validateRange, 
  validateProgramData, 
  validateRequirementsData,
  validateSchoolData 
} from '@/lib/validation'

describe('validateRange', () => {
  it('should return null for valid values', () => {
    expect(validateRange(5, 1, 10, 'Test')).toBeNull()
    expect(validateRange(50, 0, 100, 'Score')).toBeNull()
    expect(validateRange(2.5, 1.0, 4.0, 'GPA')).toBeNull()
  })
  
  it('should return error for values below minimum', () => {
    expect(validateRange(0, 1, 10, 'Test')).toBe('Test must be between 1 and 10')
    expect(validateRange(-5, 0, 100, 'Score')).toBe('Score must be between 0 and 100')
    expect(validateRange(0.5, 1.0, 4.0, 'GPA')).toBe('GPA must be between 1 and 4')
  })
  
  it('should return error for values above maximum', () => {
    expect(validateRange(15, 1, 10, 'Test')).toBe('Test must be between 1 and 10')
    expect(validateRange(150, 0, 100, 'Score')).toBe('Score must be between 0 and 100')
    expect(validateRange(5.0, 1.0, 4.0, 'GPA')).toBe('GPA must be between 1 and 4')
  })
  
  it('should handle null values correctly', () => {
    expect(validateRange(null, 1, 10, 'Test')).toBeNull()
    expect(validateRange(null, 0, 100, 'Score')).toBeNull()
    expect(validateRange(null, 1.0, 4.0, 'GPA')).toBeNull()
  })
  
  it('should handle boundary values correctly', () => {
    // Exactly at minimum should be valid
    expect(validateRange(1, 1, 10, 'Test')).toBeNull()
    expect(validateRange(0, 0, 100, 'Score')).toBeNull()
    expect(validateRange(1.0, 1.0, 4.0, 'GPA')).toBeNull()
    
    // Exactly at maximum should be valid
    expect(validateRange(10, 1, 10, 'Test')).toBeNull()
    expect(validateRange(100, 0, 100, 'Score')).toBeNull()
    expect(validateRange(4.0, 1.0, 4.0, 'GPA')).toBeNull()
  })
})

describe('validateProgramData', () => {
  it('should return empty array for valid program data', () => {
    const validData = {
      duration_years: 2.0,
      credits: 60,
      total_tuition: 50000
    }
    expect(validateProgramData(validData)).toEqual([])
  })
  
  it('should return empty array when optional fields are null', () => {
    const dataWithNulls = {
      duration_years: null,
      credits: null,
      total_tuition: null
    }
    expect(validateProgramData(dataWithNulls)).toEqual([])
  })
  
  it('should validate duration_years range (0.5-8.0)', () => {
    // Below minimum
    const belowMin = { duration_years: 0.3 }
    expect(validateProgramData(belowMin)).toContain('Duration must be between 0.5 and 8')
    
    // Above maximum
    const aboveMax = { duration_years: 10.0 }
    expect(validateProgramData(aboveMax)).toContain('Duration must be between 0.5 and 8')
    
    // Valid values
    const validMin = { duration_years: 0.5 }
    expect(validateProgramData(validMin)).toEqual([])
    
    const validMax = { duration_years: 8.0 }
    expect(validateProgramData(validMax)).toEqual([])
  })
  
  it('should validate credits range (1-200)', () => {
    // Below minimum
    const belowMin = { credits: 0 }
    expect(validateProgramData(belowMin)).toContain('Credits must be between 1 and 200')
    
    // Above maximum
    const aboveMax = { credits: 250 }
    expect(validateProgramData(aboveMax)).toContain('Credits must be between 1 and 200')
    
    // Valid values
    const validMin = { credits: 1 }
    expect(validateProgramData(validMin)).toEqual([])
    
    const validMax = { credits: 200 }
    expect(validateProgramData(validMax)).toEqual([])
  })
  
  it('should validate non-negative tuition', () => {
    // Negative tuition should be invalid
    const negativeTuition = { total_tuition: -1000 }
    expect(validateProgramData(negativeTuition)).toContain('Total tuition must be non-negative')
    
    // Zero tuition should be valid
    const zeroTuition = { total_tuition: 0 }
    expect(validateProgramData(zeroTuition)).toEqual([])
    
    // Positive tuition should be valid
    const positiveTuition = { total_tuition: 50000 }
    expect(validateProgramData(positiveTuition)).toEqual([])
    
    // Null tuition should be valid
    const nullTuition = { total_tuition: null }
    expect(validateProgramData(nullTuition)).toEqual([])
  })
  
  it('should return all validation errors', () => {
    const invalidData = {
      duration_years: 10.0,  // Too high
      credits: 0,           // Too low
      total_tuition: -5000  // Negative
    }
    const errors = validateProgramData(invalidData)
    
    expect(errors).toHaveLength(3)
    expect(errors).toContain('Duration must be between 0.5 and 8')
    expect(errors).toContain('Credits must be between 1 and 200')
    expect(errors).toContain('Total tuition must be non-negative')
  })
})

describe('validateRequirementsData', () => {
  it('should return empty array for valid requirements data', () => {
    const validData = {
      ielts_score: 7.0,
      toefl_score: 100,
      gre_score: 320,
      min_gpa: 3.5,
      letters_of_recommendation: 3,
      application_fee: 100
    }
    expect(validateRequirementsData(validData)).toEqual([])
  })
  
  it('should return empty array when optional fields are null', () => {
    const dataWithNulls = {
      ielts_score: null,
      toefl_score: null,
      gre_score: null,
      min_gpa: null,
      letters_of_recommendation: null,
      application_fee: null
    }
    expect(validateRequirementsData(dataWithNulls)).toEqual([])
  })
  
  it('should validate IELTS score range (0-9)', () => {
    // Below minimum
    const belowMin = { ielts_score: -1 }
    expect(validateRequirementsData(belowMin)).toContain('IELTS Score must be between 0 and 9')
    
    // Above maximum
    const aboveMax = { ielts_score: 10 }
    expect(validateRequirementsData(aboveMax)).toContain('IELTS Score must be between 0 and 9')
    
    // Valid boundary values
    const validMin = { ielts_score: 0 }
    expect(validateRequirementsData(validMin)).toEqual([])
    
    const validMax = { ielts_score: 9 }
    expect(validateRequirementsData(validMax)).toEqual([])
  })
  
  it('should validate TOEFL score range (0-120)', () => {
    // Below minimum
    const belowMin = { toefl_score: -1 }
    expect(validateRequirementsData(belowMin)).toContain('TOEFL Score must be between 0 and 120')
    
    // Above maximum
    const aboveMax = { toefl_score: 130 }
    expect(validateRequirementsData(aboveMax)).toContain('TOEFL Score must be between 0 and 120')
    
    // Valid boundary values
    const validMin = { toefl_score: 0 }
    expect(validateRequirementsData(validMin)).toEqual([])
    
    const validMax = { toefl_score: 120 }
    expect(validateRequirementsData(validMax)).toEqual([])
  })
  
  it('should validate GRE score range (260-340)', () => {
    // Below minimum
    const belowMin = { gre_score: 250 }
    expect(validateRequirementsData(belowMin)).toContain('GRE Score must be between 260 and 340')
    
    // Above maximum
    const aboveMax = { gre_score: 350 }
    expect(validateRequirementsData(aboveMax)).toContain('GRE Score must be between 260 and 340')
    
    // Valid boundary values
    const validMin = { gre_score: 260 }
    expect(validateRequirementsData(validMin)).toEqual([])
    
    const validMax = { gre_score: 340 }
    expect(validateRequirementsData(validMax)).toEqual([])
  })
  
  it('should validate GPA range (0-4.0)', () => {
    // Below minimum
    const belowMin = { min_gpa: -0.5 }
    expect(validateRequirementsData(belowMin)).toContain('GPA must be between 0 and 4')
    
    // Above maximum
    const aboveMax = { min_gpa: 5.0 }
    expect(validateRequirementsData(aboveMax)).toContain('GPA must be between 0 and 4')
    
    // Valid boundary values
    const validMin = { min_gpa: 0 }
    expect(validateRequirementsData(validMin)).toEqual([])
    
    const validMax = { min_gpa: 4.0 }
    expect(validateRequirementsData(validMax)).toEqual([])
  })
  
  it('should validate letters of recommendation range (0-10)', () => {
    // Below minimum
    const belowMin = { letters_of_recommendation: -1 }
    expect(validateRequirementsData(belowMin)).toContain('Letters of Recommendation must be between 0 and 10')
    
    // Above maximum
    const aboveMax = { letters_of_recommendation: 15 }
    expect(validateRequirementsData(aboveMax)).toContain('Letters of Recommendation must be between 0 and 10')
    
    // Valid boundary values
    const validMin = { letters_of_recommendation: 0 }
    expect(validateRequirementsData(validMin)).toEqual([])
    
    const validMax = { letters_of_recommendation: 10 }
    expect(validateRequirementsData(validMax)).toEqual([])
  })
  
  it('should validate non-negative application fee', () => {
    // Negative fee should be invalid
    const negativeFee = { application_fee: -50 }
    expect(validateRequirementsData(negativeFee)).toContain('Application fee must be non-negative')
    
    // Zero fee should be valid
    const zeroFee = { application_fee: 0 }
    expect(validateRequirementsData(zeroFee)).toEqual([])
    
    // Positive fee should be valid
    const positiveFee = { application_fee: 100 }
    expect(validateRequirementsData(positiveFee)).toEqual([])
    
    // Null fee should be valid
    const nullFee = { application_fee: null }
    expect(validateRequirementsData(nullFee)).toEqual([])
  })
  
  it('should return all validation errors', () => {
    const invalidData = {
      ielts_score: 15,        // Too high
      toefl_score: -10,       // Too low
      gre_score: 200,         // Too low
      min_gpa: 5.0,          // Too high
      letters_of_recommendation: 20, // Too high
      application_fee: -100   // Negative
    }
    const errors = validateRequirementsData(invalidData)
    
    expect(errors).toHaveLength(6)
    expect(errors).toContain('IELTS Score must be between 0 and 9')
    expect(errors).toContain('TOEFL Score must be between 0 and 120')
    expect(errors).toContain('GRE Score must be between 260 and 340')
    expect(errors).toContain('GPA must be between 0 and 4')
    expect(errors).toContain('Letters of Recommendation must be between 0 and 10')
    expect(errors).toContain('Application fee must be non-negative')
  })
})

describe('validateSchoolData', () => {
  it('should return empty array for valid school data', () => {
    const validData = {
      year_founded: 1950,
      qs_ranking: 100
    }
    expect(validateSchoolData(validData)).toEqual([])
  })
  
  it('should return empty array when optional fields are null', () => {
    const dataWithNulls = {
      year_founded: null,
      qs_ranking: null
    }
    expect(validateSchoolData(dataWithNulls)).toEqual([])
  })
  
  it('should validate year founded range (1000-2025)', () => {
    // Below minimum
    const belowMin = { year_founded: 999 }
    expect(validateSchoolData(belowMin)).toContain('Year founded must be between 1000 and 2025')
    
    // Above maximum
    const aboveMax = { year_founded: 2030 }
    expect(validateSchoolData(aboveMax)).toContain('Year founded must be between 1000 and 2025')
    
    // Valid boundary values
    const validMin = { year_founded: 1000 }
    expect(validateSchoolData(validMin)).toEqual([])
    
    const validMax = { year_founded: 2025 }
    expect(validateSchoolData(validMax)).toEqual([])
    
    // Typical valid values
    const typical = { year_founded: 1950 }
    expect(validateSchoolData(typical)).toEqual([])
  })
  
  it('should validate QS ranking range (1-2000)', () => {
    // Below minimum
    const belowMin = { qs_ranking: 0 }
    expect(validateSchoolData(belowMin)).toContain('QS ranking must be between 1 and 2000')
    
    // Above maximum
    const aboveMax = { qs_ranking: 2500 }
    expect(validateSchoolData(aboveMax)).toContain('QS ranking must be between 1 and 2000')
    
    // Valid boundary values
    const validMin = { qs_ranking: 1 }
    expect(validateSchoolData(validMin)).toEqual([])
    
    const validMax = { qs_ranking: 2000 }
    expect(validateSchoolData(validMax)).toEqual([])
    
    // Typical valid values
    const typical = { qs_ranking: 150 }
    expect(validateSchoolData(typical)).toEqual([])
  })
  
  it('should return all validation errors', () => {
    const invalidData = {
      year_founded: 500,    // Too low
      qs_ranking: 3000     // Too high
    }
    const errors = validateSchoolData(invalidData)
    
    expect(errors).toHaveLength(2)
    expect(errors).toContain('Year founded must be between 1000 and 2025')
    expect(errors).toContain('QS ranking must be between 1 and 2000')
  })
  
  it('should handle mixed valid and invalid data', () => {
    const mixedData = {
      year_founded: 1985,   // Valid
      qs_ranking: -10      // Invalid
    }
    const errors = validateSchoolData(mixedData)
    
    expect(errors).toHaveLength(1)
    expect(errors).toContain('QS ranking must be between 1 and 2000')
  })
})
