import { describe, it, expect, vi } from 'vitest'

// Mock Papa Parse
const mockPapaParse = vi.fn()
vi.mock('papaparse', () => ({
  default: {
    parse: mockPapaParse
  }
}))

// Mock fetch
global.fetch = vi.fn()

// CSV processing helper functions
const processSchoolsCSV = async (csvData: any[]): Promise<{
  success: number
  errors: string[]
  duplicates: number
  skipped: number
}> => {
  let successCount = 0
  let duplicateCount = 0
  let skippedCount = 0
  const errors: string[] = []

  const VALID_SCHOOL_TYPES = ['Public', 'Private', 'Art & Design', 'Community College']
  const VALID_REGIONS = ['United States', 'United Kingdom', 'Canada', 'Europe', 'Asia', 'Australia', 'Other']

  for (const [index, school] of csvData.entries()) {
    try {
      // Validate required fields
      if (!school.name?.trim()) {
        errors.push(`Row ${index + 1}: School name is required`)
        continue
      }

      // Validate school type if provided
      if (school.type && !VALID_SCHOOL_TYPES.includes(school.type.trim())) {
        errors.push(`Row ${index + 1}: Invalid school type. Must be one of: ${VALID_SCHOOL_TYPES.join(', ')}`)
        continue
      }

      // Validate region if provided
      if (school.region && !VALID_REGIONS.includes(school.region.trim())) {
        errors.push(`Row ${index + 1}: Invalid region. Must be one of: ${VALID_REGIONS.join(', ')}`)
        continue
      }

      // Validate year_founded if provided
      if (school.year_founded && (isNaN(parseInt(school.year_founded)) || parseInt(school.year_founded) < 1000 || parseInt(school.year_founded) > new Date().getFullYear())) {
        errors.push(`Row ${index + 1}: Invalid year_founded. Must be a valid year between 1000 and ${new Date().getFullYear()}`)
        continue
      }

      // Validate qs_ranking if provided
      if (school.qs_ranking && (isNaN(parseInt(school.qs_ranking)) || parseInt(school.qs_ranking) < 1)) {
        errors.push(`Row ${index + 1}: Invalid qs_ranking. Must be a positive integer`)
        continue
      }

      // Mock duplicate check - only check for exact duplicates in the same batch
      const isDuplicate = csvData.slice(0, index).some(prevSchool => 
        prevSchool.name?.toLowerCase().trim() === school.name?.toLowerCase().trim()
      )
      if (isDuplicate) {
        duplicateCount++
        errors.push(`Row ${index + 1}: Duplicate school found - "${school.name.trim()}" already exists`)
        continue
      }

      // Mock API call
      const response = await fetch('/api/admin/schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: school.name.trim(),
          initial: school.initial?.trim() || null,
          type: school.type?.trim() || null,
          region: school.region?.trim() || school.country?.trim() || null,
          location: school.location?.trim() || null,
          year_founded: school.year_founded ? parseInt(school.year_founded) : null,
          qs_ranking: school.qs_ranking ? parseInt(school.qs_ranking) : null,
          website_url: school.website_url?.trim() || null,
        }),
      })

      if (response.ok) {
        successCount++
      } else {
        const error = await response.text()
        errors.push(`Row ${index + 1}: ${error}`)
      }
    } catch (error) {
      errors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return { success: successCount, errors, duplicates: duplicateCount, skipped: skippedCount }
}

