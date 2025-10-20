import { describe, it, expect } from 'vitest'

// Test data constants (same as in the component)
const VALID_SCHOOL_TYPES = ['Public', 'Private', 'Art & Design', 'Community College']
const VALID_REGIONS = ['United States', 'United Kingdom', 'Canada', 'Europe', 'Asia', 'Australia', 'Other']
const VALID_DEGREES = ['Bachelor', 'Master', 'PhD', 'Associate', 'Certificate', 'Diploma']
const VALID_DELIVERY_METHODS = ['Onsite', 'Online', 'Hybrid']
const VALID_SCHEDULE_TYPES = ['Full-time', 'Part-time']
const VALID_APPLICATION_DIFFICULTY = ['SSR', 'SR', 'R', 'N']

// Validation helper functions (extracted from component logic)
const validateSchoolType = (type: string): boolean => {
  return !type || VALID_SCHOOL_TYPES.includes(type)
}

const validateRegion = (region: string): boolean => {
  return !region || VALID_REGIONS.includes(region)
}

const validateYearFounded = (year: string): boolean => {
  if (!year) return true
  const yearNum = parseFloat(year)
  return !isNaN(yearNum) && Number.isInteger(yearNum) && yearNum >= 1000 && yearNum <= new Date().getFullYear()
}

const validateQSRanking = (ranking: string): boolean => {
  if (!ranking) return true
  const rankingNum = parseFloat(ranking)
  return !isNaN(rankingNum) && Number.isInteger(rankingNum) && rankingNum >= 1
}

const validateDegree = (degree: string): boolean => {
  return !degree || VALID_DEGREES.includes(degree)
}

const validateDeliveryMethod = (method: string): boolean => {
  return !method || VALID_DELIVERY_METHODS.includes(method)
}

const validateScheduleType = (schedule: string): boolean => {
  return !schedule || VALID_SCHEDULE_TYPES.includes(schedule)
}

const validateApplicationDifficulty = (difficulty: string): boolean => {
  return !difficulty || VALID_APPLICATION_DIFFICULTY.includes(difficulty)
}

const validateDurationYears = (duration: string): boolean => {
  if (!duration) return true
  const durationNum = parseFloat(duration)
  return !isNaN(durationNum) && durationNum > 0
}

const validateCredits = (credits: string): boolean => {
  if (!credits) return true
  const creditsNum = parseFloat(credits)
  return !isNaN(creditsNum) && Number.isInteger(creditsNum) && creditsNum >= 0
}

const validateTotalTuition = (tuition: string): boolean => {
  if (!tuition) return true
  const tuitionNum = parseFloat(tuition)
  return !isNaN(tuitionNum) && Number.isInteger(tuitionNum) && tuitionNum >= 0
}

const validateIELTSScore = (score: string): boolean => {
  if (!score) return true
  const scoreNum = parseFloat(score)
  return !isNaN(scoreNum) && scoreNum >= 0 && scoreNum <= 9
}

const validateTOEFLScore = (score: string): boolean => {
  if (!score) return true
  const scoreNum = parseFloat(score)
  return !isNaN(scoreNum) && scoreNum >= 0 && scoreNum <= 120
}

const validateGREScore = (score: string): boolean => {
  if (!score) return true
  const scoreNum = parseInt(score)
  return !isNaN(scoreNum) && scoreNum >= 260 && scoreNum <= 340
}

const validateMinGPA = (gpa: string): boolean => {
  if (!gpa) return true
  const gpaNum = parseFloat(gpa)
  return !isNaN(gpaNum) && gpaNum >= 0 && gpaNum <= 4
}

const validateAddOnsJSON = (addOns: string): boolean => {
  if (!addOns) return true
  try {
    JSON.parse(addOns)
    return true
  } catch {
    return false
  }
}

const parseBooleanValue = (value: string): boolean => {
  return value === 'true' || value === '1' || value === 'Y' || value === 'y'
}

