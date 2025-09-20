import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getCurrentUser, isAdmin } from '@/lib/supabase/helpers'
import { ProgramCategoriesAssignmentPage } from '@/components/admin/program-categories-assignment-page'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function AdminProgramCategoriesPage() {
  // Check authentication and admin status
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }

  const userIsAdmin = await isAdmin(user.id)
  if (!userIsAdmin) {
    redirect('/')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Program Categories Assignment</h1>
          <p className="text-muted-foreground mt-2">
            Assign categories and career paths to existing programs
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/categories">Manage Categories</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }>
        <ProgramCategoriesAssignmentPage />
      </Suspense>
    </div>
  )
}
