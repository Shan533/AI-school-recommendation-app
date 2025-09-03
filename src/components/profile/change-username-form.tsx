'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { updateUsernameAction } from '@/lib/auth-actions'
import { Edit, Save, X } from 'lucide-react'

interface ChangeUsernameFormProps {
  currentUsername: string
  onUsernameChange?: (newUsername: string) => void
}

export default function ChangeUsernameForm({ currentUsername, onUsernameChange }: ChangeUsernameFormProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [newUsername, setNewUsername] = useState(currentUsername)

  const handleEdit = () => {
    setIsEditing(true)
    setNewUsername(currentUsername)
    setError(null)
    setSuccess(null)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setNewUsername(currentUsername)
    setError(null)
    setSuccess(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    // Check if username is same as current
    if (newUsername === currentUsername) {
      setError('New username must be different from current username')
      setIsLoading(false)
      return
    }

    // Validate username length
    if (newUsername.length < 3) {
      setError('Username must be at least 3 characters')
      setIsLoading(false)
      return
    }

    // Validate username format
    if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) {
      setError('Username can only contain letters, numbers, and underscores')
      setIsLoading(false)
      return
    }

    try {
      const formData = new FormData()
      formData.append('username', newUsername)

      const result = await updateUsernameAction(formData)
      
      if (result.success) {
        setSuccess(result.error || 'Username updated successfully!')
        if (onUsernameChange) {
          onUsernameChange(newUsername)
        }
        setIsEditing(false)
      } else {
        setError(result.error || 'Failed to update username')
      }
    } catch (error) {
      setError('An unexpected error occurred')
      console.error('Username update error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Change Username</CardTitle>
          <CardDescription>
            Enter a new username. Username must be at least 3 characters and can only contain letters, numbers, and underscores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">New Username</Label>
              <Input
                id="username"
                name="username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Enter new username"
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
            
            <div className="flex gap-2">
              <Button 
                type="submit" 
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isLoading ? 'Saving...' : 'Save'}
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <span className="text-lg font-medium">{currentUsername}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleEdit}
          className="h-8 w-8 p-0"
          title="Edit username"
        >
          <Edit className="h-4 w-4" />
        </Button>
      </div>
      
      {success && (
        <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
          {success}
        </div>
      )}
    </div>
  )
}
