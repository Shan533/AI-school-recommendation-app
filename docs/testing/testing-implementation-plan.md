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

#### 1. **Data Validation** (`src/lib/validation.ts`) ✅
- **File**: `__tests__/lib/validation.test.ts`
- **Functions tested**:
  - `validateRange()` - Numerical range validation (5 tests)
  - `validateProgramData()` - Program data validation (6 tests)
  - `validateRequirementsData()` - Requirements validation (9 tests)
  - `validateSchoolData()` - School data validation (6 tests)
- **Coverage**: 100% (26 tests passing)
- **Impact**: ⭐⭐⭐⭐⭐ (Prevents invalid data in database)
- **Difficulty**: ⭐ (Pure functions, easy to test)

#### 2. **Database Helpers** (`src/lib/supabase/helpers.ts`) ✅
- **File**: `__tests__/lib/supabase/helpers.vitest.ts`
- **Functions tested**:
  - `getSupabaseClient()` - Client creation (2 tests)
  - `getCurrentUser()` - User authentication state (4 tests)
  - `getUserProfile()` - User profile retrieval (5 tests)
  - `isAdmin()` - Admin permission check (9 tests)
- **Coverage**: 100% (20 tests passing)
- **Impact**: ⭐⭐⭐⭐⭐ (Core database operations)
- **Difficulty**: ⭐⭐ (Requires mocking Supabase)

#### 3. **Authentication Actions** (`src/lib/auth-actions.ts`) ✅
- **File**: `__tests__/lib/auth-actions.vitest.ts`
- **Functions tested**:
  - `loginAction()` - User login process (5 tests)
  - `registerAction()` - User registration process (9 tests)
  - `logoutAction()` - User logout process (2 tests)
  - `signInWithGoogleAction()` - OAuth login (6 tests)
  - `resendEmailVerification()` - Email verification (3 tests)
  - Zod schemas validation (11 tests)
- **Coverage**: 98.94% (36 tests passing)
- **Impact**: ⭐⭐⭐⭐⭐ (Security critical)
- **Difficulty**: ⭐⭐⭐ (Server actions, complex mocking)

#### 4. **Utility Functions** (`src/lib/utils.ts`) ✅
- **File**: `__tests__/lib/utils.test.ts`
- **Functions tested**:
  - `cn()` - Class name utility function (4 tests)
- **Coverage**: 100% (4 tests passing)
- **Impact**: ⭐⭐ (UI utility)
- **Difficulty**: ⭐ (Simple utility function)

### 🟡 **MEDIUM Priority - API Endpoints**
Server-side API routes that handle CRUD operations.

#### 5. **Schools Admin API** (`src/app/api/admin/schools/`) ✅
- **File**: `__tests__/api/admin/schools.vitest.ts`
- **Endpoints tested**:
  - `POST /api/admin/schools` - Create school (6 tests)
  - `GET /api/admin/schools/[id]` - Get school (5 tests)
  - `PUT /api/admin/schools/[id]` - Update school (6 tests)
  - `DELETE /api/admin/schools/[id]` - Delete school (6 tests)
- **Coverage**: POST 100%, GET/PUT/DELETE 80.36% (23 tests passing)
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

## 📊 Coverage Impact Status

| Priority | Files | Status | Actual Coverage | Implementation Time |
|----------|-------|--------|-----------------|-------------------|
| HIGH     | 4 files | 4/4 Complete ✅ | +75% achieved | 2 days |
| MEDIUM   | 2 files | 1/2 Complete ✅ | +10% achieved | 1 day |
| LOW      | 2 files | 0/2 Pending | +5-10% estimated | 1 day |

### Current Test Suite Status
- **Total Vitest Tests**: 110 passing (auth-actions: 36, helpers: 20, schools-api: 23, utils: 4, home: 1, validation: 26)
- **Total Jest Tests**: 65 passing (validation: 26, schema: 35, utils: 4)
- **Combined Coverage**: 175 tests
- **HIGH Priority Modules**: 100% complete
  - **Auth Actions**: 98.94% coverage (36 tests)
  - **Validation**: 100% coverage (26 tests) 
  - **Helpers**: 100% coverage (20 tests)
  - **Utils**: 100% coverage (4 tests)
