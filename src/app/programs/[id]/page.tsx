import { notFound } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase/helpers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

async function getProgram(id: string) {
  const supabase = await getSupabaseClient()
  const { data: program, error } = await supabase
    .from('programs')
    .select(`
      *,
      schools (
        id,
        name,
        initial,
        type,
        location,
        country,
        qs_ranking,
        website_url
      )
    `)
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Error fetching program:', error)
    return null
  }
  
  return program
}

export default async function ProgramDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const program = await getProgram(id)
  
  if (!program) {
    notFound()
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <Button asChild variant="outline">
          <Link href="/programs">← Back to Programs</Link>
        </Button>
      </div>

      {/* Program Header */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl mb-2">
                {program.name}
                {program.initial && <span className="text-gray-600 ml-2">({program.initial})</span>}
              </CardTitle>
              <p className="text-lg text-gray-600">{program.degree} Program</p>
            </div>
            <div className="flex gap-2">
              {program.is_stem && (
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-lg font-medium">
                  STEM Designated
                </span>
              )}
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg font-medium">
                {program.degree}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {program.description && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-700 mb-2">Program Description</h4>
              <p className="text-gray-700 leading-relaxed">{program.description}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {program.duration_months && (
              <div>
                <h4 className="font-semibold text-gray-700">Duration</h4>
                <p>{program.duration_months} months</p>
              </div>
            )}
            {program.total_tuition && program.currency && (
              <div>
                <h4 className="font-semibold text-gray-700">Total Tuition</h4>
                <p>{program.currency} {program.total_tuition.toLocaleString()}</p>
              </div>
            )}
            {program.currency && !program.total_tuition && (
              <div>
                <h4 className="font-semibold text-gray-700">Currency</h4>
                <p>{program.currency}</p>
              </div>
            )}
          </div>
          
          <div className="flex gap-3">
            {program.website_url && (
              <Button asChild>
                <a href={program.website_url} target="_blank" rel="noopener noreferrer">
                  Visit Program Website
                </a>
              </Button>
            )}
            <Button asChild variant="outline">
              <Link href={`/schools/${program.schools?.id}`}>View School Details</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* School Information */}
      {program.schools && (
        <Card>
          <CardHeader>
            <CardTitle>School Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold mb-1">
                  {program.schools.name}
                  {program.schools.initial && (
                    <span className="text-gray-600 ml-2">({program.schools.initial})</span>
                  )}
                </h3>
                {program.schools.type && (
                  <p className="text-gray-600">{program.schools.type}</p>
                )}
              </div>
              {program.schools.qs_ranking && (
                <div className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-center">
                  <p className="text-xs font-medium">QS Ranking</p>
                  <p className="text-lg font-bold">#{program.schools.qs_ranking}</p>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {program.schools.location && (
                <div>
                  <h4 className="font-semibold text-gray-700">Location</h4>
                  <p>{program.schools.location}</p>
                </div>
              )}
              {program.schools.country && (
                <div>
                  <h4 className="font-semibold text-gray-700">Country</h4>
                  <p>{program.schools.country}</p>
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button asChild>
                <Link href={`/schools/${program.schools.id}`}>View All School Programs</Link>
              </Button>
              {program.schools.website_url && (
                <Button asChild variant="outline">
                  <a href={program.schools.website_url} target="_blank" rel="noopener noreferrer">
                    School Website
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}