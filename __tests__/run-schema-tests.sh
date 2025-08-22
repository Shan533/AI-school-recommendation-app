#!/bin/bash

# Schema Test Runner
# This script runs all schema validation tests

echo "🧪 Running Schema Validation Tests"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run test and check result
run_test() {
    local test_name="$1"
    local command="$2"
    
    echo -e "${YELLOW}Running: $test_name${NC}"
    
    if eval "$command"; then
        echo -e "${GREEN}✅ $test_name PASSED${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ $test_name FAILED${NC}"
        ((TESTS_FAILED++))
    fi
    echo ""
}

# Change to project root directory
cd "$(dirname "$0")/.."

echo "📍 Working directory: $(pwd)"
echo ""

# Test 1: Migration file validation
run_test "Migration File Validation" "node __tests__/schema/validate-migration.js"

# Test 2: TypeScript type checking
run_test "TypeScript Type Validation" "npx tsc --noEmit __tests__/schema/test-schema-types.ts"

# Test 3: Check if migration file exists
run_test "Migration File Existence" "test -f supabase/migrations/0002_add_requirements_and_program_enhancements.sql"

# Test 4: Check schema design document
run_test "Schema Design Document" "test -f docs/schema-design.mdc"

# Summary
echo "=================================="
echo "📊 Test Summary:"
echo -e "  ${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "  ${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All schema tests passed!${NC}"
    echo -e "${GREEN}✅ Schema is ready for deployment${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please review the errors above.${NC}"
    exit 1
fi
