'use client'

import { useState, useEffect } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export interface ProgramCategory {
  id: string
  name: string
  abbreviation: string
  description?: string
}

interface CategoryMultiSelectorProps {
  categories: ProgramCategory[]
  selectedIds: string[]
  primaryId?: string
  onChange: (selectedIds: string[], primaryId?: string) => void
  allowPrimarySelection?: boolean
  maxSelections?: number
  disabled?: boolean
  placeholder?: string
  className?: string
}

export function CategoryMultiSelector({
  categories,
  selectedIds,
  primaryId,
  onChange,
  allowPrimarySelection = true,
  maxSelections = 5,
  disabled = false,
  placeholder = "Select categories...",
  className
}: CategoryMultiSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Filter categories based on search term
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.abbreviation.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Get selected categories for display
  const selectedCategories = categories.filter(cat => selectedIds.includes(cat.id))

  const handleCategoryToggle = (categoryId: string) => {
    if (disabled) return

    let newSelectedIds: string[]
    let newPrimaryId = primaryId

    if (selectedIds.includes(categoryId)) {
      // Remove category
      newSelectedIds = selectedIds.filter(id => id !== categoryId)
      
      // If removing primary category, clear primary
      if (primaryId === categoryId) {
        newPrimaryId = undefined
      }
    } else {
      // Add category (check max selections)
      if (selectedIds.length >= maxSelections) {
        return // Don't add if at max
      }
      newSelectedIds = [...selectedIds, categoryId]
      
      // Auto-select as primary if it's the first category
      if (allowPrimarySelection && selectedIds.length === 0) {
        newPrimaryId = categoryId
      }
    }

    onChange(newSelectedIds, newPrimaryId)
  }

  const handlePrimaryChange = (categoryId: string) => {
    if (disabled || !allowPrimarySelection) return
    
    // Only allow setting primary if category is selected
    if (selectedIds.includes(categoryId)) {
      onChange(selectedIds, categoryId)
    }
  }

  const handleRemoveCategory = (categoryId: string) => {
    if (disabled) return
    
    const newSelectedIds = selectedIds.filter(id => id !== categoryId)
    const newPrimaryId = primaryId === categoryId ? undefined : primaryId
    
    onChange(newSelectedIds, newPrimaryId)
  }

  const isSelected = (categoryId: string) => selectedIds.includes(categoryId)
  const isPrimary = (categoryId: string) => primaryId === categoryId

  return (
    <div className={cn("space-y-3", className)}>
      {/* Selected Categories Display */}
      {selectedCategories.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">已选择的分类:</Label>
          <div className="flex flex-wrap gap-2">
            {selectedCategories.map(category => (
              <Badge
                key={category.id}
                variant={isPrimary(category.id) ? "default" : "secondary"}
                className="flex items-center gap-1 pr-1"
              >
                <span className="text-xs">
                  {isPrimary(category.id) && "★ "}
                  {category.abbreviation}: {category.name}
                </span>
                {!disabled && (
                  <button
                    onClick={() => handleRemoveCategory(category.id)}
                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                    aria-label={`Remove ${category.name} category`}
                    title={`Remove ${category.name} category`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Category Selection Popover */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            className="w-full justify-between"
            disabled={disabled || selectedIds.length >= maxSelections}
          >
            <span className="truncate">
              {selectedCategories.length === 0
                ? placeholder
                : `${selectedCategories.length} categories selected`}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <div className="space-y-2 p-2">
            {/* Search Input */}
            <Input
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8"
            />
            
            {/* Category List */}
            <div className="max-h-64 overflow-y-auto">
              {filteredCategories.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-4">
                  No categories found
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredCategories.map(category => (
                    <div
                      key={category.id}
                      className={cn(
                        "flex items-center space-x-2 p-2 rounded-md hover:bg-accent cursor-pointer",
                        isSelected(category.id) && "bg-accent"
                      )}
                      onClick={() => handleCategoryToggle(category.id)}
                    >
                      <div className="flex items-center space-x-2 flex-1">
                        <div
                          className={cn(
                            "w-4 h-4 border rounded flex items-center justify-center",
                            isSelected(category.id) && "bg-primary border-primary text-primary-foreground"
                          )}
                        >
                          {isSelected(category.id) && <Check className="h-3 w-3" />}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {category.abbreviation}
                            </span>
                            <span className="text-sm truncate">
                              {category.name}
                            </span>
                          </div>
                          {category.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {category.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Primary Category Selection */}
                      {allowPrimarySelection && isSelected(category.id) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePrimaryChange(category.id)
                          }}
                          className={cn(
                            "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                            isPrimary(category.id)
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-muted-foreground hover:border-primary"
                          )}
                        >
                          {isPrimary(category.id) && <Check className="h-3 w-3" />}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Max Selections Warning */}
            {selectedIds.length >= maxSelections && (
              <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                Maximum {maxSelections} categories selected
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Helper Text */}
      <div className="text-xs text-muted-foreground">
        {allowPrimarySelection && (
          <span>★ indicates primary category. </span>
        )}
        Select up to {maxSelections} categories.
      </div>
    </div>
  )
}
