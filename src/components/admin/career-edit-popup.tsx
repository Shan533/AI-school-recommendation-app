'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Trash2 } from 'lucide-react'
import { Career, CareerType } from '@/lib/types'

interface CareerEditPopupProps {
  career: Career | null
  isOpen: boolean
  onClose: () => void
  onSave: (careerData: {
    id: string
    name: string
    abbreviation: string
    description: string
    industry: string
    career_type: CareerType
  }) => Promise<void>
  onDelete: (careerId: string) => Promise<void>
}

export function CareerEditPopup({ 
  career, 
  isOpen, 
  onClose, 
  onSave, 
  onDelete 
}: CareerEditPopupProps) {
  const [formData, setFormData] = useState({
    name: '',
    abbreviation: '',
    description: '',
    industry: '',
    career_type: 'Software' as CareerType
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Update form data when career changes
  useEffect(() => {
    if (career) {
      setFormData({
        name: career.name,
        abbreviation: career.abbreviation,
        description: career.description || '',
        industry: career.industry || '',
        career_type: career.career_type || 'Software'
      })
    }
  }, [career])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!career) return

    setError(null)
    setIsLoading(true)

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        setError('Career name is required')
        return
      }
      if (!formData.abbreviation.trim()) {
        setError('Career abbreviation is required')
        return
      }

      await onSave({
        id: career.id,
        ...formData
      })
      
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update career')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!career) return

    setIsLoading(true)
    try {
      await onDelete(career.id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete career')
    } finally {
      setIsLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setError(null)
      setShowDeleteConfirm(false)
      onClose()
    }
  }

  if (!career) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Career</DialogTitle>
          <DialogDescription>
            Update career information or remove this career path.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="edit-name">Career Name *</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Software Engineer"
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-abbreviation">Abbreviation *</Label>
            <Input
              id="edit-abbreviation"
              value={formData.abbreviation}
              onChange={(e) => setFormData(prev => ({ ...prev, abbreviation: e.target.value }))}
              placeholder="e.g., SWE"
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of this career path"
              disabled={isLoading}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-industry">Industry</Label>
            <Input
              id="edit-industry"
              value={formData.industry}
              onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
              placeholder="e.g., Technology"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-career_type">Career Type</Label>
            <select
              id="edit-career_type"
              value={formData.career_type}
              onChange={(e) => setFormData(prev => ({ ...prev, career_type: e.target.value as CareerType }))}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
            >
              <option value="Software">Software</option>
              <option value="Data">Data</option>
              <option value="Design">Design</option>
              <option value="Management">Management</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <DialogFooter className="flex justify-between">
            <div>
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isLoading}
                className="mr-2"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </DialogFooter>
        </form>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background border rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-2">Delete Career</h3>
              <p className="text-muted-foreground mb-4">
                Are you sure you want to delete "{career.name}"? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isLoading}
                >
                  {isLoading ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
