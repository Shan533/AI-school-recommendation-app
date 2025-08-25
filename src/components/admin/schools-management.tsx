'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface School {
  id: string
  name: string
  initial?: string
  type?: string
  country?: string
  location?: string
  year_founded?: number
  qs_ranking?: number
  website_url?: string
}

interface SchoolsManagementProps {
  initialSchools: School[]
}

export default function SchoolsManagement({ initialSchools }: SchoolsManagementProps) {
  const [schools, setSchools] = useState<School[]>(initialSchools)
  const [editingSchool, setEditingSchool] = useState<School | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [schoolToDelete, setSchoolToDelete] = useState<School | null>(null)
  const [loading, setLoading] = useState(false)

  const handleEditSchool = async (formData: FormData) => {
    if (!editingSchool) return

    setLoading(true)
    try {
      const schoolData = {
        name: formData.get('name') as string,
        initial: formData.get('initial') as string,
        type: formData.get('type') as string,
        country: formData.get('country') as string,
        location: formData.get('location') as string,
        year_founded: formData.get('year_founded') ? parseInt(formData.get('year_founded') as string) : null,
        qs_ranking: formData.get('qs_ranking') ? parseInt(formData.get('qs_ranking') as string) : null,
        website_url: formData.get('website_url') as string,
      }

      const response = await fetch(`/api/admin/schools/${editingSchool.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schoolData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update school')
      }

      const updatedSchool = await response.json()
      setSchools(schools.map(school => 
        school.id === editingSchool.id ? updatedSchool : school
      ))
      
      setIsEditDialogOpen(false)
      setEditingSchool(null)
    } catch (error) {
      console.error('Error updating school:', error)
      alert('Failed to update school. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSchool = async () => {
    if (!schoolToDelete) return

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/schools/${schoolToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete school')
      }

      setSchools(schools.filter(school => school.id !== schoolToDelete.id))
      setIsDeleteDialogOpen(false)
      setSchoolToDelete(null)
    } catch (error) {
      console.error('Error deleting school:', error)
      alert('Failed to delete school. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const openEditDialog = (school: School) => {
    setEditingSchool(school)
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (school: School) => {
    setSchoolToDelete(school)
    setIsDeleteDialogOpen(true)
  }

  return (
    <>
      {/* Schools List */}
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
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openEditDialog(school)}
                      disabled={loading}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => openDeleteDialog(school)}
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
        <p className="text-center text-gray-500 py-8">No schools found. Add your first school above.</p>
      )}

      {/* Edit School Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit School</DialogTitle>
          </DialogHeader>
          {editingSchool && (
            <form action={handleEditSchool} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">School Name *</Label>
                <Input 
                  id="edit-name" 
                  name="name" 
                  defaultValue={editingSchool.name}
                  required 
                />
              </div>
              
              <div>
                <Label htmlFor="edit-initial">Abbreviation</Label>
                <Input 
                  id="edit-initial" 
                  name="initial" 
                  defaultValue={editingSchool.initial || ''}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-type">Type</Label>
                <Input 
                  id="edit-type" 
                  name="type" 
                  placeholder="e.g., University" 
                  defaultValue={editingSchool.type || ''}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-country">Country</Label>
                <Input 
                  id="edit-country" 
                  name="country" 
                  defaultValue={editingSchool.country || ''}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-location">Location</Label>
                <Input 
                  id="edit-location" 
                  name="location" 
                  placeholder="City, State" 
                  defaultValue={editingSchool.location || ''}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-year_founded">Year Founded</Label>
                <Input 
                  id="edit-year_founded" 
                  name="year_founded" 
                  type="number" 
                  step="1" 
                  min="1000" 
                  max="2025" 
                  placeholder="e.g., 1865" 
                  defaultValue={editingSchool.year_founded || ''}
                />
                <p className="text-xs text-gray-500 mt-1">Range: 1000 - 2025</p>
              </div>
              
              <div>
                <Label htmlFor="edit-qs_ranking">QS Ranking</Label>
                <Input 
                  id="edit-qs_ranking" 
                  name="qs_ranking" 
                  type="number" 
                  step="1" 
                  min="1" 
                  max="2000" 
                  placeholder="e.g., 50" 
                  defaultValue={editingSchool.qs_ranking || ''}
                />
                <p className="text-xs text-gray-500 mt-1">Range: 1 - 2000</p>
              </div>
              
              <div>
                <Label htmlFor="edit-website_url">Website URL</Label>
                <Input 
                  id="edit-website_url" 
                  name="website_url" 
                  type="url" 
                  defaultValue={editingSchool.website_url || ''}
                />
              </div>
              
              <div className="md:col-span-2 flex gap-2 justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update School'}
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
          {schoolToDelete && (
            <div className="space-y-4">
              <p>
                Are you sure you want to delete <strong>{schoolToDelete.name}</strong>?
              </p>
              <p className="text-sm text-gray-600">
                This action cannot be undone. The school will be permanently removed from the system.
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
                  onClick={handleDeleteSchool}
                  disabled={loading}
                >
                  {loading ? 'Deleting...' : 'Delete School'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
