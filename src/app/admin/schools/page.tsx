import { redirect } from 'next/navigation'
import { getCurrentUser, isAdmin, getSupabaseClient } from '@/lib/supabase/helpers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

async function getSchools() {
  const supabase = await getSupabaseClient()
  const { data: schools, error } = await supabase
    .from('schools')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching schools:', error)
    return []
  }
  
  return schools || []
}

async function createSchool(formData: FormData) {
  'use server'
  
  const user = await getCurrentUser()
  if (!user || !(await isAdmin(user.id))) {
    redirect('/login')
  }

  const supabase = await getSupabaseClient()
  
  const schoolData = {
    name: formData.get('name') as string,
    initial: formData.get('initial') as string,
    type: formData.get('type') as string,
    country: formData.get('country') as string,
    location: formData.get('location') as string,
    year_founded: formData.get('year_founded') ? parseInt(formData.get('year_founded') as string) : null,
    qs_ranking: formData.get('qs_ranking') ? parseInt(formData.get('qs_ranking') as string) : null,
    website_url: formData.get('website_url') as string,
    created_by: user.id,
  }

  const { error } = await supabase
    .from('schools')
    .insert([schoolData])

  if (error) {
    console.error('Error creating school:', error)
  }
  
  redirect('/admin/schools')
}

export default async function SchoolsManagement() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

  const userIsAdmin = await isAdmin(user.id)
  
  if (!userIsAdmin) {
    redirect('/')
  }

  const schools = await getSchools()

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Schools Management</h1>
        <Button asChild>
          <a href="/admin/dashboard">Back to Dashboard</a>
        </Button>
      </div>

      {/* Add School Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Add New School</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createSchool} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">School Name *</Label>
              <Input id="name" name="name" required />
            </div>
            
            <div>
              <Label htmlFor="initial">Abbreviation</Label>
              <Input id="initial" name="initial" />
            </div>
            
            <div>
              <Label htmlFor="type">Type</Label>
              <Input id="type" name="type" placeholder="e.g., University" />
            </div>
            
            <div>
              <Label htmlFor="country">Country</Label>
              <Input id="country" name="country" />
            </div>
            
            <div>
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" placeholder="City, State" />
            </div>
            
            <div>
              <Label htmlFor="year_founded">Year Founded</Label>
              <Input id="year_founded" name="year_founded" type="number" />
            </div>
            
            <div>
              <Label htmlFor="qs_ranking">QS Ranking</Label>
              <Input id="qs_ranking" name="qs_ranking" type="number" />
            </div>
            
            <div>
              <Label htmlFor="website_url">Website URL</Label>
              <Input id="website_url" name="website_url" type="url" />
            </div>
            
            <div className="md:col-span-2">
              <Button type="submit" className="w-full">Add School</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Schools List */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Schools ({schools.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {schools.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>QS Ranking</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schools.map((school) => (
                  <TableRow key={school.id}>
                    <TableCell className="font-medium">
                      {school.name} {school.initial && `(${school.initial})`}
                    </TableCell>
                    <TableCell>{school.type || '-'}</TableCell>
                    <TableCell>{school.location || '-'}</TableCell>
                    <TableCell>{school.qs_ranking || '-'}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">Edit</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-gray-500 py-8">No schools found. Add your first school above.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}