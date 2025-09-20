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
  validateSchoolData,
  validateCollectionData,
  validateCollectionItemData,
  validateCareerData,
  validateCategoryData
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

describe('validateCollectionData', () => {
  it('should return empty array for valid collection data', () => {
    const validData = {
      name: 'My Collection',
      description: 'A test collection'
    }
    expect(validateCollectionData(validData)).toEqual([])
  })
  
  it('should return empty array when description is missing', () => {
    const dataWithoutDescription = {
      name: 'My Collection'
    }
    expect(validateCollectionData(dataWithoutDescription)).toEqual([])
  })
  
  it('should validate required name field', () => {
    // Missing name
    const noName = { description: 'Test' }
    expect(validateCollectionData(noName)).toContain('Collection name is required')
    
    // Empty name
    const emptyName = { name: '' }
    expect(validateCollectionData(emptyName)).toContain('Collection name is required')
    
    // Whitespace only name
    const whitespaceName = { name: '   ' }
    expect(validateCollectionData(whitespaceName)).toContain('Collection name is required')
    
    // Non-string name
    const nonStringName = { name: 123 }
    expect(validateCollectionData(nonStringName)).toContain('Collection name is required')
  })
  
  it('should validate name length limit', () => {
    const longName = { name: 'a'.repeat(101) }
    expect(validateCollectionData(longName)).toContain('Collection name must be less than 100 characters')
    
    // Exactly 100 characters should be valid
    const exactLimit = { name: 'a'.repeat(100) }
    expect(validateCollectionData(exactLimit)).toEqual([])
  })
  
  it('should validate description length limit', () => {
    const longDescription = { 
      name: 'Test Collection',
      description: 'a'.repeat(501)
    }
    expect(validateCollectionData(longDescription)).toContain('Collection description must be less than 500 characters')
    
    // Exactly 500 characters should be valid
    const exactLimit = { 
      name: 'Test Collection',
      description: 'a'.repeat(500)
    }
    expect(validateCollectionData(exactLimit)).toEqual([])
  })
  
  it('should handle non-string description', () => {
    const nonStringDesc = { 
      name: 'Test Collection',
      description: 123
    }
    expect(validateCollectionData(nonStringDesc)).toEqual([])
  })
})

describe('validateCollectionItemData', () => {
  it('should return empty array for valid school item data', () => {
    const validSchoolItem = {
      school_id: 'school-123',
      notes: 'Interesting school'
    }
    expect(validateCollectionItemData(validSchoolItem)).toEqual([])
  })
  
  it('should return empty array for valid program item data', () => {
    const validProgramItem = {
      program_id: 'program-123',
      notes: 'Great program'
    }
    expect(validateCollectionItemData(validProgramItem)).toEqual([])
  })
  
  it('should return empty array when notes are missing', () => {
    const itemWithoutNotes = {
      school_id: 'school-123'
    }
    expect(validateCollectionItemData(itemWithoutNotes)).toEqual([])
  })
  
  it('should require either school_id or program_id', () => {
    // Neither provided
    const neitherProvided = { notes: 'Test' }
    expect(validateCollectionItemData(neitherProvided)).toContain('Either school_id or program_id is required')
    
    // Both provided
    const bothProvided = { 
      school_id: 'school-123',
      program_id: 'program-123'
    }
    expect(validateCollectionItemData(bothProvided)).toContain('Cannot specify both school_id and program_id')
  })
  
  it('should validate school_id and program_id as strings', () => {
    // Non-string school_id
    const nonStringSchoolId = { school_id: 123 }
    expect(validateCollectionItemData(nonStringSchoolId)).toContain('Either school_id or program_id is required')
    
    // Non-string program_id
    const nonStringProgramId = { program_id: 456 }
    expect(validateCollectionItemData(nonStringProgramId)).toContain('Either school_id or program_id is required')
  })
  
  it('should validate notes length limit', () => {
    const longNotes = {
      school_id: 'school-123',
      notes: 'a'.repeat(501)
    }
    expect(validateCollectionItemData(longNotes)).toContain('Notes must be less than 500 characters')
    
    // Exactly 500 characters should be valid
    const exactLimit = {
      school_id: 'school-123',
      notes: 'a'.repeat(500)
    }
    expect(validateCollectionItemData(exactLimit)).toEqual([])
  })
  
  it('should handle non-string notes', () => {
    const nonStringNotes = {
      school_id: 'school-123',
      notes: 123
    }
    expect(validateCollectionItemData(nonStringNotes)).toEqual([])
  })
})

