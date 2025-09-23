"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"

export interface FilterState {
  degree?: string
  category?: string
  location?: string
  stemOnly?: boolean
  delivery?: string
}

export interface FilterOptions {
  degrees: string[]
  categories: Array<{ id: string; name: string }>
  locations: string[]
  deliveries: string[]
}

interface FilterControlsProps {
  value: FilterState
  onChange: (next: FilterState) => void
  options: FilterOptions
  className?: string
}

export function FilterControls({ value, onChange, options, className }: FilterControlsProps) {
  const update = <K extends keyof FilterState>(key: K, v: FilterState[K]) => {
    onChange({ ...value, [key]: v })
  }

  const clearAll = () => {
    onChange({})
  }

  return (
    <div className={cn("w-full grid grid-cols-1 md:grid-cols-5 gap-3", className)}>
      <div>
        <label className="block text-sm text-gray-600 mb-1">Degree</label>
        <select
          className="w-full border rounded px-2 py-2 text-sm bg-white"
          value={value.degree || ""}
          onChange={(e) => update("degree", e.target.value || undefined)}
        >
          <option value="">All</option>
          {options.degrees.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">Category</label>
        <select
          className="w-full border rounded px-2 py-2 text-sm bg-white"
          value={value.category || ""}
          onChange={(e) => update("category", e.target.value || undefined)}
        >
          <option value="">All</option>
          {options.categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
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
        <label className="block text-sm text-gray-600 mb-1">Delivery</label>
        <select
          className="w-full border rounded px-2 py-2 text-sm bg-white"
          value={value.delivery || ""}
          onChange={(e) => update("delivery", e.target.value || undefined)}
        >
          <option value="">All</option>
          {options.deliveries.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      <div className="flex items-end justify-between gap-2">
        <div className="flex items-center gap-2">
          <Checkbox id="stemOnly" checked={!!value.stemOnly} onCheckedChange={(v) => update("stemOnly", Boolean(v))} />
          <label htmlFor="stemOnly" className="text-sm">STEM only</label>
        </div>
        <Button type="button" variant="outline" onClick={clearAll}>Clear</Button>
      </div>
    </div>
  )
}


