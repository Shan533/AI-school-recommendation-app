import { redirect } from 'next/navigation'
import { getCurrentUser, isAdmin } from '@/lib/supabase/helpers'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
        <Card>
          <CardHeader>
            <CardTitle>Schools Management</CardTitle>
            <CardDescription>
              Add, edit, and manage schools in the database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/schools">
              <Button className="w-full">Manage Schools</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Programs Management</CardTitle>
            <CardDescription>
              Add, edit, and manage academic programs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/programs">
              <Button className="w-full">Manage Programs</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>CSV Upload</CardTitle>
            <CardDescription>
              Bulk upload schools and programs via CSV files
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/csv-upload">
              <Button className="w-full">Upload CSV</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Manage user accounts and admin permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/users">
              <Button className="w-full">Manage Users</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reviews Management</CardTitle>
            <CardDescription>
              View and manage user reviews for schools and programs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/reviews">
              <Button className="w-full">Manage Reviews</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}