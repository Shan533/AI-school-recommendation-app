'use client'

import { useState } from 'react'
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
import { CareerType } from '@/lib/types'

interface CareerCreationPopupProps {
  isOpen: boolean
  onClose: () => void
  onSave: (careerData: {
    name: string
    abbreviation: string
    description: string
    industry: string
    career_type: CareerType
  }) => Promise<void>
}

export function CareerCreationPopup({ isOpen, onClose, onSave }: CareerCreationPopupProps) {
  const [formData, setFormData] = useState({
    name: '',
    abbreviation: '',
    description: '',
    industry: '',
    career_type: 'Software' as CareerType
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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

      await onSave(formData)
      
      // Reset form
      setFormData({
        name: '',
        abbreviation: '',
        description: '',
        industry: '',
        career_type: 'Software'
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create career')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        name: '',
        abbreviation: '',
        description: '',
        industry: '',
        career_type: 'Software'
      })
      setError(null)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Career</DialogTitle>
          <DialogDescription>
            Create a new career path that can be assigned to program categories.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Career Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Software Engineer"
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="abbreviation">Abbreviation *</Label>
            <Input
              id="abbreviation"
              value={formData.abbreviation}
              onChange={(e) => setFormData(prev => ({ ...prev, abbreviation: e.target.value }))}
              placeholder="e.g., SWE"
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of this career path"
              disabled={isLoading}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              value={formData.industry}
              onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
              placeholder="e.g., Technology"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="career_type">Career Type</Label>
            <select
              id="career_type"
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Career'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
