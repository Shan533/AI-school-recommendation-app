'use client'

import { Button } from '@/components/ui/button'

export default function ResetPasswordButton() {
  const handleResetPassword = () => {
    // Navigate to forgot password page
    window.location.href = '/forgot-password'
  }

  return (
    <div className="flex justify-center">
      <Button 
        variant="outline"
        onClick={handleResetPassword}
      >
        Reset Password
      </Button>
    </div>
  )
}
