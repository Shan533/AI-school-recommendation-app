/**
 * TypeScript type definitions for Collections system
 * User collections for schools and programs
 */

// ============================================================================
// COLLECTION TYPES
// ============================================================================

export interface Collection {
  id: string
  user_id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
}

export interface CollectionItem {
  id: string
  collection_id: string
  school_id?: string
  program_id?: string
  notes?: string
  created_at: string
}

export interface CollectionWithItems extends Collection {
  items: CollectionItemWithDetails[]
}

export interface CollectionItemWithDetails extends CollectionItem {
  school?: {
    id: string
    name: string
    initial?: string
    location?: string
    country?: string
  }
  program?: {
    id: string
    name: string
    initial?: string
    degree: string
    school: {
      name: string
      initial?: string
    }
  }
}

// ============================================================================
// COLLECTION FORM TYPES
// ============================================================================

export interface CollectionFormData {
  name: string
  description?: string
}

export interface CollectionItemFormData {
  school_id?: string
  program_id?: string
  notes?: string
}

// ============================================================================
// COLLECTION API RESPONSE TYPES
// ============================================================================

export interface CollectionsResponse {
  collections: Collection[]
  total: number
}

export interface CollectionResponse {
  collection: CollectionWithItems
}

export interface CollectionItemsResponse {
  items: CollectionItemWithDetails[]
  total: number
}

// ============================================================================
// COLLECTION VALIDATION TYPES
// ============================================================================

export interface CollectionValidationError {
  field: string
  message: string
}

export interface CollectionValidationResult {
  valid: boolean
  errors: CollectionValidationError[]
}
