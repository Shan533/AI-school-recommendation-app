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

export default function CSVUpload() {
  const [uploading, setUploading] = useState(false)
  const [uploadResults, setUploadResults] = useState<{
    success: number
    errors: string[]
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
          const errors: string[] = []

          for (const [index, school] of schools.entries()) {
            try {
              const response = await fetch('/api/admin/schools', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  name: school.name,
                  initial: school.initial,
                  type: school.type,
                  region: school.region ?? school.country,
                  location: school.location,
                  year_founded: school.year_founded ? parseInt(school.year_founded) : null,
                  qs_ranking: school.qs_ranking ? parseInt(school.qs_ranking) : null,
                  website_url: school.website_url,
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

          setUploadResults({ success: successCount, errors })
          setUploading(false)
        },
        error: (error) => {
          setUploadResults({ success: 0, errors: [`CSV parsing error: ${error.message}`] })
          setUploading(false)
        }
      })
    } catch (error) {
      setUploadResults({ 
        success: 0, 
        errors: [`Upload error: ${error instanceof Error ? error.message : 'Unknown error'}`] 
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
          const errors: string[] = []

          for (const [index, program] of programs.entries()) {
            try {
              const response = await fetch('/api/admin/programs', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  name: program.name,
                  initial: program.initial,
                  school_id: program.school_id,
                  degree: program.degree,
                  website_url: program.website_url,
                  duration_years: program.duration_years ? parseFloat(program.duration_years) : null,
                  currency: program.currency,
                  total_tuition: program.total_tuition ? parseInt(program.total_tuition) : null,
                  is_stem: program.is_stem === 'true' || program.is_stem === '1',
                  description: program.description,
                  credits: program.credits ? parseInt(program.credits) : null,
                  delivery_method: program.delivery_method,
                  schedule_type: program.schedule_type,
                  location: program.location,
                  add_ons: program.add_ons ? (() => {
                    try {
                      return JSON.parse(program.add_ons)
                    } catch (e) {
                      console.error('Invalid JSON in add_ons:', e)
                      return null
                    }
                  })() : null,
                  start_date: program.start_date,
                  // Requirements fields
                  ielts_score: program.ielts_score ? parseFloat(program.ielts_score) : null,
                  toefl_score: program.toefl_score ? parseFloat(program.toefl_score) : null,
                  gre_score: program.gre_score ? parseInt(program.gre_score) : null,
                  min_gpa: program.min_gpa ? parseFloat(program.min_gpa) : null,
                  other_tests: program.other_tests,
                  requires_personal_statement: program.requires_personal_statement === 'true' || program.requires_personal_statement === '1',
                  requires_portfolio: program.requires_portfolio === 'true' || program.requires_portfolio === '1',
                  requires_cv: program.requires_cv === 'true' || program.requires_cv === '1',
                  letters_of_recommendation: program.letters_of_recommendation ? parseInt(program.letters_of_recommendation) : null,
                  application_fee: program.application_fee ? parseInt(program.application_fee) : null,
                  application_deadline: program.application_deadline,
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

          setUploadResults({ success: successCount, errors })
          setUploading(false)
        },
        error: (error) => {
          setUploadResults({ success: 0, errors: [`CSV parsing error: ${error.message}`] })
          setUploading(false)
        }
      })
    } catch (error) {
      setUploadResults({ 
        success: 0, 
        errors: [`Upload error: ${error instanceof Error ? error.message : 'Unknown error'}`] 
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
                <li>type</li>
                <li>region (enum: United States, United Kingdom, Canada, Europe, Asia, Australia, Other)</li>
                <li>location</li>
                <li>year_founded (number)</li>
                <li>qs_ranking (number)</li>
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
                    <li>degree (required)</li>
                    <li>description</li>
                    <li>website_url</li>
                  </ul>
                </div>
                
                <div>
                  <p className="font-medium">Program Details:</p>
                  <ul className="list-disc list-inside ml-2">
                    <li>duration_years (number, e.g., 1.5)</li>
                    <li>credits (number)</li>
                    <li>delivery_method (Onsite/Online/Hybrid)</li>
                    <li>schedule_type (Full-time/Part-time)</li>
                    <li>location</li>
                    <li>start_date (YYYY-MM-DD)</li>
                    <li>is_stem (true/false or 1/0)</li>
                    <li>add_ons (JSON string)</li>
                  </ul>
                </div>
                
                <div>
                  <p className="font-medium">Financial:</p>
                  <ul className="list-disc list-inside ml-2">
                    <li>currency</li>
                    <li>total_tuition (number)</li>
                  </ul>
                </div>
                
                <div>
                  <p className="font-medium">Requirements:</p>
                  <ul className="list-disc list-inside ml-2">
                    <li>ielts_score, toefl_score, gre_score (numbers)</li>
                    <li>min_gpa (number)</li>
                    <li>other_tests</li>
                    <li>requires_personal_statement, requires_portfolio, requires_cv (true/false)</li>
                    <li>letters_of_recommendation (number)</li>
                    <li>application_fee (number)</li>
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
            <p className="text-green-600 font-medium mb-2">
              Successfully uploaded: {uploadResults.success} records
            </p>
            
            {uploadResults.errors.length > 0 && (
              <div>
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