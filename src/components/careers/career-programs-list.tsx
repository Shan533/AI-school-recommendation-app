"use client"

import React from "react"
import { ViewToggle, useViewPreference, ViewMode } from "@/components/ui/view-toggle"
import { TableView, ColumnDef } from "@/components/ui/table-view"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Program } from "@/lib/types/program-types"

interface Pagination {
  page: number
  limit: number
  total: number
  total_pages: number
}

interface CareerProgramsListProps {
  programs: Program[]
  showFilters?: boolean
  pagination?: Pagination
  baseUrl: string
}

export function CareerProgramsList({ 
  programs, 
  showFilters = true, 
  pagination,
  baseUrl 
}: CareerProgramsListProps) {
  // Suppress unused parameter warning for future use
  void showFilters
  const [view, setView] = useViewPreference("career-programs:view", "table")

  // Build filter option lists
  const unique = <T,>(arr: (T | null | undefined)[]) => Array.from(new Set(arr.filter(Boolean) as T[]))
  const degreeOptions = unique(programs.map(p => p.degree)).sort().map(d => ({ label: String(d), value: String(d) }))
  const schoolOptions = unique(programs.map(p => p.schools?.name)).sort().map(n => ({ label: String(n), value: String(n) }))
  const regionOptions = unique(programs.map(p => p.schools?.region)).sort().map(r => ({ label: String(r), value: String(r) }))
  const stemOptions = [
    { label: "Yes", value: "true" },
    { label: "No", value: "false" },
  ]
  const difficultyOptions = unique(programs.map(p => p.application_difficulty)).filter(Boolean).sort().map(d => ({ 
    label: String(d), 
    value: String(d) 
  }))

  const columns: ColumnDef<Program>[] = [
    { 
      key: "name", 
      header: "Program Name", 
      sortable: true, 
      widthClassName: "w-[25%]",
      render: (v, row) => (
        <div className="truncate" title={`${row.name}${row.initial ? ` (${row.initial})` : ""}`}>
          <div className="font-medium">{row.name}</div>
          {row.initial && <div className="text-sm text-gray-500">({row.initial})</div>}
        </div>
      )
    },
    { 
      key: "schools", 
      header: "School", 
      sortable: true, 
      widthClassName: "w-[20%]",
      filterType: "select",
      filterAccessor: (row) => row.schools?.name ?? "",
      filterOptions: schoolOptions,
      sortAccessor: (row) => row.schools?.name ?? "",
      render: (v, row) => (
        <div className="truncate" title={`${row.schools?.name ?? ""}`}>
          <div className="font-medium">{row.schools?.name ?? ""}</div>
          {row.schools?.qs_ranking && (
            <div className="text-sm text-gray-500">QS #{row.schools.qs_ranking}</div>
          )}
        </div>
      )
    },
    { 
      key: "degree", 
      header: "Degree", 
      sortable: true, 
      widthClassName: "w-[10%]",
      filterType: "select",
      filterOptions: degreeOptions
    },
    { 
      key: "region" as keyof Program, 
      header: "Region", 
      sortable: true, 
      widthClassName: "w-[10%]",
      filterType: "select",
      filterAccessor: (row) => row.schools?.region ?? "",
      filterOptions: regionOptions,
      sortAccessor: (row) => row.schools?.region ?? "",
      render: (v, row) => row.schools?.region ?? "-"
    },
    { 
      key: "is_stem", 
      header: "STEM", 
      sortable: true, 
      widthClassName: "w-[8%]",
      filterType: "select",
      filterAccessor: (row) => (row.is_stem === true ? "true" : row.is_stem === false ? "false" : ""),
      filterOptions: stemOptions,
      render: (v, row) => (
        <Badge variant={row.is_stem ? "default" : "secondary"} className="text-xs">
          {row.is_stem ? "Yes" : "No"}
        </Badge>
      )
    },
    { 
      key: "duration_years", 
      header: "Duration", 
      sortable: true, 
      widthClassName: "w-[8%]",
      render: (v) => (v ? `${v}y` : "-")
    },
    { 
      key: "application_difficulty", 
      header: "Difficulty", 
      sortable: true, 
      widthClassName: "w-[10%]",
      filterType: "select",
      filterOptions: difficultyOptions,
      render: (v, row) => {
        if (!row.application_difficulty) return "-"
        const color = {
          'SSR': 'bg-red-100 text-red-800',
          'SR': 'bg-orange-100 text-orange-800', 
          'R': 'bg-yellow-100 text-yellow-800',
          'N': 'bg-green-100 text-green-800'
        }[row.application_difficulty] || 'bg-gray-100 text-gray-800'
        return (
          <Badge variant="outline" className={`text-xs ${color}`}>
            {row.application_difficulty}
          </Badge>
        )
      }
    },
    {
      key: "actions" as keyof Program,
      header: "Actions",
      widthClassName: "w-[9%]",
      render: (v, row) => (
        <Link href={`/programs/${row.id}`}>
          <Button variant="outline" size="sm">
            View
          </Button>
        </Link>
      )
    }
  ]

  if (view === "cards") {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Programs</h2>
          <ViewToggle storageKey="career-programs:view" defaultView="table" onChange={(v: ViewMode) => setView(v)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs.map((program: Program) => (
            <Card key={program.id} className="hover:shadow-lg transition-shadow flex flex-col h-full">
              <CardHeader>
                <CardTitle className="flex justify-between items-start gap-2 min-w-0">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold leading-tight truncate pr-2">{program.name}</h3>
                    {program.initial && (
                      <span className="text-sm text-gray-600">({program.initial})</span>
                    )}
                  </div>
                  {program.is_primary_category && (
                    <Badge variant="default" className="text-xs">Primary</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col flex-grow">
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <p><strong>School:</strong> {program.schools?.name}</p>
                  {program.schools?.qs_ranking && (
                    <p><strong>QS Ranking:</strong> #{program.schools.qs_ranking}</p>
                  )}
                  {program.duration_years && (
                    <p><strong>Duration:</strong> {program.duration_years} years</p>
                  )}
                  {program.total_tuition && program.currency && (
                    <p><strong>Tuition:</strong> {program.currency} {program.total_tuition.toLocaleString()}</p>
                  )}
                  {program.application_difficulty && (
                    <p><strong>Difficulty:</strong> {program.application_difficulty}</p>
                  )}
                  {program.is_stem !== undefined && (
                    <p><strong>STEM:</strong> {program.is_stem ? "Yes" : "No"}</p>
                  )}
                </div>
                <div className="flex gap-2 mt-auto">
                  <Link href={`/programs/${program.id}`} className="flex-1 text-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium">
                    View Details
                  </Link>
                  {program.website_url && (
                    <a href={program.website_url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium">
                      Website
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Pagination for cards view */}
        {pagination && pagination.total_pages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex items-center space-x-2">
              {pagination.page > 1 && (
                <Link href={`${baseUrl}?page=${pagination.page - 1}`}>
                  <Button variant="outline" size="sm">Previous</Button>
                </Link>
              )}
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.total_pages}
              </span>
              {pagination.page < pagination.total_pages && (
                <Link href={`${baseUrl}?page=${pagination.page + 1}`}>
                  <Button variant="outline" size="sm">Next</Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Programs</h2>
        <ViewToggle storageKey="career-programs:view" defaultView="table" onChange={(v: ViewMode) => setView(v)} />
      </div>
      <TableView
        data={programs}
        columns={columns}
        defaultSort={{ key: "name", direction: "asc" }}
        onRowClick={(row) => {
          window.location.href = `/programs/${row.id}`
        }}
        emptyMessage="No programs found"
        pageSize={25}
        showPagination={false} // We'll handle pagination manually
      />
      
      {/* Pagination for table view */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex justify-center mt-8">
          <div className="flex items-center space-x-2">
            {pagination.page > 1 && (
              <Link href={`${baseUrl}?page=${pagination.page - 1}`}>
                <Button variant="outline" size="sm">Previous</Button>
              </Link>
            )}
            <span className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.total_pages} ({pagination.total} total)
            </span>
            {pagination.page < pagination.total_pages && (
              <Link href={`${baseUrl}?page=${pagination.page + 1}`}>
                <Button variant="outline" size="sm">Next</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
