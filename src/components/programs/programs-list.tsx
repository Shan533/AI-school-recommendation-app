"use client"

import React from "react"
import { ViewToggle, useViewPreference, ViewMode } from "@/components/ui/view-toggle"
import { TableView, ColumnDef } from "@/components/ui/table-view"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Program, Category } from "@/lib/types/program-types"

interface ProgramsListProps {
  programs: Program[]
  categories?: Category[]
}

// Helper function to get primary category abbreviation
const getPrimaryCategory = (program: Program): string | null => {
  if (!program.program_category_mapping) return null
  const primaryMapping = program.program_category_mapping.find(m => m.is_primary)
  return primaryMapping?.program_categories?.abbreviation || null
}

export default function ProgramsList({ programs }: ProgramsListProps) {
  const [view, setView] = useViewPreference("programs:view", "table")

  // Build filter option lists
  const unique = <T,>(arr: (T | null | undefined)[]) => Array.from(new Set(arr.filter(Boolean) as T[]))
  const degreeOptions = unique(programs.map(p => p.degree)).sort().map(d => ({ label: String(d), value: String(d) }))
  const schoolOptions = unique(programs.map(p => p.schools?.[0]?.name)).sort().map(n => ({ label: String(n), value: String(n) }))
  const categoryOptions = unique(programs.map(p => getPrimaryCategory(p))).sort().map(c => ({ label: String(c), value: String(c) }))
  const stemOptions = [
    { label: "Yes", value: "true" },
    { label: "No", value: "false" },
  ]

  const columns: ColumnDef<Program>[] = [
    { key: "name", header: "Program Name", sortable: true, widthClassName: "w-[28%]",
      render: (v, row) => (
        <div className="truncate" title={`${row.name}${row.initial ? ` (${row.initial})` : ""}`}>
          {row.name}{row.initial ? ` (${row.initial})` : ""}
        </div>
      )
    },
    { key: "schools", header: "School", sortable: true, widthClassName: "w-[20%]",
      filterType: "select",
      filterAccessor: (row) => row.schools?.[0]?.name ?? "",
      filterOptions: schoolOptions,
      sortAccessor: (row) => row.schools?.[0]?.name ?? "",
      render: (v, row) => (
        <div className="truncate" title={`${row.schools?.[0]?.name ?? ""}`}>
          {row.schools?.[0]?.name ?? ""}
        </div>
      )
    },
    { key: "degree", header: "Degree", sortable: true, widthClassName: "w-[10%]",
      filterType: "select",
      filterOptions: degreeOptions
    },
    { key: "category", header: "Category", sortable: true, widthClassName: "w-[10%]",
      filterType: "select",
      filterOptions: categoryOptions,
      filterAccessor: (row) => getPrimaryCategory(row) ?? "",
      sortAccessor: (row) => getPrimaryCategory(row) ?? "",
      render: (v, row) => getPrimaryCategory(row) ?? "-"
    },
    { key: "is_stem", header: "STEM", sortable: true, widthClassName: "w-[10%]",
      filterType: "select",
      filterAccessor: (row) => (row.is_stem === true ? "true" : row.is_stem === false ? "false" : ""),
      filterOptions: stemOptions,
      render: (v, row) => (row.is_stem === true ? "Yes" : row.is_stem === false ? "No" : "-")
    },
    { key: "duration_years", header: "Duration", sortable: true, widthClassName: "w-[10%]",
      render: (v) => (v ? `${v} years` : "-")
    },
    { key: "application_difficulty", header: "Difficulty", sortable: true, widthClassName: "w-[10%]",
      filterType: "text"
    },
  ]



  if (view === "cards") {
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Programs</h2>
          <ViewToggle storageKey="programs:view" defaultView="table" onChange={(v: ViewMode) => setView(v)} />
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
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col flex-grow">
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <p><strong>School:</strong> {program.schools?.[0]?.name}</p>
                  {program.duration_years && (
                    <p><strong>Duration:</strong> {program.duration_years} years</p>
                  )}
                  {program.total_tuition && program.currency && (
                    <p><strong>Tuition:</strong> {program.currency} {program.total_tuition.toLocaleString()}</p>
                  )}
                  {program.application_difficulty && (
                    <p><strong>Difficulty:</strong> {program.application_difficulty}</p>
                  )}
                  {getPrimaryCategory(program) && (
                    <p><strong>Category:</strong> {getPrimaryCategory(program)}</p>
                  )}
                </div>
                <div className="flex gap-2 mt-auto">
                  <Link href={`/programs/${program.id}`} className="text-blue-600 hover:underline">Details</Link>
                  {program.website_url && (
                    <a href={program.website_url} target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:underline">Visit</a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold">Programs</h2>
        <ViewToggle storageKey="programs:view" defaultView="table" onChange={(v: ViewMode) => setView(v)} />
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
        showPagination={true}
      />
    </div>
  )
}


