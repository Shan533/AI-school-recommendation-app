import { filterItems, searchConfigs, MatchType, getMatchInfo } from '@/lib/admin-search'

// Mock data for testing
const mockSchools = [
  { id: '1', name: 'Carnegie Mellon University', initial: 'CMU', country: 'USA', location: 'Pittsburgh' },
  { id: '2', name: 'Massachusetts Institute of Technology', initial: 'MIT', country: 'USA', location: 'Cambridge' },
  { id: '3', name: 'Stanford University', initial: 'Stanford', country: 'USA', location: 'Stanford' },
  { id: '4', name: 'University of California Berkeley', initial: 'UC Berkeley', country: 'USA', location: 'Berkeley' },
  { id: '5', name: 'Cornell University', initial: 'Cornell', country: 'USA', location: 'Ithaca' }
]

const mockPrograms = [
  { 
    id: '1', 
    name: 'Master of Science in Computer Science', 
    initial: 'MSCS',
    degree: 'Master',
    schools: { name: 'Carnegie Mellon University', initial: 'CMU' }
  },
  { 
    id: '2', 
    name: 'Bachelor of Science in Computer Science', 
    initial: 'BSCS',
    degree: 'Bachelor',
    schools: [{ name: 'MIT', initial: 'MIT' }, { name: 'Stanford University', initial: 'Stanford' }]
  },
  { 
    id: '3', 
    name: 'PhD in Artificial Intelligence', 
    initial: 'PhD AI',
    degree: 'PhD',
    schools: { name: 'Stanford University', initial: 'Stanford' }
  }
]

const mockUsers = [
  { id: '1', name: 'John Doe', email: 'john@example.com', is_admin: false },
  { id: '2', name: 'Jane Smith', email: 'jane@university.edu', is_admin: true },
  { id: '3', name: 'Admin User', email: 'admin@cmu.edu', is_admin: true },
  { id: '4', name: 'Test Student', email: 'test@gmail.com', is_admin: false }
]

