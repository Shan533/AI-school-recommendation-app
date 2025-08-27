const fs = require('fs');
const path = require('path');

describe('Schema Migration Validation', () => {
  let migration;

  beforeAll(() => {
    const migrationPath = path.join(__dirname, '../../supabase/migrations/0002_add_requirements_and_program_enhancements.sql');
    migration = fs.readFileSync(migrationPath, 'utf8');
  });

  test('Migration file should exist and be readable', () => {
    expect(migration).toBeDefined();
  });

  describe('SQL Syntax Checks', () => {
    const checks = [
      { name: 'ALTER TABLE statements', pattern: /ALTER TABLE/g },
      { name: 'CREATE TABLE statements', pattern: /CREATE TABLE/g },
      { name: 'Primary key definition', pattern: /PRIMARY KEY/g },
      { name: 'Foreign key references', pattern: /REFERENCES/g },
      { name: 'Cascade delete', pattern: /ON DELETE CASCADE/g },
      { name: 'RLS enablement', pattern: /ENABLE ROW LEVEL SECURITY/g },
      { name: 'RLS policies', pattern: /CREATE POLICY/g },
      { name: 'UUID data type', pattern: /uuid/g },
      { name: 'Real data type', pattern: /real/g },
      { name: 'Boolean data type', pattern: /boolean/g },
      { name: 'JSONB data type', pattern: /jsonb/g },
    ];

    checks.forEach(check => {
      test(`should contain ${check.name}`, () => {
        const matches = migration.match(check.pattern);
        expect(matches).not.toBeNull();
        expect(matches.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Migration Statistics', () => {
    test('should have reasonable number of lines', () => {
      const lineCount = migration.split('\n').length;
      expect(lineCount).toBeGreaterThan(10);
    });

    test('should have required SQL statements', () => {
      expect(migration.match(/ALTER TABLE/g)?.length).toBeGreaterThan(0);
      expect(migration.match(/CREATE TABLE/g)?.length).toBeGreaterThan(0);
      expect(migration.match(/CREATE POLICY/g)?.length).toBeGreaterThan(0);
      expect(migration.match(/ADD COLUMN/g)?.length).toBeGreaterThan(0);
    });
  });

  describe('Schema Design Validation', () => {
    const newColumns = [
      'credits', 'delivery_method', 'schedule_type', 
      'location', 'add_ons', 'start_date'
    ];

    test.each(newColumns)('should contain new column %s', (column) => {
      expect(migration).toContain(column);
    });

    const requirementFields = [
      'ielts_score', 'toefl_score', 'gre_score', 'min_gpa',
      'requires_personal_statement', 'requires_portfolio', 'requires_cv',
      'application_deadline'
    ];

    test.each(requirementFields)('should contain requirements field %s', (field) => {
      expect(migration).toContain(field);
    });
  });
});