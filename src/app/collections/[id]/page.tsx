import { notFound, redirect } from 'next/navigation'
import { getCurrentUser, getCollectionWithItems } from '@/lib/supabase/helpers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import CollectionItemsView from '@/components/collections/collection-items-view'
import type { Collection } from '@/lib/validation'

export default async function CollectionDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

  const collection = await getCollectionWithItems(id, user.id)
  
  if (!collection) {
    notFound()
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-end items-center mb-6">
        <Button asChild variant="outline" className="cursor-pointer">
          <Link href="/collections">← Back to Collections</Link>
        </Button>
      </div>

      {/* Collection Header */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-2xl md:text-3xl mb-2">
                {collection.name}
              </CardTitle>
              {collection.description && (
                <p className="text-gray-600 text-base md:text-lg">
                  {collection.description}
                </p>
              )}
            </div>
            <Badge variant="secondary" className="ml-4">
              {collection.collection_items?.length || 0} items
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <p>Created {new Date(collection.created_at).toLocaleDateString()}</p>
            {collection.updated_at !== collection.created_at && (
              <p>Updated {new Date(collection.updated_at).toLocaleDateString()}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Collection Items */}
      <CollectionItemsView 
        collection={{
          ...collection,
          items: collection.collection_items || []
        } as unknown as Collection & { items: typeof collection.collection_items }} 
        userId={user.id}
      />
    </div>
  )
}
