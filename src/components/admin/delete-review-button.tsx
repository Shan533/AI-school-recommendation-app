'use client'

import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface DeleteReviewButtonProps {
  reviewId: string
  reviewType: 'school' | 'program'
  onDelete: (formData: FormData) => Promise<{ success: boolean; message: string }>
}

export function DeleteReviewButton({ reviewId, reviewType, onDelete }: DeleteReviewButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    
    try {
      const formData = new FormData()
      formData.append('reviewId', reviewId)
      formData.append('reviewType', reviewType)
      
      const result = await onDelete(formData)
      
      if (result.success) {
        // Show success message and refresh the page
        alert(result.message)
        window.location.reload()
      }
    } catch (error) {
      // Show more specific error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete review. Please try again.'
      alert(`Error: ${errorMessage}`)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <form onSubmit={handleDelete}>
      <Button 
        type="submit" 
        variant="destructive" 
        size="sm"
        disabled={isDeleting}
      >
        {isDeleting ? 'Deleting...' : 'Delete'}
      </Button>
    </form>
  )
}
