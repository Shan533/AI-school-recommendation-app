'use client'

import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface DeleteReviewButtonProps {
  reviewId: string
  reviewType: 'school' | 'program'
  onDelete: (formData: FormData) => Promise<void>
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
      
      await onDelete(formData)
    } catch (error) {
      console.error('Error deleting review:', error)
      alert('Failed to delete review. Please try again.')
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
