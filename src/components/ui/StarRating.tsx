'use client'

import { Star } from 'lucide-react'

interface StarRatingProps {
  rating: number
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  count?: number
  className?: string
}

export default function StarRating({
  rating,
  size = 'md',
  showValue = false,
  count,
  className = '',
}: StarRatingProps) {
  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }

  const stars: React.ReactNode[] = []
  const fullStars = Math.floor(rating)
  const hasHalf = rating - fullStars >= 0.25 && rating - fullStars < 0.75
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0)

  // Full stars
  for (let i = 0; i < fullStars; i++) {
    stars.push(
      <Star
        key={`full-${i}`}
        className={`${sizeClasses[size]} fill-[#C59F00] text-[#C59F00]`}
      />
    )
  }

  // Half star
  if (hasHalf) {
    stars.push(
      <div key="half" className="relative inline-flex">
        <Star className={`${sizeClasses[size]} text-gray-300`} />
        <div className="absolute inset-0 overflow-hidden w-1/2">
          <Star className={`${sizeClasses[size]} fill-[#C59F00] text-[#C59F00]`} />
        </div>
      </div>
    )
  }

  // Empty stars
  for (let i = 0; i < emptyStars; i++) {
    stars.push(
      <Star
        key={`empty-${i}`}
        className={`${sizeClasses[size]} text-gray-300`}
      />
    )
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex items-center gap-0.5">{stars}</div>
      {showValue && (
        <span className={`${textSizes[size]} font-medium text-gray-700`}>
          {rating.toFixed(1)}
        </span>
      )}
      {count !== undefined && (
        <span className={`${textSizes[size]} text-gray-500`}>
          ({count})
        </span>
      )}
    </div>
  )
}
