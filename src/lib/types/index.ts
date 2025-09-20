/**
 * Central type definitions index
 * Re-exports all type definitions for easy importing
 */

// ============================================================================
// SCHEMA ENHANCEMENTS
// ============================================================================
export * from './schema-enhancements'

// ============================================================================
// COLLECTIONS
// ============================================================================
export * from './collections'

// ============================================================================
// VALIDATION TYPES
// ============================================================================
export type { 
  Collection, 
  CollectionItem, 
  CollectionWithItems, 
  CollectionItemWithDetails,
  CollectionFormData,
  CollectionItemFormData,
  CollectionValidationError,
  CollectionValidationResult
} from './collections'

// ============================================================================
// COMMON UTILITY TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
  success: boolean
}

export interface PaginatedApiResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
    has_next: boolean
    has_prev: boolean
  }
}

export interface BaseEntity {
  id: string
  created_at: string
  updated_at: string
}

export interface UserEntity extends BaseEntity {
  user_id: string
}

// ============================================================================
// FORM VALIDATION TYPES
// ============================================================================

export interface ValidationError {
  field: string
  message: string
  code?: string
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

// ============================================================================
// SEARCH AND FILTER TYPES
// ============================================================================

export interface BaseSearchFilters {
  search?: string
  page?: number
  limit?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface DateRange {
  start_date?: string
  end_date?: string
}

export interface NumberRange {
  min?: number
  max?: number
}
