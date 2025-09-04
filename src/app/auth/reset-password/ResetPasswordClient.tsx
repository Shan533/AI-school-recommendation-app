'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PasswordInput } from '@/components/ui/password-input'
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

  // Lazy initialization to avoid triggering env validation during module import
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    // 1) Handle code/access_token from email link to establish session
    //    - New version recommends code (?code=...)
    //    - Old version might have access_token/refresh_token in hash
    const run = async () => {
      try {
        const code = searchParams?.get('code')
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
        } else if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
          const hash = new URLSearchParams(window.location.hash.substring(1))
          const access_token = hash.get('access_token')
          const refresh_token = hash.get('refresh_token')
          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({ access_token, refresh_token })
            if (error) throw error
          }
        }

        // 2) Validate if there's already a recovery session (recovery type)
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          setError('Reset link is invalid or expired. Please request a new one.')
        }
      } catch (e: unknown) {
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

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
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
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                required
                disabled={isLoading}
              />
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
