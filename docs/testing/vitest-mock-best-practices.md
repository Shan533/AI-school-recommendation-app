# Vitest Mock Best Practices

This document contains best practices and solutions for common mocking issues encountered when testing with Vitest in the AI School Recommend App.

## 🎯 Overview

This guide addresses common TypeScript and mocking challenges when testing:
- Supabase client interactions
- Next.js server components and API routes
- Cookie store mocking
- Complex mock chain objects

## 📋 Quick Reference

### Common Mock Patterns

| Component | Mock Pattern | Common Issues |
|-----------|-------------|---------------|
| Supabase Client | Factory function with `vi.mocked()` | Type compatibility |
| Cookie Store | Full interface implementation | Missing properties |
| Mock Chains | Type assertions with `as any` | Complex type inference |
| Server Functions | Async import mocking | Module resolution |

## 🔧 Cookie Store Mocking

### Problem
TypeScript errors when mocking Next.js cookies:
```
Type '{ get: Mock<Procedure>; set: Mock<Procedure>; }' is missing properties: 
[Symbol.iterator], size, getAll, has
```

### Solution
```typescript
// ✅ Complete cookie store mock
const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  getAll: vi.fn(),
  has: vi.fn(),
  delete: vi.fn(),
  clear: vi.fn(),
  toString: vi.fn(),
  [Symbol.iterator]: vi.fn(() => [][Symbol.iterator]()),
  size: 0
}

// ✅ Mock with async cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore))
}))
```

### Usage Example
```typescript
describe('Supabase Helpers', () => {
  beforeEach(() => {
    mockCookies.mockResolvedValue(mockCookieStore)
  })
  
  it('should create client with cookies', async () => {
    const client = await getSupabaseClient()
    expect(mockCookies).toHaveBeenCalledOnce()
  })
})
```

## 🗄️ Supabase Client Mocking

### Problem
Complex type errors with Supabase client mocks and query chains.

### Solution
```typescript
// ✅ Comprehensive Supabase client mock
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn()
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        order: vi.fn(() => ({
          then: vi.fn((callback) => callback({ data: [], error: null }))
        }))
      }))
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: null, error: null }))
      }))
    }))
  }))
}

// ✅ Mock with type assertion for complex chains
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
  createAdminClient: vi.fn(() => mockSupabaseClient)
}))
```

## 🔗 Mock Chain Objects

### Problem
TypeScript errors with complex mock chain objects:
```
Property 'insert' is missing in type '{ select: ... }' but required
```

### Solution
```typescript
// ✅ Mock chain with all required properties
const mockChain = {
  select: vi.fn(() => ({
    eq: vi.fn(() => ({
      single: vi.fn(() => Promise.resolve({ data: mockData, error: null }))
    }))
  })),
  insert: vi.fn(), // Always include this for type compatibility
  order: vi.fn(),  // Include if needed for type compatibility
}

// ✅ Use type assertion for complex scenarios
mockSupabaseClient.from.mockReturnValue(mockChain as any)
```

### Multiple Return Values
```typescript
// ✅ Mock multiple return values for complex scenarios
mockSupabaseClient.from
  .mockReturnValueOnce({ 
    select: vi.fn().mockReturnValue(selectChain), 
    insert: vi.fn() 
  } as any)
  .mockReturnValueOnce({ 
    select: vi.fn(), 
    insert: vi.fn().mockReturnValue(insertChain) 
  } as any)
```

## 🏭 Factory Function Mocking

### Problem
Module resolution issues with Vitest and Next.js 15 Server Components.

### Solution
```typescript
// ✅ Use factory functions for better module resolution
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn()
}))

// ✅ Import and create typed mocks
import { createClient } from '@/lib/supabase/server'
const mockCreateClient = vi.mocked(createClient)

// ✅ Setup in beforeEach
beforeEach(() => {
  mockCreateClient.mockReturnValue(mockSupabaseClient as any)
})
```

## 📦 Async Import Mocking

### Problem
Issues with dynamic imports in test files.

