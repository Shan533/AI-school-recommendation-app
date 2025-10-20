'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Papa from 'papaparse'
import Link from 'next/link'

interface CSVRow {
  [key: string]: string
}

// Valid values for school types (normalized)
const VALID_SCHOOL_TYPES = ['Public', 'Private', 'Art & Design', 'Community College']

// Valid values for regions
const VALID_REGIONS = ['United States', 'United Kingdom', 'Canada', 'Europe', 'Asia', 'Australia', 'Other']

// Valid values for program degrees (normalized)
const VALID_DEGREES = ['Bachelor', 'Master', 'PhD', 'Associate', 'Certificate', 'Diploma']

// Valid values for delivery methods
const VALID_DELIVERY_METHODS = ['Onsite', 'Online', 'Hybrid']

// Valid values for schedule types
const VALID_SCHEDULE_TYPES = ['Full-time', 'Part-time']

// Valid values for application difficulty
const VALID_APPLICATION_DIFFICULTY = ['SSR', 'SR', 'R', 'N']

// Helper function to check for duplicate schools
const checkDuplicateSchool = async (schoolName: string, schoolInitial?: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/admin/schools?search=${encodeURIComponent(schoolName)}&limit=10`)
    if (!response.ok) return false
    
    const data = await response.json()
    const schools = data.schools || []
    
    // Check for exact name match or initial match
    return schools.some((school: { name: string; initial?: string }) => 
      school.name.toLowerCase() === schoolName.toLowerCase() ||
      (schoolInitial && school.initial && school.initial.toLowerCase() === schoolInitial.toLowerCase())
    )
  } catch (error) {
    console.error('Error checking duplicate school:', error)
    return false
  }
}

// Helper function to check for duplicate programs
const checkDuplicateProgram = async (programName: string, schoolId: string, programInitial?: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/admin/programs?search=${encodeURIComponent(programName)}&limit=10`)
    if (!response.ok) return false
    
    const data = await response.json()
    const programs = data.programs || []
    
    // Check for exact name match with same school, or initial match
    return programs.some((program: { school_id: string; name: string; initial?: string }) => 
      program.school_id === schoolId && (
        program.name.toLowerCase() === programName.toLowerCase() ||
        (programInitial && program.initial && program.initial.toLowerCase() === programInitial.toLowerCase())
      )
    )
  } catch (error) {
    console.error('Error checking duplicate program:', error)
    return false
  }
}

