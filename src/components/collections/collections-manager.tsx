'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Heart, Plus, Edit, Trash2, FolderOpen, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Collection {
  id: string
  name: string
  description?: string
  item_count: number
  created_at: string
  updated_at: string
}

interface CollectionsManagerProps {
  userId: string
}

export default function CollectionsManager({ userId }: CollectionsManagerProps) {
  const [collections, setCollections] = useState<Collection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null)
  
  // Form states
  const [newCollectionName, setNewCollectionName] = useState('')
  const [newCollectionDescription, setNewCollectionDescription] = useState('')
  const [editCollectionName, setEditCollectionName] = useState('')
  const [editCollectionDescription, setEditCollectionDescription] = useState('')
  
  // Loading states
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    loadCollections()
  }, [userId])

  const loadCollections = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/collections')
      
      if (response.ok) {
        const data = await response.json()
        setCollections(data)
      } else {
        console.error('Failed to load collections')
      }
    } catch (error) {
      console.error('Error loading collections:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const createCollection = async () => {
    if (!newCollectionName.trim()) return

    setIsCreating(true)
    try {
      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCollectionName.trim(),
          description: newCollectionDescription.trim() || null,
        }),
      })

      if (response.ok) {
        const newCollection = await response.json()
        setCollections(prev => [newCollection, ...prev])
        setIsCreateDialogOpen(false)
        setNewCollectionName('')
        setNewCollectionDescription('')
      } else {
        const error = await response.json()
        console.error('Error creating collection:', error)
      }
    } catch (error) {
      console.error('Error creating collection:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const updateCollection = async () => {
    if (!selectedCollection || !editCollectionName.trim()) return

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/collections/${selectedCollection.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editCollectionName.trim(),
          description: editCollectionDescription.trim() || null,
        }),
      })

      if (response.ok) {
        const updatedCollection = await response.json()
        setCollections(prev => 
          prev.map(c => c.id === selectedCollection.id ? updatedCollection : c)
        )
        setIsEditDialogOpen(false)
        setSelectedCollection(null)
      } else {
        const error = await response.json()
        console.error('Error updating collection:', error)
      }
    } catch (error) {
      console.error('Error updating collection:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const deleteCollection = async () => {
    if (!selectedCollection) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/collections/${selectedCollection.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setCollections(prev => prev.filter(c => c.id !== selectedCollection.id))
        setIsDeleteDialogOpen(false)
        setSelectedCollection(null)
      } else {
        const error = await response.json()
        console.error('Error deleting collection:', error)
      }
    } catch (error) {
      console.error('Error deleting collection:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const openEditDialog = (collection: Collection) => {
    setSelectedCollection(collection)
    setEditCollectionName(collection.name)
    setEditCollectionDescription(collection.description || '')
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (collection: Collection) => {
    setSelectedCollection(collection)
    setIsDeleteDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button - mobile-friendly */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <p className="text-gray-600">
            Organize your favorite schools and programs into collections
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          New Collection
        </Button>
      </div>

      {/* Collections Grid */}
      {collections.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FolderOpen className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No Collections Yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first collection to start organizing your favorite schools and programs.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Collection
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {collections.map((collection) => (
            <Card key={collection.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="truncate">{collection.name}</CardTitle>
                    {collection.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {collection.description}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className="ml-2">
                    {collection.item_count}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* Mobile-first button layout */}
                <div className="space-y-2">
                  <Button asChild className="w-full">
                    <Link href={`/collections/${collection.id}`}>
                      <Heart className="h-4 w-4 mr-2" />
                      View Items
                    </Link>
                  </Button>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openEditDialog(collection)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      <span className="hidden xs:inline">Edit</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openDeleteDialog(collection)}
                      className="text-red-600 hover:text-red-700 flex-1"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      <span className="hidden xs:inline">Delete</span>
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Created {new Date(collection.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Collection Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Collection</DialogTitle>
            <DialogDescription>
              Give your collection a name and description to help you organize your items.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="create-name" className="text-sm font-medium">
                Collection Name
              </label>
              <Input
                id="create-name"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="e.g., My Favorites, Computer Science Programs"
                maxLength={100}
              />
            </div>
            <div>
              <label htmlFor="create-description" className="text-sm font-medium">
                Description (Optional)
              </label>
              <Textarea
                id="create-description"
                value={newCollectionDescription}
                onChange={(e) => setNewCollectionDescription(e.target.value)}
                placeholder="Describe what this collection is for..."
                maxLength={500}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsCreateDialogOpen(false)
                setNewCollectionName('')
                setNewCollectionDescription('')
              }}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button 
              onClick={createCollection}
              disabled={!newCollectionName.trim() || isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                'Create Collection'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Collection Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Collection</DialogTitle>
            <DialogDescription>
              Update your collection&apos;s name and description.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="edit-name" className="text-sm font-medium">
                Collection Name
              </label>
              <Input
                id="edit-name"
                value={editCollectionName}
                onChange={(e) => setEditCollectionName(e.target.value)}
                placeholder="Collection name"
                maxLength={100}
              />
            </div>
            <div>
              <label htmlFor="edit-description" className="text-sm font-medium">
                Description (Optional)
              </label>
              <Textarea
                id="edit-description"
                value={editCollectionDescription}
                onChange={(e) => setEditCollectionDescription(e.target.value)}
                placeholder="Describe what this collection is for..."
                maxLength={500}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditDialogOpen(false)
                setSelectedCollection(null)
              }}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button 
              onClick={updateCollection}
              disabled={!editCollectionName.trim() || isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                'Update Collection'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Collection Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Collection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{selectedCollection?.name}&quot;? This action cannot be undone.
              All items in this collection will be removed from it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={deleteCollection}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete Collection'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
