-- =========================================================
-- 0) basic extensions
-- =========================================================
create extension if not exists pgcrypto;

-- =========================================================
-- 1) rankings table: school_rankings
--    use subject NOT NULL DEFAULT '' to simplify unique key and UPSERT
-- =========================================================
create table if not exists school_rankings (
  id         bigserial primary key,
  school_id  uuid not null references schools(id) on delete cascade,
  source     text not null check (source in ('qs','times')),
  year       int  not null check (year between 1900 and 2100),
  subject    text not null default '',   -- overall ranking leave empty string
  rank       int  not null check (rank > 0),
  unique (school_id, source, year, subject)
);

create index if not exists idx_school_rankings_school on school_rankings(school_id);
create index if not exists idx_school_rankings_src_year on school_rankings(source, year);

-- =========================================================
-- 2) school aliases table (recommended, for MIT ↔ full name)
-- =========================================================
create table if not exists school_aliases (
  id         bigserial primary key,
  school_id  uuid not null references schools(id) on delete cascade,
  alias_name text not null,
  created_at timestamptz not null default now()
);

-- unique function index (note: lower(alias_name) outside the parentheses)
create unique index if not exists uq_school_alias_ci
  on school_aliases (school_id, (lower(alias_name)));

-- =========================================================
-- 3) audit table: record each merge
-- =========================================================
create table if not exists merge_audit (
  id            bigserial primary key,
  unreviewed_id uuid,
  school_id     uuid,
  action        text not null,   -- 'UPSERT_BASE','UPSERT_RANK','CREATE_SCHOOL','ATTACH_ALIAS',...
  details       jsonb not null,  -- change details
  reviewer      text,
  merged_at     timestamptz not null default now()
);

-- =========================================================
-- 4) add reviewed flag to unreviewed_schools (if not)
-- =========================================================
alter table unreviewed_schools
  add column if not exists reviewed boolean not null default false,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by text;

-- =========================================================
-- 5) name normalization function: remove parentheses, compress spaces, lowercase
-- =========================================================
create or replace function normalize_school_name(p text)
returns text
language sql
immutable
as $$
  select trim(
           regexp_replace(
             lower(
               regexp_replace(p, '\s*\(.*\)\s*$', '', 'g') -- remove trailing parentheses and internal content
             ),
             '\s+', ' ', 'g'                               -- compress multiple spaces
           )
         )
$$;

-- =========================================================
-- 6) current/unreviewed snapshot view (for comparison or audit)
-- =========================================================
create or replace view existing_snapshot as
with ranks as (
  select
    sr.school_id,
    jsonb_object_agg((sr.source||'_'||sr.year)::text, to_jsonb(sr.rank)) as ranks_json
  from school_rankings sr
  group by sr.school_id
)
select
  s.id, s.name, s.initial, s.country, s.location, s.website,
  coalesce(r.ranks_json, '{}'::jsonb) as ranks
from schools s
left join ranks r on r.school_id = s.id;

create or replace view unreviewed_snapshot as
select
  u.id, u.name, u.initial, u.country, u.location, u.website,
  (
    select coalesce(jsonb_object_agg(k, (u_json->k)), '{}'::jsonb)
    from jsonb_object_keys(u_json) as k
    where k ~ '^(qs|times)_[0-9]{4}$'
  ) as ranks
from (
  select u.*, to_jsonb(u)::jsonb as u_json
  from unreviewed_schools u
) x(u, u_json);

-- =========================================================
-- 7) find school_id by name/alias
--    order: original name (case-insensitive) → normalized name → alias (normalized)
-- =========================================================
create or replace function find_school_id_by_name_alias(p_name text)
returns uuid
language plpgsql
stable
as $$
declare
  v_id   uuid;
  v_norm text := normalize_school_name(p_name);
begin
  -- original name (case-insensitive)
  select id into v_id
  from schools
  where lower(name) = lower(p_name)
  limit 1;
  if v_id is not null then
    return v_id;
  end if;

  -- normalized name
  select id into v_id
  from schools
  where normalize_school_name(name) = v_norm
  limit 1;
  if v_id is not null then
    return v_id;
  end if;

  -- alias (normalized)
  select sa.school_id into v_id
  from school_aliases sa
  where normalize_school_name(sa.alias_name) = v_norm
  limit 1;

  return v_id; -- may be NULL
end;
$$;

-- =========================================================
-- 8) batch merge RPC: approve_unreviewed_schools_bulk
--    parameters:
--      p_unreviewed_ids        uuid[]  multiple unreviewed IDs
--      p_reviewer              text    reviewer
--      p_merge_strategy_base   text    'fill-missing' | 'overwrite'
--      p_merge_strategy_rank   text    'upsert' | 'skip'
-- =========================================================
create or replace function approve_unreviewed_schools_bulk(
  p_unreviewed_ids uuid[],
  p_reviewer text default null,
  p_merge_strategy_base text default 'fill-missing',
  p_merge_strategy_rank text default 'upsert'
) returns table (unreviewed_id uuid, merged_school_id uuid)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid        uuid;
  v_u          unreviewed_schools%rowtype;
  v_sid        uuid;
  v_new_school boolean;
  v_key        text;
  v_source     text;
  v_year       int;
  v_rank_val   int;
  v_subject    text;
  v_before     existing_snapshot%rowtype;
