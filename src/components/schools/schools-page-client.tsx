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
  search?: string
}

export default function SchoolsPageClient({ initialSchools, search }: SchoolsPageClientProps) {
  // Removed page-level filters in favor of header filters
  const [searchTerm, setSearchTerm] = React.useState(search || "")

  // Update searchTerm when search prop changes (URL parameter changes)
  React.useEffect(() => {
    setSearchTerm(search || "")
  }, [search])

  // Removed options for page-level filters

  // Build breadcrumb navigation
  const breadcrumbs = React.useMemo(() => {
    const items = []

    // Always start with "All Schools"
    items.push({ label: "All Schools", href: "/schools" })

    // Add search if present
    if (search) {
      items.push({ label: search, href: `/schools?search=${encodeURIComponent(search)}` })
    }

    return items
  }, [search])

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
      {/* Breadcrumb Navigation */}
      {search && (
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