### Solution
```typescript
// ✅ Use async import for better compatibility
it('should test async function', async () => {
  const { createAdminClient } = await import('@/lib/supabase/helpers')
  
  const result = createAdminClient()
  expect(result).toBeDefined()
})
```

## 🧪 Testing Patterns

### Basic Test Structure
```typescript
import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn()
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn()
}))

// Import mocked modules
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// Create typed mocks
const mockCreateClient = vi.mocked(createClient)
const mockCookies = vi.mocked(cookies)

describe('Feature Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Setup default mocks
  })

  it('should work correctly', async () => {
    // Arrange
    mockCreateClient.mockReturnValue(mockClient as any)
    
    // Act
    const result = await functionUnderTest()
    
    // Assert
    expect(result).toBeDefined()
  })
})
```

### Error Handling Tests
```typescript
it('should handle errors gracefully', async () => {
  // Arrange
  mockCreateClient.mockImplementation(() => {
    throw new Error('Client creation failed')
  })

  // Act & Assert
  await expect(functionUnderTest()).rejects.toThrow('Client creation failed')
})
```

### Multiple Mock Scenarios
```typescript
it('should handle different response scenarios', async () => {
  // Test success case
  mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
    data: { user: mockUser },
    error: null
  })
  
  // Test error case
  mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
    data: { user: null },
    error: { message: 'Auth error' }
  })

  const [result1, result2] = await Promise.all([
    getCurrentUser(),
    getCurrentUser()
  ])

  expect(result1).toEqual(mockUser)
  expect(result2).toBeNull()
})
```

## 🚨 Common Pitfalls

### 1. Missing Mock Properties
```typescript
// ❌ Incomplete mock
const mockCookieStore = { get: vi.fn(), set: vi.fn() }

// ✅ Complete mock
const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  getAll: vi.fn(),
  has: vi.fn(),
  delete: vi.fn(),
  clear: vi.fn(),
  [Symbol.iterator]: vi.fn(() => [][Symbol.iterator]()),
  size: 0
}
```

### 2. Type Assertion Overuse
```typescript
// ❌ Overusing 'as any'
const result = someFunction() as any

// ✅ Specific type assertions
mockSupabaseClient.from.mockReturnValue(mockChain as any)
```

### 3. Mock Setup in Wrong Place
```typescript
// ❌ Setup in test instead of beforeEach
it('should test', () => {
  vi.clearAllMocks() // Wrong place
  // test code
})

// ✅ Setup in beforeEach
beforeEach(() => {
  vi.clearAllMocks() // Correct place
})
```

## 📊 Coverage Optimization

### Ensuring Complete Coverage
```typescript
// ✅ Test all code paths
describe('function', () => {
  it('should handle success case', async () => {
    // Test happy path
  })

  it('should handle error case', async () => {
    // Test error path
  })

  it('should handle edge case', async () => {
    // Test edge cases
  })
})
```

### Missing Function Coverage
```typescript
// ✅ Add tests for uncovered functions
describe('createAdminClient', () => {
  it('should create and return an admin client', async () => {
    const { createAdminClient } = await import('@/lib/supabase/helpers')
    
    const result = createAdminClient()
    expect(result).toBeDefined()
  })
})
```

## 🔄 Maintenance

### When to Update This Guide
- New mocking challenges are discovered
- Vitest version updates require changes
- New Next.js features affect mocking patterns
- Complex type issues are resolved

### Keeping Mocks Current
- Review mock patterns when updating dependencies
- Test mock compatibility with new TypeScript versions
- Update examples when patterns change
- Document new solutions for recurring issues

## 📚 Related Documentation

- [Testing Plan](./testing-plan.md) - Overall testing strategy
- [Testing Implementation Plan](./testing-implementation-plan.md) - Test implementation roadmap
- [Core Setup Testing](./core-setup-testing.md) - Environment and setup testing

## 🤝 Contributing

When encountering new mocking challenges:

1. **Document the Problem**: Describe the error and context
2. **Find the Solution**: Work through the TypeScript/mocking issue
3. **Update This Guide**: Add the solution with examples
4. **Test the Solution**: Ensure it works across different scenarios

---

*Last updated: December 2024 - Vitest 3.2.4, Next.js 15.4.6*