describe('validateCareerData', () => {
  it('should return valid result for correct career data', () => {
    const validData = {
      name: 'Software Engineer',
      abbreviation: 'SWE',
      career_type: 'Software',
      industry: 'Technology',
      description: 'Develops software applications'
    }
    const result = validateCareerData(validData)
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
  })
  
  it('should return valid result when optional fields are missing', () => {
    const minimalData = {
      name: 'Data Scientist',
      abbreviation: 'DS',
      career_type: 'Data'
    }
    const result = validateCareerData(minimalData)
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
  })
  
  it('should validate required name field', () => {
    // Missing name
    const noName = { abbreviation: 'TEST', career_type: 'Software' }
    const result = validateCareerData(noName)
    expect(result.valid).toBe(false)
    expect(result.errors).toContainEqual({ field: 'name', message: 'Career name is required' })
    
    // Empty name
    const emptyName = { name: '', abbreviation: 'TEST', career_type: 'Software' }
    const result2 = validateCareerData(emptyName)
    expect(result2.valid).toBe(false)
    expect(result2.errors).toContainEqual({ field: 'name', message: 'Career name is required' })
    
    // Non-string name
    const nonStringName = { name: 123, abbreviation: 'TEST', career_type: 'Software' }
    const result3 = validateCareerData(nonStringName)
    expect(result3.valid).toBe(false)
    expect(result3.errors).toContainEqual({ field: 'name', message: 'Career name is required' })
  })
  
  it('should validate name length limit', () => {
    const longName = { 
      name: 'a'.repeat(51), 
      abbreviation: 'TEST', 
      career_type: 'Software' 
    }
    const result = validateCareerData(longName)
    expect(result.valid).toBe(false)
    expect(result.errors).toContainEqual({ field: 'name', message: 'Career name must be less than 50 characters' })
  })
  
  it('should validate required abbreviation field', () => {
    // Missing abbreviation
    const noAbbr = { name: 'Test Career', career_type: 'Software' }
    const result = validateCareerData(noAbbr)
    expect(result.valid).toBe(false)
    expect(result.errors).toContainEqual({ field: 'abbreviation', message: 'Abbreviation is required' })
    
    // Empty abbreviation
    const emptyAbbr = { name: 'Test Career', abbreviation: '', career_type: 'Software' }
    const result2 = validateCareerData(emptyAbbr)
    expect(result2.valid).toBe(false)
    expect(result2.errors).toContainEqual({ field: 'abbreviation', message: 'Abbreviation is required' })
  })
  
  it('should validate abbreviation length limit', () => {
    const longAbbr = { 
      name: 'Test Career', 
      abbreviation: 'a'.repeat(11), 
      career_type: 'Software' 
    }
    const result = validateCareerData(longAbbr)
    expect(result.valid).toBe(false)
    expect(result.errors).toContainEqual({ field: 'abbreviation', message: 'Abbreviation must be less than 10 characters' })
  })
  
  it('should validate career type', () => {
    // Invalid career type
    const invalidType = { name: 'Test Career', abbreviation: 'TEST', career_type: 'Invalid' }
    const result = validateCareerData(invalidType)
    expect(result.valid).toBe(false)
    expect(result.errors).toContainEqual({ field: 'career_type', message: 'Valid career type is required' })
    
    // Missing career type
    const noType = { name: 'Test Career', abbreviation: 'TEST' }
    const result2 = validateCareerData(noType)
    expect(result2.valid).toBe(false)
    expect(result2.errors).toContainEqual({ field: 'career_type', message: 'Valid career type is required' })
  })
  
  it('should validate all valid career types', () => {
    const validTypes = ['Software', 'Data', 'AI', 'Hardware', 'Product', 'Design', 'Security', 'Infrastructure', 'Management', 'Finance', 'Healthcare', 'Research']
    
    validTypes.forEach(type => {
      const data = { name: 'Test Career', abbreviation: 'TEST', career_type: type }
      const result = validateCareerData(data)
      expect(result.valid).toBe(true)
    })
  })
  
  it('should validate industry length limit', () => {
    const longIndustry = { 
      name: 'Test Career', 
      abbreviation: 'TEST', 
      career_type: 'Software',
      industry: 'a'.repeat(51)
    }
    const result = validateCareerData(longIndustry)
    expect(result.valid).toBe(false)
    expect(result.errors).toContainEqual({ field: 'industry', message: 'Industry must be less than 50 characters' })
  })
  
  it('should validate description length limit', () => {
    const longDescription = { 
      name: 'Test Career', 
      abbreviation: 'TEST', 
      career_type: 'Software',
      description: 'a'.repeat(501)
    }
    const result = validateCareerData(longDescription)
    expect(result.valid).toBe(false)
    expect(result.errors).toContainEqual({ field: 'description', message: 'Description must be less than 500 characters' })
  })
  
  it('should return multiple validation errors', () => {
    const invalidData = {
      name: 'a'.repeat(51),  // Too long
      abbreviation: 'a'.repeat(11),  // Too long
      career_type: 'Invalid',  // Invalid type
      industry: 'a'.repeat(51),  // Too long
      description: 'a'.repeat(501)  // Too long
    }
    const result = validateCareerData(invalidData)
    expect(result.valid).toBe(false)
    expect(result.errors).toHaveLength(5)
  })
})

