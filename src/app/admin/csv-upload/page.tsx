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
                  country: school.country,
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
                  duration_months: program.duration_months ? parseInt(program.duration_months) : null,
                  currency: program.currency,
                  total_tuition: program.total_tuition ? parseInt(program.total_tuition) : null,
                  is_stem: program.is_stem === 'true' || program.is_stem === '1',
                  description: program.description,
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
        <Button asChild>
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
                <li>country</li>
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
              <ul className="list-disc list-inside mt-2">
                <li>name (required)</li>
                <li>initial</li>
                <li>school_id (required - UUID of existing school)</li>
                <li>degree (required)</li>
                <li>website_url</li>
                <li>duration_months (number)</li>
                <li>currency</li>
                <li>total_tuition (number)</li>
                <li>is_stem (true/false or 1/0)</li>
                <li>description</li>
              </ul>
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