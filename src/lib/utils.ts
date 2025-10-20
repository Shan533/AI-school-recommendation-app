import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Safely extract a human-readable message from unknown errors.
export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  try {
    return JSON.stringify(err)
  } catch {
    return 'Unknown error'
  }
}

// Safely format a date string to a localized string, with fallback for invalid dates
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString || typeof dateString !== 'string') return '-'
  
  try {
    const date = new Date(dateString)
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn('Failed to format date: invalid date string', dateString)
      return '-'
    }
    
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    console.warn('Failed to format date:', dateString, error)
    return '-'
  }
}
