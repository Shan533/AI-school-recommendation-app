'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { updateEmailAction } from '@/lib/auth-actions'

interface UpdateEmailFormProps {
  currentEmail: string
}

export default function UpdateEmailForm({ currentEmail }: UpdateEmailFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    const newEmail = formData.get('email') as string

    // Check if new email is different from current
    if (newEmail === currentEmail) {
      setError('New email must be different from current email')
      setIsLoading(false)
      return
    }

    try {
      const result = await updateEmailAction(formData)
      if (result.success) {
        setSuccess(result.error || 'Email update initiated! Check your new email for confirmation.')
      } else {
        setError(result.error || 'Failed to update email')
      }
    } catch (error) {
      setError('An unexpected error occurred')
      console.error('Email update error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update Email Address</CardTitle>
        <CardDescription>
          Change your email address. You&apos;ll need to confirm the new email before the change takes effect.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600">
              <strong>Current email:</strong> {currentEmail}
            </p>
          </div>
          
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">New Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter new email address"
                required
                disabled={isLoading}
              />
            </div>
            
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}
            
            {success && (
              <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
                {success}
              </div>
            )}
            
            <Button 
              type="submit" 
              disabled={isLoading}
            >
              {isLoading ? 'Updating...' : 'Update Email'}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}
