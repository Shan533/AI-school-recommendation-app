'use client'

import { useState, useEffect } from 'react'
import { Check, X } from 'lucide-react'

interface AnimatedRequirementProps {
  text: string
  met: boolean
  index: number
  showOnlyUnmet?: boolean
}

export function AnimatedRequirement({ text, met, index, showOnlyUnmet = false }: AnimatedRequirementProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const [shouldRender, setShouldRender] = useState(true)

  useEffect(() => {
    // Show the requirement with a staggered delay
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, index * 100)

    return () => clearTimeout(timer)
  }, [index])

  useEffect(() => {
    // Handle exit animation when met becomes true (only in showOnlyUnmet mode)
    if (showOnlyUnmet && met && isVisible && !isExiting) {
      setIsExiting(true)
      const timer = setTimeout(() => {
        setShouldRender(false)
      }, 300) // Match the transition duration

      return () => clearTimeout(timer)
    } else if (showOnlyUnmet && !met && isExiting) {
      // Reset if requirement becomes unmet again
      setIsExiting(false)
      setShouldRender(true)
    }
  }, [met, isVisible, isExiting, showOnlyUnmet])

  // In showOnlyUnmet mode, don't render if already met (unless still animating out)
  if (showOnlyUnmet && met && !isExiting && !shouldRender) return null

  if (!shouldRender) return null

  return (
    <div 
      className={`flex items-center space-x-2 transition-all duration-300 ease-out overflow-hidden ${
        isExiting 
          ? 'opacity-0 transform -translate-y-2 scale-95 max-h-0 mb-0' 
          : isVisible
          ? 'opacity-100 transform translate-y-0 scale-100 max-h-6 mb-2'
          : 'opacity-0 transform translate-y-1 scale-95 max-h-0 mb-0'
      }`}
      style={{
        transition: 'all 300ms ease-out'
      }}
    >
      {met ? (
        <Check className="h-4 w-4 text-green-500 transition-colors duration-200" />
      ) : (
        <X className="h-4 w-4 text-red-500 transition-colors duration-200" />
      )}
      <span className={`transition-colors duration-200 ${
        met ? 'text-green-500' : 'text-red-500'
      }`}>
        {text}
      </span>
    </div>
  )
}
