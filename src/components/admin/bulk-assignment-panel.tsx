'use client'

import { useState, useEffect } from 'react'
import { Users, CheckCircle, AlertCircle, Eye, Undo2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { CategoryMultiSelector, ProgramCategory } from './category-multi-selector'
import { CareerPathMultiSelector } from './career-path-multi-selector'
import { cn } from '@/lib/utils'

export interface Program {
  id: string
  name: string
  school_name?: string
  category_ids?: string[]
  primary_category_id?: string
  career_paths?: string[]
}

interface BulkAssignmentPanelProps {
  selectedPrograms: Program[]
  categories: ProgramCategory[]
  onBulkAssign: (assignments: BulkAssignmentData) => Promise<void>
  onPreview?: (assignments: BulkAssignmentData) => void
  disabled?: boolean
  className?: string
}

export interface BulkAssignmentData {
  programIds: string[]
  categoryIds: string[]
  primaryCategoryId?: string
  careerPaths: string[]
}

export function BulkAssignmentPanel({
  selectedPrograms,
  categories,
  onBulkAssign,
  onPreview,
  disabled = false,
  className
}: BulkAssignmentPanelProps) {
  const [assignmentData, setAssignmentData] = useState<BulkAssignmentData>({
    programIds: [],
    categoryIds: [],
    careerPaths: []
  })
  
  const [customCareerPath, setCustomCareerPath] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Update assignment data when selected programs change
  useEffect(() => {
    setAssignmentData(prev => ({
      ...prev,
      programIds: selectedPrograms.map(p => p.id)
    }))
  }, [selectedPrograms])

  // Get available career paths from database
  const [availableCareers, setAvailableCareers] = useState<Array<{ id: string; name: string; abbreviation: string }>>([])
  const [categoryCareerMapping, setCategoryCareerMapping] = useState<Record<string, Array<{ id: string; name: string; abbreviation: string }>>>({})
  
  // Fetch career paths and category-career mappings from database
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [careersResponse, mappingResponse] = await Promise.all([
          fetch('/api/admin/careers'),
          fetch('/api/admin/category-career-mapping')
        ])
        
        if (careersResponse.ok) {
          const careersData = await careersResponse.json()
          setAvailableCareers(careersData.map((career: { id: string; name: string; abbreviation: string }) => ({
            id: career.id,
            name: career.name,
            abbreviation: career.abbreviation
          })))
        }
        
        if (mappingResponse.ok) {
          const mappingData = await mappingResponse.json()
          setCategoryCareerMapping(mappingData.mappings)
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      }
    }
    
    fetchData()
  }, [])

  const handleCategoryChange = (categoryIds: string[], primaryCategoryId?: string) => {
    // Auto-select default career paths for selected categories
    const defaultCareerPaths: string[] = []
    
    categoryIds.forEach(categoryId => {
      const careers = categoryCareerMapping[categoryId] || []
      careers.forEach(career => {
        if (!defaultCareerPaths.includes(career.name)) {
          defaultCareerPaths.push(career.name)
        }
      })
    })
    
    // Keep any manually selected career paths that are not from default mappings
    const currentCareerPaths = assignmentData.careerPaths || []
    const manuallySelectedPaths = currentCareerPaths.filter(path => {
      // Check if this path is from any of the currently selected categories
      return !categoryIds.some(categoryId => {
        const careers = categoryCareerMapping[categoryId] || []
        return careers.some(career => career.name === path)
      })
    })
    
    setAssignmentData(prev => ({
      ...prev,
      categoryIds,
      primaryCategoryId,
      careerPaths: [...defaultCareerPaths, ...manuallySelectedPaths]
    }))
  }


  const handleAddCustomCareerPath = () => {
    const trimmedPath = customCareerPath.trim()
    if (trimmedPath && !assignmentData.careerPaths.includes(trimmedPath)) {
      setAssignmentData(prev => ({
        ...prev,
        careerPaths: [...prev.careerPaths, trimmedPath]
      }))
      setCustomCareerPath('')
    }
  }

  const handleRemoveCareerPath = (path: string) => {
    setAssignmentData(prev => ({
      ...prev,
      careerPaths: prev.careerPaths.filter(p => p !== path)
    }))
  }

  const handleClearAllCareerPaths = () => {
    setAssignmentData(prev => ({
      ...prev,
      careerPaths: []
    }))
  }

  const handleToggleCareerPath = (path: string) => {
    setAssignmentData(prev => ({
      ...prev,
      careerPaths: prev.careerPaths.includes(path)
        ? prev.careerPaths.filter(p => p !== path)
        : [...prev.careerPaths, path]
    }))
  }

  const handlePreview = () => {
    if (onPreview) {
      onPreview(assignmentData)
    }
    setShowPreview(true)
  }

  const handleApply = async () => {
    setIsLoading(true)
    try {
      await onBulkAssign(assignmentData)
      // Reset form after successful assignment
      setAssignmentData({
        programIds: selectedPrograms.map(p => p.id),
        categoryIds: [],
        careerPaths: []
      })
      setCustomCareerPath('')
      setShowPreview(false)
    } catch (error) {
      console.error('Bulk assignment failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setAssignmentData({
      programIds: selectedPrograms.map(p => p.id),
      categoryIds: [],
      careerPaths: []
    })
    setCustomCareerPath('')
    setShowPreview(false)
  }

  const canApply = assignmentData.categoryIds.length > 0 && selectedPrograms.length > 0
  const hasChanges = assignmentData.categoryIds.length > 0 || assignmentData.careerPaths.length > 0

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Bulk Assignment
        </CardTitle>
        <CardDescription>
          Assign categories and career paths to {selectedPrograms.length} selected programs
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Selected Programs Summary */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Selected Programs:</h4>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {selectedPrograms.map(program => (
              <div key={program.id} className="flex items-center justify-between text-sm">
                <span className="truncate">{program.name}</span>
                {program.school_name && (
                  <Badge variant="outline" className="text-xs">
                    {program.school_name}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Assignment Forms */}
        <div className="space-y-6">
          {/* Category Selection */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Categories</h4>
            <CategoryMultiSelector
              categories={categories}
              selectedIds={assignmentData.categoryIds}
              primaryId={assignmentData.primaryCategoryId}
              onChange={handleCategoryChange}
              disabled={disabled || isLoading}
              maxSelections={5}
            />
          </div>

          {/* Career Paths Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium">Career Paths</h4>
                {assignmentData.careerPaths.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAllCareerPaths}
                    disabled={disabled || isLoading}
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>
              {assignmentData.categoryIds.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  Auto-selected from categories
                </span>
              )}
            </div>
            <CareerPathMultiSelector
              availableCareers={availableCareers}
              selectedPaths={assignmentData.careerPaths}
              customPath={customCareerPath}
              onCustomPathChange={setCustomCareerPath}
              onAddCustomPath={handleAddCustomCareerPath}
              onRemovePath={handleRemoveCareerPath}
              onTogglePath={handleToggleCareerPath}
              disabled={disabled || isLoading}
              maxPaths={999}
            />
          </div>
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handlePreview}
              disabled={disabled || isLoading || !hasChanges}
              size="sm"
            >
              <Eye className="h-4 w-4 mr-1" />
              Preview
            </Button>
            
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={disabled || isLoading || !hasChanges}
              size="sm"
            >
              <Undo2 className="h-4 w-4 mr-1" />
              Reset
            </Button>
          </div>

          <Button
            onClick={handleApply}
            disabled={disabled || isLoading || !canApply}
            size="sm"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Applying...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-1" />
                Apply to {selectedPrograms.length} Programs
              </>
            )}
          </Button>
        </div>

        {/* Validation Messages */}
        {assignmentData.categoryIds.length === 0 && hasChanges && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please select at least one category to apply assignments.
            </AlertDescription>
          </Alert>
        )}

        {selectedPrograms.length === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No programs selected. Please select programs to assign categories and career paths.
            </AlertDescription>
          </Alert>
        )}

        {/* Preview Summary */}
        {showPreview && hasChanges && (
          <div className="space-y-3 p-4 bg-muted rounded-lg">
            <h4 className="text-sm font-medium">Preview Changes:</h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Categories:</span>{' '}
                {assignmentData.categoryIds.length > 0 ? (
                  <span>
                    {assignmentData.categoryIds.map(id => {
                      const category = categories.find(c => c.id === id)
                      return category?.abbreviation || id
                    }).join(', ')}
                    {assignmentData.primaryCategoryId && (
                      <span className="text-primary ml-1">
                        (★ {categories.find(c => c.id === assignmentData.primaryCategoryId)?.abbreviation} as primary)
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="text-muted-foreground">None selected</span>
                )}
              </div>
              <div>
                <span className="font-medium">Career Paths:</span>{' '}
                {assignmentData.careerPaths.length > 0 ? (
                  <span>{assignmentData.careerPaths.join(', ')}</span>
                ) : (
                  <span className="text-muted-foreground">None selected</span>
                )}
              </div>
              <div>
                <span className="font-medium">Programs:</span>{' '}
                <span>{assignmentData.programIds.length} programs will be updated</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
