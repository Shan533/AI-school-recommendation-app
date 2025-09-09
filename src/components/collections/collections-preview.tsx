'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Heart, FolderOpen, Plus, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Collection {
  id: string
  name: string
  description?: string
  item_count: number
  created_at: string
}

interface CollectionsPreviewProps {
  userId: string
}

export default function CollectionsPreview({ userId }: CollectionsPreviewProps) {
  const [collections, setCollections] = useState<Collection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
        setError('Failed to load collections')
      }
    } catch (err) {
      console.error('Error loading collections:', err)
      setError('Failed to load collections')
    } finally {
      setIsLoading(false)
    }
  }

  const totalItems = collections.reduce((sum, collection) => sum + collection.item_count, 0)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            My Collections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            My Collections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500 text-center py-4">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            My Collections
          </CardTitle>
          <div className="flex items-center gap-2">
            {collections.length > 0 && (
              <Badge variant="secondary">
                {totalItems} items
              </Badge>
            )}
            <Button asChild size="sm">
              <Link href="/collections">
                View All
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {collections.length === 0 ? (
          <div className="text-center py-8">
            <FolderOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Collections Yet</h3>
            <p className="text-gray-600 mb-4">
              Start organizing your favorite schools and programs by creating collections.
            </p>
            <Button asChild size="sm">
              <Link href="/programs">
                <Plus className="h-4 w-4 mr-2" />
                Browse Programs
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {collections.slice(0, 3).map((collection) => (
              <div
                key={collection.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">
                    {collection.name}
                  </h4>
                  {collection.description && (
                    <p className="text-sm text-gray-600 truncate mt-1">
                      {collection.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Badge variant="outline" className="text-xs">
                    {collection.item_count}
                  </Badge>
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/collections/${collection.id}`}>
                      View
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
            
            {collections.length > 3 && (
              <div className="text-center pt-2">
                <Button asChild variant="outline" size="sm">
                  <Link href="/collections">
                    View {collections.length - 3} more collections
                  </Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
