'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  rating: number
  onRatingChange?: (rating: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function StarRating({ 
  rating, 
  onRatingChange, 
  readonly = false, 
  size = 'md',
  className 
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0)
  
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5', 
    lg: 'h-6 w-6'
  }

  const handleClick = (value: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(value)
    }
  }

  const handleMouseEnter = (value: number) => {
    if (!readonly) {
      setHoverRating(value)
    }
  }

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverRating(0)
    }
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const isActive = star <= (hoverRating || rating)
        return (
          <Star
            key={star}
            className={cn(
              sizeClasses[size],
              'transition-colors duration-150',
              isActive 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'fill-gray-200 text-gray-200',
              !readonly && 'cursor-pointer hover:scale-110 transition-transform'
            )}
            onClick={() => handleClick(star)}
            onMouseEnter={() => handleMouseEnter(star)}
            onMouseLeave={handleMouseLeave}
          />
        )
      })}
      {readonly && (
        <span className="ml-2 text-sm text-gray-600">
          ({rating.toFixed(1)})
        </span>
      )}
    </div>
  )
}