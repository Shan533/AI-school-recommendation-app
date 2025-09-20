'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit, Trash2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CareerManagementPopup } from '@/components/admin/career-management-popup'
import { 
  ProgramCategory, 
  CategoryManagementForm,
  Career,
  CareerType
} from '@/lib/types'

interface CategoryManagementProps {
  className?: string
}

export function CategoryManagement({ className }: CategoryManagementProps) {
  const [categories, setCategories] = useState<ProgramCategory[]>([])
  const [careers, setCareers] = useState<Career[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ProgramCategory | null>(null)
  const [showCareerForm, setShowCareerForm] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [showCareerManagement, setShowCareerManagement] = useState(false)
  const [selectedCategoryForCareerManagement, setSelectedCategoryForCareerManagement] = useState<ProgramCategory | null>(null)

  // Load categories
  const loadCategories = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/admin/categories')
      if (!response.ok) {
        throw new Error('Failed to load categories')
      }

      const data = await response.json()
      setCategories(data.categories || [])
      
      // Update selected category if career management popup is open
      if (selectedCategoryForCareerManagement) {
        const updatedCategory = data.categories?.find(
          (cat: ProgramCategory) => cat.id === selectedCategoryForCareerManagement.id
        )
        if (updatedCategory) {
          setSelectedCategoryForCareerManagement(updatedCategory)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories')
    } finally {
      setIsLoading(false)
    }
  }, [selectedCategoryForCareerManagement])

  // Load careers
  const loadCareers = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/careers')
      if (!response.ok) {
        throw new Error('Failed to load careers')
      }

      const data = await response.json()
      setCareers(data || [])
    } catch (err) {
      console.error('Failed to load careers:', err)
    }
  }, [])

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([loadCategories(), loadCareers()])
    }
    loadData()
  }, [loadCategories, loadCareers])

  // Filter categories based on search
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.abbreviation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Handle create/edit category
  const handleSaveCategory = async (formData: CategoryManagementForm) => {
    try {
      const url = editingCategory 
        ? `/api/admin/categories/${editingCategory.id}`
        : '/api/admin/categories'
      
      const method = editingCategory ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save category')
      }

      const savedCategory = await response.json()
      
      if (editingCategory) {
        setCategories(prev => 
          prev.map(cat => cat.id === editingCategory.id ? savedCategory : cat)
        )
      } else {
        setCategories(prev => [...prev, savedCategory])
      }

      setShowForm(false)
      setEditingCategory(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save category')
    }
  }

  // Handle delete category
  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete category')
      }

      setCategories(prev => prev.filter(cat => cat.id !== categoryId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category')
    }
  }

  // Handle edit category
  const handleEditCategory = (category: ProgramCategory) => {
    setEditingCategory(category)
    setShowForm(true)
  }

  // Handle new category
  const handleNewCategory = () => {
    setEditingCategory(null)
    setShowForm(true)
  }

  // Handle add career to category
  const handleAddCareerToCategory = async (categoryId: string, careerId: string) => {
    try {
      const response = await fetch('/api/admin/category-career-mapping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category_id: categoryId,
          career_id: careerId
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add career to category')
      }

      // Update categories without triggering loading state
      await loadCategoriesSilently()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add career to category')
    }
  }

  // Handle remove career from category
  const handleRemoveCareerFromCategory = async (categoryId: string, careerId: string) => {
    try {
      const response = await fetch(`/api/admin/category-career-mapping?category_id=${categoryId}&career_id=${careerId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to remove career from category')
      }

      // Update categories without triggering loading state
      await loadCategoriesSilently()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove career from category')
    }
  }

  // Load categories without triggering loading state (for popup operations)
  const loadCategoriesSilently = async () => {
    try {
      const response = await fetch('/api/admin/categories')
      if (!response.ok) {
        throw new Error('Failed to load categories')
      }

      const data = await response.json()
      setCategories(data.categories || [])
      
      // Update selected category if career management popup is open
      if (selectedCategoryForCareerManagement) {
        const updatedCategory = data.categories?.find(
          (cat: ProgramCategory) => cat.id === selectedCategoryForCareerManagement.id
        )
        if (updatedCategory) {
          setSelectedCategoryForCareerManagement(updatedCategory)
        }
      }
    } catch (err) {
      console.error('Error loading categories silently:', err)
    }
  }

  // Handle create new career
  const handleCreateCareer = async (careerData: Partial<Career>) => {
    try {
      const response = await fetch('/api/admin/careers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(careerData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create career')
      }

      const newCareer = await response.json()
      setCareers(prev => [...prev, newCareer])
      
      // If we have a selected category, add this career to it
      if (selectedCategoryId) {
        await handleAddCareerToCategory(selectedCategoryId, newCareer.id)
      }
      
      setShowCareerForm(false)
      setSelectedCategoryId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create career')
    }
  }

  // Handle open career form for specific category
  // const handleOpenCareerForm = (categoryId: string) => {
  //   setSelectedCategoryId(categoryId)
  //   setShowCareerForm(true)
  // }

  // Handle open career management popup
  const handleOpenCareerManagement = (category: ProgramCategory) => {
    setSelectedCategoryForCareerManagement(category)
    setShowCareerManagement(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={handleNewCategory}>
          <Plus className="w-4 h-4 mr-1" />
          New Category
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Categories List */}
      <div className="grid gap-4">
        {filteredCategories.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                {searchTerm ? 'No categories found matching your search.' : 'No categories found.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredCategories.map((category) => (
            <Card key={category.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {category.name}
                      <Badge variant="secondary">{category.abbreviation}</Badge>
                    </CardTitle>
                    {category.description && (
                      <CardDescription className="mt-1">
                        {category.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditCategory(category)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCategory(category.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Default Career Paths:</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenCareerManagement(category)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Manage
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {category.career_paths && category.career_paths.length > 0 ? (
                      category.career_paths.map((path, index) => {
                        const career = careers.find(c => c.name === path)
                        return (
                          <Badge 
                            key={index} 
                            variant="outline" 
                            title={career?.abbreviation || path} // Show full name on hover
                          >
                            {career?.name || path}
                          </Badge>
                        )
                      })
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        No default career paths set
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Category Form Modal */}
      {showForm && (
        <CategoryFormModal
          category={editingCategory}
          onSave={handleSaveCategory}
          onClose={() => {
            setShowForm(false)
            setEditingCategory(null)
          }}
        />
      )}

      {/* Career Management Popup */}
      <CareerManagementPopup
        category={selectedCategoryForCareerManagement}
        isOpen={showCareerManagement}
        onClose={() => {
          setShowCareerManagement(false)
          setSelectedCategoryForCareerManagement(null)
        }}
        onAddCareer={handleAddCareerToCategory}
        onRemoveCareer={handleRemoveCareerFromCategory}
        onCreateCareer={handleCreateCareer}
      />

      {/* Career Form Modal */}
      {showCareerForm && (
        <CareerFormModal
          onSave={handleCreateCareer}
          onClose={() => {
            setShowCareerForm(false)
            setSelectedCategoryId(null)
          }}
        />
      )}
    </div>
  )
}

// Category Form Modal Component
interface CategoryFormModalProps {
  category?: ProgramCategory | null
  onSave: (data: CategoryManagementForm) => Promise<void>
  onClose: () => void
}

function CategoryFormModal({ category, onSave, onClose }: CategoryFormModalProps) {
  const [formData, setFormData] = useState<CategoryManagementForm>({
    name: category?.name || '',
    abbreviation: category?.abbreviation || '',
    description: category?.description || ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors([])

    try {
      // Basic validation
      const newErrors: string[] = []
      if (!formData.name.trim()) newErrors.push('Name is required')
      if (!formData.abbreviation.trim()) newErrors.push('Abbreviation is required')

      if (newErrors.length > 0) {
        setErrors(newErrors)
        return
      }

      await onSave(formData)
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'Failed to save category'])
    } finally {
      setIsSubmitting(false)
    }
  }


  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>
            {category ? 'Edit Category' : 'New Category'}
          </CardTitle>
          <CardDescription>
            {category ? 'Update category information' : 'Create a new program category'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Display */}
            {errors.length > 0 && (
              <Alert variant="destructive">
                <AlertDescription>
                  <ul className="list-disc list-inside">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">
                  Name *
                </label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Computer Science"
                  required
                />
              </div>
              <div>
                <label htmlFor="abbreviation" className="block text-sm font-medium mb-1">
                  Abbreviation *
                </label>
                <Input
                  id="abbreviation"
                  value={formData.abbreviation}
                  onChange={(e) => setFormData(prev => ({ ...prev, abbreviation: e.target.value }))}
                  placeholder="e.g., CS"
                  maxLength={10}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description of the category"
                className="w-full px-3 py-2 border border-input rounded-md resize-none"
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : (category ? 'Update' : 'Create')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// Career Form Modal Component
interface CareerFormModalProps {
  onSave: (data: Partial<Career>) => Promise<void>
  onClose: () => void
}

function CareerFormModal({ onSave, onClose }: CareerFormModalProps) {
  const [formData, setFormData] = useState<Partial<Career>>({
    name: '',
    abbreviation: '',
    description: '',
    industry: '',
    career_type: 'Software' as CareerType
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const careerTypes: CareerType[] = [
    'Software', 'Data', 'AI', 'Hardware', 'Product', 'Design', 
    'Security', 'Infrastructure', 'Management', 'Finance', 'Healthcare', 'Research'
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors([])

    try {
      // Basic validation
      const newErrors: string[] = []
      if (!formData.name?.trim()) newErrors.push('Name is required')
      if (!formData.abbreviation?.trim()) newErrors.push('Abbreviation is required')
      if (!formData.career_type) newErrors.push('Career type is required')

      if (newErrors.length > 0) {
        setErrors(newErrors)
        return
      }

      await onSave(formData)
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'Failed to save career'])
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Create New Career</CardTitle>
          <CardDescription>
            Add a new career path that can be assigned to program categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Display */}
            {errors.length > 0 && (
              <Alert variant="destructive">
                <AlertDescription>
                  <ul className="list-disc list-inside">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="career-name" className="block text-sm font-medium mb-1">
                  Name *
                </label>
                <Input
                  id="career-name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Software Engineer"
                  required
                />
              </div>
              <div>
                <label htmlFor="career-abbreviation" className="block text-sm font-medium mb-1">
                  Abbreviation *
                </label>
                <Input
                  id="career-abbreviation"
                  value={formData.abbreviation || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, abbreviation: e.target.value }))}
                  placeholder="e.g., SWE"
                  maxLength={10}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="career-type" className="block text-sm font-medium mb-1">
                  Career Type *
                </label>
                <select
                  id="career-type"
                  value={formData.career_type || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, career_type: e.target.value as CareerType }))}
                  className="w-full px-3 py-2 border border-input rounded-md"
                  required
                >
                  {careerTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="career-industry" className="block text-sm font-medium mb-1">
                  Industry
                </label>
                <Input
                  id="career-industry"
                  value={formData.industry || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                  placeholder="e.g., Technology"
                />
              </div>
            </div>

            <div>
              <label htmlFor="career-description" className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                id="career-description"
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description of the career"
                className="w-full px-3 py-2 border border-input rounded-md resize-none"
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Career'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
