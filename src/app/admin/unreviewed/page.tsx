// app/admin/unreviewed/page.tsx
export const dynamic = 'force-dynamic'

import {
  getServerSupabaseAdmin,
  getServerSupabaseUser,
} from '@/lib/supabase/server'
import UnreviewedClient from './UnreviewedClient'

/* ========= Types ========= */
type AdminClient = ReturnType<typeof getServerSupabaseAdmin>
type FromFn = AdminClient['from']
type QueryBuilder = ReturnType<FromFn>
type SelectBuilder = ReturnType<QueryBuilder['select']>
type Item = {
  id: string
  name: string
  initial?: string | null
  country?: string | null
  location?: string | null
  website?: string | null
  website_url?: string | null
  [key: string]: unknown
}

type ExistingRanking = {
  school_id: string
  system: string   // 'qs' | 'times'
  year: number
  rank: number
}

type RankDiff = {
  key: string
  system: string
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
  missingAllRanks?: boolean
}

/* ========= Utils ========= */

// fetch all in pages (avoid PostgREST default 1000 limit)
async function fetchAll<T>(
  admin: ReturnType<typeof getServerSupabaseAdmin>,
  table: string,
  selectCols = '*',
  opts: {
    filter?: (q: SelectBuilder) => SelectBuilder
    order?: { col: string; asc?: boolean }
  } = {}
): Promise<T[]> {
  const pageSize = 1000
  let from = 0
  const rows: T[] = []
  while (true) {
    let q: SelectBuilder = admin.from(table).select(selectCols) as SelectBuilder
    if (opts.filter) q = opts.filter(q)
    if (opts.order) q = q.order(opts.order.col, { ascending: opts.order.asc ?? true })
    const { data, error } = await q.range(from, from + pageSize - 1)
    if (error) throw error
    rows.push(...((data as T[]) ?? []))
    if (!data || data.length < pageSize) break
    from += pageSize
  }
  return rows
}

function normalizeName(raw: string | null | undefined) {
  const s = (raw ?? '').toLowerCase().trim()
  // remove trailing parentheses, e.g. "MIT (Massachusetts…)" → "mit"
  return s.replace(/\s*\(.*\)\s*$/, '').replace(/\s+/g, ' ')
}

// dynamically extract ranking column names (case-insensitive): qs_YYYY / times_YYYY
function extractRankingKeys(row: Record<string, unknown>) {
  return Object.keys(row).filter((k) => /^(qs|times)_[0-9]{4}$/i.test(k))
}

// read incoming base fields (compatible with website_url)
function getIncomingBase(u: Item, field: BaseDiff['field']): string | null | undefined {
  if (field === 'website') return (u.website ?? u.website_url)
  return u[field]
}

/* ========= Page ========= */
export default async function Page() {
  const admin = getServerSupabaseAdmin()
  const supa  = await getServerSupabaseUser()

  // fetch all (reviewed filtered & sorted)
  const schools  = await fetchAll<Item>(
    admin,
    'unreviewed_schools',
    '*',
    { filter: (q) => q.eq('reviewed', false), order: { col: 'name', asc: true } }
  )

  const programs = await fetchAll<Item>(
    admin,
    'unreviewed_programs',
    'id, name',
    { order: { col: 'name', asc: true } }
  )

  const existing = await fetchAll<Item>(
    supa,
    'schools',
    'id, name, initial, country, location, website',
    { order: { col: 'name', asc: true } }
  )

  const existingRankings = await fetchAll<ExistingRanking>(
    admin,
    'school_rankings',
    'school_id, system, year, rank',
    { order: { col: 'school_id', asc: true } }
  )

  const { data: userData } = await supa.auth.getUser()
  const reviewerEmail = userData?.user?.email ?? null

  // name -> existing (using normalized name)
  const existingByNormName = new Map<string, Item>()
  for (const s of existing) {
    const key = normalizeName(s.name)
    if (key) existingByNormName.set(key, s)
  }

  // (school_id, system, year) -> rank
  const rankBySchoolIdSystemYear = new Map<string, number>()
  for (const r of existingRankings) {
    const key = `${r.school_id}::${r.system}::${r.year}`
    rankBySchoolIdSystemYear.set(key, r.rank)
  }

  // generate review rows (include: base fields different, ranking missing/need update, and "no ranking" schools)
  const reviewRows: ReviewRow[] = []

  for (const u of schools) {
    const norm = normalizeName(u.name)
    const matched = existingByNormName.get(norm) || null

    // base fields comparison
    const baseFields: BaseDiff[] = (['name','initial','country','location','website'] as const).map((field) => {
      const incoming = getIncomingBase(u, field)
      const existingVal = matched ? matched[field as keyof Item] as (string | null | undefined) : null
      const changed = matched ? (incoming ?? null) !== (existingVal ?? null) : true
      return { field, incoming, existing: existingVal, changed }
    })

    // ranking keys: qs_YYYY / times_YYYY
    const keys = extractRankingKeys(u as Record<string, unknown>)
    const hasIncomingRanks = keys.some((k) => {
      const v = u[k as keyof Item]
      return v !== null && v !== undefined && String(v).trim() !== ''
    })

    const rankDiffs: RankDiff[] = []
    for (const k of keys) {
      const m = k.match(/^(qs|times)_(\d{4})$/i)!
      const system = m[1].toLowerCase() // qs/times
      const year = Number(m[2])
      const raw = u[k as keyof Item]
      const incoming =
        raw === null || raw === undefined || String(raw).trim() === ''
          ? null
          : Number(raw)

      if (!matched) {
        if (Number.isFinite(incoming as number)) {
          rankDiffs.push({ key: k, system, year, incoming: incoming as number, existing: null, status: 'missing' })
        }
        continue
      }

      const existingRank = rankBySchoolIdSystemYear.get(`${matched.id}::${system}::${year}`) ?? null

      if (incoming == null || !Number.isFinite(incoming)) {
        // if not provided, skip, missingAllRanks will control the visibility
      } else if (existingRank == null) {
        rankDiffs.push({ key: k, system, year, incoming, existing: null, status: 'missing' })
      } else if (existingRank !== incoming) {
        rankDiffs.push({ key: k, system, year, incoming, existing: existingRank, status: 'update' })
      } else {
        rankDiffs.push({ key: k, system, year, incoming, existing: existingRank, status: 'same' })
      }
    }

    const showBecauseNoRanking = !hasIncomingRanks
    const hasAnyDiff =
      showBecauseNoRanking ||
      baseFields.some(b => b.changed) ||
      rankDiffs.some(r => r.status === 'missing' || r.status === 'update')

    if (hasAnyDiff) {
      reviewRows.push({
        unreviewed: u,
        existingSchoolId: matched ? matched.id : null,
        baseDiffs: baseFields,
        rankDiffs,
        hasAnyDiff,
        missingAllRanks: showBecauseNoRanking || undefined,
      })
    }
  }

  return (
    <UnreviewedClient
      initialPrograms={programs as { id: string; name: string }[]}
      reviewRows={reviewRows}
      reviewerEmail={reviewerEmail}
    />
  )
}
