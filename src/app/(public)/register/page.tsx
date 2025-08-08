'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { registerAction, signInWithGoogleAction } from '@/lib/auth-actions'

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setMessage(null)
    setIsError(false)

    try {
      const result = await registerAction(formData)
      if (!result.success) {
        setMessage(result.error || 'Registration failed')
        setIsError(true)
      } else if (result.error) {
        // Success with message (like email confirmation)
        setMessage(result.error)
        setIsError(false)
      }
    } catch (error) {
      setMessage('An unexpected error occurred')
      setIsError(true)
      console.error('Registration error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleGoogleSignUp() {
    setIsLoading(true)
    setMessage(null)
    setIsError(false)

    try {
      const result = await signInWithGoogleAction()
      if (!result.success) {
        setMessage(result.error || 'Google sign-up failed')
        setIsError(true)
        setIsLoading(false)
      } else if (result.url) {
        // Redirect to Google OAuth
        window.location.href = result.url
      }
    } catch (error) {
      setMessage('An unexpected error occurred')
      setIsError(true)
      console.error('Google sign-up error:', error)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Create Account</CardTitle>
          <CardDescription className="text-center">
            Enter your information to create a new account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Google Sign Up */}
          <div className="space-y-4">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignUp}
              disabled={isLoading}
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {isLoading ? 'Signing up...' : 'Continue with Google'}
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">
                  Or create account with email
                </span>
              </div>
            </div>
          </div>

          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">User Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Enter your username"
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Create a password (min. 6 characters)"
                required
                disabled={isLoading}
              />
            </div>
            {message && (
              <div className={`text-sm p-3 rounded-md ${
                isError 
                  ? 'text-red-600 bg-red-50' 
                  : 'text-green-600 bg-green-50'
              }`}>
                {message}
                {!isError && message.includes('email') && (
                  <div className="mt-2">
                    <Link 
                      href="/auth/verify-email" 
                      className="text-green-700 hover:underline font-medium"
                    >
                      Go to email verification →
                    </Link>
                  </div>
                )}
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link 
              href="/login" 
              className="text-blue-600 hover:underline font-medium"
            >
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
