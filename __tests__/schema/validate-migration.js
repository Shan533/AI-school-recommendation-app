const fs = require('fs');

console.log('🔍 Schema Migration Validation');
console.log('=====================================');

try {
  const path = require('path');
  const migrationPath = path.join(__dirname, '../../supabase/migrations/0002_add_requirements_and_program_enhancements.sql');
  const migration = fs.readFileSync(migrationPath, 'utf8');
  
  console.log('✅ Migration file exists and is readable');
  
  // Basic syntax checks
  const checks = [
    { name: 'ALTER TABLE statements', pattern: /ALTER TABLE/g, expected: true },
    { name: 'CREATE TABLE statements', pattern: /CREATE TABLE/g, expected: true },
    { name: 'Primary key definition', pattern: /PRIMARY KEY/g, expected: true },
    { name: 'Foreign key references', pattern: /REFERENCES/g, expected: true },
    { name: 'Cascade delete', pattern: /ON DELETE CASCADE/g, expected: true },
    { name: 'RLS enablement', pattern: /ENABLE ROW LEVEL SECURITY/g, expected: true },
    { name: 'RLS policies', pattern: /CREATE POLICY/g, expected: true },
    { name: 'UUID data type', pattern: /uuid/g, expected: true },
    { name: 'Real data type', pattern: /real/g, expected: true },
    { name: 'Boolean data type', pattern: /boolean/g, expected: true },
    { name: 'JSONB data type', pattern: /jsonb/g, expected: true },
  ];
  
  let allPassed = true;
  
  checks.forEach(check => {
    const matches = migration.match(check.pattern);
    const found = matches && matches.length > 0;
    
    if (found === check.expected) {
      console.log(`✅ ${check.name}: ${found ? `Found ${matches.length} instances` : 'Not found (as expected)'}`);
    } else {
      console.log(`❌ ${check.name}: ${found ? 'Found' : 'Not found'}`);
      allPassed = false;
    }
  });
  
  console.log('\n📊 Migration Statistics:');
  console.log(`- Total lines: ${migration.split('\n').length}`);
  console.log(`- ALTER TABLE: ${(migration.match(/ALTER TABLE/g) || []).length}`);
  console.log(`- CREATE TABLE: ${(migration.match(/CREATE TABLE/g) || []).length}`);
  console.log(`- CREATE POLICY: ${(migration.match(/CREATE POLICY/g) || []).length}`);
  console.log(`- ADD COLUMN: ${(migration.match(/ADD COLUMN/g) || []).length}`);
  
  console.log('\n🎯 Schema Design Validation:');
  
  // Check for new columns
  const newColumns = [
    'credits', 'delivery_method', 'schedule_type', 
    'location', 'add_ons', 'start_date'
  ];
  
  newColumns.forEach(column => {
    if (migration.includes(column)) {
      console.log(`✅ New column '${column}' found in migration`);
    } else {
      console.log(`❌ New column '${column}' missing from migration`);
      allPassed = false;
    }
  });
  
  // Check requirements table structure
  const requirementFields = [
    'ielts_score', 'toefl_score', 'gre_score', 'min_gpa',
    'requires_personal_statement', 'requires_portfolio', 'requires_cv',
    'application_deadline'
  ];
  
  requirementFields.forEach(field => {
    if (migration.includes(field)) {
      console.log(`✅ Requirements field '${field}' found`);
    } else {
      console.log(`❌ Requirements field '${field}' missing`);
      allPassed = false;
    }
  });
  
  console.log('\n' + '='.repeat(40));
  if (allPassed) {
    console.log('🎉 ALL VALIDATION CHECKS PASSED!');
    console.log('✅ Migration is ready for deployment');
  } else {
    console.log('⚠️  Some validation checks failed');
    console.log('❌ Please review the migration file');
  }
  
} catch (error) {
  console.error('❌ Error reading migration file:', error.message);
}
