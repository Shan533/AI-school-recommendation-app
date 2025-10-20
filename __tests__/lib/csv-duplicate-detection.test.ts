import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock fetch globally
global.fetch = vi.fn()

// Mock duplicate detection functions (extracted from component logic)
const checkDuplicateSchool = async (schoolName: string, schoolInitial?: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/admin/schools?search=${encodeURIComponent(schoolName)}&limit=10`)
    if (!response.ok) return false
    
    const data = await response.json()
    const schools = data.schools || []
    
    // Check for exact name match or initial match
    return schools.some((school: any) => 
      school.name.toLowerCase() === schoolName.toLowerCase() ||
      (schoolInitial && school.initial && school.initial.toLowerCase() === schoolInitial.toLowerCase())
    )
  } catch (error) {
    console.error('Error checking duplicate school:', error)
    return false
  }
}

const checkDuplicateProgram = async (programName: string, schoolId: string, programInitial?: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/admin/programs?search=${encodeURIComponent(programName)}&limit=10`)
    if (!response.ok) return false
    
    const data = await response.json()
    const programs = data.programs || []
    
    // Check for exact name match with same school, or initial match
    return programs.some((program: any) => 
      program.school_id === schoolId && (
        program.name.toLowerCase() === programName.toLowerCase() ||
        (programInitial && program.initial && program.initial.toLowerCase() === programInitial.toLowerCase())
      )
    )
  } catch (error) {
    console.error('Error checking duplicate program:', error)
    return false
  }
}

