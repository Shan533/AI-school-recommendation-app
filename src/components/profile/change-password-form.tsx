'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PasswordInput } from '@/components/ui/password-input'
import { PasswordRequirements } from '@/components/ui/password-requirements'
import { changePasswordAction } from '@/lib/auth-actions'

interface ChangePasswordFormProps {
  onPasswordChange?: () => void
}

export default function ChangePasswordForm({ onPasswordChange }: ChangePasswordFormProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false)

  // Check if new password meets all requirements
  const isNewPasswordValid = () => {
    return newPassword.length >= 8 && 
           /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) && 
           /[0-9]/.test(newPassword) && 
           /[^A-Za-z0-9]/.test(newPassword)
  }

  const handleEdit = () => {
    setIsEditing(true)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setError(null)
    setSuccess(null)
    setShowPasswordRequirements(false)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setError(null)
    setSuccess(null)
    setShowPasswordRequirements(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    // Validate current password is provided
    if (!currentPassword.trim()) {
      setError('Current password is required')
      setIsLoading(false)
      return
    }

    // Validate new password strength
    if (!isNewPasswordValid()) {
      setError('New password must meet all requirements: at least 8 characters, uppercase, lowercase, number, and special character')
      setIsLoading(false)
      return
    }

    // Validate password match
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      setIsLoading(false)
      return
    }

    // Validate new password is different from current
    if (currentPassword === newPassword) {
      setError('New password must be different from current password')
      setIsLoading(false)
      return
    }

    try {
      const formData = new FormData()
      formData.append('currentPassword', currentPassword)
      formData.append('newPassword', newPassword)

      const result = await changePasswordAction(formData)
      
      if (result.success) {
        setSuccess('Password updated successfully!')
        setIsEditing(false)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setShowPasswordRequirements(false)
        
        if (onPasswordChange) {
          onPasswordChange()
        }
      } else {
        setError(result.error || 'Failed to update password')
      }
    } catch (error) {
      setError('An unexpected error occurred')
      console.error('Password change error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Password</h3>
            <p className="text-sm text-gray-600">Update your account password</p>
          </div>
          <Button onClick={handleEdit} variant="outline" size="sm">
            Change Password
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <PasswordInput
              id="currentPassword"
              name="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <PasswordInput
              id="newPassword"
              name="newPassword"
              value={newPassword}
              onChange={(e) => {
                const password = e.target.value
                setNewPassword(password)
                
                // Show requirements if user starts typing
                if (password.length > 0) {
                  setShowPasswordRequirements(true)
                } else {
                  // Hide requirements if password is empty
                  setShowPasswordRequirements(false)
                }
              }}
              onFocus={() => {
                // Show requirements on focus if password has content
                if (newPassword.length > 0) {
                  setShowPasswordRequirements(true)
                }
              }}
              onBlur={() => {
                // Hide requirements on blur if password is valid or empty
                if (newPassword === '' || isNewPasswordValid()) {
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
                  password={newPassword} 
                  showOnlyUnmet={true}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
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
              disabled={isLoading || !isNewPasswordValid() || !currentPassword || !confirmPassword}
              className="flex-1"
            >
              {isLoading ? 'Updating...' : 'Update Password'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
