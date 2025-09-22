'use client'

import * as React from 'react'
import { useMemo, useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Checkbox from '@/components/ui/checkbox'
import { createClient } from '@supabase/supabase-js'

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

/** ===== Types from server ===== */
type Item = {
  id: string
  name: string
  initial?: string | null
  country?: string | null
  location?: string | null
  website?: string | null
  [key: string]: unknown
}

type RankDiff = {
  key: string               // e.g. 'qs_2025'
  system: string            // 'qs' | 'times'
  year: number
  incoming: number | null
  existing: number | null
  status: 'missing' | 'update' | 'same' | 'invalid'
}

type BaseDiff = {
  field: 'name' | 'initial' | 'country' | 'location' | 'website'
  incoming: string | null | undefined
  existing: string | null | undefined
  changed: boolean
}

type ReviewRow = {
  unreviewed: Item
  existingSchoolId: string | null
  baseDiffs: BaseDiff[]
  rankDiffs: RankDiff[]
  hasAnyDiff: boolean
}

type Program = { id: string; name: string }

/** ===== Config ===== */
const PAGE_SIZE = 10
const YEARS_BY_SYSTEM: Record<'QS' | 'TIME', number[]> = {
  QS: [2025, 2024],
  TIME: [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016],
}

/** ===== Supabase client (browser) ===== */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function UnreviewedClient({
  initialPrograms,
  reviewRows: initialReviewRows,
  reviewerEmail, // optional: pass current user email; if not passed, it's null
}: {
  initialPrograms: Program[]
  reviewRows: ReviewRow[]
  reviewerEmail?: string | null
}) {
  const [active, setActive] = useState<'schools' | 'programs'>('schools')

  // local mutable data: reviewRows (will be deleted after merge successfully)
  const [reviewRows, setReviewRows] = useState<ReviewRow[]>(initialReviewRows)

  // selection set
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // pages for each
  const [pageSchools, setPageSchools] = useState(1)
  const [pagePrograms, setPagePrograms] = useState(1)

  // ranking filter
  const [selectedSystem, setSelectedSystem] = useState<'QS' | 'TIME'>('QS')
  const [selectedYear, setSelectedYear] = useState<number>(2025)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // merge strategy
  const [baseStrategy, setBaseStrategy] = useState<'fill-missing' | 'overwrite'>('fill-missing')
  const [rankStrategy, setRankStrategy] = useState<'upsert' | 'skip'>('upsert')

  // request status
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // dynamically correct year based on system
  useEffect(() => {
    const years = YEARS_BY_SYSTEM[selectedSystem]
    if (years && !years.includes(selectedYear)) {
      setSelectedYear(years[0])
    }
  }, [selectedSystem, selectedYear])

  // stats (based on difference)
  const schoolsStats = useMemo(() => {
    const total = reviewRows.length
    let newCount = 0
    let baseChanged = 0
    let rankActions = 0
    for (const r of reviewRows) {
      if (!r.existingSchoolId) newCount++
      if (r.baseDiffs.some((b) => b.changed)) baseChanged++
      if (r.rankDiffs.some((d) => d.status === 'missing' || d.status === 'update')) rankActions++
    }
    return { total, news: newCount, baseChanged, rankActions }
  }, [reviewRows])

  const programsStats = useMemo(
    () => ({ total: initialPrograms.length }),
    [initialPrograms]
  )

  // when data size changes and current page is out of bounds, go back to the last page
  useEffect(() => {
    const max = Math.max(1, Math.ceil(reviewRows.length / PAGE_SIZE))
    if (pageSchools > max) setPageSchools(max)
  }, [reviewRows.length, pageSchools])

  useEffect(() => {
    const max = Math.max(1, Math.ceil(initialPrograms.length / PAGE_SIZE))
    if (pagePrograms > max) setPagePrograms(max)
  }, [initialPrograms.length, pagePrograms])

  // sort: sort by "incoming rank" (unreviewed's value) of the selected system/year, with value first
  const sortedReviewRows = useMemo(() => {
    const rows = [...reviewRows]
    rows.sort((a, b) => {
      const ra = pickIncomingRank(a.unreviewed, selectedSystem, selectedYear)
      const rb = pickIncomingRank(b.unreviewed, selectedSystem, selectedYear)
      const aNull = ra == null
      const bNull = rb == null
      if (aNull && bNull) return 0
      if (aNull) return 1
      if (bNull) return -1
      if (sortOrder === 'asc') return (ra as number) - (rb as number)
      return (rb as number) - (ra as number)
    })
    return rows
  }, [reviewRows, selectedSystem, selectedYear, sortOrder])

  /** ----- selection helpers ----- */
  const toggleOne = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }, [])

  const clearSelection = useCallback(() => setSelectedIds(new Set()), [])

  const selectAllOnPage = useCallback((ids: string[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => next.add(id))
      return next
    })
  }, [])

  /** ----- approve actions ----- */
  async function approve(unreviewedIds: string[]) {
    if (!unreviewedIds.length) return
    setPending(true)
    setErrorMsg(null)
    setMessage(null)
    try {
      const { data, error } = await supabase.rpc('approve_unreviewed_schools_bulk', {
        p_unreviewed_ids: unreviewedIds,
        p_reviewer: reviewerEmail ?? null,
        p_merge_strategy_base: baseStrategy,
        p_merge_strategy_rank: rankStrategy,
      })
      if (error) throw error

      const approvedSet = new Set<string>(data?.map((d: { unreviewed_id: string }) => d.unreviewed_id) ?? [])
      setReviewRows((rows) => rows.filter((r) => !approvedSet.has(r.unreviewed.id)))
      setSelectedIds((prev) => {
        const next = new Set(prev)
        approvedSet.forEach((id) => next.delete(id))
        return next
      })
      setMessage(`Approved ${approvedSet.size} item(s).`)
    } catch (e: unknown) {
      const message = typeof e === 'object' && e && 'message' in e ? String((e as { message?: unknown }).message) : null
      setErrorMsg(message ?? 'Approve failed')
    } finally {
      setPending(false)
    }
  }

  // current page ids
  const currentPageIds = useMemo(() => {
    const { slice } = paginate(sortedReviewRows, pageSchools, PAGE_SIZE)
    return slice.map((r) => r.unreviewed.id)
  }, [sortedReviewRows, pageSchools])

  return (
    <div className="container mx-auto space-y-4 p-6">
      <h1 className="text-3xl font-bold">Unreviewed Data</h1>

      {/* top switch button + current view stats + batch operations */}
      <div className="rounded-t-xl border border-b-0 p-2 flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Unreviewed tabs" className="inline-flex overflow-hidden rounded-xl">
          <ToggleButton
            label="Unreviewed Schools"
            active={active === 'schools'}
            onClick={() => setActive('schools')}
            aria-controls="unreviewed-content"
            aria-selected={active === 'schools'}
          />
          <ToggleButton
            label="Unreviewed Programs"
            active={active === 'programs'}
            onClick={() => setActive('programs')}
            aria-controls="unreviewed-content"
            aria-selected={active === 'programs'}
          />
        </div>

        {active === 'schools' ? (
          <div className="flex flex-col gap-2 self-start">
            {/* stats */}
            <div className="flex flex-wrap items-center gap-2">
              <BadgeLike>Total: {schoolsStats.total}</BadgeLike>
              <BadgeLike className="bg-green-100 text-green-800">New: {schoolsStats.news}</BadgeLike>
              <BadgeLike className="bg-amber-100 text-amber-900">Base changed: {schoolsStats.baseChanged}</BadgeLike>
              <BadgeLike className="bg-blue-100 text-blue-900">Rank actions: {schoolsStats.rankActions}</BadgeLike>
            </div>

            {/* filters */}
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-sm">System</label>
              <select
                aria-label="ranking system"
                value={selectedSystem}
                onChange={(e) => setSelectedSystem(e.target.value as 'QS' | 'TIME')}
                className="rounded border px-2 py-1 text-sm"
              >
                <option value="QS">QS</option>
                <option value="TIME">TIMES</option>
              </select>
              <label className="text-sm">Year</label>
              <select
                aria-label="ranking year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="rounded border px-2 py-1 text-sm"
              >
                {YEARS_BY_SYSTEM[selectedSystem].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <label className="text-sm">Sort</label>
              <select
                aria-label="ranking sort order"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="rounded border px-2 py-1 text-sm"
              >
                <option value="asc">Asc</option>
                <option value="desc">Desc</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 self-start">
            <div className="flex flex-wrap items-center gap-2">
              <BadgeLike>Total: {programsStats.total}</BadgeLike>
            </div>
          </div>
        )}

        {/* batch operations area (only schools) */}
        {active === 'schools' && (
          <div className="flex flex-col gap-2 self-end">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => selectAllOnPage(currentPageIds)} disabled={pending}>
                Select page ({currentPageIds.length})
              </Button>
              <Button variant="outline" size="sm" onClick={clearSelection} disabled={pending}>
                Clear
              </Button>
              <span className="text-xs text-muted-foreground">Selected: {selectedIds.size}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-sm">Base</label>
              <select
                value={baseStrategy}
                onChange={(e) => setBaseStrategy(e.target.value as 'fill-missing' | 'overwrite')}
                className="rounded border px-2 py-1 text-sm"
                aria-label="base strategy"
              >
                <option value="fill-missing">fill-missing</option>
                <option value="overwrite">overwrite</option>
              </select>
              <label className="text-sm">Rank</label>
              <select
                value={rankStrategy}
                onChange={(e) => setRankStrategy(e.target.value as 'upsert' | 'skip')}
                className="rounded border px-2 py-1 text-sm"
                aria-label="rank strategy"
              >
                <option value="upsert">upsert</option>
                <option value="skip">skip</option>
              </select>
              <Button
                onClick={() => approve(Array.from(selectedIds))}
                disabled={pending || selectedIds.size === 0}
              >
                {pending ? 'Approving…' : 'Approve Selected'}
              </Button>
            </div>
            {message && <div className="text-xs text-emerald-700">{message}</div>}
            {errorMsg && <div className="text-xs text-rose-700">{errorMsg}</div>}
          </div>
        )}
      </div>

      {/* main display area */}
      <Card id="unreviewed-content" className="-mt-px rounded-t-none border-t-0">
        <CardContent className="space-y-4 p-4">
          {active === 'schools' ? (
            <>
              <SchoolsView
                rows={sortedReviewRows}
                page={pageSchools}
                pageSize={PAGE_SIZE}
                selectedSystem={selectedSystem}
                selectedYear={selectedYear}
                selectedIds={selectedIds}
                onToggle={(id, checked) => toggleOne(id, checked)}
                onApproveOne={(id) => approve([id])}
                pending={pending}
              />
              <Pager
                page={pageSchools}
                total={sortedReviewRows.length}
                pageSize={PAGE_SIZE}
                onChange={setPageSchools}
              />
            </>
          ) : (
            <>
              <ProgramsView
                rows={initialPrograms}
                page={pagePrograms}
                pageSize={PAGE_SIZE}
              />
              <Pager
                page={pagePrograms}
                total={initialPrograms.length}
                pageSize={PAGE_SIZE}
                onChange={setPagePrograms}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/* ---------------- view components ---------------- */

function SchoolsView({
  rows,
  page,
  pageSize,
  selectedSystem,
  selectedYear,
  selectedIds,
  onToggle,
  onApproveOne,
  pending,
}: {
  rows: ReviewRow[]
  page: number
  pageSize: number
  selectedSystem: 'QS' | 'TIME'
  selectedYear: number
  selectedIds: Set<string>
  onToggle: (id: string, checked: boolean) => void
  onApproveOne: (id: string) => void
  pending: boolean
}) {
  if (!rows?.length) {
    return <div className="text-sm text-muted-foreground">No unreviewed schools with diffs.</div>
  }

  const { slice } = paginate(rows, page, pageSize)

  return (
    <div className="space-y-3">
      {slice.map((r) => {
        const s = r.unreviewed
        const badge = !r.existingSchoolId
          ? <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-800">New</span>
          : r.hasAnyDiff
          ? <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-900">Partial Update</span>
          : <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">Same</span>

        const checked = selectedIds.has(s.id)

        return (
          <div key={s.id} className="space-y-3 rounded-xl border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  aria-label="select school"
                  checked={checked}
                  onChange={(e) => onToggle(s.id, e.target.checked)}
                />
                <div className="font-semibold">{s.name}</div>
                <RankingTagInline school={s} system={selectedSystem} year={selectedYear} />
              </div>
              <div className="flex items-center gap-2">
                {badge}
                <Button variant="outline" size="sm" onClick={() => onApproveOne(s.id)} disabled={pending}>
                  Approve
                </Button>
              </div>
            </div>

            {/* base fields difference */}
            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="mb-2 text-xs font-semibold opacity-80">Base Fields</div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {r.baseDiffs.map(({ field, existing, incoming, changed }) => (
                  <div key={field} className={cn('rounded-md border p-2', changed && 'border-red-200 bg-red-50')}>
                    <div className="text-xs text-muted-foreground">{labelOf(field)}</div>
                    <div className="text-xs opacity-70">Existing: {display(existing)}</div>
                    <div className="text-sm">Incoming: {display(incoming)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ranking difference */}
            <div className="rounded-lg border p-3">
              <div className="mb-2 text-xs font-semibold opacity-80">Rankings</div>
              <div className="flex flex-wrap gap-2">
                {r.rankDiffs.map((d) => (
                  <RankBadge key={d.key} diff={d} />
                ))}
              </div>

              <div className="mt-3">
                {r.rankDiffs
                  .filter((d) => mapSystemLabel(d.system) === selectedSystem && d.year === selectedYear)
                  .map((d) => (
                    <div key={d.key} className="text-sm">
                      <span className="font-medium">{d.key}</span>:&nbsp;
                      <span className="opacity-70">existing</span> {display(d.existing)}{' '}
                      <span className="opacity-70">→ incoming</span> {display(d.incoming)}{' '}
                      {d.status === 'missing' && <em className="text-emerald-700">(add)</em>}
                      {d.status === 'update' && <em className="text-blue-700">(update)</em>}
                      {d.status === 'invalid' && <em className="text-rose-700">(invalid)</em>}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function RankBadge({ diff }: { diff: RankDiff }) {
  const color =
    diff.status === 'missing'
      ? 'bg-emerald-100 text-emerald-800'
      : diff.status === 'update'
      ? 'bg-blue-100 text-blue-900'
      : diff.status === 'invalid'
      ? 'bg-rose-100 text-rose-800'
      : 'bg-slate-100 text-slate-700'
  return (
    <span className={cn('rounded px-2 py-0.5 text-xs', color)}>
      {diff.key}: {display(diff.existing)} → {display(diff.incoming)} {diff.status !== 'same' ? `(${diff.status})` : ''}
    </span>
  )
}

function RankingTagInline({
  school,
  system,
  year,
}: {
  school: Item
  system: 'QS' | 'TIME'
  year: number
}) {
  const key = system === 'QS' ? (`qs_${year}` as const) : (`times_${year}` as const)
  const raw = school[key as keyof Item]
  const rank = typeof raw === 'number' ? raw : raw == null ? null : Number(raw)
  if (rank == null) return <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">—</span>
  const tone = rank <= 50 ? 'bg-green-100 text-green-800' : rank <= 200 ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-700'
  return (
    <span className={cn('rounded px-2 py-0.5 text-xs', tone)}>
      {system} {year} #{rank}
    </span>
  )
}

function pickIncomingRank(row: Item, system: 'QS' | 'TIME', year: number): number | null {
  const key = system === 'QS' ? (`qs_${year}` as const) : (`times_${year}` as const)
  const raw = row[key as keyof Item]
  if (raw == null) return null
  const n = typeof raw === 'number' ? raw : Number(raw)
  return Number.isFinite(n) ? n : null
}

function ProgramsView({
  rows,
  page,
  pageSize,
}: {
  rows: Program[]
  page: number
  pageSize: number
}) {
  if (!rows?.length) {
    return <div className="text-sm text-muted-foreground">No unreviewed programs.</div>
  }

  const { slice } = paginate(rows, page, pageSize)

  return (
    <div className="space-y-3">
      {slice.map((p) => (
        <div key={p.id} className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <Checkbox aria-label="select program" />
            <span className="font-medium">{p.name}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ---------------- pager component ---------------- */

function Pager({
  page,
  total,
  pageSize,
  onChange,
}: {
  page: number
  total: number
  pageSize: number
  onChange: (p: number) => void
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const canPrev = page > 1
  const canNext = page < totalPages

  // generate a sliding window of pages (max 7)
  const window = 7
  const half = Math.floor(window / 2)
  let start = Math.max(1, page - half)
  const end = Math.min(totalPages, start + window - 1)
  start = Math.max(1, end - window + 1)

  const pages = []
  for (let i = start; i <= end; i++) pages.push(i)

  const { from, to } = rangeInfo(page, pageSize, total)

  return (
    <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
      <div className="text-xs text-muted-foreground">
        {total === 0 ? '0 items' : `${from}–${to} of ${total}`}
      </div>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" disabled={!canPrev} onClick={() => onChange(1)}>« First</Button>
        <Button variant="outline" size="sm" disabled={!canPrev} onClick={() => onChange(page - 1)}>‹ Prev</Button>

        {pages.map((p) => (
          <Button
            key={p}
            variant={p === page ? 'default' : 'outline'}
            size="sm"
            onClick={() => onChange(p)}
            className={cn(p === page && 'bg-black text-white hover:bg-black')}
          >
            {p}
          </Button>
        ))}

        <Button variant="outline" size="sm" disabled={!canNext} onClick={() => onChange(page + 1)}>Next ›</Button>
        <Button variant="outline" size="sm" disabled={!canNext} onClick={() => onChange(totalPages)}>Last »</Button>
      </div>
    </div>
  )
}

/* ---------------- components & utils ---------------- */

function ToggleButton({
  label,
  active,
  onClick,
  ...aria
}: {
  label: string
  active: boolean
  onClick: () => void
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="tab"
      {...aria}
      className={cn(
        'px-4 py-2 text-sm transition outline-none border-0',
        'focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:ring-black/40',
        active
          ? 'bg-white text-black'
          : 'bg-black text-white hover:bg-black/90'
      )}
    >
      {label}
    </button>
  )
}

function BadgeLike({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn('rounded bg-slate-100 px-2 py-1 text-sm', className)}>{children}</span>
}

function display(v: unknown) {
  if (v === null || v === undefined || v === '') return <span className="opacity-50">—</span>
  return String(v)
}

function labelOf(field: BaseDiff['field']) {
  switch (field) {
    case 'name': return 'Name'
    case 'initial': return 'Initial'
    case 'country': return 'Country'
    case 'location': return 'Location'
    case 'website': return 'Website'
  }
}

function mapSystemLabel(sys: string): 'QS' | 'TIME' {
  return sys.toLowerCase() === 'qs' ? 'QS' : 'TIME'
}

/* ---- simple pager tool ---- */
function paginate<T>(rows: T[], page: number, pageSize: number) {
  const total = rows.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const curr = Math.min(Math.max(1, page), totalPages)
  const start = (curr - 1) * pageSize
  const end = Math.min(start + pageSize, total)
  return { slice: rows.slice(start, end), start, end, curr, total, totalPages }
}

function rangeInfo(page: number, pageSize: number, total: number) {
  if (total === 0) return { from: 0, to: 0 }
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  return { from, to }
}