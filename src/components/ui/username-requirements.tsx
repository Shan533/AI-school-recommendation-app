'use client'

import { Check, X } from 'lucide-react'

interface UsernameRequirementProps {
  username: string
}

export function UsernameRequirements({ username }: UsernameRequirementProps) {
  const requirements = [
    {
      text: 'At least 3 characters',
      met: username.length >= 3,
    },
    {
      text: 'No special characters',
      met: /^[a-zA-Z0-9_]+$/.test(username),
    },
    {
      text: 'No spaces',
      met: !username.includes(' '),
    },
  ]

  return (
    <div className="space-y-2 text-sm text-muted-foreground">
      {requirements.map((req, index) => (
        <div key={index} className="flex items-center space-x-2">
          {req.met ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <X className="h-4 w-4 text-red-500" />
          )}
          <span className={req.met ? 'text-green-500' : 'text-red-500'}>
            {req.text}
          </span>
        </div>
      ))}
    </div>
  )
}
