'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { StarRating } from '@/components/ui/star-rating'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface ReviewFormProps {
  type: 'school' | 'program'
  itemId: string
  itemName: string
  existingReview?: {
    id: string
    rating: number
    comment: string
  } | null
  onSuccess?: () => void
}

export function ReviewForm({ type, itemId, itemName, existingReview, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(existingReview?.rating || 0)
  const [comment, setComment] = useState(existingReview?.comment || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (rating === 0) {
      setError('Please select a rating')
      return
    }

    if (comment.trim().length < 10) {
      setError('Please write at least 10 characters in your review')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const tableName = type === 'school' ? 'school_reviews' : 'program_reviews'
      const foreignKey = type === 'school' ? 'school_id' : 'program_id'

      const reviewData = {
        rating,
        comment: comment.trim(),
        user_id: user.id,
        [foreignKey]: itemId,
      }

      let result
      if (existingReview) {
        // Update existing review
        result = await supabase
          .from(tableName)
          .update(reviewData)
          .eq('id', existingReview.id)
          .select()
      } else {
        // Create new review
        result = await supabase
          .from(tableName)
          .insert([reviewData])
          .select()
      }

      if (result.error) {
        throw result.error
      }

      // Reset form
      if (!existingReview) {
        setRating(0)
        setComment('')
      }

      if (onSuccess) {
        onSuccess()
      }

      // Refresh the page to show updated reviews
      router.refresh()
    } catch (error) {
      console.error('Error submitting review:', error)
      setError('Failed to submit review. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {existingReview ? 'Edit Your Review' : 'Write a Review'} for {itemName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="rating">Rating *</Label>
            <div className="mt-2">
              <StarRating
                rating={rating}
                onRatingChange={setRating}
                size="lg"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="comment">Your Review *</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={`Share your experience with ${itemName}...`}
              rows={4}
              className="mt-2"
            />
            <p className="text-sm text-gray-500 mt-1">
              Minimum 10 characters ({comment.length}/10)
            </p>
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting 
                ? 'Submitting...' 
                : existingReview 
                  ? 'Update Review' 
                  : 'Submit Review'
              }
            </Button>
            {existingReview && onSuccess && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onSuccess}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}