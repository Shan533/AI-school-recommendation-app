-- Schema Test Script
-- This script tests the new database schema design
-- Run this after applying the migration to verify everything works correctly

-- Test 1: Verify all tables exist and have correct structure
\d+ profiles;
\d+ schools;
\d+ programs;
\d+ requirements;
\d+ program_reviews;
\d+ school_reviews;
\d+ collections;
\d+ collection_items;

-- Test 2: Insert sample data to test relationships
BEGIN;

-- Insert a test user profile (assuming auth.users exists)
INSERT INTO profiles (id, name, is_admin) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Test Admin', true)
ON CONFLICT (id) DO NOTHING;

-- Insert a test school
INSERT INTO schools (id, name, type, region, location, created_by)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Test University',
  'University',
  'USA',
  'Boston, MA',
  '00000000-0000-0000-0000-000000000001'
) ON CONFLICT (id) DO NOTHING;

-- Insert a test program with new columns
INSERT INTO programs (
  id,
  name,
  school_id,
  degree,
  duration_years,
  credits,
  currency,
  total_tuition,
  is_stem,
  delivery_method,
  schedule_type,
  location,
  add_ons,
  start_date,
  created_by
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  'Computer Science Masters',
  '11111111-1111-1111-1111-111111111111',
  'Master of Science',
  2.0,
  36,
  'USD',
  50000,
  true,
  'Hybrid',
  'Full-time',
  'Cambridge, MA',
  '{"scholarship_available": true, "internship_support": true}',
  '2024-09-01',
  '00000000-0000-0000-0000-000000000001'
) ON CONFLICT (id) DO NOTHING;

-- Insert requirements for the program (one-to-one relationship)
INSERT INTO requirements (
  program_id,
  ielts_score,
  toefl_score,
  gre_score,
  min_gpa,
  other_tests,
  requires_personal_statement,
  requires_portfolio,
  requires_cv,
  letters_of_recommendation,
  application_fee,
  application_deadline
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  7.0,
  100,
  320,
  3.5,
  'Optional: Subject GRE in Computer Science',
  true,
  false,
  true,
  3,
  75,
  '2024-12-15'
) ON CONFLICT (program_id) DO NOTHING;

-- Test 3: Verify the one-to-one relationship works
-- This should work (each program can have one requirement)
SELECT 
  p.name as program_name,
  p.delivery_method,
  p.schedule_type,
  p.credits,
  r.min_gpa,
  r.ielts_score,
  r.requires_personal_statement
FROM programs p
LEFT JOIN requirements r ON p.id = r.program_id
WHERE p.id = '22222222-2222-2222-2222-222222222222';

-- Test 4: Try to insert duplicate requirements (should fail due to primary key constraint)
-- This should fail with a constraint violation
-- INSERT INTO requirements (program_id, min_gpa) 
-- VALUES ('22222222-2222-2222-2222-222222222222', 3.0);

-- Test 5: Test cascade deletion
-- When a program is deleted, its requirements should be deleted too
-- DELETE FROM programs WHERE id = '22222222-2222-2222-2222-222222222222';
-- SELECT * FROM requirements WHERE program_id = '22222222-2222-2222-2222-222222222222';

-- Test 6: Verify JSON structure in add_ons column
SELECT 
  name,
  add_ons,
  add_ons->>'scholarship_available' as has_scholarship,
  add_ons->>'internship_support' as has_internship
FROM programs 
WHERE add_ons IS NOT NULL;

ROLLBACK; -- Don't commit test data

-- Test 7: Check constraints and data types
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name IN ('programs', 'requirements')
  AND table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- Test 8: Verify foreign key relationships
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('programs', 'requirements');