const processProgramsCSV = async (csvData: any[]): Promise<{
  success: number
  errors: string[]
  duplicates: number
  skipped: number
}> => {
  let successCount = 0
  let duplicateCount = 0
  let skippedCount = 0
  const errors: string[] = []

  const VALID_DEGREES = ['Bachelor', 'Master', 'PhD', 'Associate', 'Certificate', 'Diploma']
  const VALID_DELIVERY_METHODS = ['Onsite', 'Online', 'Hybrid']
  const VALID_SCHEDULE_TYPES = ['Full-time', 'Part-time']
  const VALID_APPLICATION_DIFFICULTY = ['SSR', 'SR', 'R', 'N']

  for (const [index, program] of csvData.entries()) {
    try {
      // Validate required fields
      if (!program.name?.trim()) {
        errors.push(`Row ${index + 1}: Program name is required`)
        continue
      }

      if (!program.school_id?.trim()) {
        errors.push(`Row ${index + 1}: School ID is required`)
        continue
      }

      if (!program.degree?.trim()) {
        errors.push(`Row ${index + 1}: Degree is required`)
        continue
      }

      // Validate degree if provided
      if (program.degree && !VALID_DEGREES.includes(program.degree.trim())) {
        errors.push(`Row ${index + 1}: Invalid degree. Must be one of: ${VALID_DEGREES.join(', ')}`)
        continue
      }

      // Validate delivery_method if provided
      if (program.delivery_method && !VALID_DELIVERY_METHODS.includes(program.delivery_method.trim())) {
        errors.push(`Row ${index + 1}: Invalid delivery_method. Must be one of: ${VALID_DELIVERY_METHODS.join(', ')}`)
        continue
      }

      // Validate schedule_type if provided
      if (program.schedule_type && !VALID_SCHEDULE_TYPES.includes(program.schedule_type.trim())) {
        errors.push(`Row ${index + 1}: Invalid schedule_type. Must be one of: ${VALID_SCHEDULE_TYPES.join(', ')}`)
        continue
      }

      // Validate application_difficulty if provided
      if (program.application_difficulty && !VALID_APPLICATION_DIFFICULTY.includes(program.application_difficulty.trim())) {
        errors.push(`Row ${index + 1}: Invalid application_difficulty. Must be one of: ${VALID_APPLICATION_DIFFICULTY.join(', ')}`)
        continue
      }

      // Validate numeric fields
      if (program.duration_years && (isNaN(parseFloat(program.duration_years)) || parseFloat(program.duration_years) <= 0)) {
        errors.push(`Row ${index + 1}: Invalid duration_years. Must be a positive number`)
        continue
      }

      if (program.credits && (isNaN(parseInt(program.credits)) || parseInt(program.credits) < 0)) {
        errors.push(`Row ${index + 1}: Invalid credits. Must be a non-negative integer`)
        continue
      }

      if (program.total_tuition && (isNaN(parseInt(program.total_tuition)) || parseInt(program.total_tuition) < 0)) {
        errors.push(`Row ${index + 1}: Invalid total_tuition. Must be a non-negative integer`)
        continue
      }

      // Validate test scores
      if (program.ielts_score && (isNaN(parseFloat(program.ielts_score)) || parseFloat(program.ielts_score) < 0 || parseFloat(program.ielts_score) > 9)) {
        errors.push(`Row ${index + 1}: Invalid ielts_score. Must be between 0 and 9`)
        continue
      }

      if (program.toefl_score && (isNaN(parseFloat(program.toefl_score)) || parseFloat(program.toefl_score) < 0 || parseFloat(program.toefl_score) > 120)) {
        errors.push(`Row ${index + 1}: Invalid toefl_score. Must be between 0 and 120`)
        continue
      }

      if (program.gre_score && (isNaN(parseInt(program.gre_score)) || parseInt(program.gre_score) < 260 || parseInt(program.gre_score) > 340)) {
        errors.push(`Row ${index + 1}: Invalid gre_score. Must be between 260 and 340`)
        continue
      }

      if (program.min_gpa && (isNaN(parseFloat(program.min_gpa)) || parseFloat(program.min_gpa) < 0 || parseFloat(program.min_gpa) > 4)) {
        errors.push(`Row ${index + 1}: Invalid min_gpa. Must be between 0 and 4`)
        continue
      }

      // Validate add_ons JSON
      let addOns = null
      if (program.add_ons?.trim()) {
        try {
          addOns = JSON.parse(program.add_ons)
        } catch (e) {
          errors.push(`Row ${index + 1}: Invalid add_ons JSON format`)
          continue
        }
      }

      // Mock duplicate check - only check for exact duplicates in the same batch
      const isDuplicate = csvData.slice(0, index).some(prevProgram => 
        prevProgram.name?.toLowerCase() === program.name?.toLowerCase() && 
        prevProgram.school_id === program.school_id
      )
      if (isDuplicate) {
        duplicateCount++
        errors.push(`Row ${index + 1}: Duplicate program found - "${program.name.trim()}" already exists for this school`)
        continue
      }

      // Mock API call
      const response = await fetch('/api/admin/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: program.name.trim(),
          initial: program.initial?.trim() || null,
          school_id: program.school_id.trim(),
          degree: program.degree.trim(),
          website_url: program.website_url?.trim() || null,
          duration_years: program.duration_years ? parseFloat(program.duration_years) : null,
          currency: program.currency?.trim() || null,
          total_tuition: program.total_tuition ? parseInt(program.total_tuition) : null,
          is_stem: program.is_stem === 'true' || program.is_stem === '1' || program.is_stem === 'Y' || program.is_stem === 'y',
          description: program.description?.trim() || null,
          credits: program.credits ? parseInt(program.credits) : null,
          delivery_method: program.delivery_method?.trim() || null,
          schedule_type: program.schedule_type?.trim() || null,
          location: program.location?.trim() || null,
          application_difficulty: program.application_difficulty?.trim() || null,
          difficulty_description: program.difficulty_description?.trim() || null,
          add_ons: addOns,
          start_date: program.start_date?.trim() || null,
          ielts_score: program.ielts_score ? parseFloat(program.ielts_score) : null,
          toefl_score: program.toefl_score ? parseFloat(program.toefl_score) : null,
          gre_score: program.gre_score ? parseInt(program.gre_score) : null,
          min_gpa: program.min_gpa ? parseFloat(program.min_gpa) : null,
          other_tests: program.other_tests?.trim() || null,
          requires_personal_statement: program.requires_personal_statement === 'true' || program.requires_personal_statement === '1' || program.requires_personal_statement === 'Y' || program.requires_personal_statement === 'y',
          requires_portfolio: program.requires_portfolio === 'true' || program.requires_portfolio === '1' || program.requires_portfolio === 'Y' || program.requires_portfolio === 'y',
          requires_cv: program.requires_cv === 'true' || program.requires_cv === '1' || program.requires_cv === 'Y' || program.requires_cv === 'y',
          letters_of_recommendation: program.letters_of_recommendation ? parseInt(program.letters_of_recommendation) : null,
          application_fee: program.application_fee ? parseInt(program.application_fee) : null,
          application_deadline: program.application_deadline?.trim() || null,
        }),
      })

      if (response.ok) {
        successCount++
      } else {
        const error = await response.text()
        errors.push(`Row ${index + 1}: ${error}`)
      }
    } catch (error) {
      errors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return { success: successCount, errors, duplicates: duplicateCount, skipped: skippedCount }
}

