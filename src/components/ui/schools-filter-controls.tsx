"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface SchoolsFilterState {
  type?: string
  location?: string
  region?: string
  qsRanking?: string
}

export interface SchoolsFilterOptions {
  types: string[]
  locations: string[]
  regions: string[]
}

interface SchoolsFilterControlsProps {
  value: SchoolsFilterState
  onChange: (next: SchoolsFilterState) => void
  options: SchoolsFilterOptions
  className?: string
}

export function SchoolsFilterControls({ value, onChange, options, className }: SchoolsFilterControlsProps) {
  const update = <K extends keyof SchoolsFilterState>(key: K, v: SchoolsFilterState[K]) => {
    onChange({ ...value, [key]: v })
  }

  const clearAll = () => {
    onChange({})
  }

  return (
    <div className={cn("w-full grid grid-cols-1 md:grid-cols-5 gap-3", className)}>
      <div>
        <label className="block text-sm text-gray-600 mb-1">Type</label>
        <select
          className="w-full border rounded px-2 py-2 text-sm bg-white"
          value={value.type || ""}
          onChange={(e) => update("type", e.target.value || undefined)}
        >
          <option value="">All</option>
          {options.types.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">Location</label>
        <select
          className="w-full border rounded px-2 py-2 text-sm bg-white"
          value={value.location || ""}
          onChange={(e) => update("location", e.target.value || undefined)}
        >
          <option value="">All</option>
          {options.locations.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">Region</label>
        <select
          className="w-full border rounded px-2 py-2 text-sm bg-white"
          value={value.region || ""}
          onChange={(e) => update("region", e.target.value || undefined)}
        >
          <option value="">All</option>
          {options.regions.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">QS Ranking</label>
        <select
          className="w-full border rounded px-2 py-2 text-sm bg-white"
          value={value.qsRanking || ""}
          onChange={(e) => update("qsRanking", e.target.value || undefined)}
        >
          <option value="">All</option>
          <option value="top-50">Top 50</option>
          <option value="top-100">Top 100</option>
          <option value="top-200">Top 200</option>
          <option value="top-500">Top 500</option>
        </select>
      </div>

      <div className="flex items-end justify-end md:col-span-1">
        <Button type="button" variant="outline" className="w-full md:w-auto" onClick={clearAll}>Clear</Button>
      </div>
    </div>
  )
}
