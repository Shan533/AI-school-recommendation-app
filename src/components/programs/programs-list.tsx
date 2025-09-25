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
  const schoolOptions = unique(programs.map(p => p.schools?.name)).sort().map(n => ({ label: String(n), value: String(n) }))
  const categoryOptions = unique(programs.map(p => getPrimaryCategory(p))).sort().map(c => ({ label: String(c), value: String(c) }))
  const stemOptions = [
    { label: "Yes", value: "true" },
    { label: "No", value: "false" },
  ]
  const difficultyOptions = unique(programs.map(p => p.application_difficulty)).filter(Boolean).sort().map(d => ({ 
    label: String(d), 
    value: String(d) 
  }))
  // Region abbreviation mapping
  const getRegionAbbr = (region: string | null | undefined): string => {
    if (!region) return "-"
    const regionMap: Record<string, string> = {
      'United States': 'US',
      'United Kingdom': 'UK', 
      'Canada': 'CA',
      'Europe': 'EU',
      'Asia': 'AS',
      'Australia': 'AU'
    }
    return regionMap[region] || region.substring(0, 2).toUpperCase()
  }

  const columns: ColumnDef<Program>[] = [
    { key: "name", header: "Program", sortable: true, widthClassName: "w-[25%]",
      render: (v, row) => (
        <div className="truncate" title={`${row.name}${row.initial ? ` (${row.initial})` : ""}`}>
          <div className="font-medium">{row.name}</div>
          {row.initial && <div className="text-xs text-gray-500">({row.initial})</div>}
        </div>
      )
    },
    { key: "schools", header: "School", widthClassName: "w-[20%]",
      filterType: "select",
      filterAccessor: (row) => row.schools?.name ?? "",
      filterOptions: schoolOptions,
      render: (v, row) => (
        <div className="truncate" title={`${row.schools?.name ?? ""}`}>
          {row.schools?.name ?? ""}
        </div>
      )
    },
    { key: "region", header: "Region", widthClassName: "w-[8%]",
      filterType: "select",
      filterAccessor: (row) => row.schools?.region ?? "",
      filterOptions: unique(programs.map(p => p.schools?.region)).sort().map(r => ({ label: r || "", value: r || "" })),
      render: (v, row) => (
        <div className="text-center font-mono text-sm" title={row.schools?.region ?? ""}>
          {getRegionAbbr(row.schools?.region)}
        </div>
      )
    },
    { key: "degree", header: "Degree", widthClassName: "w-[8%]",
      filterType: "select",
      filterOptions: degreeOptions,
      render: (v) => <div className="text-center">{String(v) || "-"}</div>
    },
    { key: "category", header: "Category", widthClassName: "w-[8%]",
      filterType: "select",
      filterOptions: categoryOptions,
      filterAccessor: (row) => getPrimaryCategory(row) ?? "",
      render: (v, row) => (
        <div className="text-center font-mono text-sm">
          {getPrimaryCategory(row) ?? "-"}
        </div>
      )
    },
    { key: "is_stem", header: "STEM", sortable: true, widthClassName: "w-[8%]",
      filterType: "select",
      filterAccessor: (row) => (row.is_stem === true ? "true" : row.is_stem === false ? "false" : ""),
      filterOptions: stemOptions,
      render: (v, row) => (
        <div className="text-center">
          {row.is_stem === true ? "✓" : row.is_stem === false ? "✗" : "-"}
        </div>
      )
    },
    { key: "duration_years", header: "Duration", sortable: true, widthClassName: "w-[8%]",
      render: (v) => (
        <div className="text-center text-sm">
          {v ? `${v}y` : "-"}
        </div>
      )
    },
    {key: "difficulty", header: "Difficulty", widthClassName: "w-[8%]",
      filterType: "select",
      filterOptions: difficultyOptions,
      render: (v) => (
        <div className="text-center">{String(v) || "-"}</div>
      )
    }
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
                  <p><strong>School:</strong> {program.schools?.name}</p>
                  <p><strong>Region:</strong> {getRegionAbbr(program.schools?.region)} ({program.schools?.region})</p>
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
                  <p><strong>STEM:</strong> {program.is_stem === true ? "Yes" : program.is_stem === false ? "No" : "-"}</p>
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


