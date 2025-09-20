import { describe, it, expect, assertType } from 'vitest'
import {
  APPLICATION_DIFFICULTY_VALUES,
  DIFFICULTY_LEVELS,
  DELIVERY_METHODS,
  SCHEDULE_TYPES,
  DEGREE_TYPES,
  type ApplicationDifficulty,
  type DifficultyInfo,
  type ProgramSearchFilters,
  type SchoolSearchFilters,
  type EnhancedProgram,
  type EnhancedSchool,
} from '@/lib/types/schema-enhancements'

describe('schema-enhancements types/constants', () => {
  it('defines difficulty values and map coherently', () => {
    expect(APPLICATION_DIFFICULTY_VALUES).toEqual(['Easy', 'Medium', 'Hard', 'Very Hard'])
    for (const key of APPLICATION_DIFFICULTY_VALUES) {
      const info = DIFFICULTY_LEVELS[key]
      expect(info.level).toBe(key)
      expect(info.label.length).toBeGreaterThan(0)
      expect(info.acceptanceRate.length).toBeGreaterThan(0)
    }

    // Type-level check
    const sample: DifficultyInfo = DIFFICULTY_LEVELS.Medium
    expect(sample.level).toBe('Medium')
  })

  it('includes expected delivery, schedule and degree options', () => {
    expect(DELIVERY_METHODS).toContain('Onsite')
    expect(DELIVERY_METHODS).toContain('Online')
    expect(DELIVERY_METHODS).toContain('Hybrid')

    expect(SCHEDULE_TYPES).toEqual(expect.arrayContaining(['Full-time', 'Part-time', 'Flexible']))

    expect(DEGREE_TYPES).toEqual(expect.arrayContaining(['Bachelor', 'Master', 'PhD']))
  })

  it('ProgramSearchFilters supports region filtering and typed difficulty', () => {
    const filters: ProgramSearchFilters = {
      search: 'cs',
      region: ['United States', 'Asia'],
      difficulty: ['Easy', 'Medium'] satisfies ApplicationDifficulty[]
    }
    expect(filters.region?.length).toBe(2)
    expect(filters.difficulty?.includes('Easy')).toBe(true)
  })

  it('SchoolSearchFilters supports basic constraints', () => {
    const filters: SchoolSearchFilters = {
      search: 'Tech',
      type: ['Public'],
      year_founded_min: 1800,
      year_founded_max: 2024
    }
    expect(filters.type).toEqual(['Public'])
  })

  it('EnhancedProgram and EnhancedSchool minimal shape compiles', () => {
    const p: EnhancedProgram = {
      id: 'p1',
      name: 'CS',
      school_id: 's1',
      degree: 'Master',
      is_stem: true,
      created_at: new Date().toISOString()
    }
    const s: EnhancedSchool = {
      id: 's1',
      name: 'Test University',
      created_at: new Date().toISOString()
    }
    expect(p.name).toBe('CS')
    expect(s.name).toBe('Test University')
  })
})