begin
  if p_unreviewed_ids is null or array_length(p_unreviewed_ids,1) is null then
    raise exception 'p_unreviewed_ids cannot be empty';
  end if;

  foreach v_uid in array p_unreviewed_ids loop
    -- 1) read and lock unreviewed record
    select * into v_u
    from unreviewed_schools
    where id = v_uid and reviewed = false
    for update;
    if not found then
      continue; -- reviewed/not exists, skip
    end if;

    -- 2) find or create schools record
    v_sid := find_school_id_by_name_alias(v_u.name);
    v_new_school := false;

    if v_sid is null then
      v_sid := gen_random_uuid();
      insert into schools (id, name, initial, country, location, website)
      values (v_sid, v_u.name, v_u.initial, v_u.country, v_u.location, v_u.website);

      insert into merge_audit(unreviewed_id, school_id, action, details, reviewer)
      values (v_u.id, v_sid, 'CREATE_SCHOOL', jsonb_build_object('name', v_u.name), p_reviewer);

      -- register original name as alias, for later hit
      insert into school_aliases (school_id, alias_name)
      values (v_sid, v_u.name)
      on conflict do nothing;

      insert into merge_audit(unreviewed_id, school_id, action, details, reviewer)
      values (v_u.id, v_sid, 'ATTACH_ALIAS', jsonb_build_object('alias', v_u.name), p_reviewer);

      v_new_school := true;
    end if;

    -- 3) record "before" snapshot (for audit)
    select * into v_before from existing_snapshot where id = v_sid;

    -- 4) merge base fields
    if p_merge_strategy_base = 'overwrite' then
      update schools s set
        initial  = coalesce(v_u.initial,  s.initial),
        country  = coalesce(v_u.country,  s.country),
        location = coalesce(v_u.location, s.location),
        website  = coalesce(v_u.website,  s.website)
      where s.id = v_sid;

      insert into merge_audit(unreviewed_id, school_id, action, details, reviewer)
      values (
        v_u.id, v_sid, 'UPSERT_BASE',
        jsonb_build_object(
          'mode','overwrite',
          'before', jsonb_build_object(
            'initial', v_before.initial, 'country', v_before.country,
            'location', v_before.location, 'website', v_before.website
          ),
          'after', jsonb_build_object(
            'initial', coalesce(v_u.initial,  v_before.initial),
            'country', coalesce(v_u.country,  v_before.country),
            'location', coalesce(v_u.location, v_before.location),
            'website', coalesce(v_u.website,  v_before.website)
          )
        ),
        p_reviewer
      );
    else
      -- only fill missing
      update schools s set
        initial  = coalesce(s.initial,  v_u.initial),
        country  = coalesce(s.country,  v_u.country),
        location = coalesce(s.location, v_u.location),
        website  = coalesce(s.website,  v_u.website)
      where s.id = v_sid;

      insert into merge_audit(unreviewed_id, school_id, action, details, reviewer)
      values (
        v_u.id, v_sid, 'UPSERT_BASE',
        jsonb_build_object('mode','fill-missing'),
        p_reviewer
      );
    end if;

    -- 5) merge rankings (qs_YYYY / times_YYYY)
    if p_merge_strategy_rank = 'upsert' then
      for v_key in
        select key
        from jsonb_object_keys(to_jsonb(v_u)) as key
        where key ~ '^(qs|times)_[0-9]{4}$'
          and (to_jsonb(v_u)->>key) ~ '^[0-9]+$'  -- only merge valid rankings
      loop
        v_source   := split_part(v_key, '_', 1);
        v_year     := split_part(v_key, '_', 2)::int;
        v_rank_val := (to_jsonb(v_u)->>v_key)::int;
        v_subject  := '';  -- can be derived from v_u if needed

        insert into school_rankings (school_id, source, year, subject, rank)
        values (v_sid, v_source, v_year, v_subject, v_rank_val)
        on conflict (school_id, source, year, subject)
        do update set rank = excluded.rank;

        insert into merge_audit(unreviewed_id, school_id, action, details, reviewer)
        values (
          v_u.id, v_sid, 'UPSERT_RANK',
          jsonb_build_object('key', v_key, 'source', v_source, 'year', v_year, 'rank', v_rank_val),
          p_reviewer
        );
      end loop;
    end if;

    -- 6) mark reviewed
    update unreviewed_schools
    set reviewed = true, reviewed_at = now(), reviewed_by = p_reviewer
    where id = v_u.id;

    -- 7) return result
    unreviewed_id := v_u.id;
    merged_school_id := v_sid;
    return next;
  end loop;
end;
$$;

-- =========================================================
-- 9) basic permissions (adjust to your role model/RLS as needed)
-- =========================================================
grant execute on function approve_unreviewed_schools_bulk(uuid[], text, text, text) to authenticated;
grant select on existing_snapshot to authenticated;
grant select on unreviewed_snapshot to authenticated;
