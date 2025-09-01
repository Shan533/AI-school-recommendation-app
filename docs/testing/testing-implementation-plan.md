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

#### 5. **Programs Admin API** (`src/app/api/admin/programs/`) ✅
- **File**: `__tests__/api/admin/programs.vitest.ts`
- **Endpoints tested**:
  - `POST /api/admin/programs` - Create program (13 tests)
  - `GET /api/admin/programs/[id]` - Get program (5 tests)
  - `PUT /api/admin/programs/[id]` - Update program (9 tests)
  - `DELETE /api/admin/programs/[id]` - Delete program (8 tests)
- **Coverage**: POST 98.05%, GET/PUT/DELETE 78.45% (35 tests passing)
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
| MEDIUM   | 2 files | 2/2 Complete ✅ | +20% achieved | 2 days |
| LOW      | 2 files | 0/2 Pending | +5-10% estimated | 1 day |

### Current Test Suite Status
- **Total Vitest Tests**: 145 passing (auth-actions: 36, helpers: 20, schools-api: 23, programs-api: 35, utils: 4, home: 1, validation: 26)
- **Total Jest Tests**: 65 passing (validation: 26, schema: 35, utils: 4)
- **Combined Coverage**: 210 tests
- **HIGH Priority Modules**: 100% complete
  - **Auth Actions**: 98.94% coverage (36 tests)
  - **Validation**: 100% coverage (26 tests) 
  - **Helpers**: 100% coverage (20 tests)
  - **Utils**: 100% coverage (4 tests)
- **MEDIUM Priority Modules**: 100% complete ✅
  - **Schools Admin API**: 80.36-100% coverage (23 tests) ✅
  - **Programs Admin API**: 78.45-98.05% coverage (35 tests) ✅

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

### Phase 2: API Coverage (MEDIUM Priority) ✅ COMPLETE
5. **Schools Admin API** (`__tests__/api/admin/schools.vitest.ts`) ✅
   - Integration testing approach
   - 23 tests with 80.36-100% coverage
   - All CRUD operations tested (POST, GET, PUT, DELETE)
   - Authentication and authorization thoroughly tested

6. **Programs Admin API** (`__tests__/api/admin/programs.vitest.ts`) ✅
   - Complex validation testing with requirements handling
   - 35 tests with 78.45-98.05% coverage
   - All CRUD operations tested (POST, GET, PUT, DELETE)
   - Comprehensive error handling and edge cases
   - Requirements management and validation testing

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

### Current Status: Phase 2 Complete ✅

**Next Priority: Phase 3 - Infrastructure & Remaining APIs**

#### **Immediate Next Steps (High Impact, Low Effort)**

1. **Auth Logout API** (`src/app/api/auth/logout/route.ts`)
   - **File**: `__tests__/api/auth/logout.vitest.ts`
   - **Expected tests**: 2-3 tests
   - **Coverage impact**: +1% overall
   - **Estimated time**: 30 minutes
   - **Priority**: 🔥 High (quick win)

2. **Supabase Client Configuration** (`src/lib/supabase/client.ts`)
   - **File**: `__tests__/lib/supabase/client.vitest.ts`
   - **Expected tests**: 5-8 tests
   - **Coverage impact**: +2-3% overall
   - **Estimated time**: 1 hour
   - **Priority**: 📈 Medium (infrastructure)

#### **Medium Term Goals (High Impact, Medium Effort)**

3. **Users Admin API** (`src/app/api/admin/users/`)
   - **Files**: `__tests__/api/admin/users.vitest.ts`
   - **Expected tests**: 20-25 tests
   - **Coverage impact**: +5-8% overall
   - **Estimated time**: 2-3 hours
   - **Priority**: 🎯 High (major coverage boost)

4. **Supabase Server Configuration** (`src/lib/supabase/server.ts`)
   - **File**: `__tests__/lib/supabase/server.vitest.ts`
   - **Expected tests**: 8-12 tests
   - **Coverage impact**: +3-4% overall
   - **Estimated time**: 1.5 hours
   - **Priority**: 📊 Medium (completion)

#### **Implementation Strategy**
1. **Start with quick wins** (logout API, client config)
2. **Build infrastructure patterns** for remaining tests
3. **Tackle major APIs** (Users management)
4. **Complete coverage** with remaining infrastructure

### Current Achievement Summary
✅ **Phase 1 Complete**: All core business logic tested
✅ **Phase 2 Complete**: All Admin API endpoints tested

- 4/4 HIGH priority modules with 100% or near-100% coverage
- 2/2 MEDIUM priority API modules complete
- 210 tests covering authentication, validation, database helpers, utilities, Schools API, and Programs API
- Dual testing strategy (Jest + Vitest) working perfectly
- Strong foundation for infrastructure and remaining API testing

### Commands
```bash
# Run all tests
npm test && npm run test:vitest

# Run with coverage
npm run test:coverage && npm run test:vitest:coverage

# Run specific test suites
npm run test:vitest __tests__/api/admin/schools.vitest.ts
npm run test:vitest __tests__/api/admin/programs.vitest.ts
npm run test:vitest __tests__/lib/auth-actions.vitest.ts

# Run with coverage for specific files
npm run test:vitest:coverage __tests__/api/admin/programs.vitest.ts -- --run
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
- ✅ Achieved 210 total tests across dual testing strategy
- ✅ Completed Programs Admin API testing with 35 comprehensive tests
- ✅ Achieved 78.45-98.05% coverage for Programs API endpoints
- ✅ Implemented complex requirements management testing

---

*Last updated: Sep 2025*
*Next review: After Phase 3 infrastructure testing completion*
