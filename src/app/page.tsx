'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { FloatingAlert } from '@/components/floating-alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

async function getTopSchools() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('schools')
    .select('id,name,initial,qs_ranking,region')
    .not('qs_ranking','is',null)
    .order('qs_ranking', { ascending: true })
    .limit(5)
  if (error) {
    console.error('Top schools fetch error:', error)
    return [] as Array<{ id: string; name: string; initial: string | null; qs_ranking: number | null; region: string | null }>
  }
  return data ?? []
}

async function getPopularPrograms() {
  const supabase = createClient()
  // Placeholder: without ratings, show recent programs by name
  const { data, error } = await supabase
    .from('programs')
    .select('id,name,initial,schools(name)')
    .order('name', { ascending: true })
    .limit(5)
  if (error) {
    console.error('Popular programs fetch error:', error)
    return [] as Array<{ id: string; name: string; initial: string | null; schools: { name?: string | null } | null }>
  }
  return data ?? []
}

async function getCareers() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('careers')
    .select('id,name,abbreviation')
    .order('name', { ascending: true })
    .limit(30)
  if (error) {
    console.error('Careers fetch error:', error)
    return [] as Array<{ id: string; name: string; abbreviation: string | null }>
  }
  return data ?? []
}

export default function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [params, setParams] = useState<Record<string, string | string[] | undefined>>({})
  const [topSchools, setTopSchools] = useState<Array<{ id: string; name: string; initial: string | null; qs_ranking: number | null; region: string | null }>>([])
  const [popularPrograms, setPopularPrograms] = useState<Array<{ id: string; name: string; initial: string | null; schools: { name?: string | null } | { name?: string | null }[] | null }>>([])
  const [careers, setCareers] = useState<Array<{ id: string; name: string; abbreviation: string | null }>>([])
  
  useEffect(() => {
    const loadData = async () => {
      const [paramsData, schoolsData, programsData, careersData] = await Promise.all([
        searchParams,
        getTopSchools(),
        getPopularPrograms(),
        getCareers(),
      ])
      setParams(paramsData)
      setTopSchools(schoolsData)
      setPopularPrograms(programsData)
      setCareers(careersData)
    }
    loadData()
  }, [searchParams])

  const showLoginSuccess = params?.login === '1'
  const showLogoutSuccess = params?.logout === '1'
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100">

      {/* Login Success Alert (floating, auto dismiss) */}
      {showLoginSuccess && (
        <FloatingAlert title="Welcome back! 🎉" description="You're now signed in." />
      )}
      {showLogoutSuccess && (
        <FloatingAlert title="Signed out" description="You've been logged out successfully." />
      )}

      {/* Hero */}
      <section className="container mx-auto px-6 pt-[clamp(1.5rem,6vh,4rem)] pb-[clamp(1rem,3vh,2rem)] text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          Break Into <span className="text-blue-600">Tech</span> with the
          <span className="text-blue-600 block">Top Program</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-0">
          Find, rate, and review top CS, AI/ML, HCI, Data, Cybersecurity & more—matched to your profile.
        </p>
      </section>
      {/* Top Lists */}
      <section className="container mx-auto px-6 mb-[clamp(2rem,6vh,4rem)] grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="gap-2">
          <CardHeader className="pb-0">
            <div className="flex justify-between items-center">
              <CardTitle>Top Schools (QS Ranking)</CardTitle>
              <Button asChild variant="outline" size="sm">
                <Link href="/schools">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {topSchools.length === 0 ? (
              <div className="text-sm text-gray-500">No QS ranking data yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-full table-fixed">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[15%]">QS</TableHead>
                      <TableHead className="w-[55%]">School</TableHead>
                      <TableHead className="w-[30%]">Region</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topSchools.map((s) => (
                      <TableRow key={s.id} className="cursor-pointer hover:bg-gray-50" onClick={() => window.location.href = `/schools/${s.id}`}>
                        <TableCell className="text-sm">{s.qs_ranking ? `#${s.qs_ranking}` : '-'}</TableCell>
                        <TableCell className="truncate text-sm">{s.name}{s.initial ? ` (${s.initial})` : ''}</TableCell>
                        <TableCell className="text-sm">{s.region ?? '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="gap-2">
          <CardHeader className="pb-0">
            <div className="flex justify-between items-center">
              <CardTitle>Popular Programs</CardTitle>
              <Button asChild variant="outline" size="sm">
                <Link href="/programs">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {popularPrograms.length === 0 ? (
              <div className="text-sm text-gray-500">No programs available.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-full table-fixed">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60%]">Program</TableHead>
                      <TableHead className="w-[40%]">School</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {popularPrograms.map((p) => {
                      const schoolName = Array.isArray(p.schools)
                        ? (p.schools[0]?.name ?? '')
                        : (p.schools?.name ?? '')
                      return (
                        <TableRow key={p.id} className="cursor-pointer hover:bg-gray-50" onClick={() => window.location.href = `/programs/${p.id}`}>
                          <TableCell className="truncate text-sm">{p.name}{p.initial ? ` (${p.initial})` : ''}</TableCell>
                          <TableCell className="truncate text-sm">{schoolName}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Career Explorer - Animated Marquee */}
      <section className="container mx-auto px-6 pb-[clamp(2rem,6vh,4rem)]">
        {careers.length === 0 ? (
          <div className="text-sm text-gray-500">No careers available.</div>
        ) : (
          <div className="relative overflow-hidden">
            <div className="flex animate-marquee gap-4">
              {(() => {
                // const colorClasses = [
                //   'bg-blue-50 text-blue-900 border-blue-200',
                //   'bg-green-50 text-green-900 border-green-200',
                //   'bg-purple-50 text-purple-900 border-purple-200',
                //   'bg-amber-50 text-amber-900 border-amber-200',
                // ] as const
                return null
              })()}
              {/* First set */}
              {careers.map((c, i) => {
                const palette = [
                  'bg-gray-100 text-blue-900 border-gray-200',   // deep blue
                  'bg-blue-100 text-blue-900 border-blue-200', // light blue
                  'bg-white text-blue-900 border-blue-200',    // white
                ]
                const color = palette[i % palette.length]
                return (
                <a key={c.id} href={`/careers/${c.id}`} className={`shrink-0 rounded-lg border px-4 py-3 text-sm font-medium shadow-sm hover:shadow-md transition-all duration-200 ${color}`}>
                  <div>{c.abbreviation ?? c.name}</div>
                  {c.abbreviation && c.name !== c.abbreviation && (
                    <div className="text-xs text-gray-500 mt-1">{c.name}</div>
                  )}
                </a>
              )})}
              {/* Duplicate set for seamless loop */}
              {careers.map((c, i) => {
                const palette = [
                  'bg-blue-600 text-white border-blue-700',   // deep blue
                  'bg-blue-100 text-blue-900 border-blue-200', // light blue
                  'bg-white text-blue-900 border-blue-200',    // white
                ]
                const color = palette[i % palette.length]
                return (
                <a key={`${c.id}-dup`} href={`/careers/${c.id}`} className={`shrink-0 rounded-lg border px-4 py-3 text-sm font-medium shadow-sm hover:shadow-md transition-all duration-200 ${color}`}>
                  <div>{c.abbreviation ?? c.name}</div>
                  {c.abbreviation && c.name !== c.abbreviation && (
                    <div className="text-xs text-gray-500 mt-1">{c.name}</div>
                  )}
                </a>
              )})}
            </div>
          </div>
        )}
      </section>

      {/* Quick Stats */}
      <section className="container mx-auto px-6 pb-[clamp(2rem,6vh,4rem)]">
        <div className="bg-white rounded-lg shadow-lg p-[clamp(1.5rem,3vh,2rem)]">
          <h3 className="text-2xl font-bold text-center mb-8">Platform Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">1000+</div>
              <div className="text-gray-600">Universities</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">5000+</div>
              <div className="text-gray-600">Programs</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">50+</div>
              <div className="text-gray-600">Countries</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600 mb-2">24/7</div>
              <div className="text-gray-600">AI Support</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}