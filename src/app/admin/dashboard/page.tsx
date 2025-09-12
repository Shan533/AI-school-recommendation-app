import { redirect } from 'next/navigation'
import { getCurrentUser, isAdmin } from '@/lib/supabase/helpers'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default async function AdminDashboard() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

  const userIsAdmin = await isAdmin(user.id)
  
  if (!userIsAdmin) {
    redirect('/')
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        <Link href="/admin/schools">
          <Card>
            <CardHeader>
              <CardTitle>Schools Management</CardTitle>
              <CardDescription>
                Add, edit, and manage schools in the database
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/admin/programs">
          <Card>
            <CardHeader>
              <CardTitle>Programs Management</CardTitle>
              <CardDescription>
                Add, edit, and manage academic programs
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/admin/csv-upload">
          <Card>
            <CardHeader>
              <CardTitle>CSV Upload</CardTitle>
              <CardDescription>
                Bulk upload schools and programs via CSV files
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/admin/users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage user accounts and admin permissions
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        

        <Link href="/admin/reviews">
          <Card>
          <CardHeader>
            <CardTitle>Reviews Management</CardTitle>
            <CardDescription>
              View and manage user reviews for schools and programs
            </CardDescription>
          </CardHeader>
          </Card>
        </Link>

      </div>
    </div>
  )
}