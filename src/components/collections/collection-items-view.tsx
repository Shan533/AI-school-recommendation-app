'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { Edit, Trash2, Loader2, FolderOpen, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface CollectionItem {
  id: string
  notes?: string
  created_at: string
  school_id?: string
  program_id?: string
  schools?: {
    id: string
    name: string
    initial?: string
    location?: string
    country?: string
  }
  programs?: {
    id: string
    name: string
    initial?: string
    degree: string
    schools: {
      name: string
      initial?: string
    }
  }
}

interface Collection {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
  collection_items?: CollectionItem[]
}

interface CollectionItemsViewProps {
  collection: Collection
  userId: string
}

export default function CollectionItemsView({ collection }: CollectionItemsViewProps) {
  const router = useRouter()
  const [items, setItems] = useState<CollectionItem[]>(collection.collection_items || [])
  const [selectedItem, setSelectedItem] = useState<CollectionItem | null>(null)
  const [isEditNotesOpen, setIsEditNotesOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editNotes, setEditNotes] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set())

  const toggleNoteExpansion = (itemId: string) => {
    setExpandedNotes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  const openEditNotes = (item: CollectionItem) => {
    setSelectedItem(item)
    setEditNotes(item.notes || '')
    setIsEditNotesOpen(true)
  }

  const openDeleteDialog = (item: CollectionItem) => {
    setSelectedItem(item)
    setIsDeleteDialogOpen(true)
  }

  const updateItemNotes = async () => {
    if (!selectedItem) return

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/collections/${collection.id}/items/${selectedItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: editNotes.trim() || null,
        }),
      })

      if (response.ok) {
        const updatedItem = await response.json()
        setItems(prev => 
          prev.map(item => 
            item.id === selectedItem.id 
              ? { ...item, notes: updatedItem.notes }
              : item
          )
        )
        setIsEditNotesOpen(false)
        setSelectedItem(null)
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Error updating notes:', errorData)
        // You could add a toast notification here in the future
        alert(`Failed to update notes: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error updating notes:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const removeItem = async () => {
    if (!selectedItem) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/collections/${collection.id}/items/${selectedItem.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setItems(prev => prev.filter(item => item.id !== selectedItem.id))
        setIsDeleteDialogOpen(false)
        setSelectedItem(null)
        router.refresh() // Refresh to update the collection item count
      } else {
        console.error('Error removing item')
      }
    } catch (error) {
      console.error('Error removing item:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <FolderOpen className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No Items Yet</h3>
          <p className="text-gray-600 mb-6">
            This collection is empty. Start adding schools and programs by browsing and using the &quot;Add to Collection&quot; button.
          </p>
          <div className="flex gap-3 justify-center">
            <Button asChild>
              <Link href="/programs">
                Browse Programs
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/schools">
                Browse Schools
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {items.map((item) => {
          const isProgram = !!item.program_id

          return (
            <Card 
              key={item.id} 
              className={`hover:shadow-lg transition-shadow cursor-pointer ${
                isProgram ? 'bg-gray-50' : 'bg-white'
              }`}
              onClick={() => router.push(isProgram ? `/programs/${item.program_id}` : `/schools/${item.school_id}`)}
            >
              <CardHeader>
                {/* Mobile-first layout: stack vertically on small screens */}
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg leading-tight">
                      <span className="break-words">
                        {isProgram ? item.programs?.name : item.schools?.name}
                      </span>
                      {(item.programs?.initial || item.schools?.initial) && (
                        <span className="text-gray-600 ml-2 text-base">
                          ({item.programs?.initial || item.schools?.initial})
                        </span>
                      )}
                    </CardTitle>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant={isProgram ? "default" : "secondary"} className="text-xs">
                        {isProgram ? item.programs?.degree : 'School'}
                      </Badge>
                      {isProgram && (
                        <Badge variant="outline" className="text-xs">
                          <span className="truncate max-w-[120px]">
                            {item.programs?.schools?.initial || item.programs?.schools?.name}
                          </span>
                        </Badge>
                      )}
                    </div>
                  </div>
                  {/* Action buttons - full width on mobile, compact on desktop */}
                  <div className="flex gap-2 w-full sm:w-auto sm:flex-shrink-0">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        openEditNotes(item)
                      }}
                      className="flex-1 sm:flex-initial"
                    >
                      <Edit className="h-4 w-4 sm:mr-0 mr-2" />
                      <span className="sm:hidden">Edit Notes</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        openDeleteDialog(item)
                      }}
                      className="text-red-600 hover:text-red-700 flex-1 sm:flex-initial"
                    >
                      <Trash2 className="h-4 w-4 sm:mr-0 mr-2" />
                      <span className="sm:hidden">Remove</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col h-full">
                {item.notes && (
                  <div className="mb-2 p-2 bg-gray-50 rounded border-l-2 border-gray-300">
                    <div className="flex items-start justify-between gap-1">
                      <p className={`text-xs text-gray-600 leading-tight flex-1 ${
                        expandedNotes.has(item.id) 
                          ? '' 
                          : 'overflow-hidden'
                      }`} 
                         style={expandedNotes.has(item.id) ? {} : {
                           display: '-webkit-box',
                           WebkitLineClamp: 1,
                           WebkitBoxOrient: 'vertical'
                         }}>
                        {item.notes}
                      </p>
                      {item.notes.length > 50 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleNoteExpansion(item.id)
                          }}
                          className="text-gray-400 hover:text-gray-600 flex-shrink-0 p-0.5"
                        >
                          {expandedNotes.has(item.id) ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )}
                
                <p className="text-xs text-gray-500 mt-auto">
                  Added {new Date(item.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Edit Notes Dialog */}
      <Dialog open={isEditNotesOpen} onOpenChange={setIsEditNotesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Notes</DialogTitle>
            <DialogDescription>
              Add or update your notes for &quot;{selectedItem?.programs?.name || selectedItem?.schools?.name}&quot;.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="item-notes" className="text-sm font-medium">
                Notes (Optional)
              </label>
              <Textarea
                id="item-notes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Add your thoughts, reminders, or any other notes..."
                maxLength={500}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditNotesOpen(false)
                setSelectedItem(null)
                setEditNotes('')
              }}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button 
              onClick={updateItemNotes}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                'Update Notes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Item Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from Collection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove &quot;{selectedItem?.programs?.name || selectedItem?.schools?.name}&quot; 
              from this collection? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={removeItem}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Removing...
                </>
              ) : (
                'Remove from Collection'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
