'use client'

import { AnimatedRequirement } from './animated-requirement'

interface PasswordRequirementProps {
  password: string
  showOnlyUnmet?: boolean
}

export function PasswordRequirements({ password, showOnlyUnmet = false }: PasswordRequirementProps) {
  const requirements = [
    {
      text: 'At least 8 characters',
      met: password.length >= 8,
    },
    {
      text: 'Contains both uppercase and lowercase letters',
      met: /[A-Z]/.test(password) && /[a-z]/.test(password),
    },
    {
      text: 'Contains number',
      met: /[0-9]/.test(password),
    },
    {
      text: 'Contains special character (!@#$%^&*()_+-)',
      met: /[^A-Za-z0-9]/.test(password),
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
