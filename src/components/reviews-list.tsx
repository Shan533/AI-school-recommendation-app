import { StarRating } from '@/components/ui/star-rating'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

interface Review {
  id: string
  rating: number
  comment: string
  created_at: string
  profiles: {
    name: string
  } | null
}

interface ReviewsListProps {
  reviews: Review[]
  type: 'school' | 'program'
  averageRating?: number
  totalReviews?: number
}

export function ReviewsList({ reviews, type, averageRating, totalReviews }: ReviewsListProps) {
  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">No reviews yet.</p>
          <p className="text-sm text-gray-400 mt-1">
            Be the first to review this {type}!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Reviews Summary */}
      {averageRating && totalReviews && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {averageRating.toFixed(1)}
                </div>
                <StarRating rating={averageRating} readonly size="sm" />
              </div>
              <div>
                <p className="text-lg font-semibold">
                  {totalReviews} {totalReviews === 1 ? 'Review' : 'Reviews'}
                </p>
                <p className="text-gray-600">
                  Average rating from verified reviews
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual Reviews */}
      <div className="space-y-4">
        {reviews.map((review, index) => (
          <div key={review.id}>
            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-start gap-3 md:gap-4">
                  <Avatar className="flex-shrink-0">
                    <AvatarFallback>
                      {review.profiles?.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    {/* Mobile: Stack vertically, Desktop: Side by side */}
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between md:mb-2">
                      <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                        <h4 className="font-semibold text-gray-900 text-sm md:text-base">
                          {review.profiles?.name || 'Anonymous User'}
                        </h4>
                        <Badge variant="secondary" className="text-xs whitespace-nowrap">
                          Verified
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs md:text-sm">
                        <StarRating rating={review.rating} readonly size="sm" />
                        <span className="text-gray-500 whitespace-nowrap">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    {review.comment ? (
                      <p className="text-gray-700 leading-relaxed">
                        {review.comment}
                      </p>
                    ) : (
                      <p className="text-gray-500 italic text-sm">
                        Rating only review
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {index < reviews.length - 1 && (
              <Separator className="my-4" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}