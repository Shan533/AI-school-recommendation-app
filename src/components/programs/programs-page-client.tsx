"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { PublicSearchCard } from "@/components/ui/public-search-card"
// removed top-level FilterControls; per-column filters live in table headers
import ProgramsList from "@/components/programs/programs-list"
import { filterItems, searchConfigs } from "@/lib/admin-search"
import Link from "next/link"
import { Program, Category } from "@/lib/types/program-types"

interface ProgramsPageClientProps {
  initialPrograms: Program[]
  categories: Category[]
}


// Removed unused helper

export default function ProgramsPageClient({ initialPrograms }: ProgramsPageClientProps) {
  // Removed page-level filters in favor of header filters
  const [searchTerm, setSearchTerm] = React.useState("")

  // Removed options for page-level filters

  // Apply search only (column filters handled in table)
  const filteredPrograms = React.useMemo(() => {
    let result = initialPrograms

    // Apply search
    if (searchTerm) {
      result = filterItems(result, {
        fields: searchConfigs.programs.fields,
        searchTerm
      })
    }

    return result
  }, [initialPrograms, searchTerm])

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          {searchTerm ? `Search Results (${filteredPrograms.length})` : `Programs (${filteredPrograms.length})`}
        </h1>
        <Button asChild variant="outline" className="cursor-pointer">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>

      {/* Search Programs */}
      <PublicSearchCard 
        placeholder={searchConfigs.programs.placeholder}
        helpText={searchConfigs.programs.helpText}
        onSearch={setSearchTerm}
      />

      {/* Removed top-level FilterControls; use header filters instead */}

      <ProgramsList programs={filteredPrograms} />

      <div className="mt-8 text-center">
        <Button asChild variant="outline">
          <Link href="/schools">View Schools</Link>
        </Button>
      </div>
    </div>
  )
}
