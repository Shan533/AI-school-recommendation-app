# Testing Implementation Plan

## 📋 Overview

This document outlines the comprehensive testing strategy for the AI School Recommend App, focusing on backend logic and API endpoints that are included in our coverage metrics.

## 🎯 Testing Scope

Based on our Jest configuration, we focus on testing:
- `src/lib/` - Utility functions and business logic
- `src/app/api/` - API routes and server-side logic

**Excluded from coverage:**
- Frontend components (`src/components/`)
- Next.js pages (`src/app/**/page.tsx`)
- Layout and error pages

## 🚦 Priority Levels

### 🔴 **HIGH Priority - Core Business Logic**
Critical functions that handle data validation, authentication, and database operations.

#### 1. **Data Validation** (`src/lib/validation.ts`)
- **File**: `__tests__/lib/validation.test.ts`
- **Functions to test**:
  - `validateRange()` - Numerical range validation
  - `validateProgramData()` - Program data validation
  - `validateRequirementsData()` - Requirements validation
  - `validateSchoolData()` - School data validation
- **Impact**: ⭐⭐⭐⭐⭐ (Prevents invalid data in database)
- **Difficulty**: ⭐ (Pure functions, easy to test)

#### 2. **Database Helpers** (`src/lib/supabase/helpers.ts`)
- **File**: `__tests__/lib/supabase/helpers.test.ts`
- **Functions to test**:
  - `getCurrentUser()` - User authentication state
  - `getUserProfile()` - User profile retrieval
  - `isAdmin()` - Admin permission check
  - `getSupabaseClient()` - Client creation
- **Impact**: ⭐⭐⭐⭐⭐ (Core database operations)
- **Difficulty**: ⭐⭐ (Requires mocking Supabase)

#### 3. **Authentication Actions** (`src/lib/auth-actions.ts`)
- **File**: `__tests__/lib/auth-actions.test.ts`
- **Functions to test**:
  - `login()` - User login process
  - `register()` - User registration process
  - `logout()` - User logout process
  - `setupUsername()` - Username setup
  - Zod schemas validation
- **Impact**: ⭐⭐⭐⭐⭐ (Security critical)
- **Difficulty**: ⭐⭐⭐ (Server actions, complex mocking)

### 🟡 **MEDIUM Priority - API Endpoints**
Server-side API routes that handle CRUD operations.

#### 4. **Schools Admin API** (`src/app/api/admin/schools/`)
- **File**: `__tests__/api/admin/schools.test.ts`
- **Endpoints to test**:
  - `GET /api/admin/schools` - List schools
  - `POST /api/admin/schools` - Create school
  - `GET /api/admin/schools/[id]` - Get school
  - `PUT /api/admin/schools/[id]` - Update school
  - `DELETE /api/admin/schools/[id]` - Delete school
- **Impact**: ⭐⭐⭐⭐ (Admin functionality)
- **Difficulty**: ⭐⭐⭐ (Integration testing, auth mocking)

#### 5. **Programs Admin API** (`src/app/api/admin/programs/`)
- **File**: `__tests__/api/admin/programs.test.ts`
- **Endpoints to test**:
  - `GET /api/admin/programs` - List programs
  - `POST /api/admin/programs` - Create program
  - `GET /api/admin/programs/[id]` - Get program
  - `PUT /api/admin/programs/[id]` - Update program
  - `DELETE /api/admin/programs/[id]` - Delete program
- **Impact**: ⭐⭐⭐⭐ (Admin functionality)
- **Difficulty**: ⭐⭐⭐ (Integration testing, complex validation)

### 🟢 **LOW Priority - Infrastructure**
Supporting infrastructure and client-side utilities.

#### 6. **Supabase Clients** (`src/lib/supabase/`)
- **Files**: 
  - `__tests__/lib/supabase/server.test.ts`
  - `__tests__/lib/supabase/client.test.ts`
- **Functions to test**:
  - `createClient()` variations
  - `createAdminClient()`
  - Client configuration
- **Impact**: ⭐⭐ (Infrastructure)
- **Difficulty**: ⭐⭐ (Configuration testing)

## 📊 Expected Coverage Impact

| Priority | Files | Estimated Coverage Boost | Implementation Time |
|----------|-------|--------------------------|-------------------|
| HIGH     | 3 files | +60-80% | 2-3 days |
| MEDIUM   | 2 files | +15-25% | 2-3 days |
| LOW      | 2 files | +5-10% | 1 day |

## 🛠️ Implementation Strategy

### Phase 1: Foundation (HIGH Priority)
1. **Start with `validation.test.ts`**
   - Pure functions, immediate coverage boost
   - Discovers validation bugs early
   - Sets testing patterns for the project

2. **Add `supabase/helpers.test.ts`**
   - Core database operations
   - Establishes mocking patterns
   - Critical for user flows

3. **Complete `auth-actions.test.ts`**
   - Security-critical functionality
   - Complex but high-impact testing

### Phase 2: API Coverage (MEDIUM Priority)
4. **Implement API route tests**
   - Integration testing approach
   - Mock authentication and database
   - Test all CRUD operations

### Phase 3: Infrastructure (LOW Priority)
5. **Add remaining infrastructure tests**
   - Complete coverage of included files
   - Polish and edge cases

## 🧪 Testing Patterns & Best Practices

### Mocking Strategy
```typescript
// Supabase mocking pattern
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
  createAdminClient: jest.fn()
}))

// Next.js headers mocking
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
  headers: jest.fn()
}))
```

### Test Structure
```typescript
describe('FunctionName', () => {
  describe('success cases', () => {
    it('should handle valid input correctly', () => {
      // Test implementation
    })
  })
  
  describe('error cases', () => {
    it('should handle invalid input gracefully', () => {
      // Test implementation
    })
  })
  
  describe('edge cases', () => {
    it('should handle boundary conditions', () => {
      // Test implementation
    })
  })
})
```

## 📈 Success Metrics

### Coverage Targets
- **Overall target**: 80%+ for included files
- **Critical functions**: 95%+ coverage
- **API endpoints**: 90%+ coverage

### Quality Metrics
- All tests pass consistently
- No flaky tests
- Fast test execution (< 30s total)
- Clear test failure messages

## 🚀 Getting Started

1. **Choose a priority level** (recommend starting with HIGH)
2. **Pick a specific test file** (recommend `validation.test.ts`)
3. **Replace `it.todo()` with actual test implementations**
4. **Run tests**: `npm run test:coverage`
5. **Check coverage improvement**
6. **Move to next test file**

## 📝 Notes

- All test files are created with `it.todo()` placeholders
- Each test file includes detailed comments about what to test
- Mocking patterns are documented in each file
- Priority is based on business impact and implementation difficulty
- Coverage configuration excludes frontend components for focused backend testing

---

*Last updated: $(date)*
*Next review: After Phase 1 completion*
