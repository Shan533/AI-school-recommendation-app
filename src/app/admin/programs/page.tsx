import { redirect } from 'next/navigation'
import { getCurrentUser, isAdmin, getSupabaseClient } from '@/lib/supabase/helpers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

async function getPrograms() {
  const supabase = await getSupabaseClient()
  const { data: programs, error } = await supabase
    .from('programs')
    .select(`
      *,
      schools (
        name,
        initial
      )
    `)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching programs:', error)
    return []
  }
  
  return programs || []
}

async function getSchools() {
  const supabase = await getSupabaseClient()
  const { data: schools, error } = await supabase
    .from('schools')
    .select('id, name, initial')
    .order('name')
  
  if (error) {
    console.error('Error fetching schools:', error)
    return []
  }
  
  return schools || []
}

async function createProgram(formData: FormData) {
  'use server'
  
  const user = await getCurrentUser()
  if (!user || !(await isAdmin(user.id))) {
    redirect('/login')
  }

  const supabase = await getSupabaseClient()
  
  const programData = {
    name: formData.get('name') as string,
    initial: formData.get('initial') as string,
    school_id: formData.get('school_id') as string,
    degree: formData.get('degree') as string,
    website_url: formData.get('website_url') as string,
    duration_months: formData.get('duration_months') ? parseInt(formData.get('duration_months') as string) : null,
    currency: formData.get('currency') as string,
    total_tuition: formData.get('total_tuition') ? parseInt(formData.get('total_tuition') as string) : null,
    is_stem: formData.get('is_stem') === 'on',
    description: formData.get('description') as string,
    created_by: user.id,
  }

  const { error } = await supabase
    .from('programs')
    .insert([programData])

  if (error) {
    console.error('Error creating program:', error)
  }
  
  redirect('/admin/programs')
}

export default async function ProgramsManagement() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

  const userIsAdmin = await isAdmin(user.id)
  
  if (!userIsAdmin) {
    redirect('/')
  }

  const [programs, schools] = await Promise.all([getPrograms(), getSchools()])

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Programs Management</h1>
        <Button asChild>
          <a href="/admin/dashboard">Back to Dashboard</a>
        </Button>
      </div>

      {/* Add Program Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Add New Program</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createProgram} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Program Name *</Label>
              <Input id="name" name="name" required />
            </div>
            
            <div>
              <Label htmlFor="initial">Abbreviation</Label>
              <Input id="initial" name="initial" />
            </div>
            
            <div>
              <Label htmlFor="school_id">School *</Label>
              <select id="school_id" name="school_id" required className="w-full p-2 border border-gray-300 rounded-md">
                <option value="">Select a school</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name} {school.initial && `(${school.initial})`}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <Label htmlFor="degree">Degree *</Label>
              <Input id="degree" name="degree" placeholder="e.g., MS, PhD, BS" required />
            </div>
            
            <div>
              <Label htmlFor="duration_months">Duration (months)</Label>
              <Input id="duration_months" name="duration_months" type="number" />
            </div>
            
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Input id="currency" name="currency" placeholder="e.g., USD, EUR" />
            </div>
            
            <div>
              <Label htmlFor="total_tuition">Total Tuition</Label>
              <Input id="total_tuition" name="total_tuition" type="number" />
            </div>
            
            <div>
              <Label htmlFor="website_url">Website URL</Label>
              <Input id="website_url" name="website_url" type="url" />
            </div>
            
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="is_stem" name="is_stem" />
              <Label htmlFor="is_stem">STEM Designated</Label>
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" rows={3} />
            </div>
            
            <div className="md:col-span-2">
              <Button type="submit" className="w-full">Add Program</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Programs List */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Programs ({programs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {programs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Program Name</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>Degree</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>STEM</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {programs.map((program) => (
                  <TableRow key={program.id}>
                    <TableCell className="font-medium">
                      {program.name} {program.initial && `(${program.initial})`}
                    </TableCell>
                    <TableCell>
                      {program.schools?.name} {program.schools?.initial && `(${program.schools.initial})`}
                    </TableCell>
                    <TableCell>{program.degree}</TableCell>
                    <TableCell>{program.duration_months ? `${program.duration_months} months` : '-'}</TableCell>
                    <TableCell>{program.is_stem ? 'Yes' : 'No'}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">Edit</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-gray-500 py-8">No programs found. Add your first program above.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}