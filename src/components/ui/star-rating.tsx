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
  allowHalfStars?: boolean
}

export function StarRating({ 
  rating, 
  onRatingChange, 
  readonly = false, 
  size = 'md',
  className,
  allowHalfStars = false
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0)
  
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5', 
    lg: 'h-6 w-6'
  }

  const handleClick = (value: number, isHalf?: boolean) => {
    if (!readonly && onRatingChange) {
      const finalValue = isHalf ? value - 0.5 : value
      onRatingChange(finalValue)
    }
  }

  const handleMouseEnter = (value: number, isHalf?: boolean) => {
    if (!readonly) {
      const finalValue = isHalf ? value - 0.5 : value
      setHoverRating(finalValue)
    }
  }

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverRating(0)
    }
  }

  const getStarFill = (starIndex: number, currentRating: number) => {
    if (currentRating >= starIndex) {
      return 'full'
    } else if (currentRating >= starIndex - 0.5) {
      return 'half'
    }
    return 'empty'
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const currentRating = hoverRating || rating
        const fillType = getStarFill(star, currentRating)
        
        return (
          <div key={star} className="relative">
            {allowHalfStars && !readonly ? (
              // Interactive half-star rating
              <div className="relative group">
                {/* Base star */}
                <Star
                  className={cn(
                    sizeClasses[size],
                    'transition-colors duration-150 fill-gray-200 text-gray-200'
                  )}
                />
                {/* Full star overlay */}
                {fillType !== 'empty' && (
                  <div className={cn(
                    "absolute inset-0",
                    fillType === 'half' ? 'w-1/2 overflow-hidden' : 'w-full'
                  )}>
                    <Star
                      className={cn(
                        sizeClasses[size],
                        'fill-yellow-400 text-yellow-400 transition-colors duration-150'
                      )}
                    />
                  </div>
                )}
                
                {/* Visual divider line when hovering */}
                <div className="absolute inset-0 flex">
                  <div className="w-1/2 opacity-0 group-hover:opacity-30 transition-opacity duration-150 border-r border-gray-400"></div>
                  <div className="w-1/2"></div>
                </div>
                
                {/* Left half clickable area */}
                <div
                  className={cn(
                    'absolute inset-0 w-1/2 cursor-pointer z-10',
                    'hover:bg-yellow-100 hover:bg-opacity-20 rounded-l-sm transition-colors duration-150'
                  )}
                  onClick={() => handleClick(star, true)}
                  onMouseEnter={() => handleMouseEnter(star, true)}
                  onMouseLeave={handleMouseLeave}
                  title={`${star - 0.5} stars`}
                />
                {/* Right half clickable area */}
                <div
                  className={cn(
                    'absolute inset-0 left-1/2 w-1/2 cursor-pointer z-10',
                    'hover:bg-yellow-100 hover:bg-opacity-20 rounded-r-sm transition-colors duration-150'
                  )}
                  onClick={() => handleClick(star, false)}
                  onMouseEnter={() => handleMouseEnter(star, false)}
                  onMouseLeave={handleMouseLeave}
                  title={`${star} stars`}
                />
              </div>
            ) : (
              // Regular full-star rating or readonly display
              <div className="relative">
                <Star
                  className={cn(
                    sizeClasses[size],
                    'transition-colors duration-150',
                    fillType === 'empty' 
                      ? 'fill-gray-200 text-gray-200' 
                      : 'fill-yellow-400 text-yellow-400',
                    !readonly && 'cursor-pointer hover:scale-110 transition-transform'
                  )}
                  onClick={() => !readonly && handleClick(star, false)}
                  onMouseEnter={() => !readonly && handleMouseEnter(star, false)}
                  onMouseLeave={handleMouseLeave}
                />
                {/* Half star overlay for display */}
                {fillType === 'half' && (
                  <div className="absolute inset-0 overflow-hidden w-1/2">
                    <Star
                      className={cn(
                        sizeClasses[size],
                        'fill-yellow-400 text-yellow-400'
                      )}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
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