export default function CSVUpload() {
  const [uploading, setUploading] = useState(false)
  const [uploadResults, setUploadResults] = useState<{
    success: number
    errors: string[]
    duplicates: number
    skipped: number
  } | null>(null)

  const handleSchoolsUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadResults(null)

    try {
      Papa.parse(file, {
        header: true,
        complete: async (results) => {
          const schools = results.data as CSVRow[]
          let successCount = 0
          let duplicateCount = 0
          let skippedCount = 0
          const errors: string[] = []

          for (const [index, school] of schools.entries()) {
            try {
              // Validate required fields
              if (!school.name?.trim()) {
                errors.push(`Row ${index + 1}: School name is required`)
                skippedCount++
                continue
              }

              // Validate school type if provided
              if (school.type && !VALID_SCHOOL_TYPES.includes(school.type.trim())) {
                errors.push(`Row ${index + 1}: Invalid school type. Must be one of: ${VALID_SCHOOL_TYPES.join(', ')}`)
                skippedCount++
                continue
              }

              // Validate region if provided
              if (school.region && !VALID_REGIONS.includes(school.region.trim())) {
                errors.push(`Row ${index + 1}: Invalid region. Must be one of: ${VALID_REGIONS.join(', ')}`)
                skippedCount++
                continue
              }

              // Validate year_founded if provided
              if (school.year_founded && (isNaN(parseInt(school.year_founded)) || parseInt(school.year_founded) < 1000 || parseInt(school.year_founded) > new Date().getFullYear())) {
                errors.push(`Row ${index + 1}: Invalid year_founded. Must be a valid year between 1000 and ${new Date().getFullYear()}`)
                skippedCount++
                continue
              }

              // Validate qs_ranking if provided
              if (school.qs_ranking && (isNaN(parseInt(school.qs_ranking)) || parseInt(school.qs_ranking) < 1)) {
                errors.push(`Row ${index + 1}: Invalid qs_ranking. Must be a positive integer`)
                skippedCount++
                continue
              }

              // Check for duplicates
              const isDuplicate = await checkDuplicateSchool(school.name.trim(), school.initial?.trim())
              if (isDuplicate) {
                duplicateCount++
                errors.push(`Row ${index + 1}: Duplicate school found - "${school.name.trim()}" already exists`)
                continue
              }

              const response = await fetch('/api/admin/schools', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  name: school.name.trim(),
                  initial: school.initial?.trim() || null,
                  type: school.type?.trim() || null,
                  region: school.region?.trim() || school.country?.trim() || null,
                  location: school.location?.trim() || null,
                  year_founded: school.year_founded ? parseInt(school.year_founded) : null,
                  qs_ranking: school.qs_ranking ? parseInt(school.qs_ranking) : null,
                  website_url: school.website_url?.trim() || null,
                }),
              })

              if (response.ok) {
                successCount++
              } else {
                const error = await response.text()
                errors.push(`Row ${index + 1}: ${error}`)
              }
            } catch (error) {
              errors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
            }
          }

          setUploadResults({ success: successCount, errors, duplicates: duplicateCount, skipped: skippedCount })
          setUploading(false)
        },
        error: (error) => {
          setUploadResults({ success: 0, errors: [`CSV parsing error: ${error.message}`], duplicates: 0, skipped: 0 })
          setUploading(false)
        }
      })
    } catch (error) {
      setUploadResults({ 
        success: 0, 
        errors: [`Upload error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        duplicates: 0,
        skipped: 0
      })
      setUploading(false)
    }
  }

  const handleProgramsUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadResults(null)

    try {
      Papa.parse(file, {
        header: true,
        complete: async (results) => {
          const programs = results.data as CSVRow[]
          let successCount = 0
          let duplicateCount = 0
          let skippedCount = 0
          const errors: string[] = []

          for (const [index, program] of programs.entries()) {
            try {
              // Validate required fields
              if (!program.name?.trim()) {
                errors.push(`Row ${index + 1}: Program name is required`)
                skippedCount++
                continue
              }

              if (!program.school_id?.trim()) {
                errors.push(`Row ${index + 1}: School ID is required`)
                skippedCount++
                continue
              }

              if (!program.degree?.trim()) {
                errors.push(`Row ${index + 1}: Degree is required`)
                skippedCount++
                continue
              }

              // Validate degree if provided
              if (program.degree && !VALID_DEGREES.includes(program.degree.trim())) {
                errors.push(`Row ${index + 1}: Invalid degree. Must be one of: ${VALID_DEGREES.join(', ')}`)
                skippedCount++
                continue
              }

              // Validate delivery_method if provided
              if (program.delivery_method && !VALID_DELIVERY_METHODS.includes(program.delivery_method.trim())) {
                errors.push(`Row ${index + 1}: Invalid delivery_method. Must be one of: ${VALID_DELIVERY_METHODS.join(', ')}`)
                skippedCount++
                continue
              }

              // Validate schedule_type if provided
              if (program.schedule_type && !VALID_SCHEDULE_TYPES.includes(program.schedule_type.trim())) {
                errors.push(`Row ${index + 1}: Invalid schedule_type. Must be one of: ${VALID_SCHEDULE_TYPES.join(', ')}`)
                skippedCount++
                continue
              }

              // Validate application_difficulty if provided
              if (program.application_difficulty && !VALID_APPLICATION_DIFFICULTY.includes(program.application_difficulty.trim())) {
                errors.push(`Row ${index + 1}: Invalid application_difficulty. Must be one of: ${VALID_APPLICATION_DIFFICULTY.join(', ')}`)
                skippedCount++
                continue
              }

              // Validate numeric fields
              if (program.duration_years && (isNaN(parseFloat(program.duration_years)) || parseFloat(program.duration_years) <= 0)) {
                errors.push(`Row ${index + 1}: Invalid duration_years. Must be a positive number`)
                skippedCount++
                continue
              }

              if (program.credits && (isNaN(parseInt(program.credits)) || parseInt(program.credits) < 0)) {
                errors.push(`Row ${index + 1}: Invalid credits. Must be a non-negative integer`)
                skippedCount++
                continue
              }

              if (program.total_tuition && (isNaN(parseInt(program.total_tuition)) || parseInt(program.total_tuition) < 0)) {
                errors.push(`Row ${index + 1}: Invalid total_tuition. Must be a non-negative integer`)
                skippedCount++
                continue
              }

              // Validate test scores
              if (program.ielts_score && (isNaN(parseFloat(program.ielts_score)) || parseFloat(program.ielts_score) < 0 || parseFloat(program.ielts_score) > 9)) {
                errors.push(`Row ${index + 1}: Invalid ielts_score. Must be between 0 and 9`)
                skippedCount++
                continue
              }

              if (program.toefl_score && (isNaN(parseFloat(program.toefl_score)) || parseFloat(program.toefl_score) < 0 || parseFloat(program.toefl_score) > 120)) {
                errors.push(`Row ${index + 1}: Invalid toefl_score. Must be between 0 and 120`)
                skippedCount++
                continue
              }

              if (program.gre_score && (isNaN(parseInt(program.gre_score)) || parseInt(program.gre_score) < 260 || parseInt(program.gre_score) > 340)) {
                errors.push(`Row ${index + 1}: Invalid gre_score. Must be between 260 and 340`)
                skippedCount++
                continue
              }

              if (program.min_gpa && (isNaN(parseFloat(program.min_gpa)) || parseFloat(program.min_gpa) < 0 || parseFloat(program.min_gpa) > 4)) {
                errors.push(`Row ${index + 1}: Invalid min_gpa. Must be between 0 and 4`)
                skippedCount++
                continue
              }

              // Validate add_ons JSON
              let addOns = null
              if (program.add_ons?.trim()) {
                try {
                  addOns = JSON.parse(program.add_ons)
                } catch {
                  errors.push(`Row ${index + 1}: Invalid add_ons JSON format`)
                  skippedCount++
                  continue
                }
              }

              // Check for duplicates
              const isDuplicate = await checkDuplicateProgram(program.name.trim(), program.school_id.trim(), program.initial?.trim())
              if (isDuplicate) {
                duplicateCount++
                errors.push(`Row ${index + 1}: Duplicate program found - "${program.name.trim()}" already exists for this school`)
                continue
              }

              const response = await fetch('/api/admin/programs', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  name: program.name.trim(),
                  initial: program.initial?.trim() || null,
                  school_id: program.school_id.trim(),
                  degree: program.degree.trim(),
                  website_url: program.website_url?.trim() || null,
                  duration_years: program.duration_years ? parseFloat(program.duration_years) : null,
                  currency: program.currency?.trim() || null,
                  total_tuition: program.total_tuition ? parseInt(program.total_tuition) : null,
                  is_stem: program.is_stem?.trim() === 'true' || program.is_stem?.trim() === '1' || program.is_stem?.trim() === 'Y' || program.is_stem?.trim() === 'y',
                  description: program.description?.trim() || null,
                  credits: program.credits ? parseInt(program.credits) : null,
                  delivery_method: program.delivery_method?.trim() || null,
                  schedule_type: program.schedule_type?.trim() || null,
                  location: program.location?.trim() || null,
                  application_difficulty: program.application_difficulty?.trim() || null,
                  difficulty_description: program.difficulty_description?.trim() || null,
                  add_ons: addOns,
                  start_date: program.start_date?.trim() || null,
                  // Requirements fields
                  ielts_score: program.ielts_score ? parseFloat(program.ielts_score) : null,
                  toefl_score: program.toefl_score ? parseFloat(program.toefl_score) : null,
                  gre_score: program.gre_score ? parseInt(program.gre_score) : null,
                  min_gpa: program.min_gpa ? parseFloat(program.min_gpa) : null,
                  other_tests: program.other_tests?.trim() || null,
                  requires_personal_statement: program.requires_personal_statement?.trim() === 'true' || program.requires_personal_statement?.trim() === '1' || program.requires_personal_statement?.trim() === 'Y' || program.requires_personal_statement?.trim() === 'y',
                  requires_portfolio: program.requires_portfolio?.trim() === 'true' || program.requires_portfolio?.trim() === '1' || program.requires_portfolio?.trim() === 'Y' || program.requires_portfolio?.trim() === 'y',
                  requires_cv: program.requires_cv?.trim() === 'true' || program.requires_cv?.trim() === '1' || program.requires_cv?.trim() === 'Y' || program.requires_cv?.trim() === 'y',
                  letters_of_recommendation: program.letters_of_recommendation ? parseInt(program.letters_of_recommendation) : null,
                  application_fee: program.application_fee ? parseInt(program.application_fee) : null,
                  application_deadline: program.application_deadline?.trim() || null,
                }),
              })

              if (response.ok) {
                successCount++
              } else {
                const error = await response.text()
                errors.push(`Row ${index + 1}: ${error}`)
              }
            } catch (error) {
              errors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
            }
          }

          setUploadResults({ success: successCount, errors, duplicates: duplicateCount, skipped: skippedCount })
          setUploading(false)
        },
        error: (error) => {
          setUploadResults({ success: 0, errors: [`CSV parsing error: ${error.message}`], duplicates: 0, skipped: 0 })
          setUploading(false)
        }
      })
    } catch (error) {
      setUploadResults({ 
        success: 0, 
        errors: [`Upload error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        duplicates: 0,
        skipped: 0
      })
      setUploading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">CSV Upload</h1>
        <Button asChild variant="outline" className="cursor-pointer">
          <Link href="/admin/dashboard">Back to Dashboard</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Schools CSV Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Schools CSV</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="schools-csv">Select Schools CSV File</Label>
              <Input
                id="schools-csv"
                type="file"
                accept=".csv"
                onChange={handleSchoolsUpload}
                disabled={uploading}
              />
            </div>
            
            <div className="text-sm text-gray-600">
              <p><strong>Expected CSV format for schools:</strong></p>
              <ul className="list-disc list-inside mt-2">
                <li>name (required)</li>
                <li>initial</li>
                <li>type (enum: Public, Private, Art & Design, Community College)</li>
                <li>region (enum: United States, United Kingdom, Canada, Europe, Asia, Australia, Other)</li>
                <li>location</li>
                <li>year_founded (number, 1000-{new Date().getFullYear()})</li>
                <li>qs_ranking (positive integer)</li>
                <li>website_url</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Programs CSV Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Programs CSV</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="programs-csv">Select Programs CSV File</Label>
              <Input
                id="programs-csv"
                type="file"
                accept=".csv"
                onChange={handleProgramsUpload}
                disabled={uploading}
              />
            </div>
            
            <div className="text-sm text-gray-600">
              <p><strong>Expected CSV format for programs:</strong></p>
              <div className="mt-2 space-y-2">
                <div>
                  <p className="font-medium">Basic Fields:</p>
                  <ul className="list-disc list-inside ml-2">
                    <li>name (required)</li>
                    <li>initial</li>
                    <li>school_id (required - UUID of existing school)</li>
                    <li>degree (required; enum: Bachelor, Master, PhD, Associate, Certificate, Diploma)</li>
                    <li>description</li>
                    <li>website_url</li>
                  </ul>
                </div>
                
                <div>
                  <p className="font-medium">Program Details:</p>
                  <ul className="list-disc list-inside ml-2">
                    <li>duration_years (positive number, e.g., 1.5)</li>
                    <li>credits (non-negative integer)</li>
                    <li>delivery_method (enum: Onsite, Online, Hybrid)</li>
                    <li>schedule_type (enum: Full-time, Part-time)</li>
                    <li>location</li>
                    <li>start_date (YYYY-MM-DD)</li>
                    <li>is_stem (true/false, 1/0, Y/N, y/n)</li>
                    <li>add_ons (valid JSON string)</li>
                    <li>application_difficulty (enum: SSR, SR, R, N)</li>
                    <li>difficulty_description</li>
                  </ul>
                </div>
                
                <div>
                  <p className="font-medium">Financial:</p>
                  <ul className="list-disc list-inside ml-2">
                    <li>currency</li>
                    <li>total_tuition (non-negative integer)</li>
                  </ul>
                </div>
                
                <div>
                  <p className="font-medium">Requirements:</p>
                  <ul className="list-disc list-inside ml-2">
                    <li>ielts_score (0-9)</li>
                    <li>toefl_score (0-120)</li>
                    <li>gre_score (260-340)</li>
                    <li>min_gpa (0-4)</li>
                    <li>other_tests</li>
                    <li>requires_personal_statement, requires_portfolio, requires_cv (true/false, 1/0, Y/N, y/n)</li>
                    <li>letters_of_recommendation (non-negative integer)</li>
                    <li>application_fee (non-negative integer)</li>
                    <li>application_deadline (YYYY-MM-DD)</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upload Status */}
      {uploading && (
        <Card className="mt-6">
          <CardContent className="p-6">
            <p className="text-center">Uploading and processing CSV file...</p>
          </CardContent>
        </Card>
      )}

      {/* Upload Results */}
      {uploadResults && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Upload Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-green-600 font-medium">
                Successfully uploaded: {uploadResults.success} records
              </p>
              
              {uploadResults.duplicates > 0 && (
                <p className="text-yellow-600 font-medium">
                  Duplicates skipped: {uploadResults.duplicates} records
                </p>
              )}
              
              {uploadResults.skipped > 0 && (
                <p className="text-blue-600 font-medium">
                  Skipped: {uploadResults.skipped} records
                </p>
              )}
            </div>
            
            {uploadResults.errors.length > 0 && (
              <div className="mt-4">
                <p className="text-red-600 font-medium mb-2">
                  Errors ({uploadResults.errors.length}):
                </p>
                <ul className="list-disc list-inside text-sm text-red-600 max-h-40 overflow-y-auto">
                  {uploadResults.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}