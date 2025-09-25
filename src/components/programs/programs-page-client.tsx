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
  search?: string
  region?: string
  category?: string
  career?: string
}


// Removed unused helper

export default function ProgramsPageClient({ 
  initialPrograms, 
  search, 
  region, 
  category, 
  career 
}: ProgramsPageClientProps) {
  // Removed page-level filters in favor of header filters
  const [searchTerm, setSearchTerm] = React.useState(search || "")

  // Update searchTerm when search prop changes (URL parameter changes)
  React.useEffect(() => {
    setSearchTerm(search || "")
  }, [search])

  // Build breadcrumb navigation
  const breadcrumbs = React.useMemo(() => {
    const items = []
    
    // Always start with "All Programs"
    items.push({ label: "All Programs", href: "/programs" })
    
    // Add search if present
    if (search) {
      items.push({ label: search, href: `/programs?search=${encodeURIComponent(search)}` })
    }
    
    // Add region if present
    if (region) {
      items.push({ label: region, href: `/programs?region=${encodeURIComponent(region)}` })
    }
    
    // Add category if present
    if (category) {
      items.push({ label: category, href: `/programs?category=${encodeURIComponent(category)}` })
    }
    
    // Add career if present
    if (career) {
      items.push({ label: career, href: `/programs?career=${encodeURIComponent(career)}` })
    }
    
    return items
  }, [search, region, category, career])

  // Apply search and URL parameter filters
  const filteredPrograms = React.useMemo(() => {
    let result = initialPrograms

    // Apply region filter
    if (region) {
      result = result.filter(program => 
        program.schools?.region === region
      )
    }

    // Apply category filter
    if (category) {
      result = result.filter(program => 
        program.program_category_mapping?.some(mapping => 
          mapping.program_categories?.name === category
        )
      )
    }

    // Apply career filter (this would need to be implemented based on your career-program relationship)
    // if (career) {
    //   result = result.filter(program => 
    //     // Add career filtering logic here
    //   )
    // }

    // Apply search
    if (searchTerm) {
      result = filterItems(result, {
        fields: searchConfigs.programs.fields,
        searchTerm
      })
    }

    return result
  }, [initialPrograms, region, category, searchTerm])

  return (
    <div className="container mx-auto p-6">
      {/* Breadcrumb Navigation */}
      {(search || region || category || career) && (
        <nav className="flex items-center space-x-2 text-sm mb-6">
          {breadcrumbs.map((item, index) => (
            <React.Fragment key={item.href}>
              {index > 0 && <span className="text-gray-400">›</span>}
              <Link 
                href={item.href} 
                className={index === breadcrumbs.length - 1 
                  ? "text-gray-900 font-medium" 
                  : "text-gray-500 hover:text-gray-700"
                }
              >
                {item.label}
              </Link>
            </React.Fragment>
          ))}
        </nav>
      )}

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
