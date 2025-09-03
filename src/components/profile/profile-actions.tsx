'use client'

import { Button } from '@/components/ui/button'

interface ProfileActionsProps {
  userEmail: string
}

export default function ProfileActions({ userEmail }: ProfileActionsProps) {
  const handleChangeEmail = () => {
    // Scroll to email update form
    document.getElementById('email-update-section')?.scrollIntoView({ 
      behavior: 'smooth' 
    })
  }

  const handleResetPassword = () => {
    // Navigate to forgot password page
    window.location.href = '/forgot-password'
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
      <p className="text-gray-600">{userEmail}</p>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleChangeEmail}
        >
          Change Email
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleResetPassword}
        >
          Reset Password
        </Button>
      </div>
    </div>
  )
}
