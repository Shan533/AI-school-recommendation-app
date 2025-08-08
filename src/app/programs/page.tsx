import { getSupabaseClient } from '@/lib/supabase/helpers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

async function getPrograms() {
  const supabase = await getSupabaseClient()
  const { data: programs, error } = await supabase
    .from('programs')
    .select(`
      *,
      schools (
        name,
        initial,
        location,
        country
      )
    `)
    .order('name')
  
  if (error) {
    console.error('Error fetching programs:', error)
    return []
  }
  
  return programs || []
}

export default async function ProgramsPage() {
  const programs = await getPrograms()

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Programs</h1>
        <Button asChild>
          <Link href="/">Back to Home</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {programs.length > 0 ? (
          programs.map((program) => (
            <Card key={program.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{program.name}</h3>
                    {program.initial && (
                      <span className="text-sm text-gray-600">({program.initial})</span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {program.is_stem && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        STEM
                      </span>
                    )}
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {program.degree}
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <p><strong>School:</strong> {program.schools?.name}</p>
                  {program.schools?.location && (
                    <p><strong>Location:</strong> {program.schools.location}</p>
                  )}
                  {program.duration_months && (
                    <p><strong>Duration:</strong> {program.duration_months} months</p>
                  )}
                  {program.total_tuition && program.currency && (
                    <p><strong>Tuition:</strong> {program.currency} {program.total_tuition.toLocaleString()}</p>
                  )}
                </div>
                
                {program.description && (
                  <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                    {program.description}
                  </p>
                )}
                
                <div className="flex gap-2">
                  <Button asChild className="flex-1">
                    <Link href={`/programs/${program.id}`}>View Details</Link>
                  </Button>
                  {program.website_url && (
                    <Button variant="outline" asChild>
                      <a href={program.website_url} target="_blank" rel="noopener noreferrer">
                        Website
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 text-lg">No programs found.</p>
            <p className="text-gray-400 mt-2">Programs will appear here once they are added by administrators.</p>
          </div>
        )}
      </div>

      <div className="mt-8 text-center">
        <Button asChild variant="outline">
          <Link href="/schools">View Schools</Link>
        </Button>
      </div>
    </div>
  )
}