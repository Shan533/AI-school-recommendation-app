"use client"

import React from "react"
import { ViewToggle, useViewPreference, ViewMode } from "@/components/ui/view-toggle"
import { TableView, ColumnDef } from "@/components/ui/table-view"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

interface SchoolsListProps {
  schools: School[]
}

export default function SchoolsList({ schools }: SchoolsListProps) {
  const [view, setView] = useViewPreference("schools:view", "table")

  // Build filter option lists
  const unique = <T,>(arr: (T | null | undefined)[]) => Array.from(new Set(arr.filter(Boolean) as T[]))
  const typeOptions = unique(schools.map(s => s.type)).sort().map(t => ({ label: String(t), value: String(t) }))
  const locationOptions = unique(schools.map(s => s.location)).sort().map(l => ({ label: String(l), value: String(l) }))
  const regionOptions = unique(schools.map(s => s.region)).sort().map(r => ({ label: String(r), value: String(r) }))

  const columns: ColumnDef<School>[] = [
    { key: "name", header: "School Name", sortable: true, widthClassName: "w-[30%]",
      filterType: "text",
      render: (v, row) => (
        <div className="truncate" title={`${row.name}${row.initial ? ` (${row.initial})` : ""}`}>
          {row.name}{row.initial ? ` (${row.initial})` : ""}
        </div>
      )
    },
    { key: "type", header: "Type", sortable: true, widthClassName: "w-[15%]",
      filterType: "select",
      filterOptions: typeOptions,
      render: (_v, row) => row.type || "-"
    },
    { key: "region", header: "Region", sortable: true, widthClassName: "w-[15%]",
      filterType: "select",
      filterOptions: regionOptions,
      render: (_v, row) => row.region || "-"
    },
    { key: "location", header: "Location", sortable: true, widthClassName: "w-[20%]",
      filterType: "select",
      filterOptions: locationOptions,
      render: (_v, row) => row.location || "-"
    },
    { key: "qs_ranking", header: "QS Rank", sortable: true, widthClassName: "w-[10%]",
      filterType: "text",
      render: (_v, row) => row.qs_ranking ? `#${row.qs_ranking}` : "-"
    },
    { key: "year_founded", header: "Founded", sortable: true, widthClassName: "w-[10%]",
      filterType: "text",
      render: (_v, row) => row.year_founded || "-"
    },
  ]


  if (view === "cards") {
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Schools</h2>
          <ViewToggle storageKey="schools:view" defaultView="table" onChange={(v: ViewMode) => setView(v)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schools.map((school: School) => (
            <Card key={school.id} className="hover:shadow-lg transition-shadow flex flex-col h-full">
              <CardHeader>
                <CardTitle className="flex justify-between items-start gap-2 min-w-0">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold leading-tight truncate pr-2">{school.name}</h3>
                    {school.initial && (
                      <span className="text-sm text-gray-600">({school.initial})</span>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col flex-grow">
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  {school.type && <p><strong>Type:</strong> {school.type}</p>}
                  {school.location && <p><strong>Location:</strong> {school.location}</p>}
                  {school.qs_ranking && <p><strong>QS Ranking:</strong> #{school.qs_ranking}</p>}
                  {school.year_founded && <p><strong>Founded:</strong> {school.year_founded}</p>}
                  {school.region && <p><strong>Region:</strong> {school.region}</p>}
                </div>
                <div className="flex gap-2 mt-auto">
                  <Link href={`/schools/${school.id}`} className="text-blue-600 hover:underline">Details</Link>
                  {school.website_url && (
                    <a href={school.website_url} target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:underline">Visit</a>
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
        <h2 className="text-xl font-semibold">Schools</h2>
        <ViewToggle storageKey="schools:view" defaultView="table" onChange={(v: ViewMode) => setView(v)} />
      </div>
      <TableView
        data={schools}
        columns={columns}
        defaultSort={{ key: "name", direction: "asc" }}
        onRowClick={(row) => {
          window.location.href = `/schools/${row.id}`
        }}
        emptyMessage="No schools found"
        pageSize={25}
        showPagination={true}
      />
    </div>
  )
}
