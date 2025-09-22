'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PasswordInput } from '@/components/ui/password-input'
import { PasswordRequirements } from '@/components/ui/password-requirements'
import { createClient } from '@/lib/supabase/client'
import { getErrorMessage } from '@/lib/utils'

export default function ResetPasswordClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false)

  // Lazy initialization to avoid triggering env validation during module import
  const supabase = useMemo(() => createClient(), [])

  // Check if password meets all requirements
  const isPasswordValid = () => {
    return password.length >= 8 && 
           /[A-Z]/.test(password) && /[a-z]/.test(password) && 
           /[0-9]/.test(password) && 
           /[^A-Za-z0-9]/.test(password)
  }

  useEffect(() => {
    // Handle password reset token from email link
    const run = async () => {
      try {
        // Get token_hash and type from URL parameters
        const token_hash = searchParams?.get('token_hash')
        const type = searchParams?.get('type')
        
        if (token_hash && type === 'recovery') {
          // Use verifyOtp for password reset flow
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: 'recovery'
          })
          
          if (error) {
            console.error('Token verification error:', error)
            setError('Reset link is invalid or expired. Please request a new one.')
            return
          }
        } else {
          // Check if there's already a valid session
          const { data: { session } } = await supabase.auth.getSession()
          if (!session) {
            setError('Reset link is invalid or expired. Please request a new one.')
            return
          }
        }

        // Validate if there's a recovery session
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          setError('Reset link is invalid or expired. Please request a new one.')
        }
      } catch (e: unknown) {
        console.error('Reset password validation error:', e)
        setError(getErrorMessage(e) ?? 'Failed to validate reset link.')
      }
    }
    run()
    // Only run once on first render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    // Validate password strength
    if (!isPasswordValid()) {
      setError('Password must meet all requirements: at least 8 characters, uppercase, lowercase, number, and special character')
      setIsLoading(false)
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        setError(getErrorMessage(error))
      } else {
        setSuccess('Password updated! Redirecting to sign in…')
        await supabase.auth.signOut()
        setTimeout(() => router.push('/login'), 1500)
      }
    } catch (e: unknown) {
      setError(getErrorMessage(e) ?? 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Set New Password</CardTitle>
          <CardDescription className="text-center">
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <PasswordInput
                id="password"
                name="password"
                value={password}
                onChange={(e) => {
                  const newPassword = e.target.value
                  setPassword(newPassword)
                  
                  // Show requirements if user starts typing
                  if (newPassword.length > 0) {
                    setShowPasswordRequirements(true)
                  } else {
                    // Hide requirements if password is empty
                    setShowPasswordRequirements(false)
                  }
                }}
                onFocus={() => {
                  // Show requirements on focus if password has content
                  if (password.length > 0) {
                    setShowPasswordRequirements(true)
                  }
                }}
                onBlur={() => {
                  // Hide requirements on blur if password is valid or empty
                  if (password === '' || isPasswordValid()) {
                    setShowPasswordRequirements(false)
                  }
                }}
                placeholder="Enter new password"
                required
                disabled={isLoading}
              />
              {showPasswordRequirements && (
                <div className="mt-2">
                  <PasswordRequirements 
                    password={password} 
                    showOnlyUnmet={true}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                disabled={isLoading}
              />
            </div>

            {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}
            {success && <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">{success}</div>}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Updating…' : 'Update Password'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <Button variant="link" onClick={() => router.push('/login')} className="p-0 h-auto">
              Back to Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
