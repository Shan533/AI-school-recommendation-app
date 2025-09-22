'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { getServerSupabaseAdmin } from '@/lib/supabase/server';

export async function approveItems({ schoolIds, programIds }:{
  schoolIds: string[];
  programIds: string[];
}) {
  await requireAdmin();
  const supabase = getServerSupabaseAdmin();

  const idsSchools = schoolIds?.length ? `('{${schoolIds.join(',')}}')` : `('{}')`;
  const idsPrograms = programIds?.length ? `('{${programIds.join(',')}}')` : `('{}')`;

  const sql = `
    begin;

    -- Schools: INSERT ... ON CONFLICT ... DO UPDATE (only cover non-empty incremental fields)
    insert into schools (name, country, website, ...)
    select s.name, s.country, s.website, ...
    from unreviewed_schools s
    where s.id = any(${idsSchools}::uuid[])
    on conflict (name) do update set
      country = coalesce(excluded.country, schools.country),
      website = coalesce(excluded.website, schools.website)

    returning id;

    delete from unreviewed_schools where id = any(${idsSchools}::uuid[]);

    insert into programs (school_id, name, degree, ...)
    select p.school_id, p.name, p.degree, ...
    from unreviewed_programs p
    where p.id = any(${idsPrograms}::uuid[])
    on conflict (school_id, name) do update set
      degree = coalesce(excluded.degree, programs.degree),
      ...;

    delete from unreviewed_programs where id = any(${idsPrograms}::uuid[]);

    commit;
  `;

  const { error } = await supabase.rpc('exec_sql', { sql });
  if (error) throw error;

  revalidatePath('/admin/unreviewed');
}