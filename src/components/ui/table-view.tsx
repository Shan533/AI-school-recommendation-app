"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronDown, ChevronUp, ChevronsUpDown, Filter as FilterIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Pagination } from "@/components/ui/pagination"

export type SortDirection = "asc" | "desc"

export interface ColumnDef<T> {
  key: keyof T
  header: string
  widthClassName?: string
  render?: (value: T[keyof T], row: T) => React.ReactNode
  sortable?: boolean
  sortAccessor?: (row: T) => string | number | boolean | null | undefined
  // Optional filter config
  filterType?: "text" | "select"
  filterAccessor?: (row: T) => string | number | boolean | null | undefined
  filterOptions?: Array<{ label: string; value: string }>
}

interface TableViewProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  className?: string
  defaultSort?: { key: keyof T; direction: SortDirection }
  customSorts?: Array<{
    label: string
    compare: (a: T, b: T) => number
  }>
  onRowClick?: (row: T) => void
  emptyMessage?: string
  pageSize?: number
  showPagination?: boolean
}

export function TableView<T extends Record<string, unknown>>({
  data,
  columns,
  className,
  defaultSort,
  customSorts,
  onRowClick,
  emptyMessage = "No data",
  pageSize = 25,
  showPagination = true,
}: TableViewProps<T>) {
  const [sortKey, setSortKey] = React.useState<keyof T | null>(defaultSort?.key ?? null)
  const [sortDirection, setSortDirection] = React.useState<SortDirection>(defaultSort?.direction ?? "asc")
  const [activeCustomSort, setActiveCustomSort] = React.useState<number | null>(null)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [filters, setFilters] = React.useState<Record<string, string>>({})

  const onHeaderClick = (col: ColumnDef<T>) => {
    if (!col.sortable) return
    // Reset custom sort when clicking a column
    setActiveCustomSort(null)
    // Reset to first page when sorting
    setCurrentPage(1)

    const nextKey = col.key
    if (sortKey === nextKey) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(nextKey)
      setSortDirection("asc")
    }
  }

  const filteredAndSortedData = React.useMemo(() => {
    // 1) Apply column filters
    let result = data.filter((row) => {
      return columns.every((col) => {
        const filterVal = filters[String(col.key)]
        if (!filterVal) return true
        if (!col.filterType) return true
        const accessor = col.filterAccessor
          ? col.filterAccessor
          : (r: T) => r[col.key]
        const v = accessor(row)
        if (v == null) return false
        if (col.filterType === "text") {
          return String(v).toLowerCase().includes(filterVal.toLowerCase())
        }
        if (col.filterType === "select") {
          return String(v) === filterVal
        }
        return true
      })
    })

    if (activeCustomSort != null && customSorts && customSorts[activeCustomSort]) {
      const compare = customSorts[activeCustomSort].compare
      result = [...result].sort(compare)
    } else if (sortKey) {
      const col = columns.find((c) => c.key === sortKey)
      if (col) {
        const accessor = col.sortAccessor
          ? col.sortAccessor
          : (row: T) => {
              const v = row[sortKey]
              return typeof v === "string" || typeof v === "number" || typeof v === "boolean" ? v : String(v)
            }

        const copy = [...result]
        copy.sort((a, b) => {
          const av = accessor(a)
          const bv = accessor(b)
          if (av == null && bv == null) return 0
          if (av == null) return -1
          if (bv == null) return 1
          if (av < bv) return sortDirection === "asc" ? -1 : 1
          if (av > bv) return sortDirection === "asc" ? 1 : -1
          return 0
        })
        result = copy
      }
    }

    return result
  }, [activeCustomSort, customSorts, data, sortDirection, sortKey, columns, filters])

  const paginatedData = React.useMemo(() => {
    if (!showPagination) return filteredAndSortedData
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredAndSortedData.slice(startIndex, endIndex)
  }, [filteredAndSortedData, currentPage, pageSize, showPagination])

  const totalPages = Math.ceil(filteredAndSortedData.length / pageSize)

  const SortIcon = ({ active, direction }: { active: boolean; direction: SortDirection }) => {
    if (!active) return <ChevronsUpDown className="h-3.5 w-3.5 opacity-60" />
    return direction === "asc" ? (
      <ChevronUp className="h-3.5 w-3.5" />
    ) : (
      <ChevronDown className="h-3.5 w-3.5" />
    )
  }

  return (
    <div className={cn("w-full", className)}>
      {customSorts && customSorts.length > 0 && (
        <div className="mb-2 flex items-center gap-2 text-sm">
          <span className="text-gray-600">Custom sort:</span>
          {customSorts.map((s, idx) => (
            <button
              key={s.label}
              type="button"
              className={cn(
                "px-2 py-1 rounded border",
                activeCustomSort === idx ? "bg-gray-100 border-gray-300" : "hover:bg-gray-50 border-transparent"
              )}
              onClick={() => setActiveCustomSort((cur) => (cur === idx ? null : idx))}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
      <div className="w-full overflow-x-auto">
      <Table className="min-w-full table-fixed">
        <TableHeader>
          <TableRow>
            {columns.map((col) => {
              const active = sortKey === col.key
              const filterValue = filters[String(col.key)] ?? ""
              return (
                <TableHead
                  key={String(col.key)}
                  className={cn("select-none", col.widthClassName, col.sortable && "cursor-pointer")}
                  onClick={() => onHeaderClick(col)}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate">{col.header}</span>
                    <div className="inline-flex items-center gap-1 w-10 justify-end">
                      {/* Reserve space for sort icon */}
                      <span className="inline-flex h-3.5 w-3.5 items-center justify-center">
                        {col.sortable ? <SortIcon active={!!active} direction={sortDirection} /> : null}
                      </span>
                      {/* Reserve space for filter icon */}
                      <span className="inline-flex h-5 w-5 items-center justify-center">
                        {col.filterType ? (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className="inline-flex h-5 w-5 items-center justify-center rounded hover:bg-gray-100"
                                onClick={(e) => e.stopPropagation()}
                                aria-label={`Filter ${col.header}`}
                              >
                                <FilterIcon className={cn("h-3.5 w-3.5 opacity-70", filterValue ? "text-blue-600" : undefined)} />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-64 p-3" onOpenAutoFocus={(e) => e.preventDefault()}>
                              {col.filterType === "text" && (
                                <input
                                  className="w-full border rounded px-2 py-1 text-sm"
                                  placeholder={`Filter ${col.header}`}
                                  value={filterValue}
                                  onChange={(ev) => setFilters((prev) => ({ ...prev, [String(col.key)]: ev.target.value }))}
                                />
                              )}
                              {col.filterType === "select" && (
                                <select
                                  className="w-full border rounded px-2 py-1 text-sm bg-white"
                                  value={filterValue}
                                  onChange={(ev) => setFilters((prev) => ({ ...prev, [String(col.key)]: ev.target.value }))}
                                >
                                  <option value="">All</option>
                                  {(col.filterOptions ?? []).map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                  ))}
                                </select>
                              )}
                              {filterValue !== "" && (
                                <div className="mt-2 text-right">
                                  <button
                                    type="button"
                                    className="text-xs text-gray-600 hover:underline"
                                    onClick={() => setFilters((prev) => ({ ...prev, [String(col.key)]: "" }))}
                                  >
                                    Clear
                                  </button>
                                </div>
                              )}
                            </PopoverContent>
                          </Popover>
                        ) : null}
                      </span>
                    </div>
                  </div>
                </TableHead>
              )
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center text-sm text-gray-500">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            paginatedData.map((row, idx) => (
              <TableRow
                key={idx}
                className={onRowClick ? "cursor-pointer" : undefined}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => {
                  const value = row[col.key]
                  return (
                    <TableCell key={String(col.key)}>
                      {col.render ? col.render(value, row) : (value as unknown as React.ReactNode)}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      </div>
      
      {showPagination && totalPages > 1 && (
        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  )
}


