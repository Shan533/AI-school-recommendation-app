/**
 * Schema Type Validation Script
 * This script validates that our new schema design is compatible with TypeScript types
 */

// New enhanced Program type based on our schema design
interface Program {
  id: string;
  name: string;
  initial?: string;
  school_id: string;
  degree: string;
  website_url?: string;
  duration_years?: number;
  credits?: number;  // NEW
  currency?: string;
  total_tuition?: number;
  is_stem?: boolean;
  description?: string;
  delivery_method?: 'Onsite' | 'Online' | 'Hybrid';  // NEW
  schedule_type?: 'Full-time' | 'Part-time';  // NEW
  location?: string;  // NEW
  add_ons?: {  // NEW - JSON structure
    scholarship_available?: boolean;
    internship_support?: boolean;
    housing_assistance?: boolean;
    [key: string]: any;
  };
  start_date?: string;  // NEW - ISO date string
  created_by?: string;
  created_at?: string;
}

// New Requirements type (one-to-one with Program)
interface Requirements {
  program_id: string;  // Primary key, also foreign key
  ielts_score?: number;
  toefl_score?: number;
  gre_score?: number;
  min_gpa?: number;
  other_tests?: string;
  requires_personal_statement?: boolean;
  requires_portfolio?: boolean;
  requires_cv?: boolean;
  letters_of_recommendation?: number;
  application_fee?: number;
  application_deadline?: string;  // ISO date string
}

// Combined type for API responses
interface ProgramWithRequirements extends Program {
  requirements?: Requirements;
}

describe('Schema Type Validation', () => {
  // Sample test data
  const sampleProgram: Program = {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Computer Science Masters',
    school_id: '11111111-1111-1111-1111-111111111111',
    degree: 'Master of Science',
    duration_years: 2.0,
    credits: 36,
    currency: 'USD',
    total_tuition: 50000,
    is_stem: true,
    delivery_method: 'Hybrid',
    schedule_type: 'Full-time',
    location: 'Cambridge, MA',
    add_ons: {
      scholarship_available: true,
      internship_support: true
    },
    start_date: '2024-09-01',
    created_by: '00000000-0000-0000-0000-000000000001',
    created_at: new Date().toISOString()
  };

  const sampleRequirements: Requirements = {
    program_id: '22222222-2222-2222-2222-222222222222',
    ielts_score: 7.0,
    toefl_score: 100,
    gre_score: 320,
    min_gpa: 3.5,
    other_tests: 'Optional: Subject GRE in Computer Science',
    requires_personal_statement: true,
    requires_portfolio: false,
    requires_cv: true,
    letters_of_recommendation: 3,
    application_fee: 75,
    application_deadline: '2024-12-15'
  };

  test('Program type should have all required fields', () => {
    expect(sampleProgram.id).toBeDefined();
    expect(sampleProgram.name).toBeDefined();
    expect(sampleProgram.school_id).toBeDefined();
    expect(sampleProgram.degree).toBeDefined();
  });

  test('Requirements type should have valid program_id', () => {
    expect(sampleRequirements.program_id).toBe(sampleProgram.id);
  });

  test('IELTS score should be within valid range', () => {
    expect(sampleRequirements.ielts_score).toBeDefined();
    expect(sampleRequirements.ielts_score).toBeGreaterThanOrEqual(0);
    expect(sampleRequirements.ielts_score).toBeLessThanOrEqual(9);
  });

  test('TOEFL score should be within valid range', () => {
    expect(sampleRequirements.toefl_score).toBeDefined();
    expect(sampleRequirements.toefl_score).toBeGreaterThanOrEqual(0);
    expect(sampleRequirements.toefl_score).toBeLessThanOrEqual(120);
  });

  test('GPA should be within valid range', () => {
    expect(sampleRequirements.min_gpa).toBeDefined();
    expect(sampleRequirements.min_gpa).toBeGreaterThanOrEqual(0);
    expect(sampleRequirements.min_gpa).toBeLessThanOrEqual(4);
  });

  test('Program with Requirements should combine both types', () => {
    const combined: ProgramWithRequirements = {
      ...sampleProgram,
      requirements: sampleRequirements
    };
    expect(combined.id).toBe(sampleProgram.id);
    expect(combined.requirements?.program_id).toBe(sampleProgram.id);
  });
});

// Export types for use in the application
export type { Program, Requirements, ProgramWithRequirements };