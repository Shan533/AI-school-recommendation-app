"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { PublicSearchCard } from "@/components/ui/public-search-card"
// removed top-level SchoolsFilterControls; per-column filters live in table headers
import SchoolsList from "@/components/schools/schools-list"
import { filterItems, searchConfigs } from "@/lib/admin-search"
import Link from "next/link"

interface School {
  [key: string]: unknown
  id: string
  name: string
  initial?: string | null
  type?: string | null
  location?: string | null
  qs_ranking?: number | null
  year_founded?: number | null
  region?: string | null
  website_url?: string | null
}

interface SchoolsPageClientProps {
  initialSchools: School[]
}

export default function SchoolsPageClient({ initialSchools }: SchoolsPageClientProps) {
  // Removed page-level filters in favor of header filters
  const [searchTerm, setSearchTerm] = React.useState("")

  // Removed options for page-level filters

  // Apply search only (column filters handled in table)
  const filteredSchools = React.useMemo(() => {
    let result = initialSchools

    // Apply search
    if (searchTerm) {
      result = filterItems(result, {
        fields: searchConfigs.schools.fields,
        searchTerm
      })
    }

    return result
  }, [initialSchools, searchTerm])

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          {searchTerm ? `Search Results (${filteredSchools.length})` : `Schools (${filteredSchools.length})`}
        </h1>
        <Button asChild variant="outline" className="cursor-pointer">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>

      {/* Search Schools */}
      <PublicSearchCard 
        placeholder={searchConfigs.schools.placeholder}
        helpText={searchConfigs.schools.helpText}
        onSearch={setSearchTerm}
      />

      {/* Removed top-level filter controls; use header filters instead */}

      <SchoolsList schools={filteredSchools} />

      <div className="mt-8 text-center">
        <Button asChild variant="outline">
          <Link href="/programs">View Programs</Link>
        </Button>
      </div>
    </div>
  )
}
