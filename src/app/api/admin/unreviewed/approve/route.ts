// app/api/admin/unreviewed/approve/route.ts
import { NextResponse } from 'next/server'
import { getServerSupabaseAdmin } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function POST(req: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { schoolIds = [], programIds = [] } = await req.json()
  const admin = getServerSupabaseAdmin()

  // 调用你在 DB 里定义的 RPC，比如 merge_unreviewed
  const { error } = await admin.rpc('merge_unreviewed', {
    school_ids: schoolIds,
    program_ids: programIds,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
