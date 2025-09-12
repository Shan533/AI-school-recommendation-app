'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Heart, Loader2 } from 'lucide-react'

interface Collection {
  id: string
  name: string
  item_count: number
}

interface AddToCollectionButtonProps {
  programId?: string
  schoolId?: string
  itemName: string
  className?: string
}

export default function AddToCollectionButton({
  programId,
  schoolId,
  itemName,
  className = ''
}: AddToCollectionButtonProps) {
  const [collections, setCollections] = useState<Collection[]>([])
  const [itemCollections, setItemCollections] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [newCollectionDescription, setNewCollectionDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  // Load user's collections and check if item is already in any collections
  useEffect(() => {
    loadCollections()
    checkItemInCollections()
  }, [programId, schoolId]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadCollections = async () => {
    try {
      const response = await fetch('/api/collections')
      if (response.ok) {
        const data = await response.json()
        setCollections(data)
      }
    } catch (error) {
      console.error('Error loading collections:', error)
    }
  }

  const checkItemInCollections = async () => {
    if (!programId && !schoolId) return

    try {
      const params = new URLSearchParams()
      if (programId) params.append('program_id', programId)
      if (schoolId) params.append('school_id', schoolId)

      const response = await fetch(`/api/collections/check?${params}`)
      if (response.ok) {
        const data = await response.json()
        if (data.in_collections) {
          setItemCollections(data.collections.map((c: { collection_id: string }) => c.collection_id))
        }
      }
    } catch (error) {
      console.error('Error checking collections:', error)
    }
  }

  const addToCollection = async (collectionId: string) => {
    if (!programId && !schoolId) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/collections/${collectionId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          program_id: programId || null,
          school_id: schoolId || null,
        }),
      })

      if (response.ok) {
        setItemCollections(prev => [...prev, collectionId])
        await loadCollections() // Refresh to update item counts
      } else {
        const error = await response.json()
        console.error('Error adding to collection:', error)
      }
    } catch (error) {
      console.error('Error adding to collection:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const removeFromCollection = async (collectionId: string) => {
    if (!programId && !schoolId) return

    setIsLoading(true)
    try {
      // First get the collection to find the item
      const response = await fetch(`/api/collections/${collectionId}`)
      if (response.ok) {
        const collection = await response.json()
        const item = collection.collection_items?.find((item: { program_id?: string; school_id?: string }) => 
          (programId && item.program_id === programId) || 
          (schoolId && item.school_id === schoolId)
        )

        if (item) {
          const deleteResponse = await fetch(`/api/collections/${collectionId}/items/${item.id}`, {
            method: 'DELETE',
          })

          if (deleteResponse.ok) {
            setItemCollections(prev => prev.filter(id => id !== collectionId))
            await loadCollections() // Refresh to update item counts
          }
        }
      }
    } catch (error) {
      console.error('Error removing from collection:', error)
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
        
        // Automatically add the item to the new collection
        await addToCollection(newCollection.id)
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

  const isInAnyCollection = itemCollections.length > 0

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant={isInAnyCollection ? "default" : "outline"} 
            className={`${className} min-w-0 flex-shrink-0`}
            disabled={isLoading}
          >
            <div className="flex items-center min-w-0">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2 flex-shrink-0" />
              ) : isInAnyCollection ? (
                <Heart className="h-4 w-4 mr-2 fill-current flex-shrink-0" />
              ) : (
                <Heart className="h-4 w-4 mr-2 flex-shrink-0" />
              )}
              <span className="truncate">
                {isInAnyCollection ? 'In Collections' : 'Add to Collection'}
              </span>
              {isInAnyCollection && (
                <Badge variant="secondary" className="ml-2 flex-shrink-0">
                  {itemCollections.length}
                </Badge>
              )}
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5 text-sm font-medium text-gray-900">
            Add &quot;{itemName}&quot; to:
          </div>
          <DropdownMenuSeparator />
          
          {collections.length > 0 ? (
            collections.map((collection) => {
              const isInCollection = itemCollections.includes(collection.id)
              return (
                <DropdownMenuItem
                  key={collection.id}
                  onClick={() => {
                    if (isInCollection) {
                      removeFromCollection(collection.id)
                    } else {
                      addToCollection(collection.id)
                    }
                  }}
                  className="flex items-center justify-between"
                >
                  <span className="flex items-center">
                    {isInCollection ? (
                      <Heart className="h-4 w-4 mr-2 fill-current text-red-500" />
                    ) : (
                      <Heart className="h-4 w-4 mr-2" />
                    )}
                    {collection.name}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {collection.item_count}
                  </Badge>
                </DropdownMenuItem>
              )
            })
          ) : (
            <div className="px-2 py-1.5 text-sm text-gray-500">
              No collections yet
            </div>
          )}
          
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create New Collection
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create Collection Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Collection</DialogTitle>
            <DialogDescription>
              Create a new collection and add &quot;{itemName}&quot; to it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="collection-name">Collection Name</Label>
              <Input
                id="collection-name"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="e.g., My Favorites, Computer Science Programs"
                maxLength={100}
              />
            </div>
            <div>
              <Label htmlFor="collection-description">Description (Optional)</Label>
              <Textarea
                id="collection-description"
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
              onClick={() => setIsCreateDialogOpen(false)}
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
                'Create & Add'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
