# Schema Tests

This directory contains all tests related to database schema validation and migration testing.

## Test Files

### `test-schema.sql`
Complete SQL test script for validating database schema after migration:
- Tests table structure and relationships
- Validates constraints and foreign keys
- Tests sample data insertion
- Verifies cascade deletion behavior
- Checks JSON data handling

**Usage:**
```bash
# Connect to your database and run:
psql -f __tests__/schema/test-schema.sql
```

### `test-schema-types.ts`
TypeScript type validation for the new schema:
- Defines interfaces for Program and Requirements
- Validates type compatibility
- Tests data relationships
- Includes sample data validation

**Usage:**
```bash
npx tsc --noEmit __tests__/schema/test-schema-types.ts
```

### `validate-migration.js`
Automated migration file validation:
- Checks SQL syntax and structure
- Validates all required columns are present
- Ensures proper relationships are defined
- Verifies RLS policies are complete

**Usage:**
```bash
node __tests__/schema/validate-migration.js
```

### `schema-test-results.md`
Complete test execution report with results and recommendations.

## Running All Tests

### Quick Test (Recommended)
```bash
# Run all automated tests with a single command
__tests__/run-schema-tests.sh
```

### Manual Testing
To run individual tests:

```bash
# 1. Validate migration file
node __tests__/schema/validate-migration.js

# 2. Check TypeScript types
npx tsc --noEmit __tests__/schema/test-schema-types.ts

# 3. After applying migration, test database
# psql -f __tests__/schema/test-schema.sql
```

## Test Coverage

- ✅ Migration file syntax validation
- ✅ TypeScript type compatibility  
- ✅ Database relationship integrity
- ✅ RLS policy completeness
- ✅ Data type consistency
- ✅ Sample data insertion/deletion
- ✅ Cascade behavior testing
- ✅ JSON field validation

## Migration File Location

The actual migration file is located at:
`supabase/migrations/0002_add_requirements_and_program_enhancements.sql`
