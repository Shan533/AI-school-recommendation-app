"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LayoutGrid, List } from "lucide-react"

export type ViewMode = "table" | "cards"

interface ViewToggleProps {
  storageKey: string
  defaultView?: ViewMode
  onChange?: (view: ViewMode) => void
  className?: string
}

export function ViewToggle({
  storageKey,
  defaultView = "table",
  onChange,
  className,
}: ViewToggleProps) {
  const [view, setView] = React.useState<ViewMode>(defaultView)

  // Load preference from localStorage on mount
  React.useEffect(() => {
    try {
      const saved = typeof window !== "undefined" ? window.localStorage.getItem(storageKey) : null
      if (saved === "table" || saved === "cards") {
        setView(saved)
      }
    } catch {
      // ignore storage errors
    }
  }, [storageKey])

  const updateView = (next: ViewMode) => {
    setView(next)
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(storageKey, next)
      }
    } catch {
      // ignore storage errors
    }
    onChange?.(next)
  }

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <Button
        type="button"
        variant={view === "table" ? "default" : "outline"}
        size="icon"
        aria-pressed={view === "table"}
        aria-label="Table view"
        onClick={() => updateView("table")}
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant={view === "cards" ? "default" : "outline"}
        size="icon"
        aria-pressed={view === "cards"}
        aria-label="Card view"
        onClick={() => updateView("cards")}
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
    </div>
  )
}

export function useViewPreference(storageKey: string, fallback: ViewMode = "table") {
  const [view, setView] = React.useState<ViewMode>(fallback)

  React.useEffect(() => {
    try {
      const saved = typeof window !== "undefined" ? window.localStorage.getItem(storageKey) : null
      if (saved === "table" || saved === "cards") {
        setView(saved)
      }
    } catch {
      // ignore
    }
  }, [storageKey])

  const set = React.useCallback((next: ViewMode) => {
    setView(next)
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(storageKey, next)
      }
    } catch {
      // ignore
    }
  }, [storageKey])

  return [view, set] as const
}