describe('validateCategoryData', () => {
  it('should return valid result for correct category data', () => {
    const validData = {
      name: 'Computer Science',
      abbreviation: 'CS',
      description: 'Computer science programs'
    }
    const result = validateCategoryData(validData)
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
  })
  
  it('should return valid result when optional description is missing', () => {
    const minimalData = {
      name: 'Engineering',
      abbreviation: 'ENG'
    }
    const result = validateCategoryData(minimalData)
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
  })
  
  it('should validate required name field', () => {
    // Missing name
    const noName = { abbreviation: 'TEST' }
    const result = validateCategoryData(noName)
    expect(result.valid).toBe(false)
    expect(result.errors).toContainEqual({ field: 'name', message: 'Category name is required' })
    
    // Empty name
    const emptyName = { name: '', abbreviation: 'TEST' }
    const result2 = validateCategoryData(emptyName)
    expect(result2.valid).toBe(false)
    expect(result2.errors).toContainEqual({ field: 'name', message: 'Category name is required' })
    
    // Non-string name
    const nonStringName = { name: 123, abbreviation: 'TEST' }
    const result3 = validateCategoryData(nonStringName)
    expect(result3.valid).toBe(false)
    expect(result3.errors).toContainEqual({ field: 'name', message: 'Category name is required' })
  })
  
  it('should validate name length limit', () => {
    const longName = { 
      name: 'a'.repeat(51), 
      abbreviation: 'TEST'
    }
    const result = validateCategoryData(longName)
    expect(result.valid).toBe(false)
    expect(result.errors).toContainEqual({ field: 'name', message: 'Category name must be less than 50 characters' })
  })
  
  it('should validate required abbreviation field', () => {
    // Missing abbreviation
    const noAbbr = { name: 'Test Category' }
    const result = validateCategoryData(noAbbr)
    expect(result.valid).toBe(false)
    expect(result.errors).toContainEqual({ field: 'abbreviation', message: 'Abbreviation is required' })
    
    // Empty abbreviation
    const emptyAbbr = { name: 'Test Category', abbreviation: '' }
    const result2 = validateCategoryData(emptyAbbr)
    expect(result2.valid).toBe(false)
    expect(result2.errors).toContainEqual({ field: 'abbreviation', message: 'Abbreviation is required' })
  })
  
  it('should validate abbreviation length limit', () => {
    const longAbbr = { 
      name: 'Test Category', 
      abbreviation: 'a'.repeat(11)
    }
    const result = validateCategoryData(longAbbr)
    expect(result.valid).toBe(false)
    expect(result.errors).toContainEqual({ field: 'abbreviation', message: 'Abbreviation must be less than 10 characters' })
  })
  
  it('should validate description length limit', () => {
    const longDescription = { 
      name: 'Test Category', 
      abbreviation: 'TEST',
      description: 'a'.repeat(501)
    }
    const result = validateCategoryData(longDescription)
    expect(result.valid).toBe(false)
    expect(result.errors).toContainEqual({ field: 'description', message: 'Description must be less than 500 characters' })
  })
  
  it('should return multiple validation errors', () => {
    const invalidData = {
      name: 'a'.repeat(51),  // Too long
      abbreviation: 'a'.repeat(11),  // Too long
      description: 'a'.repeat(501)  // Too long
    }
    const result = validateCategoryData(invalidData)
    expect(result.valid).toBe(false)
    expect(result.errors).toHaveLength(3)
  })
})
