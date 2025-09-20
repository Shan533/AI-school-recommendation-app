import { describe, it, expect } from 'vitest'

describe('New Admin API Endpoints Structure', () => {
  it('should have categories API endpoints', async () => {
    // Test that the API files exist and can be imported
    const categoriesRoute = await import('@/app/api/admin/categories/route')
    expect(categoriesRoute).toBeDefined()
    expect(categoriesRoute.GET).toBeDefined()
    expect(categoriesRoute.POST).toBeDefined()
  })

  it('should have categories [id] API endpoints', async () => {
    // Test that the API files exist and can be imported
    const categoriesIdRoute = await import('@/app/api/admin/categories/[id]/route')
    expect(categoriesIdRoute).toBeDefined()
    expect(categoriesIdRoute.GET).toBeDefined()
    expect(categoriesIdRoute.PUT).toBeDefined()
    expect(categoriesIdRoute.DELETE).toBeDefined()
  })

  it('should have bulk assign API endpoint', async () => {
    // Test that the API files exist and can be imported
    const bulkAssignRoute = await import('@/app/api/admin/programs/bulk-assign/route')
    expect(bulkAssignRoute).toBeDefined()
    expect(bulkAssignRoute.POST).toBeDefined()
  })

  it('should have enhanced programs API with GET method', async () => {
    // Test that the enhanced programs API has GET method
    const programsRoute = await import('@/app/api/admin/programs/route')
    expect(programsRoute).toBeDefined()
    expect(programsRoute.GET).toBeDefined()
    expect(programsRoute.POST).toBeDefined()
  })
})
