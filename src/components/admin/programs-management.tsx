'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface School {
  id: string
  name: string
  initial?: string
}

interface Requirements {
  id: string
  ielts_score?: number
  toefl_score?: number
  gre_score?: number
  min_gpa?: number
  other_tests?: string
  requires_personal_statement?: boolean
  requires_portfolio?: boolean
  requires_cv?: boolean
  letters_of_recommendation?: number
  application_fee?: number
  application_deadline?: string
}

interface Program {
  id: string
  name: string
  initial?: string
  school_id: string
  degree: string
  website_url?: string
  duration_years?: number
  currency?: string
  total_tuition?: number
  is_stem: boolean
  description?: string
  credits?: number
  delivery_method?: string
  schedule_type?: string
  location?: string
  add_ons?: Record<string, unknown>
  start_date?: string
  schools?: School
  requirements?: Requirements
}

interface ProgramsManagementProps {
  initialPrograms: Program[]
  schools: School[]
}

export default function ProgramsManagement({ initialPrograms, schools }: ProgramsManagementProps) {
  const [programs, setPrograms] = useState<Program[]>(initialPrograms)
  const [editingProgram, setEditingProgram] = useState<Program | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [programToDelete, setProgramToDelete] = useState<Program | null>(null)
  const [loading, setLoading] = useState(false)

  const handleEditProgram = async (formData: FormData) => {
    if (!editingProgram) return

    setLoading(true)
    try {
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
        // Requirements
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

      const response = await fetch(`/api/admin/programs/${editingProgram.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(programData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update program')
      }

      await response.json()
      
      // Fetch the updated program with relations
      const programResponse = await fetch(`/api/admin/programs/${editingProgram.id}`)
      const fullProgram = await programResponse.json()
      
      setPrograms(programs.map(program => 
        program.id === editingProgram.id ? fullProgram : program
      ))
      
      setIsEditDialogOpen(false)
      setEditingProgram(null)
    } catch (error) {
      console.error('Error updating program:', error)
      alert('Failed to update program. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProgram = async () => {
    if (!programToDelete) return

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/programs/${programToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete program')
      }

      setPrograms(programs.filter(program => program.id !== programToDelete.id))
      setIsDeleteDialogOpen(false)
      setProgramToDelete(null)
    } catch (error) {
      console.error('Error deleting program:', error)
      alert('Failed to delete program. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const openEditDialog = (program: Program) => {
    setEditingProgram(program)
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (program: Program) => {
    setProgramToDelete(program)
    setIsDeleteDialogOpen(true)
  }

  return (
    <>
      {/* Programs List */}
      {programs.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[25%]">Program Name</TableHead>
              <TableHead className="w-[20%]">School</TableHead>
              <TableHead className="w-[12%]">Degree</TableHead>
              <TableHead className="w-[10%]">Duration</TableHead>
              <TableHead className="w-[12%]">Delivery</TableHead>
              <TableHead className="w-[8%]">STEM</TableHead>
              <TableHead className="w-[13%]">Requirements</TableHead>
              <TableHead className="w-[20%]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {programs.map((program) => (
              <TableRow key={program.id}>
                <TableCell className="font-medium max-w-0">
                  <div className="truncate" title={`${program.name} ${program.initial ? `(${program.initial})` : ''}`}>
                    {program.name} {program.initial && `(${program.initial})`}
                  </div>
                </TableCell>
                <TableCell className="max-w-0">
                  <div className="truncate" title={`${program.schools?.name || ''} ${program.schools?.initial ? `(${program.schools.initial})` : ''}`}>
                    {program.schools?.name} {program.schools?.initial && `(${program.schools.initial})`}
                  </div>
                </TableCell>
                <TableCell className="max-w-0">
                  <div className="truncate" title={program.degree}>
                    {program.degree}
                  </div>
                </TableCell>
                <TableCell>
                  {program.duration_years ? `${program.duration_years} years` : '-'}
                </TableCell>
                <TableCell className="max-w-0">
                  <div className="truncate" title={program.delivery_method || '-'}>
                    {program.delivery_method || '-'}
                  </div>
                </TableCell>
                <TableCell>{program.is_stem ? 'Yes' : 'No'}</TableCell>
                <TableCell className="max-w-0">
                  {program.requirements ? (
                    <div className="text-sm truncate" title={
                      `${program.requirements.ielts_score ? `IELTS: ${program.requirements.ielts_score}` : ''}${program.requirements.toefl_score ? `, TOEFL: ${program.requirements.toefl_score}` : ''}${program.requirements.min_gpa ? `, GPA: ${program.requirements.min_gpa}` : ''}`
                    }>
                      {program.requirements.ielts_score && `IELTS: ${program.requirements.ielts_score}`}
                      {program.requirements.toefl_score && (program.requirements.ielts_score ? ', ' : '') + `TOEFL: ${program.requirements.toefl_score}`}
                      {program.requirements.min_gpa && (program.requirements.ielts_score || program.requirements.toefl_score ? ', ' : '') + `GPA: ${program.requirements.min_gpa}`}
                    </div>
                  ) : '-'}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openEditDialog(program)}
                      disabled={loading}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => openDeleteDialog(program)}
                      disabled={loading}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-center text-gray-500 py-8">No programs found. Add your first program above.</p>
      )}

      {/* Edit Program Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Program</DialogTitle>
          </DialogHeader>
          {editingProgram && (
            <form action={handleEditProgram} className="space-y-6">
              {/* Basic Program Information */}
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-name">Program Name *</Label>
                    <Input 
                      id="edit-name" 
                      name="name" 
                      defaultValue={editingProgram.name}
                      required 
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-initial">Abbreviation</Label>
                    <Input 
                      id="edit-initial" 
                      name="initial" 
                      defaultValue={editingProgram.initial || ''}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-school_id">School *</Label>
                    <select 
                      id="edit-school_id" 
                      name="school_id" 
                      required 
                      className="w-full p-2 border border-gray-300 rounded-md"
                      defaultValue={editingProgram.school_id}
                    >
                      <option value="">Select a school</option>
                      {schools.map((school) => (
                        <option key={school.id} value={school.id}>
                          {school.name} {school.initial && `(${school.initial})`}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-degree">Degree *</Label>
                    <Input 
                      id="edit-degree" 
                      name="degree" 
                      placeholder="e.g., MS, PhD, BS" 
                      defaultValue={editingProgram.degree}
                      required 
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea 
                      id="edit-description" 
                      name="description" 
                      rows={3} 
                      defaultValue={editingProgram.description || ''}
                    />
                  </div>
                </div>
              </div>

              {/* Program Details */}
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Program Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-duration_years">Duration (years)</Label>
                    <Input 
                      id="edit-duration_years" 
                      name="duration_years" 
                      type="number" 
                      step="0.5" 
                      min="0.5" 
                      max="8.0" 
                      placeholder="e.g., 1.5" 
                      defaultValue={editingProgram.duration_years || ''}
                    />
                    <p className="text-xs text-gray-500 mt-1">Range: 0.5 - 8.0 years, step: 0.5</p>
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-credits">Total Credits</Label>
                    <Input 
                      id="edit-credits" 
                      name="credits" 
                      type="number" 
                      step="1" 
                      min="1" 
                      max="200" 
                      placeholder="e.g., 36" 
                      defaultValue={editingProgram.credits || ''}
                    />
                    <p className="text-xs text-gray-500 mt-1">Range: 1 - 200 credits</p>
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-delivery_method">Delivery Method</Label>
                    <select 
                      id="edit-delivery_method" 
                      name="delivery_method" 
                      className="w-full p-2 border border-gray-300 rounded-md"
                      defaultValue={editingProgram.delivery_method || ''}
                    >
                      <option value="">Select delivery method</option>
                      <option value="Onsite">Onsite</option>
                      <option value="Online">Online</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-schedule_type">Schedule Type</Label>
                    <select 
                      id="edit-schedule_type" 
                      name="schedule_type" 
                      className="w-full p-2 border border-gray-300 rounded-md"
                      defaultValue={editingProgram.schedule_type || ''}
                    >
                      <option value="">Select schedule type</option>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-location">Program Location</Label>
                    <Input 
                      id="edit-location" 
                      name="location" 
                      placeholder="If different from school location" 
                      defaultValue={editingProgram.location || ''}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-start_date">Start Date</Label>
                    <Input 
                      id="edit-start_date" 
                      name="start_date" 
                      type="date" 
                      defaultValue={editingProgram.start_date || ''}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="edit-is_stem" 
                      name="is_stem" 
                      defaultChecked={editingProgram.is_stem}
                    />
                    <Label htmlFor="edit-is_stem">STEM Designated</Label>
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-website_url">Website URL</Label>
                    <Input 
                      id="edit-website_url" 
                      name="website_url" 
                      type="url" 
                      defaultValue={editingProgram.website_url || ''}
                    />
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Financial Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-currency">Currency</Label>
                    <Input 
                      id="edit-currency" 
                      name="currency" 
                      placeholder="e.g., USD, EUR" 
                      defaultValue={editingProgram.currency || ''}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-total_tuition">Total Tuition</Label>
                    <Input 
                      id="edit-total_tuition" 
                      name="total_tuition" 
                      type="number" 
                      step="100" 
                      min="0" 
                      placeholder="e.g., 50000" 
                      defaultValue={editingProgram.total_tuition || ''}
                    />
                    <p className="text-xs text-gray-500 mt-1">Minimum: 0, step: 100</p>
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label htmlFor="edit-add_ons">Add-ons (JSON format)</Label>
                    <Textarea 
                      id="edit-add_ons" 
                      name="add_ons" 
                      rows={2} 
                      placeholder='{"scholarships": ["Merit-based", "Need-based"], "features": ["Career services"]}'
                      defaultValue={editingProgram.add_ons ? JSON.stringify(editingProgram.add_ons) : ''}
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
                    <Label htmlFor="edit-ielts_score">IELTS Score</Label>
                    <Input 
                      id="edit-ielts_score" 
                      name="ielts_score" 
                      type="number" 
                      step="0.5" 
                      min="0" 
                      max="9" 
                      placeholder="e.g., 6.5" 
                      defaultValue={editingProgram.requirements?.ielts_score || ''}
                    />
                    <p className="text-xs text-gray-500 mt-1">Range: 0.0 - 9.0, step: 0.5</p>
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-toefl_score">TOEFL Score</Label>
                    <Input 
                      id="edit-toefl_score" 
                      name="toefl_score" 
                      type="number" 
                      step="1" 
                      min="0" 
                      max="120" 
                      placeholder="e.g., 80" 
                      defaultValue={editingProgram.requirements?.toefl_score || ''}
                    />
                    <p className="text-xs text-gray-500 mt-1">Range: 0 - 120</p>
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-gre_score">GRE Score</Label>
                    <Input 
                      id="edit-gre_score" 
                      name="gre_score" 
                      type="number" 
                      step="1" 
                      min="260" 
                      max="340" 
                      placeholder="e.g., 320" 
                      defaultValue={editingProgram.requirements?.gre_score || ''}
                    />
                    <p className="text-xs text-gray-500 mt-1">Range: 260 - 340</p>
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-min_gpa">Minimum GPA</Label>
                    <Input 
                      id="edit-min_gpa" 
                      name="min_gpa" 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      max="4.00" 
                      placeholder="e.g., 3.5" 
                      defaultValue={editingProgram.requirements?.min_gpa || ''}
                    />
                    <p className="text-xs text-gray-500 mt-1">Range: 0.00 - 4.00</p>
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-letters_of_recommendation">Letters of Recommendation</Label>
                    <Input 
                      id="edit-letters_of_recommendation" 
                      name="letters_of_recommendation" 
                      type="number" 
                      step="1" 
                      min="0" 
                      max="10" 
                      placeholder="e.g., 2" 
                      defaultValue={editingProgram.requirements?.letters_of_recommendation || ''}
                    />
                    <p className="text-xs text-gray-500 mt-1">Range: 0 - 10</p>
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-application_fee">Application Fee</Label>
                    <Input 
                      id="edit-application_fee" 
                      name="application_fee" 
                      type="number" 
                      step="1" 
                      min="0" 
                      placeholder="e.g., 100" 
                      defaultValue={editingProgram.requirements?.application_fee || ''}
                    />
                    <p className="text-xs text-gray-500 mt-1">Minimum: 0</p>
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-application_deadline">Application Deadline</Label>
                    <Input 
                      id="edit-application_deadline" 
                      name="application_deadline" 
                      type="date" 
                      defaultValue={editingProgram.requirements?.application_deadline || ''}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-other_tests">Other Tests</Label>
                    <Input 
                      id="edit-other_tests" 
                      name="other_tests" 
                      placeholder="e.g., GMAT, SAT" 
                      defaultValue={editingProgram.requirements?.other_tests || ''}
                    />
                  </div>
                  
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="edit-requires_personal_statement" 
                        name="requires_personal_statement" 
                        defaultChecked={editingProgram.requirements?.requires_personal_statement || false}
                      />
                      <Label htmlFor="edit-requires_personal_statement">Personal Statement Required</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="edit-requires_portfolio" 
                        name="requires_portfolio" 
                        defaultChecked={editingProgram.requirements?.requires_portfolio || false}
                      />
                      <Label htmlFor="edit-requires_portfolio">Portfolio Required</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="edit-requires_cv" 
                        name="requires_cv" 
                        defaultChecked={editingProgram.requirements?.requires_cv || false}
                      />
                      <Label htmlFor="edit-requires_cv">CV/Resume Required</Label>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Program'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          {programToDelete && (
            <div className="space-y-4">
              <p>
                Are you sure you want to delete <strong>{programToDelete.name}</strong>?
              </p>
              <p className="text-sm text-gray-600">
                This action cannot be undone. The program and its requirements will be permanently removed from the system.
              </p>
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setIsDeleteDialogOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteProgram}
                  disabled={loading}
                >
                  {loading ? 'Deleting...' : 'Delete Program'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