describe('Admin Search System', () => {
  describe('getMatchInfo function', () => {
    test('should return EXACT match for identical strings', () => {
      const result = getMatchInfo('CMU', 'CMU')
      expect(result).toEqual({ type: MatchType.EXACT, score: 1000 })
    })

    test('should return STARTS_WITH match for prefix', () => {
      const result = getMatchInfo('Car', 'Carnegie Mellon University')
      expect(result).toEqual({ type: MatchType.STARTS_WITH, score: 800 })
    })

    test('should return WORD_BOUNDARY match for word start', () => {
      const result = getMatchInfo('Mellon', 'Carnegie Mellon University')
      expect(result).toEqual({ type: MatchType.WORD_BOUNDARY, score: 600 })
    })

    test('should return CONTAINS match for substring', () => {
      const result = getMatchInfo('nell', 'Cornell University')
      expect(result?.type).toBe(MatchType.CONTAINS)
      expect(result?.score).toBeGreaterThan(0)
      expect(result?.score).toBeLessThan(400)
    })

    test('should return null for no match', () => {
      const result = getMatchInfo('xyz', 'Carnegie Mellon University')
      expect(result).toBeNull()
    })

    test('should be case insensitive', () => {
      const result = getMatchInfo('cmu', 'CMU')
      expect(result).toEqual({ type: MatchType.EXACT, score: 1000 })
    })
  })

  describe('School Search', () => {
    test('should find exact match by abbreviation', () => {
      const results = filterItems(mockSchools, {
        fields: searchConfigs.schools.fields,
        searchTerm: 'CMU'
      })
      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('Carnegie Mellon University')
    })

    test('should find schools by partial name', () => {
      const results = filterItems(mockSchools, {
        fields: searchConfigs.schools.fields,
        searchTerm: 'University'
      })
      expect(results.length).toBeGreaterThan(1)
      expect(results.every(school => school.name.includes('University'))).toBe(true)
    })

    test('should find schools by country', () => {
      const results = filterItems(mockSchools, {
        fields: searchConfigs.schools.fields,
        searchTerm: 'USA'
      })
      expect(results).toHaveLength(5) // All mock schools are in USA
    })

    test('should find schools by location', () => {
      const results = filterItems(mockSchools, {
        fields: searchConfigs.schools.fields,
        searchTerm: 'Cambridge'
      })
      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('Massachusetts Institute of Technology')
    })

    test('should return results in correct ranking order', () => {
      const results = filterItems(mockSchools, {
        fields: searchConfigs.schools.fields,
        searchTerm: 'Stanford'
      })
      // Exact match on initial should come before word boundary match in name
      expect(results[0].initial).toBe('Stanford')
    })

    test('should return empty array for no matches', () => {
      const results = filterItems(mockSchools, {
        fields: searchConfigs.schools.fields,
        searchTerm: 'NonexistentSchool'
      })
      expect(results).toHaveLength(0)
    })

    test('should return all schools for empty search term', () => {
      const results = filterItems(mockSchools, {
        fields: searchConfigs.schools.fields,
        searchTerm: ''
      })
      expect(results).toHaveLength(mockSchools.length)
    })
  })

  describe('Program Search', () => {
    test('should find programs by abbreviation', () => {
      const results = filterItems(mockPrograms, {
        fields: searchConfigs.programs.fields,
        searchTerm: 'MSCS'
      })
      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('Master of Science in Computer Science')
    })

    test('should find programs by degree type', () => {
      const results = filterItems(mockPrograms, {
        fields: searchConfigs.programs.fields,
        searchTerm: 'Master'
      })
      expect(results.length).toBeGreaterThan(0)
      expect(results.some(program => program.degree === 'Master')).toBe(true)
    })

    test('should find programs by school name (nested object)', () => {
      const results = filterItems(mockPrograms, {
        fields: searchConfigs.programs.fields,
        searchTerm: 'Carnegie'
      })
      expect(results.length).toBeGreaterThan(0)
    })

    test('should find programs by school abbreviation (nested array)', () => {
      const results = filterItems(mockPrograms, {
        fields: searchConfigs.programs.fields,
        searchTerm: 'MIT'
      })
      expect(results.length).toBeGreaterThan(0)
    })

    test('should handle nested array of schools', () => {
      const results = filterItems(mockPrograms, {
        fields: searchConfigs.programs.fields,
        searchTerm: 'Stanford'
      })
      // Should find both programs associated with Stanford
      expect(results.length).toBeGreaterThan(1)
    })
  })

  describe('User Search', () => {
    test('should find users by name', () => {
      const results = filterItems(mockUsers, {
        fields: searchConfigs.users.fields,
        searchTerm: 'John'
      })
      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('John Doe')
    })

    test('should find users by email', () => {
      const results = filterItems(mockUsers, {
        fields: searchConfigs.users.fields,
        searchTerm: '@gmail.com'
      })
      expect(results).toHaveLength(1)
      expect(results[0].email).toBe('test@gmail.com')
    })

    test('should find admin users', () => {
      const results = filterItems(mockUsers, {
        fields: searchConfigs.users.fields,
        searchTerm: 'admin'
      })
      expect(results.length).toBeGreaterThan(0)
      expect(results.some(user => user.is_admin === true || user.name.toLowerCase().includes('admin'))).toBe(true)
    })

    test('should find users by email domain', () => {
      const results = filterItems(mockUsers, {
        fields: searchConfigs.users.fields,
        searchTerm: 'university.edu'
      })
      expect(results).toHaveLength(1)
      expect(results[0].email).toBe('jane@university.edu')
    })
  })

  describe('Search Ranking and Performance', () => {
    test('should prioritize exact matches over partial matches', () => {
      const testData = [
        { id: '1', name: 'Stanford University', initial: 'Stanford' },
        { id: '2', name: 'Stanford School of Medicine', initial: 'SSM' }
      ]
      
      const results = filterItems(testData, {
        fields: ['name', 'initial'],
        searchTerm: 'Stanford'
      })
      
      // Exact match on initial should come first
      expect(results[0].initial).toBe('Stanford')
    })

    test('should handle special characters in search', () => {
      const testData = [
        { id: '1', name: 'UC Berkeley', location: 'California, USA' }
      ]
      
      const results = filterItems(testData, {
        fields: ['name', 'location'],
        searchTerm: 'UC'
      })
      
      expect(results).toHaveLength(1)
    })

    test('should handle multiple word searches', () => {
      const results = filterItems(mockSchools, {
        fields: searchConfigs.schools.fields,
        searchTerm: 'Carnegie Mellon'
      })
      
      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('Carnegie Mellon University')
    })

    test('should be performant with large datasets', () => {
      // Create a large dataset
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `${i}`,
        name: `School ${i}`,
        initial: `S${i}`,
        country: i % 2 === 0 ? 'USA' : 'Canada'
      }))

      const startTime = performance.now()
      const results = filterItems(largeDataset, {
        fields: ['name', 'initial', 'country'],
        searchTerm: 'USA'
      })
      const endTime = performance.now()

      expect(results.length).toBe(500) // Half should match
      expect(endTime - startTime).toBeLessThan(100) // Should complete in <100ms
    })
  })

  describe('Edge Cases and Error Handling', () => {
    test('should handle null and undefined values gracefully', () => {
      const testData = [
        { id: '1', name: 'Test School', initial: null, location: undefined },
        { id: '2', name: null, initial: 'TS', location: 'Test City' }
      ]
      
      const results = filterItems(testData, {
        fields: ['name', 'initial', 'location'],
        searchTerm: 'Test'
      })
      
      expect(results.length).toBeGreaterThan(0)
    })

    test('should handle empty arrays', () => {
      const results = filterItems([], {
        fields: ['name'],
        searchTerm: 'test'
      })
      
      expect(results).toHaveLength(0)
    })

    test('should handle missing fields', () => {
      const testData = [
        { id: '1', name: 'Test Item' }
      ]
      
      const results = filterItems(testData, {
        fields: ['name', 'nonexistent_field'],
        searchTerm: 'Test'
      })
      
      expect(results).toHaveLength(1)
    })

    test('should handle deeply nested objects', () => {
      const testData = [
        {
          id: '1',
          name: 'Test Program',
          school: {
            details: {
              name: 'Deep School',
              location: {
                city: 'Test City'
              }
            }
          }
        }
      ]
      
      const results = filterItems(testData, {
        fields: ['name', 'school.details.name', 'school.details.location.city'],
        searchTerm: 'Deep'
      })
      
      expect(results).toHaveLength(1)
    })
  })

  describe('Search Configuration', () => {
    test('should have valid search configurations for all admin pages', () => {
      expect(searchConfigs.schools).toBeDefined()
      expect(searchConfigs.programs).toBeDefined()
      expect(searchConfigs.users).toBeDefined()
      expect(searchConfigs.reviews).toBeDefined()

      // Verify required properties
      Object.values(searchConfigs).forEach(config => {
        expect(config.fields).toBeInstanceOf(Array)
        expect(config.fields.length).toBeGreaterThan(0)
        expect(typeof config.placeholder).toBe('string')
        expect(typeof config.helpText).toBe('string')
      })
    })

    test('should include abbreviation fields in search configs', () => {
      expect(searchConfigs.schools.fields).toContain('initial')
      expect(searchConfigs.programs.fields).toContain('initial')
    })

    test('should include nested school fields in programs config', () => {
      expect(searchConfigs.programs.fields).toContain('schools.name')
      expect(searchConfigs.programs.fields).toContain('schools.initial')
    })
  })
})
