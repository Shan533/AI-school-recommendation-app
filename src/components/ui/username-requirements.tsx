'use client'

import { AnimatedRequirement } from './animated-requirement'

interface UsernameRequirementProps {
  username: string
  showOnlyUnmet?: boolean
}

export function UsernameRequirements({ username, showOnlyUnmet = false }: UsernameRequirementProps) {
  const requirements = [
    {
      text: 'At least 3 characters',
      met: username.length >= 3,
    },
    {
      text: 'Only letters, numbers, and underscores allowed',
      met: /^[a-zA-Z0-9_]+$/.test(username),
    },
  ]

  // When showOnlyUnmet is true, we still render all requirements
  // but let AnimatedRequirement handle its own visibility based on met status
  return (
    <div className="text-sm text-muted-foreground">
      {requirements.map((req, index) => (
        <AnimatedRequirement
          key={req.text}
          text={req.text}
          met={req.met}
          index={index}
          showOnlyUnmet={showOnlyUnmet}
        />
      ))}
    </div>
  )
}
