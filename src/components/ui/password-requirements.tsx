'use client'

import { Check, X } from 'lucide-react'

interface PasswordRequirementProps {
  password: string
}

export function PasswordRequirements({ password }: PasswordRequirementProps) {
  const requirements = [
    {
      text: 'At least 8 characters',
      met: password.length >= 8,
    },
    {
      text: 'Contains uppercase letter',
      met: /[A-Z]/.test(password),
    },
    {
      text: 'Contains lowercase letter',
      met: /[a-z]/.test(password),
    },
    {
      text: 'Contains number',
      met: /[0-9]/.test(password),
    },
    {
      text: 'Contains special character',
      met: /[^A-Za-z0-9]/.test(password),
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
