'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, Download, Upload, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { BulkAssignmentPanel } from './bulk-assignment-panel'
import { CategoryMultiSelector, ProgramCategory } from './category-multi-selector'
import { CareerPathMultiSelector } from './career-path-multi-selector'
import { 
  EnhancedProgram, 
  BulkAssignmentData, 
  BulkAssignmentResult,
  ProgramCategoryInfo,
  ProgramCareerInfo,
  ApplicationDifficulty 
} from '@/lib/types/schema-enhancements'

interface ProgramCategoriesAssignmentPageProps {
  className?: string
}

export function ProgramCategoriesAssignmentPage({ className }: ProgramCategoriesAssignmentPageProps) {
  const [programs, setPrograms] = useState<EnhancedProgram[]>([])
  const [categories, setCategories] = useState<ProgramCategory[]>([])
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [filterSchool, setFilterSchool] = useState<string>('')
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load initial data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Load programs and categories in parallel
      const [programsResponse, categoriesResponse] = await Promise.all([
        fetch('/api/admin/programs?include_categories=true'),
        fetch('/api/admin/categories')
      ])

      if (!programsResponse.ok || !categoriesResponse.ok) {
        throw new Error('Failed to load data')
      }

      const [programsData, categoriesData] = await Promise.all([
        programsResponse.json(),
        categoriesResponse.json()
      ])

      setPrograms(programsData.programs || [])
      setCategories(categoriesData.categories || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBulkAssignment = async (assignmentData: BulkAssignmentData): Promise<void> => {
    try {
      const response = await fetch('/api/admin/programs/bulk-assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assignmentData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to assign categories')
      }

      const result: BulkAssignmentResult = await response.json()
      
      if (!result.success) {
        throw new Error(result.message || 'Assignment failed')
      }

      // Refresh data and clear selection
      await loadData()
      setSelectedPrograms([])
      
      // Show success message
      alert(`Successfully updated ${result.updatedCount} programs`)
    } catch (err) {
      console.error('Bulk assignment failed:', err)
      throw err // Re-throw to let BulkAssignmentPanel handle the error
    }
  }

  const handleSelectAll = () => {
    if (selectedPrograms.length === filteredPrograms.length) {
      setSelectedPrograms([])
    } else {
      setSelectedPrograms(filteredPrograms.map(p => p.id))
    }
  }

  const handleSelectProgram = (programId: string) => {
    setSelectedPrograms(prev => 
      prev.includes(programId) 
        ? prev.filter(id => id !== programId)
        : [...prev, programId]
    )
  }

  // Filter programs based on search and filters
  const filteredPrograms = programs.filter(program => {
    const matchesSearch = !searchTerm || 
      program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.school_name?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = !filterCategory || 
      program.category_ids?.includes(filterCategory)

    const matchesSchool = !filterSchool || 
      program.school_name?.toLowerCase().includes(filterSchool.toLowerCase())

    // Filter for unassigned programs only
    const isUnassigned = !program.category_ids || program.category_ids.length === 0
    const matchesUnassignedFilter = !showUnassignedOnly || isUnassigned

    return matchesSearch && matchesCategory && matchesSchool && matchesUnassignedFilter
  })

  // Get unique schools for filter
  const schools = [...new Set(programs.map(p => p.school_name).filter(Boolean))].sort()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={loadData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={className}>
      {/* Search and Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filters
          </CardTitle>
          <CardDescription>
            Find programs to assign categories and career paths
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Programs</label>
              <Input
                placeholder="Search by program or school name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Filter by Category</label>
              <select
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.abbreviation}: {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* School Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Filter by School</label>
              <select
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                value={filterSchool}
                onChange={(e) => setFilterSchool(e.target.value)}
              >
                <option value="">All Schools</option>
                {schools.map(school => (
                  <option key={school} value={school}>
                    {school}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Unassigned Filter */}
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="unassigned-only"
              checked={showUnassignedOnly}
              onCheckedChange={(checked) => setShowUnassignedOnly(checked as boolean)}
            />
            <label 
              htmlFor="unassigned-only" 
              className="text-sm font-medium cursor-pointer"
            >
              Show only programs without categories assigned
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {showUnassignedOnly ? (
                <>
                  Showing {filteredPrograms.length} unassigned programs out of {programs.length} total
                  {programs.length > 0 && (
                    <span className="ml-2 text-orange-600">
                      ({Math.round((filteredPrograms.length / programs.length) * 100)}% unassigned)
                    </span>
                  )}
                </>
              ) : (
                `Showing ${filteredPrograms.length} of ${programs.length} programs`
              )}
            </div>
            <Button onClick={loadData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Programs List */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Programs</span>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedPrograms.length === filteredPrograms.length && filteredPrograms.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm font-medium">
                Select All ({selectedPrograms.length}/{filteredPrograms.length})
              </span>
            </div>
          </CardTitle>
          <CardDescription>
            Select programs to assign categories and career paths
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredPrograms.map(program => {
              const isUnassigned = !program.category_ids || program.category_ids.length === 0
              
              return (
                <div
                  key={program.id}
                  className={`flex items-center space-x-4 p-3 border rounded-lg hover:bg-accent ${
                    isUnassigned ? 'border-orange-200 bg-orange-50/50' : ''
                  }`}
                >
                  <Checkbox
                    checked={selectedPrograms.includes(program.id)}
                    onCheckedChange={() => handleSelectProgram(program.id)}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">{program.name}</h4>
                      {isUnassigned && (
                        <Badge variant="destructive" className="text-xs">
                          No Categories
                        </Badge>
                      )}
                      {program.difficulty_level && (
                        <Badge variant="outline" className="text-xs">
                          {program.difficulty_level}
                        </Badge>
                      )}
                    </div>
                  
                  <p className="text-sm text-muted-foreground truncate">
                    {program.school_name}
                  </p>
                  
                  {/* Categories */}
                  {program.categories && program.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      <span className="text-xs text-muted-foreground mr-1">Categories:</span>
                      {program.categories.map(category => (
                        <Badge 
                          key={category.id} 
                          variant="secondary" 
                          className="text-xs"
                        >
                          {category.abbreviation}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  {/* Career Paths */}
                  {program.career_paths && program.career_paths.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      <span className="text-xs text-muted-foreground mr-1">Careers:</span>
                      {program.career_paths.map((careerPath, index) => (
                        <Badge 
                          key={index} 
                          variant="outline" 
                          className="text-xs"
                        >
                          {careerPath}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              )
            })}
            
            {filteredPrograms.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No programs found matching your criteria
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Assignment Panel */}
      {selectedPrograms.length > 0 && (
        <BulkAssignmentPanel
          selectedPrograms={filteredPrograms.filter(p => selectedPrograms.includes(p.id))}
          categories={categories}
          onBulkAssign={handleBulkAssignment}
          className="mb-6"
        />
      )}
    </div>
  )
}