describe('CSV Processing Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({})
    })
  })

  describe('Schools CSV Processing', () => {
    it('should process valid schools successfully', async () => {
      const csvData = [
        { name: 'MIT', type: 'Private', region: 'United States', year_founded: '1861', qs_ranking: '1' },
        { name: 'Harvard', type: 'Private', region: 'United States', year_founded: '1636', qs_ranking: '3' }
      ]

      const result = await processSchoolsCSV(csvData)

      expect(result.success).toBe(2)
      expect(result.errors).toHaveLength(0)
      expect(result.duplicates).toBe(0)
      expect(result.skipped).toBe(0)
    })

    it('should handle validation errors', async () => {
      const csvData = [
        { name: '', type: 'Private' }, // Missing name
        { name: 'MIT', type: 'InvalidType' }, // Invalid type
        { name: 'Harvard', type: 'Private', region: 'InvalidRegion' }, // Invalid region
        { name: 'Stanford', type: 'Private', year_founded: '500' }, // Invalid year
        { name: 'Oxford', type: 'Private', qs_ranking: '-1' } // Invalid ranking
      ]

      const result = await processSchoolsCSV(csvData)

      expect(result.success).toBe(0)
      expect(result.errors).toHaveLength(5)
      expect(result.duplicates).toBe(0)
      expect(result.skipped).toBe(0)
      expect(result.errors[0]).toContain('School name is required')
      expect(result.errors[1]).toContain('Invalid school type')
      expect(result.errors[2]).toContain('Invalid region')
      expect(result.errors[3]).toContain('Invalid year_founded')
      expect(result.errors[4]).toContain('Invalid qs_ranking')
    })

    it('should handle duplicates', async () => {
      const csvData = [
        { name: 'MIT', type: 'Private' },
        { name: 'MIT', type: 'Private' } // Duplicate
      ]

      const result = await processSchoolsCSV(csvData)

      expect(result.success).toBe(1)
      expect(result.duplicates).toBe(1)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toContain('Duplicate school found')
    })

    it('should handle API errors', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: false,
        text: () => Promise.resolve('Server error')
      })

      const csvData = [
        { name: 'MIT', type: 'Private' }
      ]

      const result = await processSchoolsCSV(csvData)

      expect(result.success).toBe(0)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toContain('Server error')
    })

    it('should handle network errors', async () => {
      ;(global.fetch as any).mockRejectedValue(new Error('Network error'))

      const csvData = [
        { name: 'MIT', type: 'Private' }
      ]

      const result = await processSchoolsCSV(csvData)

      expect(result.success).toBe(0)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toContain('Network error')
    })
  })

  describe('Programs CSV Processing', () => {
    it('should process valid programs successfully', async () => {
      const csvData = [
        { name: 'Computer Science', school_id: 'school-1', degree: 'Master', delivery_method: 'Onsite', schedule_type: 'Full-time' },
        { name: 'Data Science', school_id: 'school-1', degree: 'Bachelor', delivery_method: 'Online', schedule_type: 'Part-time' }
      ]

      const result = await processProgramsCSV(csvData)

      expect(result.success).toBe(2)
      expect(result.errors).toHaveLength(0)
      expect(result.duplicates).toBe(0)
      expect(result.skipped).toBe(0)
    })

    it('should handle validation errors', async () => {
      const csvData = [
        { name: '', school_id: 'school-1', degree: 'Master' }, // Missing name
        { name: 'CS', school_id: '', degree: 'Master' }, // Missing school_id
        { name: 'CS', school_id: 'school-1', degree: '' }, // Missing degree
        { name: 'CS', school_id: 'school-1', degree: 'InvalidDegree' }, // Invalid degree
        { name: 'CS', school_id: 'school-1', degree: 'Master', delivery_method: 'InvalidMethod' }, // Invalid delivery_method
        { name: 'CS', school_id: 'school-1', degree: 'Master', schedule_type: 'InvalidSchedule' }, // Invalid schedule_type
        { name: 'CS', school_id: 'school-1', degree: 'Master', application_difficulty: 'Invalid' }, // Invalid application_difficulty
        { name: 'CS', school_id: 'school-1', degree: 'Master', duration_years: '-1' }, // Invalid duration
        { name: 'CS', school_id: 'school-1', degree: 'Master', credits: 'abc' }, // Invalid credits
        { name: 'CS', school_id: 'school-1', degree: 'Master', total_tuition: '-100' }, // Invalid tuition
        { name: 'CS', school_id: 'school-1', degree: 'Master', ielts_score: '10' }, // Invalid IELTS
        { name: 'CS', school_id: 'school-1', degree: 'Master', toefl_score: '150' }, // Invalid TOEFL
        { name: 'CS', school_id: 'school-1', degree: 'Master', gre_score: '200' }, // Invalid GRE
        { name: 'CS', school_id: 'school-1', degree: 'Master', min_gpa: '5.0' }, // Invalid GPA
        { name: 'CS', school_id: 'school-1', degree: 'Master', add_ons: 'invalid json' } // Invalid JSON
      ]

      const result = await processProgramsCSV(csvData)

      expect(result.success).toBe(0)
      expect(result.errors).toHaveLength(15)
      expect(result.duplicates).toBe(0)
      expect(result.skipped).toBe(0)
    })

    it('should handle duplicates', async () => {
      const csvData = [
        { name: 'Computer Science', school_id: 'school-1', degree: 'Master' },
        { name: 'Computer Science', school_id: 'school-1', degree: 'Master' } // Duplicate
      ]

      const result = await processProgramsCSV(csvData)

      expect(result.success).toBe(1)
      expect(result.duplicates).toBe(1)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toContain('Duplicate program found')
    })

    it('should handle boolean values in multiple formats', async () => {
      const csvData = [
        { name: 'CS1', school_id: 'school-1', degree: 'Master', is_stem: 'true' },
        { name: 'CS2', school_id: 'school-1', degree: 'Master', is_stem: '1' },
        { name: 'CS3', school_id: 'school-1', degree: 'Master', is_stem: 'Y' },
        { name: 'CS4', school_id: 'school-1', degree: 'Master', is_stem: 'y' },
        { name: 'CS5', school_id: 'school-1', degree: 'Master', is_stem: 'false' }
      ]

      const result = await processProgramsCSV(csvData)

      expect(result.success).toBe(5)
      expect(result.errors).toHaveLength(0)
      expect(result.duplicates).toBe(0)
      expect(result.skipped).toBe(0)
    })

    it('should handle valid JSON in add_ons', async () => {
      const csvData = [
        { name: 'CS1', school_id: 'school-1', degree: 'Master', add_ons: '{"scholarship": true}' },
        { name: 'CS2', school_id: 'school-1', degree: 'Master', add_ons: '{"features": ["research", "internship"]}' },
        { name: 'CS3', school_id: 'school-1', degree: 'Master', add_ons: '{}' }
      ]

      const result = await processProgramsCSV(csvData)

      expect(result.success).toBe(3)
      expect(result.errors).toHaveLength(0)
      expect(result.duplicates).toBe(0)
      expect(result.skipped).toBe(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty CSV data', async () => {
      const result = await processSchoolsCSV([])
      expect(result.success).toBe(0)
      expect(result.errors).toHaveLength(0)
      expect(result.duplicates).toBe(0)
      expect(result.skipped).toBe(0)
    })

    it('should handle whitespace in string fields', async () => {
      const csvData = [
        { name: '  MIT  ', type: '  Private  ', region: '  United States  ' }
      ]

      const result = await processSchoolsCSV(csvData)

      expect(result.success).toBe(1)
      expect(result.errors).toHaveLength(0)
    })

    it('should handle null/undefined values gracefully', async () => {
      const csvData = [
        { name: 'MIT', type: null, region: undefined, year_founded: null, qs_ranking: undefined }
      ]

      const result = await processSchoolsCSV(csvData)

      expect(result.success).toBe(1)
      expect(result.errors).toHaveLength(0)
    })

    it('should handle very large CSV files', async () => {
      const largeCsvData = Array.from({ length: 1000 }, (_, i) => ({
        name: `School ${i}`,
        type: 'Private',
        region: 'United States'
      }))

      const result = await processSchoolsCSV(largeCsvData)

      expect(result.success).toBe(1000)
      expect(result.errors).toHaveLength(0)
      expect(result.duplicates).toBe(0)
      expect(result.skipped).toBe(0)
    })
  })
})