describe('CSV Validation Functions', () => {
  describe('School Validation', () => {
    describe('validateSchoolType', () => {
      it('should accept valid school types', () => {
        expect(validateSchoolType('Public')).toBe(true)
        expect(validateSchoolType('Private')).toBe(true)
        expect(validateSchoolType('Art & Design')).toBe(true)
        expect(validateSchoolType('Community College')).toBe(true)
      })

      it('should reject invalid school types', () => {
        expect(validateSchoolType('Invalid')).toBe(false)
        expect(validateSchoolType('University')).toBe(false)
        expect(validateSchoolType('College')).toBe(false)
      })

      it('should accept empty values', () => {
        expect(validateSchoolType('')).toBe(true)
        expect(validateSchoolType(undefined as any)).toBe(true)
      })
    })

    describe('validateRegion', () => {
      it('should accept valid regions', () => {
        expect(validateRegion('United States')).toBe(true)
        expect(validateRegion('United Kingdom')).toBe(true)
        expect(validateRegion('Canada')).toBe(true)
        expect(validateRegion('Europe')).toBe(true)
        expect(validateRegion('Asia')).toBe(true)
        expect(validateRegion('Australia')).toBe(true)
        expect(validateRegion('Other')).toBe(true)
      })

      it('should reject invalid regions', () => {
        expect(validateRegion('Invalid')).toBe(false)
        expect(validateRegion('USA')).toBe(false)
        expect(validateRegion('UK')).toBe(false)
      })

      it('should accept empty values', () => {
        expect(validateRegion('')).toBe(true)
        expect(validateRegion(undefined as any)).toBe(true)
      })
    })

    describe('validateYearFounded', () => {
      it('should accept valid years', () => {
        expect(validateYearFounded('1000')).toBe(true)
        expect(validateYearFounded('1500')).toBe(true)
        expect(validateYearFounded('2024')).toBe(true)
        expect(validateYearFounded(new Date().getFullYear().toString())).toBe(true)
      })

      it('should reject invalid years', () => {
        expect(validateYearFounded('999')).toBe(false)
        expect(validateYearFounded('3000')).toBe(false)
        expect(validateYearFounded('abc')).toBe(false)
        expect(validateYearFounded('1800.5')).toBe(false)
      })

      it('should accept empty values', () => {
        expect(validateYearFounded('')).toBe(true)
        expect(validateYearFounded(undefined as any)).toBe(true)
      })
    })

    describe('validateQSRanking', () => {
      it('should accept valid rankings', () => {
        expect(validateQSRanking('1')).toBe(true)
        expect(validateQSRanking('100')).toBe(true)
        expect(validateQSRanking('1000')).toBe(true)
      })

      it('should reject invalid rankings', () => {
        expect(validateQSRanking('0')).toBe(false)
        expect(validateQSRanking('-1')).toBe(false)
        expect(validateQSRanking('abc')).toBe(false)
        expect(validateQSRanking('1.5')).toBe(false)
      })

      it('should accept empty values', () => {
        expect(validateQSRanking('')).toBe(true)
        expect(validateQSRanking(undefined as any)).toBe(true)
      })
    })
  })

  describe('Program Validation', () => {
    describe('validateDegree', () => {
      it('should accept valid degrees', () => {
        expect(validateDegree('Bachelor')).toBe(true)
        expect(validateDegree('Master')).toBe(true)
        expect(validateDegree('PhD')).toBe(true)
        expect(validateDegree('Associate')).toBe(true)
        expect(validateDegree('Certificate')).toBe(true)
        expect(validateDegree('Diploma')).toBe(true)
      })

      it('should reject invalid degrees', () => {
        expect(validateDegree('Bachelors')).toBe(false)
        expect(validateDegree('Masters')).toBe(false)
        expect(validateDegree('Doctorate')).toBe(false)
        expect(validateDegree('BS')).toBe(false)
        expect(validateDegree('MS')).toBe(false)
      })

      it('should accept empty values', () => {
        expect(validateDegree('')).toBe(true)
        expect(validateDegree(undefined as any)).toBe(true)
      })
    })

    describe('validateDeliveryMethod', () => {
      it('should accept valid delivery methods', () => {
        expect(validateDeliveryMethod('Onsite')).toBe(true)
        expect(validateDeliveryMethod('Online')).toBe(true)
        expect(validateDeliveryMethod('Hybrid')).toBe(true)
      })

      it('should reject invalid delivery methods', () => {
        expect(validateDeliveryMethod('In-person')).toBe(false)
        expect(validateDeliveryMethod('Remote')).toBe(false)
        expect(validateDeliveryMethod('Blended')).toBe(false)
      })

      it('should accept empty values', () => {
        expect(validateDeliveryMethod('')).toBe(true)
        expect(validateDeliveryMethod(undefined as any)).toBe(true)
      })
    })

    describe('validateScheduleType', () => {
      it('should accept valid schedule types', () => {
        expect(validateScheduleType('Full-time')).toBe(true)
        expect(validateScheduleType('Part-time')).toBe(true)
      })

      it('should reject invalid schedule types', () => {
        expect(validateScheduleType('Full time')).toBe(false)
        expect(validateScheduleType('Part time')).toBe(false)
        expect(validateScheduleType('Evening')).toBe(false)
      })

      it('should accept empty values', () => {
        expect(validateScheduleType('')).toBe(true)
        expect(validateScheduleType(undefined as any)).toBe(true)
      })
    })

    describe('validateApplicationDifficulty', () => {
      it('should accept valid difficulties', () => {
        expect(validateApplicationDifficulty('SSR')).toBe(true)
        expect(validateApplicationDifficulty('SR')).toBe(true)
        expect(validateApplicationDifficulty('R')).toBe(true)
        expect(validateApplicationDifficulty('N')).toBe(true)
      })

      it('should reject invalid difficulties', () => {
        expect(validateApplicationDifficulty('Very Hard')).toBe(false)
        expect(validateApplicationDifficulty('Easy')).toBe(false)
        expect(validateApplicationDifficulty('Medium')).toBe(false)
      })

      it('should accept empty values', () => {
        expect(validateApplicationDifficulty('')).toBe(true)
        expect(validateApplicationDifficulty(undefined as any)).toBe(true)
      })
    })

    describe('validateDurationYears', () => {
      it('should accept valid durations', () => {
        expect(validateDurationYears('1')).toBe(true)
        expect(validateDurationYears('2.5')).toBe(true)
        expect(validateDurationYears('4')).toBe(true)
      })

      it('should reject invalid durations', () => {
        expect(validateDurationYears('0')).toBe(false)
        expect(validateDurationYears('-1')).toBe(false)
        expect(validateDurationYears('abc')).toBe(false)
      })

      it('should accept empty values', () => {
        expect(validateDurationYears('')).toBe(true)
        expect(validateDurationYears(undefined as any)).toBe(true)
      })
    })

    describe('validateCredits', () => {
      it('should accept valid credits', () => {
        expect(validateCredits('0')).toBe(true)
        expect(validateCredits('30')).toBe(true)
        expect(validateCredits('120')).toBe(true)
      })

      it('should reject invalid credits', () => {
        expect(validateCredits('-1')).toBe(false)
        expect(validateCredits('abc')).toBe(false)
        expect(validateCredits('30.5')).toBe(false)
      })

      it('should accept empty values', () => {
        expect(validateCredits('')).toBe(true)
        expect(validateCredits(undefined as any)).toBe(true)
      })
    })

    describe('validateTotalTuition', () => {
      it('should accept valid tuition', () => {
        expect(validateTotalTuition('0')).toBe(true)
        expect(validateTotalTuition('50000')).toBe(true)
        expect(validateTotalTuition('100000')).toBe(true)
      })

      it('should reject invalid tuition', () => {
        expect(validateTotalTuition('-1000')).toBe(false)
        expect(validateTotalTuition('abc')).toBe(false)
        expect(validateTotalTuition('50000.50')).toBe(false)
      })

      it('should accept empty values', () => {
        expect(validateTotalTuition('')).toBe(true)
        expect(validateTotalTuition(undefined as any)).toBe(true)
      })
    })

    describe('Test Score Validation', () => {
      describe('validateIELTSScore', () => {
        it('should accept valid IELTS scores', () => {
          expect(validateIELTSScore('0')).toBe(true)
          expect(validateIELTSScore('6.5')).toBe(true)
          expect(validateIELTSScore('9')).toBe(true)
        })

        it('should reject invalid IELTS scores', () => {
          expect(validateIELTSScore('-1')).toBe(false)
          expect(validateIELTSScore('10')).toBe(false)
          expect(validateIELTSScore('abc')).toBe(false)
        })
      })

      describe('validateTOEFLScore', () => {
        it('should accept valid TOEFL scores', () => {
          expect(validateTOEFLScore('0')).toBe(true)
          expect(validateTOEFLScore('100')).toBe(true)
          expect(validateTOEFLScore('120')).toBe(true)
        })

        it('should reject invalid TOEFL scores', () => {
          expect(validateTOEFLScore('-1')).toBe(false)
          expect(validateTOEFLScore('130')).toBe(false)
          expect(validateTOEFLScore('abc')).toBe(false)
        })
      })

      describe('validateGREScore', () => {
        it('should accept valid GRE scores', () => {
          expect(validateGREScore('260')).toBe(true)
          expect(validateGREScore('300')).toBe(true)
          expect(validateGREScore('340')).toBe(true)
        })

        it('should reject invalid GRE scores', () => {
          expect(validateGREScore('250')).toBe(false)
          expect(validateGREScore('350')).toBe(false)
          expect(validateGREScore('abc')).toBe(false)
        })
      })

      describe('validateMinGPA', () => {
        it('should accept valid GPAs', () => {
          expect(validateMinGPA('0')).toBe(true)
          expect(validateMinGPA('3.0')).toBe(true)
          expect(validateMinGPA('4.0')).toBe(true)
        })

        it('should reject invalid GPAs', () => {
          expect(validateMinGPA('-1')).toBe(false)
          expect(validateMinGPA('5.0')).toBe(false)
          expect(validateMinGPA('abc')).toBe(false)
        })
      })
    })

    describe('validateAddOnsJSON', () => {
      it('should accept valid JSON', () => {
        expect(validateAddOnsJSON('{}')).toBe(true)
        expect(validateAddOnsJSON('{"scholarship": true}')).toBe(true)
        expect(validateAddOnsJSON('{"features": ["research", "internship"]}')).toBe(true)
      })

      it('should reject invalid JSON', () => {
        expect(validateAddOnsJSON('invalid json')).toBe(false)
        expect(validateAddOnsJSON('{scholarship: true}')).toBe(false)
        expect(validateAddOnsJSON('{"incomplete": }')).toBe(false)
      })

      it('should accept empty values', () => {
        expect(validateAddOnsJSON('')).toBe(true)
        expect(validateAddOnsJSON(undefined as any)).toBe(true)
      })
    })

    describe('parseBooleanValue', () => {
      it('should parse true values correctly', () => {
        expect(parseBooleanValue('true')).toBe(true)
        expect(parseBooleanValue('1')).toBe(true)
        expect(parseBooleanValue('Y')).toBe(true)
        expect(parseBooleanValue('y')).toBe(true)
      })

      it('should parse false values correctly', () => {
        expect(parseBooleanValue('false')).toBe(false)
        expect(parseBooleanValue('0')).toBe(false)
        expect(parseBooleanValue('N')).toBe(false)
        expect(parseBooleanValue('n')).toBe(false)
        expect(parseBooleanValue('')).toBe(false)
        expect(parseBooleanValue('maybe')).toBe(false)
      })
    })
  })

  describe('Integration Tests', () => {
    it('should validate a complete valid school record', () => {
      const school = {
        name: 'MIT',
        type: 'Private',
        region: 'United States',
        year_founded: '1861',
        qs_ranking: '1'
      }

      expect(validateSchoolType(school.type)).toBe(true)
      expect(validateRegion(school.region)).toBe(true)
      expect(validateYearFounded(school.year_founded)).toBe(true)
      expect(validateQSRanking(school.qs_ranking)).toBe(true)
    })

    it('should validate a complete valid program record', () => {
      const program = {
        name: 'Computer Science',
        degree: 'Master',
        delivery_method: 'Onsite',
        schedule_type: 'Full-time',
        application_difficulty: 'SR',
        duration_years: '2',
        credits: '64',
        total_tuition: '80000',
        ielts_score: '7.0',
        toefl_score: '100',
        gre_score: '320',
        min_gpa: '3.5',
        add_ons: '{"scholarship": true}',
        is_stem: 'true'
      }

      expect(validateDegree(program.degree)).toBe(true)
      expect(validateDeliveryMethod(program.delivery_method)).toBe(true)
      expect(validateScheduleType(program.schedule_type)).toBe(true)
      expect(validateApplicationDifficulty(program.application_difficulty)).toBe(true)
      expect(validateDurationYears(program.duration_years)).toBe(true)
      expect(validateCredits(program.credits)).toBe(true)
      expect(validateTotalTuition(program.total_tuition)).toBe(true)
      expect(validateIELTSScore(program.ielts_score)).toBe(true)
      expect(validateTOEFLScore(program.toefl_score)).toBe(true)
      expect(validateGREScore(program.gre_score)).toBe(true)
      expect(validateMinGPA(program.min_gpa)).toBe(true)
      expect(validateAddOnsJSON(program.add_ons)).toBe(true)
      expect(parseBooleanValue(program.is_stem)).toBe(true)
    })

    it('should handle edge cases', () => {
      // Empty strings should be valid (optional fields)
      expect(validateSchoolType('')).toBe(true)
      expect(validateRegion('')).toBe(true)
      expect(validateDegree('')).toBe(true)
      expect(validateDeliveryMethod('')).toBe(true)
      expect(validateScheduleType('')).toBe(true)
      expect(validateApplicationDifficulty('')).toBe(true)
      expect(validateDurationYears('')).toBe(true)
      expect(validateCredits('')).toBe(true)
      expect(validateTotalTuition('')).toBe(true)
      expect(validateIELTSScore('')).toBe(true)
      expect(validateTOEFLScore('')).toBe(true)
      expect(validateGREScore('')).toBe(true)
      expect(validateMinGPA('')).toBe(true)
      expect(validateAddOnsJSON('')).toBe(true)

      // Undefined values should be valid (optional fields)
      expect(validateSchoolType(undefined as any)).toBe(true)
      expect(validateRegion(undefined as any)).toBe(true)
      expect(validateDegree(undefined as any)).toBe(true)
      expect(validateDeliveryMethod(undefined as any)).toBe(true)
      expect(validateScheduleType(undefined as any)).toBe(true)
      expect(validateApplicationDifficulty(undefined as any)).toBe(true)
      expect(validateDurationYears(undefined as any)).toBe(true)
      expect(validateCredits(undefined as any)).toBe(true)
      expect(validateTotalTuition(undefined as any)).toBe(true)
      expect(validateIELTSScore(undefined as any)).toBe(true)
      expect(validateTOEFLScore(undefined as any)).toBe(true)
      expect(validateGREScore(undefined as any)).toBe(true)
      expect(validateMinGPA(undefined as any)).toBe(true)
      expect(validateAddOnsJSON(undefined as any)).toBe(true)
    })
  })
})
