'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { resendEmailVerification } from '@/lib/auth-actions'
import Link from 'next/link'

export default function VerifyEmailPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)

  async function handleResendVerification() {
    if (!email) {
      setMessage('Please enter your email address')
      setIsError(true)
      return
    }

    setIsLoading(true)
    setMessage(null)
    setIsError(false)

    try {
      const result = await resendEmailVerification(email)
      setMessage(result.error || 'Verification email sent!')
      setIsError(!result.success)
    } catch (error) {
      setMessage('An unexpected error occurred')
      setIsError(true)
      console.error('Resend verification error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            Verify Your Email
          </CardTitle>
          <CardDescription className="text-center">
            We sent you a verification email. Please check your inbox and click the verification link.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
            <p><strong>What to do next:</strong></p>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Check your email inbox (including spam folder)</li>
              <li>Click the verification link in the email</li>
              <li>Return here to sign in</li>
            </ol>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Didn&apos;t receive the email?</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
              <Button 
                onClick={handleResendVerification}
                disabled={isLoading}
                variant="outline"
              >
                {isLoading ? 'Sending...' : 'Resend'}
              </Button>
            </div>
          </div>

          {message && (
            <div className={`text-sm p-3 rounded-md ${
              isError 
                ? 'text-red-600 bg-red-50' 
                : 'text-green-600 bg-green-50'
            }`}>
              {message}
            </div>
          )}

          <div className="flex gap-2">
            <Button asChild className="flex-1">
              <Link href="/login">Back to Login</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/register">Sign Up</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}