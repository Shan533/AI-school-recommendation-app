import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/helpers'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import CollectionsManager from '@/components/collections/collections-manager'

export default async function CollectionsPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Collections</h1>
        <Button asChild variant="outline" className="cursor-pointer">
          <Link href="/profile">Back to Profile</Link>
        </Button>
      </div>

      <CollectionsManager userId={user.id} />
    </div>
  )
}
