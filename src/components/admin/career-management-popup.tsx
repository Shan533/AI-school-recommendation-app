'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, X, Search, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CareerCreationPopup } from '@/components/admin/career-creation-popup'
import { CareerEditPopup } from '@/components/admin/career-edit-popup'
import { 
  ProgramCategory, 
  Career,
  CareerType
} from '@/lib/types'

interface CareerManagementPopupProps {
  category: ProgramCategory | null
  isOpen: boolean
  onClose: () => void
  onAddCareer: (categoryId: string, careerId: string) => Promise<void>
  onRemoveCareer: (categoryId: string, careerId: string) => Promise<void>
  onCreateCareer: (careerData: Partial<Career>) => Promise<void>
}

export function CareerManagementPopup({
  category,
  isOpen,
  onClose,
  onAddCareer,
  onRemoveCareer,
  onCreateCareer
}: CareerManagementPopupProps) {
  const [careers, setCareers] = useState<Career[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [selectedCareer, setSelectedCareer] = useState<Career | null>(null)

  // Load careers when popup opens
  useEffect(() => {
    if (isOpen) {
      loadCareers()
    }
  }, [isOpen])

  const loadCareers = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/admin/careers')
      if (!response.ok) {
        throw new Error('Failed to load careers')
      }

      const data = await response.json()
      setCareers(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load careers')
    } finally {
      setIsLoading(false)
    }
  }

  // Filter careers based on search term
  const filteredCareers = useMemo(() => {
    if (!searchTerm) return careers
    
    return careers.filter(career =>
      career.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      career.abbreviation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (career.industry && career.industry.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }, [careers, searchTerm])

  // Get careers already assigned to this category
  const assignedCareers = useMemo(() => {
    if (!category?.career_paths) return []
    
    return careers.filter(career => 
      category.career_paths?.includes(career.name)
    )
  }, [careers, category?.career_paths])

  // Get available careers (not assigned to this category)
  const availableCareers = useMemo(() => {
    return filteredCareers.filter(career => 
      !category?.career_paths?.includes(career.name)
    )
  }, [filteredCareers, category?.career_paths])

  const handleAddCareer = async (careerId: string) => {
    if (!category) return
    
    try {
      setIsLoading(true)
      setError(null)
      await onAddCareer(category.id, careerId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add career')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveCareer = async (careerId: string) => {
    if (!category) return
    
    try {
      setIsLoading(true)
      setError(null)
      await onRemoveCareer(category.id, careerId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove career')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateCareer = async (careerData: {
    name: string
    abbreviation: string
    description: string
    industry: string
    career_type: CareerType
  }) => {
    if (!category) return

    try {
      setIsLoading(true)
      setError(null)
      await onCreateCareer(careerData)
      
      // Reload careers to include the new one
      await loadCareers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create career')
      throw err // Re-throw to let the popup handle the error
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditCareer = (career: Career) => {
    setSelectedCareer(career)
    setShowEditForm(true)
  }

  const handleUpdateCareer = async (careerData: {
    id: string
    name: string
    abbreviation: string
    description: string
    industry: string
    career_type: CareerType
  }) => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Update career via API
      const response = await fetch(`/api/admin/careers/${careerData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(careerData),
      })

      if (!response.ok) {
        throw new Error('Failed to update career')
      }

      // Reload careers to reflect changes
      await loadCareers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update career')
      throw err // Re-throw to let the popup handle the error
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteCareer = async (careerId: string) => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Delete career via API
      const response = await fetch(`/api/admin/careers/${careerId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete career')
      }

      // Reload careers to reflect changes
      await loadCareers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete career')
      throw err // Re-throw to let the popup handle the error
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setSearchTerm('')
    setShowCreateForm(false)
    setShowEditForm(false)
    setSelectedCareer(null)
    setError(null)
    onClose()
  }

  if (!category) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Manage Career Paths - {category.name}</DialogTitle>
          <DialogDescription>
            Add or remove career paths for this category. You can also create new careers.
          </DialogDescription>
        </DialogHeader>

        <div className="relative flex flex-col gap-4 overflow-hidden">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-sm text-muted-foreground">Processing...</span>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search careers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="space-y-4 overflow-hidden">
            {/* Assigned Careers */}
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="text-base">Assigned Career Paths</CardTitle>
              </CardHeader>
              <CardContent className="overflow-y-auto max-h-64">
                {assignedCareers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No career paths assigned
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {assignedCareers.map((career) => (
                      <div
                        key={career.id}
                        className="flex items-center gap-1 px-2 py-1 border rounded-md bg-muted/50 hover:bg-muted cursor-pointer"
                        onClick={() => handleEditCareer(career)}
                      >
                        <Badge variant="outline" title={career.name} className="text-xs">
                          {career.abbreviation}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveCareer(career.id)
                          }}
                          className="h-4 w-4 p-0 hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Available Careers */}
            <Card className="overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Available Careers</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCreateForm(true)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    New Career
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="overflow-y-auto max-h-64">
                {isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <span className="text-sm text-muted-foreground">Loading...</span>
                  </div>
                ) : availableCareers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {searchTerm ? 'No careers found matching your search.' : 'No available careers.'}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {availableCareers.map((career) => (
                      <div
                        key={career.id}
                        className="flex items-center gap-1 px-2 py-1 border rounded-md bg-muted/30 hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleAddCareer(career.id)}
                      >
                        <Badge variant="outline" title={career.name} className="text-xs">
                          {career.abbreviation}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditCareer(career)
                          }}
                          className="h-4 w-4 p-0 text-primary hover:text-primary"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Career Creation Popup */}
      <CareerCreationPopup
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSave={handleCreateCareer}
      />

      {/* Career Edit Popup */}
      <CareerEditPopup
        career={selectedCareer}
        isOpen={showEditForm}
        onClose={() => {
          setShowEditForm(false)
          setSelectedCareer(null)
        }}
        onSave={handleUpdateCareer}
        onDelete={handleDeleteCareer}
      />
    </Dialog>
  )
}
