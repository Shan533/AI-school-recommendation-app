'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { StarRating } from '@/components/ui/star-rating'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface UserReview {
  id: string
  rating: number
  comment: string
  created_at: string
  user_id: string
}

interface ReviewFormProps {
  type: 'school' | 'program'
  itemId: string
  itemName: string
  userReviews?: UserReview[]
  onSuccess?: () => void
}

export function ReviewForm({ type, itemId, itemName, userReviews = [], onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCommentForm, setShowCommentForm] = useState(false)
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const router = useRouter()
  
  const hasReviews = userReviews.length > 0

  // Quick rating submission (rating only)
  const handleQuickRatingSubmit = async () => {
    if (rating === 0) {
      setError('Please select a rating')
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
        comment: '', // Empty comment for quick rating
        user_id: user.id,
        [foreignKey]: itemId,
      }

      const result = await supabase
        .from(tableName)
        .insert([reviewData])
        .select()

      if (result.error) {
        throw result.error
      }

      // Reset form
      setRating(0)
      setComment('')
      setShowCommentForm(false)

      if (onSuccess) {
        onSuccess()
      }

      // Refresh the page to show updated reviews
      router.refresh()
    } catch (error) {
      console.error('Error submitting rating:', error)
      setError('Failed to submit rating. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Full review submission (with comment)
  const handleFullReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (rating === 0) {
      setError('Please select a rating')
      return
    }

    // If there is a comment, it must be at least 10 characters
    if (comment.trim().length > 0 && comment.trim().length < 10) {
      setError('Review must be at least 10 characters long')
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
        comment: comment.trim() || '', // Allow empty comments
        user_id: user.id,
        [foreignKey]: itemId,
      }

      const result = await supabase
        .from(tableName)
        .insert([reviewData])
        .select()

      if (result.error) {
        throw result.error
      }

      // Reset form
      setRating(0)
      setComment('')
      setShowCommentForm(false)

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

  // Handle edit review
  const handleEditReview = (review: UserReview) => {
    setEditingReviewId(review.id)
    setRating(review.rating)
    setComment(review.comment || '')
    setError(null)
  }

  // Handle update review
  const handleUpdateReview = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingReviewId) return
    
    if (rating === 0) {
      setError('Please select a rating')
      return
    }

    if (comment.trim().length > 0 && comment.trim().length < 10) {
      setError('Review must be at least 10 characters long')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/reviews/${type}/${editingReviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          comment: comment.trim() || '',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API Error Response:', errorData)
        const errorMessage = errorData.details 
          ? `${errorData.error}: ${errorData.details}` 
          : errorData.error || `Failed to update review (${response.status})`
        throw new Error(errorMessage)
      }

      // Reset form
      setEditingReviewId(null)
      setRating(0)
      setComment('')

      if (onSuccess) {
        onSuccess()
      }

      // Refresh the page to show updated reviews
      router.refresh()
    } catch (error) {
      console.error('Error updating review:', error)
      setError(error instanceof Error ? error.message : 'Failed to update review. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle delete review
  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) {
      return
    }

    setIsDeleting(reviewId)
    setError(null)

    try {
      const response = await fetch(`/api/reviews/${type}/${reviewId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API Error Response:', errorData)
        throw new Error(errorData.error || `Failed to delete review (${response.status})`)
      }

      if (onSuccess) {
        onSuccess()
      }

      // Refresh the page to show updated reviews
      router.refresh()
    } catch (error) {
      console.error('Error deleting review:', error)
      setError(error instanceof Error ? error.message : 'Failed to delete review. Please try again.')
    } finally {
      setIsDeleting(null)
    }
  }

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingReviewId(null)
    setRating(0)
    setComment('')
    setError(null)
  }

  // If user has reviews, show their reviews section
  if (hasReviews) {
    return (
      <div className="space-y-6">
        {/* User's Reviews Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              💭 Your Reviews ({userReviews.length} review{userReviews.length > 1 ? 's' : ''})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {userReviews.map((review, index) => (
              <div key={review.id} className="border rounded-lg p-3 md:p-4">
                {editingReviewId === review.id ? (
                  // Edit mode
                  <form onSubmit={handleUpdateReview} className="space-y-4">
                    <div>
                      <Label htmlFor="edit-rating">Rating *</Label>
                      <div className="mt-2">
                        <StarRating
                          rating={rating}
                          onRatingChange={setRating}
                          size="lg"
                          allowHalfStars={true}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="edit-comment">Your Review (optional)</Label>
                      <Textarea
                        id="edit-comment"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder={`Share your experience with ${itemName}...`}
                        rows={4}
                        className="mt-2"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        {comment.length === 0 
                          ? "Leave empty for rating-only review, or write at least 10 characters" 
                          : `${comment.length} characters ${comment.length < 10 ? `(need ${10 - comment.length} more)` : '✓'}`
                        }
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button 
                        type="submit" 
                        disabled={isSubmitting || rating === 0}
                        size="sm"
                        className="flex-1 sm:flex-none text-xs h-8 sm:h-9 sm:text-sm"
                      >
                        {isSubmitting ? 'Updating...' : 'Update Review'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={isSubmitting}
                        size="sm"
                        className="flex-1 sm:flex-none text-xs h-8 sm:h-9 sm:text-sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  // View mode - Mobile and desktop optimized layout
                  <div className="space-y-3">
                    {/* Header: Rating, badges and date */}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <StarRating rating={review.rating} readonly size="sm" />
                        <span className="font-medium text-sm">{review.rating.toFixed(1)} stars</span>
                        {index === 0 && (
                          <Badge variant="default" className="text-xs whitespace-nowrap">Latest</Badge>
                        )}
                        {index > 0 && (
                          <Badge variant="secondary" className="text-xs whitespace-nowrap">Previous</Badge>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 sm:text-sm">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Review comment */}
                    <div>
                      {review.comment ? (
                        <p className="text-gray-700 text-sm leading-relaxed">{review.comment}</p>
                      ) : (
                        <p className="text-gray-500 italic text-sm">Rating only review</p>
                      )}
                    </div>

                    {/* Action buttons - below the content, right aligned */}
                    <div className="flex gap-2 pt-2 border-t border-gray-100 justify-end">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleEditReview(review)}
                        disabled={isSubmitting || editingReviewId !== null}
                        className="text-xs h-7 px-2 sm:h-8 sm:px-3 sm:text-sm"
                      >
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDeleteReview(review.id)}
                        disabled={isSubmitting || isDeleting === review.id}
                        className="text-xs h-7 px-2 sm:h-8 sm:px-3 sm:text-sm"
                      >
                        {isDeleting === review.id ? 'Deleting...' : 'Delete'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            <Button 
              onClick={() => setShowCommentForm(true)}
              variant="outline" 
              className="w-full text-xs h-8 sm:h-9 sm:text-sm"
              disabled={editingReviewId !== null || isSubmitting}
            >
              + Add New Review
            </Button>
          </CardContent>
        </Card>

        {/* Error display */}
        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        {/* New Review Form (shown when user clicks "Add New Review") */}
        {showCommentForm && editingReviewId === null && (
          <Card>
            <CardHeader>
              <CardTitle>Add New Review for {itemName}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFullReviewSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="rating">Rating *</Label>
                  <div className="mt-2">
                    <StarRating
                      rating={rating}
                      onRatingChange={setRating}
                      size="lg"
                      allowHalfStars={true}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="comment">Your Review (optional)</Label>
                  <Textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={`Share your experience with ${itemName}...`}
                    rows={4}
                    className="mt-2"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {comment.length === 0 
                      ? "Leave empty for rating-only review, or write at least 10 characters" 
                      : `${comment.length} characters ${comment.length < 10 ? `(need ${10 - comment.length} more)` : '✓'}`
                    }
                  </p>
                </div>

                {error && (
                  <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                    {error}
                  </div>
                )}

                <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || rating === 0}
                    className="flex-1 text-xs h-8 sm:h-9 sm:text-sm"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Review'}
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setShowCommentForm(false)
                      setRating(0)
                      setComment('')
                      setError(null)
                    }}
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-none text-xs h-8 sm:h-9 sm:text-sm"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // If user has no reviews, show quick rating interface
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rate {itemName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="rating">Rating *</Label>
          <div className="mt-2">
            <StarRating
              rating={rating}
              onRatingChange={setRating}
              size="lg"
              allowHalfStars={true}
            />
          </div>
        </div>

        {rating > 0 && (
          <div className="flex gap-2 sm:gap-3">
            <Button 
              onClick={handleQuickRatingSubmit}
              disabled={isSubmitting}
              className="flex-1 text-xs h-8 sm:h-9 sm:text-sm"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Rating'}
            </Button>
            
            <Button 
              onClick={() => setShowCommentForm(true)}
              variant="outline"
              disabled={isSubmitting}
              className="text-xs h-8 px-2 sm:h-9 sm:px-3 sm:text-sm whitespace-nowrap"
            >
              + Add Comment
            </Button>
          </div>
        )}

        {showCommentForm && (
          <form onSubmit={handleFullReviewSubmit} className="space-y-4 pt-4 border-t">
            <div>
              <Label htmlFor="comment">Your Review (optional)</Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={`Share your experience with ${itemName}...`}
                rows={4}
                className="mt-2"
              />
              <p className="text-sm text-gray-500 mt-1">
                {comment.length === 0 
                  ? "Leave empty for rating-only review, or write at least 10 characters" 
                  : `${comment.length} characters ${comment.length < 10 ? `(need ${10 - comment.length} more)` : '✓'}`
                }
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
              <Button 
                type="submit" 
                disabled={isSubmitting || rating === 0}
                className="flex-1 text-xs h-8 sm:h-9 sm:text-sm"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </Button>
              
              <Button 
                type="button" 
                variant="outline"
                onClick={() => {
                  setShowCommentForm(false)
                  setComment('')
                  setError(null)
                }}
                disabled={isSubmitting}
                className="flex-1 sm:flex-none text-xs h-8 sm:h-9 sm:text-sm"
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  )
}