describe('CSV Duplicate Detection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('School Duplicate Detection', () => {
    it('should detect exact name match', async () => {
      const mockSchools = [
        { name: 'Massachusetts Institute of Technology', initial: 'MIT' },
        { name: 'Harvard University', initial: 'HU' }
      ]

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ schools: mockSchools })
      })

      const isDuplicate = await checkDuplicateSchool('Massachusetts Institute of Technology')
      expect(isDuplicate).toBe(true)
    })

    it('should detect case-insensitive name match', async () => {
      const mockSchools = [
        { name: 'Massachusetts Institute of Technology', initial: 'MIT' },
        { name: 'Harvard University', initial: 'HU' }
      ]

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ schools: mockSchools })
      })

      const isDuplicate = await checkDuplicateSchool('massachusetts institute of technology')
      expect(isDuplicate).toBe(true)
    })

    it('should detect initial match', async () => {
      const mockSchools = [
        { name: 'Massachusetts Institute of Technology', initial: 'MIT' },
        { name: 'Harvard University', initial: 'HU' }
      ]

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ schools: mockSchools })
      })

      const isDuplicate = await checkDuplicateSchool('MIT', 'MIT')
      expect(isDuplicate).toBe(true)
    })

    it('should detect case-insensitive initial match', async () => {
      const mockSchools = [
        { name: 'Massachusetts Institute of Technology', initial: 'MIT' },
        { name: 'Harvard University', initial: 'HU' }
      ]

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ schools: mockSchools })
      })

      const isDuplicate = await checkDuplicateSchool('MIT', 'mit')
      expect(isDuplicate).toBe(true)
    })

    it('should not detect false positives', async () => {
      const mockSchools = [
        { name: 'Massachusetts Institute of Technology', initial: 'MIT' },
        { name: 'Harvard University', initial: 'HU' }
      ]

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ schools: mockSchools })
      })

      const isDuplicate = await checkDuplicateSchool('Stanford University')
      expect(isDuplicate).toBe(false)
    })

    it('should handle empty initial gracefully', async () => {
      const mockSchools = [
        { name: 'Massachusetts Institute of Technology', initial: 'MIT' },
        { name: 'Harvard University', initial: 'HU' }
      ]

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ schools: mockSchools })
      })

      const isDuplicate = await checkDuplicateSchool('Stanford University', '')
      expect(isDuplicate).toBe(false)
    })

    it('should handle API errors gracefully', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({})
      })

      const isDuplicate = await checkDuplicateSchool('MIT')
      expect(isDuplicate).toBe(false)
    })

    it('should handle network errors gracefully', async () => {
      ;(global.fetch as any).mockRejectedValue(new Error('Network error'))

      const isDuplicate = await checkDuplicateSchool('MIT')
      expect(isDuplicate).toBe(false)
    })

    it('should handle empty response', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ schools: [] })
      })

      const isDuplicate = await checkDuplicateSchool('MIT')
      expect(isDuplicate).toBe(false)
    })

    it('should handle malformed response', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({})
      })

      const isDuplicate = await checkDuplicateSchool('MIT')
      expect(isDuplicate).toBe(false)
    })
  })

  describe('Program Duplicate Detection', () => {
    it('should detect exact name match within same school', async () => {
      const mockPrograms = [
        { name: 'Computer Science', school_id: 'school-1', initial: 'CS' },
        { name: 'Data Science', school_id: 'school-1', initial: 'DS' },
        { name: 'Computer Science', school_id: 'school-2', initial: 'CS' }
      ]

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ programs: mockPrograms })
      })

      const isDuplicate = await checkDuplicateProgram('Computer Science', 'school-1')
      expect(isDuplicate).toBe(true)
    })

    it('should detect case-insensitive name match within same school', async () => {
      const mockPrograms = [
        { name: 'Computer Science', school_id: 'school-1', initial: 'CS' },
        { name: 'Data Science', school_id: 'school-1', initial: 'DS' }
      ]

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ programs: mockPrograms })
      })

      const isDuplicate = await checkDuplicateProgram('computer science', 'school-1')
      expect(isDuplicate).toBe(true)
    })

    it('should detect initial match within same school', async () => {
      const mockPrograms = [
        { name: 'Computer Science', school_id: 'school-1', initial: 'CS' },
        { name: 'Data Science', school_id: 'school-1', initial: 'DS' }
      ]

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ programs: mockPrograms })
      })

      const isDuplicate = await checkDuplicateProgram('CS', 'school-1', 'CS')
      expect(isDuplicate).toBe(true)
    })

    it('should detect case-insensitive initial match within same school', async () => {
      const mockPrograms = [
        { name: 'Computer Science', school_id: 'school-1', initial: 'CS' },
        { name: 'Data Science', school_id: 'school-1', initial: 'DS' }
      ]

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ programs: mockPrograms })
      })

      const isDuplicate = await checkDuplicateProgram('CS', 'school-1', 'cs')
      expect(isDuplicate).toBe(true)
    })

    it('should not detect false positives across different schools', async () => {
      const mockPrograms = [
        { name: 'Computer Science', school_id: 'school-1', initial: 'CS' },
        { name: 'Computer Science', school_id: 'school-2', initial: 'CS' }
      ]

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ programs: mockPrograms })
      })

      const isDuplicate = await checkDuplicateProgram('Computer Science', 'school-3')
      expect(isDuplicate).toBe(false)
    })

    it('should not detect false positives with different names', async () => {
      const mockPrograms = [
        { name: 'Computer Science', school_id: 'school-1', initial: 'CS' },
        { name: 'Data Science', school_id: 'school-1', initial: 'DS' }
      ]

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ programs: mockPrograms })
      })

      const isDuplicate = await checkDuplicateProgram('Artificial Intelligence', 'school-1')
      expect(isDuplicate).toBe(false)
    })

    it('should handle empty initial gracefully', async () => {
      const mockPrograms = [
        { name: 'Computer Science', school_id: 'school-1', initial: 'CS' },
        { name: 'Data Science', school_id: 'school-1', initial: 'DS' }
      ]

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ programs: mockPrograms })
      })

      const isDuplicate = await checkDuplicateProgram('Computer Science', 'school-1', '')
      expect(isDuplicate).toBe(true) // Should match by name
    })

    it('should handle API errors gracefully', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({})
      })

      const isDuplicate = await checkDuplicateProgram('Computer Science', 'school-1')
      expect(isDuplicate).toBe(false)
    })

    it('should handle network errors gracefully', async () => {
      ;(global.fetch as any).mockRejectedValue(new Error('Network error'))

      const isDuplicate = await checkDuplicateProgram('Computer Science', 'school-1')
      expect(isDuplicate).toBe(false)
    })

    it('should handle empty response', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ programs: [] })
      })

      const isDuplicate = await checkDuplicateProgram('Computer Science', 'school-1')
      expect(isDuplicate).toBe(false)
    })

    it('should handle malformed response', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({})
      })

      const isDuplicate = await checkDuplicateProgram('Computer Science', 'school-1')
      expect(isDuplicate).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('should handle schools with missing initial field', async () => {
      const mockSchools = [
        { name: 'Massachusetts Institute of Technology' }, // No initial
        { name: 'Harvard University', initial: 'HU' }
      ]

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ schools: mockSchools })
      })

      const isDuplicate = await checkDuplicateSchool('MIT', 'MIT')
      expect(isDuplicate).toBe(false) // Should not match because existing school has no initial
    })

    it('should handle programs with missing initial field', async () => {
      const mockPrograms = [
        { name: 'Computer Science', school_id: 'school-1' }, // No initial
        { name: 'Data Science', school_id: 'school-1', initial: 'DS' }
      ]

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ programs: mockPrograms })
      })

      const isDuplicate = await checkDuplicateProgram('CS', 'school-1', 'CS')
      expect(isDuplicate).toBe(false) // Should not match because existing program has no initial
    })

    it('should handle null/undefined values in response', async () => {
      const mockSchools = [
        { name: 'Massachusetts Institute of Technology', initial: null },
        { name: 'Harvard University', initial: undefined }
      ]

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ schools: mockSchools })
      })

      const isDuplicate = await checkDuplicateSchool('MIT', 'MIT')
      expect(isDuplicate).toBe(false)
    })

    it('should handle special characters in names', async () => {
      const mockSchools = [
        { name: 'École Polytechnique', initial: 'EP' },
        { name: 'Universität München', initial: 'UM' }
      ]

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ schools: mockSchools })
      })

      const isDuplicate = await checkDuplicateSchool('École Polytechnique')
      expect(isDuplicate).toBe(true)
    })

    it('should handle very long names', async () => {
      const longName = 'A'.repeat(1000)
      const mockSchools = [
        { name: longName, initial: 'LONG' }
      ]

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ schools: mockSchools })
      })

      const isDuplicate = await checkDuplicateSchool(longName)
      expect(isDuplicate).toBe(true)
    })
  })

  describe('Performance Considerations', () => {
    it('should handle large response sets efficiently', async () => {
      const largeProgramsList = Array.from({ length: 1000 }, (_, i) => ({
        name: `Program ${i}`,
        school_id: `school-${i % 10}`,
        initial: `P${i}`
      }))

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ programs: largeProgramsList })
      })

      const startTime = Date.now()
      const isDuplicate = await checkDuplicateProgram('Program 500', 'school-0') // school-0 will have Program 500
      const endTime = Date.now()

      expect(isDuplicate).toBe(true)
      expect(endTime - startTime).toBeLessThan(100) // Should complete within 100ms
    })

    it('should handle concurrent duplicate checks', async () => {
      const mockSchools = [
        { name: 'MIT', initial: 'MIT' },
        { name: 'Harvard', initial: 'HU' }
      ]

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ schools: mockSchools })
      })

      const promises = [
        checkDuplicateSchool('MIT'),
        checkDuplicateSchool('Harvard'),
        checkDuplicateSchool('Stanford')
      ]

      const results = await Promise.all(promises)
      expect(results).toEqual([true, true, false])
    })
  })
})
