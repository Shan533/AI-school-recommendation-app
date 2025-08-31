import { redirect } from 'next/navigation'
import { getCurrentUser, isAdmin, getSupabaseClient } from '@/lib/supabase/helpers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import ProgramsManagementClient from '@/components/admin/programs-management'
import { AdminSearchCard } from '@/components/admin/admin-search-card'
import { filterItems, searchConfigs } from '@/lib/admin-search'

async function getPrograms() {
  const supabase = await getSupabaseClient()
  const { data: programs, error } = await supabase
    .from('programs')
    .select(`
      *,
      initial,
      schools (
        name,
        initial
      ),
      requirements (
        *
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
  
  // Parse add-ons JSON if provided
  let addOns = null
  const addOnsStr = formData.get('add_ons') as string
  if (addOnsStr?.trim()) {
    try {
      addOns = JSON.parse(addOnsStr)
    } catch (e) {
      console.error('Invalid JSON in add_ons:', e)
    }
  }
  
  const programData = {
    name: formData.get('name') as string,
    initial: formData.get('initial') as string,
    school_id: formData.get('school_id') as string,
    degree: formData.get('degree') as string,
    website_url: formData.get('website_url') as string,
    duration_years: formData.get('duration_years') ? parseFloat(formData.get('duration_years') as string) : null,
    currency: formData.get('currency') as string,
    total_tuition: formData.get('total_tuition') ? parseInt(formData.get('total_tuition') as string) : null,
    is_stem: formData.get('is_stem') === 'on',
    description: formData.get('description') as string,
    credits: formData.get('credits') ? parseInt(formData.get('credits') as string) : null,
    delivery_method: formData.get('delivery_method') as string,
    schedule_type: formData.get('schedule_type') as string,
    location: formData.get('location') as string,
    add_ons: addOns,
    start_date: formData.get('start_date') as string || null,
    created_by: user.id,
  }

  // Insert program first
  const { data: program, error: programError } = await supabase
    .from('programs')
    .insert([programData])
    .select()
    .single()

  if (programError) {
    console.error('Error creating program:', programError)
    redirect('/admin/programs')
    return
  }

  // Insert requirements if any are provided
  const requirementsData = {
    program_id: program.id,
    ielts_score: formData.get('ielts_score') ? parseFloat(formData.get('ielts_score') as string) : null,
    toefl_score: formData.get('toefl_score') ? parseFloat(formData.get('toefl_score') as string) : null,
    gre_score: formData.get('gre_score') ? parseInt(formData.get('gre_score') as string) : null,
    min_gpa: formData.get('min_gpa') ? parseFloat(formData.get('min_gpa') as string) : null,
    other_tests: formData.get('other_tests') as string,
    requires_personal_statement: formData.get('requires_personal_statement') === 'on',
    requires_portfolio: formData.get('requires_portfolio') === 'on',
    requires_cv: formData.get('requires_cv') === 'on',
    letters_of_recommendation: formData.get('letters_of_recommendation') ? parseInt(formData.get('letters_of_recommendation') as string) : null,
    application_fee: formData.get('application_fee') ? parseInt(formData.get('application_fee') as string) : null,
    application_deadline: formData.get('application_deadline') as string || null,
  }

  // Only insert requirements if at least one field is provided
  const hasRequirements = Object.entries(requirementsData).some(([key, value]) => 
    key !== 'program_id' && value !== null && value !== '' && value !== false
  )

  if (hasRequirements) {
    const { error: reqError } = await supabase
      .from('requirements')
      .insert([requirementsData])

    if (reqError) {
      console.error('Error creating requirements:', reqError)
    }
  }
  
  redirect('/admin/programs')
}

export default async function ProgramsManagementPage(props: {
  searchParams?: Promise<{ search?: string }>
}) {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

  const userIsAdmin = await isAdmin(user.id)
  
  if (!userIsAdmin) {
    redirect('/')
  }

  const searchParams = await props.searchParams
  const search = searchParams?.search

  const [allPrograms, schools] = await Promise.all([getPrograms(), getSchools()])
  
  // Filter programs based on search
  const programs = filterItems(allPrograms, {
    fields: searchConfigs.programs.fields,
    searchTerm: search || ''
  })

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
          <form action={createProgram} className="space-y-6">
            {/* Basic Program Information */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                
                <div className="md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" rows={3} />
                </div>
              </div>
            </div>

            {/* Program Details */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Program Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration_years">Duration (years)</Label>
                  <Input 
                    id="duration_years" 
                    name="duration_years" 
                    type="number" 
                    step="0.5" 
                    min="0.5" 
                    max="8.0" 
                    placeholder="e.g., 1.5" 
                  />
                  <p className="text-xs text-gray-500 mt-1">Range: 0.5 - 8.0 years, step: 0.5</p>
                </div>
                
                <div>
                  <Label htmlFor="credits">Total Credits</Label>
                  <Input 
                    id="credits" 
                    name="credits" 
                    type="number" 
                    min="1" 
                    max="200" 
                    step="1" 
                    placeholder="e.g., 36" 
                  />
                  <p className="text-xs text-gray-500 mt-1">Range: 1 - 200 credits</p>
                </div>
                
                <div>
                  <Label htmlFor="delivery_method">Delivery Method</Label>
                  <select id="delivery_method" name="delivery_method" className="w-full p-2 border border-gray-300 rounded-md">
                    <option value="">Select delivery method</option>
                    <option value="Onsite">Onsite</option>
                    <option value="Online">Online</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="schedule_type">Schedule Type</Label>
                  <select id="schedule_type" name="schedule_type" className="w-full p-2 border border-gray-300 rounded-md">
                    <option value="">Select schedule type</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="location">Program Location</Label>
                  <Input id="location" name="location" placeholder="If different from school location" />
                </div>
                
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input id="start_date" name="start_date" type="date" />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="is_stem" name="is_stem" />
                  <Label htmlFor="is_stem">STEM Designated</Label>
                </div>
                
                <div>
                  <Label htmlFor="website_url">Website URL</Label>
                  <Input id="website_url" name="website_url" type="url" />
                </div>
              </div>
            </div>

            {/* Financial Information */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Financial Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Input id="currency" name="currency" placeholder="e.g., USD, EUR" />
                </div>
                
                <div>
                  <Label htmlFor="total_tuition">Total Tuition</Label>
                  <Input 
                    id="total_tuition" 
                    name="total_tuition" 
                    type="number" 
                    min="0" 
                    step="100" 
                    placeholder="e.g., 50000" 
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum: 0, step: 100</p>
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="add_ons">Add-ons (JSON format)</Label>
                  <Textarea 
                    id="add_ons" 
                    name="add_ons" 
                    rows={2} 
                    placeholder='{"scholarships": ["Merit-based", "Need-based"], "features": ["Career services"]}'
                  />
                  <p className="text-sm text-gray-500 mt-1">Optional: JSON object for scholarships, special features, etc.</p>
                </div>
              </div>
            </div>

            {/* Requirements */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Admission Requirements</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ielts_score">IELTS Score</Label>
                  <Input 
                    id="ielts_score" 
                    name="ielts_score" 
                    type="number" 
                    step="0.5" 
                    min="0" 
                    max="9" 
                    placeholder="e.g., 6.5" 
                  />
                  <p className="text-xs text-gray-500 mt-1">Range: 0.0 - 9.0, step: 0.5</p>
                </div>
                
                <div>
                  <Label htmlFor="toefl_score">TOEFL Score</Label>
                  <Input 
                    id="toefl_score" 
                    name="toefl_score" 
                    type="number" 
                    step="1" 
                    min="0" 
                    max="120" 
                    placeholder="e.g., 80" 
                  />
                  <p className="text-xs text-gray-500 mt-1">Range: 0 - 120</p>
                </div>
                
                <div>
                  <Label htmlFor="gre_score">GRE Score</Label>
                  <Input 
                    id="gre_score" 
                    name="gre_score" 
                    type="number" 
                    step="1" 
                    min="260" 
                    max="340" 
                    placeholder="e.g., 320" 
                  />
                  <p className="text-xs text-gray-500 mt-1">Range: 260 - 340</p>
                </div>
                
                <div>
                  <Label htmlFor="min_gpa">Minimum GPA</Label>
                  <Input 
                    id="min_gpa" 
                    name="min_gpa" 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    max="4.00" 
                    placeholder="e.g., 3.5" 
                  />
                  <p className="text-xs text-gray-500 mt-1">Range: 0.00 - 4.00</p>
                </div>
                
                <div>
                  <Label htmlFor="letters_of_recommendation">Letters of Recommendation</Label>
                  <Input 
                    id="letters_of_recommendation" 
                    name="letters_of_recommendation" 
                    type="number" 
                    step="1" 
                    min="0" 
                    max="10" 
                    placeholder="e.g., 2" 
                  />
                  <p className="text-xs text-gray-500 mt-1">Range: 0 - 10</p>
                </div>
                
                <div>
                  <Label htmlFor="application_fee">Application Fee</Label>
                  <Input 
                    id="application_fee" 
                    name="application_fee" 
                    type="number" 
                    step="1" 
                    min="0" 
                    placeholder="e.g., 100" 
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum: 0</p>
                </div>
                
                <div>
                  <Label htmlFor="application_deadline">Application Deadline</Label>
                  <Input id="application_deadline" name="application_deadline" type="date" />
                </div>
                
                <div>
                  <Label htmlFor="other_tests">Other Tests</Label>
                  <Input id="other_tests" name="other_tests" placeholder="e.g., GMAT, SAT" />
                </div>
                
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="requires_personal_statement" name="requires_personal_statement" />
                    <Label htmlFor="requires_personal_statement">Personal Statement Required</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="requires_portfolio" name="requires_portfolio" />
                    <Label htmlFor="requires_portfolio">Portfolio Required</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="requires_cv" name="requires_cv" />
                    <Label htmlFor="requires_cv">CV/Resume Required</Label>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <Button type="submit" className="w-full">Add Program</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Search Programs */}
      <AdminSearchCard 
        placeholder={searchConfigs.programs.placeholder}
        helpText={searchConfigs.programs.helpText}
      />

      {/* Programs List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {search ? `Search Results (${programs.length})` : `All Programs (${programs.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProgramsManagementClient initialPrograms={programs} schools={schools} />
        </CardContent>
      </Card>
    </div>
  )
}