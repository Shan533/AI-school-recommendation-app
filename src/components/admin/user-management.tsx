'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { 
  UserPlus, 
  Mail, 
  Trash2, 
  Shield, 
  ShieldOff
} from 'lucide-react'

interface User {
  id: string
  name: string
  email: string | null
  is_admin: boolean
  created_at: string
}

interface UserManagementProps {
  initialUsers: User[]
  currentUserId: string
}

export default function UserManagement({ initialUsers, currentUserId }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [loading, setLoading] = useState(false)
  
  // Dialog states
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [isMagicLinkDialogOpen, setIsMagicLinkDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  
  // Form states
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteAsAdmin, setInviteAsAdmin] = useState(false)
  const [magicLinkEmail, setMagicLinkEmail] = useState('')
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  
  // Error and success states
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const clearMessages = () => {
    setError('')
    setSuccess('')
  }

  const handleToggleAdmin = async (userId: string, isCurrentlyAdmin: boolean) => {
    if (userId === currentUserId) {
      setError('You cannot change your own admin status')
      return
    }

    setLoading(true)
    clearMessages()

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_admin: !isCurrentlyAdmin
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update user')
      }

      // Update local state
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, is_admin: !isCurrentlyAdmin }
          : user
      ))

      setSuccess(`User ${!isCurrentlyAdmin ? 'promoted to' : 'removed from'} admin successfully`)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update user')
    } finally {
      setLoading(false)
    }
  }

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    setLoading(true)
    clearMessages()

    try {
      const response = await fetch('/api/admin/users/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          isAdminUser: inviteAsAdmin
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to invite user')
      }

      setSuccess('User invitation sent successfully')
      setInviteEmail('')
      setInviteAsAdmin(false)
      setIsInviteDialogOpen(false)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to invite user')
    } finally {
      setLoading(false)
    }
  }

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!magicLinkEmail.trim()) return

    setLoading(true)
    clearMessages()

    try {
      const response = await fetch('/api/admin/users/magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: magicLinkEmail.trim()
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to send magic link')
      }

      setSuccess('Magic link sent successfully')
      setMagicLinkEmail('')
      setIsMagicLinkDialogOpen(false)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to send magic link')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return

    setLoading(true)
    clearMessages()

    try {
      const response = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete user')
      }

      // Remove user from local state
      setUsers(users.filter(user => user.id !== userToDelete.id))
      setSuccess(`User ${userToDelete.name} deleted successfully`)
      setUserToDelete(null)
      setIsDeleteDialogOpen(false)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete user')
    } finally {
      setLoading(false)
    }
  }

  const openDeleteDialog = (user: User) => {
    if (user.id === currentUserId) {
      setError('You cannot delete your own account')
      return
    }
    setUserToDelete(user)
    setIsDeleteDialogOpen(true)
  }

  return (
    <>
      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite New User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleInviteUser} className="space-y-4">
              <div>
                <Label htmlFor="invite-email">Email Address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="invite-admin"
                  checked={inviteAsAdmin}
                  onChange={(e) => setInviteAsAdmin(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="invite-admin">Invite as admin</Label>
              </div>
              <div className="flex gap-2 justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsInviteDialogOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Invitation'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isMagicLinkDialogOpen} onOpenChange={setIsMagicLinkDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Mail className="mr-2 h-4 w-4" />
              Send Magic Link
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Magic Link</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSendMagicLink} className="space-y-4">
              <div>
                <Label htmlFor="magic-email">Email Address</Label>
                <Input
                  id="magic-email"
                  type="email"
                  value={magicLinkEmail}
                  onChange={(e) => setMagicLinkEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                />
                <p className="text-sm text-gray-600 mt-1">
                  Send a magic link to an existing user for passwordless login
                </p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsMagicLinkDialogOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Magic Link'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>All Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-semibold">{user.name}</h3>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <p className="text-xs text-gray-500">
                    Joined: {new Date(user.created_at).toLocaleDateString()}
                  </p>
                  {user.id === currentUserId && (
                    <Badge variant="outline" className="mt-1">You</Badge>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {user.is_admin ? (
                    <Badge variant="destructive">Admin</Badge>
                  ) : (
                    <Badge variant="secondary">User</Badge>
                  )}
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                      variant={user.is_admin ? "outline" : "default"}
                      size="sm"
                      disabled={loading || user.id === currentUserId}
                      title={user.id === currentUserId ? "Cannot change your own admin status" : ""}
                    >
                      {user.is_admin ? (
                        <>
                          <ShieldOff className="mr-1 h-3 w-3" />
                          Remove Admin
                        </>
                      ) : (
                        <>
                          <Shield className="mr-1 h-3 w-3" />
                          Make Admin
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={() => openDeleteDialog(user)}
                      variant="destructive"
                      size="sm"
                      disabled={loading || user.id === currentUserId}
                      title={user.id === currentUserId ? "Cannot delete your own account" : ""}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {users.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No users found
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm User Deletion</DialogTitle>
          </DialogHeader>
          {userToDelete && (
            <div className="space-y-4">
              <p>
                Are you sure you want to delete user <strong>{userToDelete.name}</strong>?
              </p>
              <p className="text-sm text-gray-600">
                This action cannot be undone. The user will be permanently removed from the system, 
                including all their data and reviews.
              </p>
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setIsDeleteDialogOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteUser}
                  disabled={loading}
                >
                  {loading ? 'Deleting...' : 'Delete User'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