- **MEDIUM Priority Modules**: 50% complete
  - **Schools Admin API**: 80.36-100% coverage (23 tests) ✅

## 🛠️ Implementation Strategy

### Phase 1: Foundation (HIGH Priority) ✅ COMPLETE
1. **`validation.test.ts`** ✅ (Jest)
   - Pure functions, immediate coverage boost
   - 26 tests with 100% coverage
   - All validation functions thoroughly tested

2. **`supabase/helpers.vitest.ts`** ✅ (Vitest)
   - Core database operations
   - 20 tests with 100% coverage
   - Complete authentication and profile management

3. **`auth-actions.vitest.ts`** ✅ (Vitest)
   - Security-critical functionality
   - 36 comprehensive tests with 98.94% coverage
   - All authentication flows and OAuth integration

4. **`utils.test.ts`** ✅ (Vitest)
   - Utility functions for UI components
   - 4 tests with 100% coverage
   - Class name merging and conditional logic

### Phase 2: API Coverage (MEDIUM Priority) - IN PROGRESS
5. **Schools Admin API** (`__tests__/api/admin/schools.vitest.ts`) ✅
   - Integration testing approach
   - 23 tests with 80.36-100% coverage
   - All CRUD operations tested (POST, GET, PUT, DELETE)
   - Authentication and authorization thoroughly tested

6. **Programs Admin API** (`__tests__/api/admin/programs.test.ts`) - NEXT
   - Complex validation testing
   - CSV upload functionality
   - Bulk operations testing

### Phase 3: Infrastructure (LOW Priority) - FUTURE
7. **Supabase Client Infrastructure**
   - Complete coverage of client creation
   - Configuration and connection testing
   - Error handling and edge cases

## 🧪 Testing Patterns & Best Practices

### Tool Selection Strategy
- **Jest**: Pure functions, validation schemas, simple utilities
- **Vitest**: Server Components, API routes, complex Next.js integrations

### Vitest Mocking Strategy (Server Components)
```typescript
// Supabase mocking pattern
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn()
}))

// Next.js headers mocking
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
  headers: vi.fn()
}))

// Next.js navigation mocking (for redirects)
vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT')
  })
}))
```

### Jest Mocking Strategy (Pure Functions)
```typescript
// Simple function mocking
jest.mock('@/lib/utils', () => ({
  cn: jest.fn()
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

## 🚀 Getting Started (Next Steps)

### Current Status: Phase 1 Complete ✅

**Next Priority: Phase 2 - API Route Testing**

1. **Choose API endpoint** (recommend starting with `schools.test.ts`)
2. **Set up integration test patterns** 
3. **Mock authentication middleware**
4. **Test CRUD operations systematically**
5. **Run tests**: `npm run test:vitest` or `npm run test:coverage`
6. **Verify coverage improvement**

### Current Achievement Summary
✅ **Phase 1 Complete**: All core business logic tested
✅ **Phase 2 - 50% Complete**: Schools Admin API implemented

- 4/4 HIGH priority modules with 100% or near-100% coverage
- 1/2 MEDIUM priority API modules complete
- 109 tests covering authentication, validation, database helpers, utilities, and Schools API
- Dual testing strategy (Jest + Vitest) working perfectly
- Strong foundation for remaining API testing

### Commands
```bash
# Run all tests
npm test && npm run test:vitest

# Run with coverage
npm run test:coverage && npm run test:vitest:coverage

# Run specific test file
npm run test:vitest __tests__/api/admin/schools.test.ts
```

## 📝 Notes

- **Phase 1 Complete**: All HIGH priority tests implemented and passing
- **Dual Testing Strategy**: Jest for pure functions, Vitest for Server Components
- **High Coverage Achieved**: 98.94% auth-actions, 100% validation/helpers/utils
- **Next Focus**: API route integration testing
- **Testing Tools**: Vitest provides better Next.js 15 + Server Components support

### Recent Achievements
- ✅ Migrated auth-actions from Jest to Vitest (resolved module resolution issues)
- ✅ Implemented comprehensive redirect mocking for Server Actions
- ✅ Added proper environment variable testing for OAuth flows
- ✅ Achieved 152 total tests across dual testing strategy

---

*Last updated: January 2025*
*Next review: After Phase 2 API testing completion*
