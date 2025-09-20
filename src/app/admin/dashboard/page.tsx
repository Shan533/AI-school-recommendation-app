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
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Schools Management</CardTitle>
            <CardDescription>
              Add, edit, and manage schools in the database
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex items-end">
            <Link href="/admin/schools" className="w-full">
              <Button className="w-full">Manage Schools</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Programs Management</CardTitle>
            <CardDescription>
              Add, edit, and manage academic programs
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex items-end">
            <Link href="/admin/programs" className="w-full">
              <Button className="w-full">Manage Programs</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>CSV Upload</CardTitle>
            <CardDescription>
              Bulk upload schools and programs via CSV files
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex items-end">
            <Link href="/admin/csv-upload" className="w-full">
              <Button className="w-full">Upload CSV</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Manage user accounts and admin permissions
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex items-end">
            <Link href="/admin/users" className="w-full">
              <Button className="w-full">Manage Users</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Reviews Management</CardTitle>
            <CardDescription>
              View and manage user reviews for schools and programs
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex items-end">
            <Link href="/admin/reviews" className="w-full">
              <Button className="w-full">Manage Reviews</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Category Management</CardTitle>
            <CardDescription>
              Create and manage program categories and career paths
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex items-end">
            <Link href="/admin/categories" className="w-full">
              <Button className="w-full">Manage Categories</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Program Categories Assignment</CardTitle>
            <CardDescription>
              Assign categories and career paths to existing programs
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex items-end">
            <Link href="/admin/program-categories" className="w-full">
              <Button className="w-full">Assign Categories</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}