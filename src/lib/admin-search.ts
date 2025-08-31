/**
 * Generic search filter function for admin pages
 * Supports searching across multiple fields with partial matching
 */

export interface SearchableItem {
  [key: string]: unknown
}

export interface SearchConfig {
  fields: string[] // Array of field paths to search in, e.g., ['name', 'email', 'profile.name']
  searchTerm: string
}

/**
 * Get nested property value from an object using dot notation
 * e.g., getNestedValue(obj, 'profile.name') returns obj.profile?.name
 */
function getNestedValue(obj: unknown, path: string): unknown {
  const result = path.split('.').reduce((current: unknown, key: string): unknown => {
    if (current === null || current === undefined) return undefined
    
    // Handle arrays - search in all array items
    if (Array.isArray(current)) {
      const values = current.map(item => item?.[key]).filter(Boolean)
      return values.length > 0 ? values.join(' ') : undefined
    }
    
    // Type assertion for object property access
    return (current as Record<string, unknown>)[key]
  }, obj)
  
  return result
}

/**
 * Match types for ranking search results
 */
export enum MatchType {
  EXACT = 1,           // Exact match (highest priority)
  STARTS_WITH = 2,     // Starts with search term
  WORD_BOUNDARY = 3,   // Word boundary match
  CONTAINS = 4         // Contains match (lowest priority)
}

/**
 * Search result with match information
 */
interface SearchResult<T> {
  item: T
  matchType: MatchType
  matchedField: string
  matchedValue: string
}

/**
 * Get match type and score for a search term against a value
 */
export function getMatchInfo(searchTerm: string, value: string): { type: MatchType; score: number } | null {
  const searchLower = searchTerm.toLowerCase()
  const valueLower = value.toLowerCase()
  
  // Exact match (highest priority)
  if (valueLower === searchLower) {
    return { type: MatchType.EXACT, score: 1000 }
  }
  
  // Starts with match
  if (valueLower.startsWith(searchLower)) {
    return { type: MatchType.STARTS_WITH, score: 800 }
  }
  
  // Word boundary match (matches whole words)
  const wordBoundaryRegex = new RegExp(`\\b${searchLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
  if (wordBoundaryRegex.test(value)) {
    return { type: MatchType.WORD_BOUNDARY, score: 600 }
  }
  
  // Contains match
  if (valueLower.includes(searchLower)) {
    // Score based on position (earlier = higher score)
    const position = valueLower.indexOf(searchLower)
    const positionScore = Math.max(0, 400 - position * 2)
    return { type: MatchType.CONTAINS, score: positionScore }
  }
  
  return null
}

/**
 * Advanced filter with intelligent ranking
 * Returns items sorted by match relevance: exact matches first, then partial matches
 */
export function filterItems<T extends SearchableItem>(
  items: T[], 
  config: SearchConfig
): T[] {
  if (!config.searchTerm || !config.searchTerm.trim()) {
    return items
  }

  const searchTerm = config.searchTerm.trim()
  const results: SearchResult<T>[] = []
  
  // Find all matches with their match types
  items.forEach(item => {
    let bestMatch: SearchResult<T> | null = null
    
    config.fields.forEach(fieldPath => {
      const value = getNestedValue(item, fieldPath)
      
      if (value === null || value === undefined) return
      
      const stringValue = String(value)
      const matchInfo = getMatchInfo(searchTerm, stringValue)
      
      if (matchInfo) {
        const candidate: SearchResult<T> = {
          item,
          matchType: matchInfo.type,
          matchedField: fieldPath,
          matchedValue: stringValue
        }
        
        // Keep the best match for this item
        if (!bestMatch) {
          bestMatch = candidate
        } else {
          const bestMatchInfo = getMatchInfo(searchTerm, bestMatch.matchedValue)
          if (bestMatchInfo && matchInfo.score > bestMatchInfo.score) {
            bestMatch = candidate
          }
        }
      }
    })
    
    if (bestMatch) {
      results.push(bestMatch)
    }
  })
  
  // Sort by match type (exact first), then by field priority, then alphabetically
  results.sort((a, b) => {
    // Primary sort: match type (exact matches first)
    if (a.matchType !== b.matchType) {
      return a.matchType - b.matchType
    }
    
    // Secondary sort: field priority (name/initial fields first)
    const getPriority = (fieldPath: string) => {
      if (fieldPath === 'name' || fieldPath === 'initial') return 1
      if (fieldPath.includes('name') || fieldPath.includes('initial')) return 2
      return 3
    }
    
    const aPriority = getPriority(a.matchedField)
    const bPriority = getPriority(b.matchedField)
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority
    }
    
    // Tertiary sort: alphabetical by matched value
    return a.matchedValue.localeCompare(b.matchedValue)
  })
  
  return results.map(result => result.item)
}

/**
 * Simple filter (legacy function for compatibility)
 * Use filterItems for better results
 */
export function simpleFilterItems<T extends SearchableItem>(
  items: T[], 
  config: SearchConfig
): T[] {
  if (!config.searchTerm || !config.searchTerm.trim()) {
    return items
  }

  const searchLower = config.searchTerm.trim().toLowerCase()
  
  return items.filter(item => {
    return config.fields.some(fieldPath => {
      const value = getNestedValue(item, fieldPath)
      
      if (value === null || value === undefined) return false
      
      // Convert to string and search
      const stringValue = String(value).toLowerCase()
      return stringValue.includes(searchLower)
    })
  })
}

/**
 * Predefined search configurations for common admin pages
 */
export const searchConfigs = {
  schools: {
    fields: ['name', 'initial', 'type', 'country', 'location'],
    placeholder: 'Search schools by name, abbreviation, type, country, or location...',
    helpText: 'Search works on: school names, abbreviations (e.g. "CMU"), type, country, and location'
  },
  
  programs: {
    fields: ['name', 'initial', 'degree', 'schools.name', 'schools.initial', 'description'],
    placeholder: 'Search programs by name, abbreviation, degree, school, or description...',
    helpText: 'Search works on: program names, abbreviations, degrees, school names/abbreviations, and descriptions'
  },
  
  users: {
    fields: ['name', 'email'],
    placeholder: 'Search users by name or email...',
    helpText: 'Search works on: user names and email addresses'
  },
  
  reviews: {
    fields: ['comment', 'profiles.name', 'schools.name', 'schools.initial', 'programs.name', 'programs.initial', 'programs.schools.name', 'programs.schools.initial'],
    placeholder: 'Search reviews by comment, user name, school/program name or abbreviation...',
    helpText: 'Search works on: review comments, user names, school/program names and abbreviations (e.g. "CMU" for Carnegie Mellon)'
  }
}
