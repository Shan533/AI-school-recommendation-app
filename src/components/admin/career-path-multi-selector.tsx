'use client'

import { useState, useMemo } from 'react'
import { Plus, X, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface Career {
  id: string
  name: string
  abbreviation: string
}

interface CareerPathMultiSelectorProps {
  availableCareers: Career[]
  selectedPaths: string[]
  customPath: string
  onCustomPathChange: (path: string) => void
  onAddCustomPath: () => void
  onRemovePath: (path: string) => void
  onTogglePath: (path: string) => void
  allowCustomPaths?: boolean
  maxPaths?: number
  disabled?: boolean
  placeholder?: string
  className?: string
}

export function CareerPathMultiSelector({
  availableCareers,
  selectedPaths,
  customPath,
  onCustomPathChange,
  onAddCustomPath,
  onRemovePath,
  onTogglePath,
  allowCustomPaths = true,
  maxPaths = 999,
  disabled = false,
  placeholder = "Add custom career path...",
  className
}: CareerPathMultiSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)

  // Filter available careers based on search term
  const filteredCareers = useMemo(() => {
    if (!availableCareers) return []
    if (!searchTerm) return availableCareers
    
    return availableCareers.filter(career =>
      career.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      career.abbreviation.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [availableCareers, searchTerm])

  // Filter out already selected career paths from available options
  const unselectedCareers = useMemo(() => {
    if (!filteredCareers) return []
    return filteredCareers.filter(career => !selectedPaths.includes(career.name))
  }, [filteredCareers, selectedPaths])

  const handleAddCustomPath = () => {
    const trimmedPath = customPath.trim()
    if (trimmedPath && !selectedPaths.includes(trimmedPath) && selectedPaths.length < maxPaths) {
      onAddCustomPath()
      onCustomPathChange('')
      setShowCustomInput(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddCustomPath()
    } else if (e.key === 'Escape') {
      setShowCustomInput(false)
      onCustomPathChange('')
    }
  }

  const canAddMore = selectedPaths.length < maxPaths
  const canAddCustom = allowCustomPaths && canAddMore && customPath.trim() && !selectedPaths.includes(customPath.trim())

  return (
    <div className={cn("space-y-4", className)}>
      {/* Selected Paths Display */}
      {selectedPaths.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">已选择的职业路径:</Label>
          <div className="flex flex-wrap gap-2">
            {selectedPaths.map(path => (
              <Badge
                key={path}
                variant="secondary"
                className="flex items-center gap-1 pr-1"
              >
                <span className="text-sm">{path}</span>
                {!disabled && (
                  <button
                    onClick={() => onRemovePath(path)}
                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Search and Available Paths */}
      <div className="space-y-3">
        <div className="space-y-2">
          <Label className="text-sm font-medium">从分类中选择:</Label>
          
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search career paths..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              disabled={disabled}
            />
          </div>

          {/* Available Careers Grid */}
          {unselectedCareers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-2">
              {unselectedCareers.map(career => (
                <label
                  key={career.id}
                  className={cn(
                    "flex items-center space-x-2 p-2 rounded hover:bg-accent cursor-pointer",
                    !canAddMore && "opacity-50 cursor-not-allowed"
                  )}
                  title={career.name} // Show full name on hover
                >
                  <input
                    type="checkbox"
                    checked={false}
                    onChange={() => onTogglePath(career.name)}
                    disabled={disabled || !canAddMore}
                    className="rounded"
                  />
                  <span className="text-sm flex-1">{career.abbreviation}</span>
                </label>
              ))}
            </div>
          ) : (
            <div className="text-center text-sm text-muted-foreground py-4 border rounded-md">
              {searchTerm ? 'No matching careers found' : 'No available careers'}
            </div>
          )}
        </div>

        {/* Custom Path Input */}
        {allowCustomPaths && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">添加自定义路径:</Label>
              {!showCustomInput && canAddMore && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCustomInput(true)}
                  disabled={disabled}
                  className="h-7"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Custom
                </Button>
              )}
            </div>

            {showCustomInput && (
              <div className="space-y-2">
                <Input
                  placeholder={placeholder}
                  value={customPath}
                  onChange={(e) => onCustomPathChange(e.target.value)}
                  onKeyDown={handleKeyPress}
                  disabled={disabled}
                  className="w-full"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddCustomPath}
                    disabled={disabled || !canAddCustom}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Path
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowCustomInput(false)
                      onCustomPathChange('')
                    }}
                    disabled={disabled}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Helper Text and Warnings */}
      <div className="space-y-1">
        {!canAddMore && (
          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
            Maximum {maxPaths} career paths selected
          </div>
        )}
        
        <div className="text-xs text-muted-foreground">
          {selectedPaths.length} of {maxPaths} paths selected.
          {allowCustomPaths && ' You can add custom career paths.'}
        </div>
      </div>
    </div>
  )
}
