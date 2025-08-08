'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

export default function SetupUsernamePage() {
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<{ id: string; email?: string; user_metadata?: { full_name?: string } } | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // Check if user already has a complete profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile && profile.name && profile.name !== user.email?.split('@')[0]) {
        // User already has a custom username, redirect to home
        router.push('/')
        return
      }

      setUser(user)
      // Pre-fill with current name or email prefix
      setUsername(profile?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || '')
    }

    checkUser()
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!username.trim()) {
      setError('Please enter a username')
      return
    }

    if (username.length < 2) {
      setError('Username must be at least 2 characters')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      
      // Update the user profile with the new username
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user!.id,
          name: username.trim(),
          is_admin: false,
        })

      if (updateError) {
        setError(updateError.message)
        return
      }

      // Redirect to home page
      router.push('/')
    } catch (error) {
      console.error('Username setup error:', error)
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">Loading...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            Welcome to AI School Recommend!
          </CardTitle>
          <CardDescription className="text-center">
            Please choose a username to complete your profile setup
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-blue-50 rounded-md">
            <div className="text-sm text-blue-800">
              <p><strong>Email:</strong> {user?.email}</p>
              <p className="mt-1 text-blue-600">
                You&apos;re signed in with Google. No password needed!
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Enter your preferred username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">
                This will be displayed as your name on the platform
              </p>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? 'Setting up...' : 'Complete Setup'}
            </Button>
          </form>

          <div className="mt-4 text-center text-xs text-gray-500">
            You can change your username later in your profile settings
          </div>
        </CardContent>
      </Card>
    </div>
  )
}