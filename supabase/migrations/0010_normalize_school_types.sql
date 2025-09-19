-- Normalize existing values in schools.type to one of:
--   Public | Private | Art & Design | Community College
--
-- Safe to run multiple times. Uses pattern-based updates.

begin;

-- Trim whitespace first
update public.schools
set type = btrim(type)
where type is not null;

-- Public
update public.schools
set type = 'Public'
where type is not null
  and type <> 'Public'
  and (
    type ~* '(?<![a-z])public(?![a-z])' or
    type ~* '(?<![a-z])state(?![a-z])' or
    type ~* 'state university' or
    type ~* 'government' or
    type ~* '(?<![a-z])govt(?![a-z])'
  );

-- Private
update public.schools
set type = 'Private'
where type is not null
  and type <> 'Private'
  and (
    type ~* '(?<![a-z])private(?![a-z])' or
    type ~* 'independent' or
    type ~* 'non[- ]?profit' or
    type ~* 'for[- ]?profit'
  );

-- Art & Design
update public.schools
set type = 'Art & Design'
where type is not null
  and type <> 'Art & Design'
  and (
    type ~* 'art\s*&\s*design' or
    type ~* 'art\s*and\s*design' or
    type ~* 'art-?and-?design' or
    type ~* 'school of design' or
    type ~* 'college of art' or
    type ~* 'visual arts' or
    type ~* 'design school' or
    type ~* 'arts college' or
    type ~* '(?<![a-z])artanddesign(?![a-z])'
  );

-- Community College
update public.schools
set type = 'Community College'
where type is not null
  and type <> 'Community College'
  and (
    type ~* 'community college' or
    type ~* 'junior college' or
    type ~* '(2|two)[- ]?year' or
    type ~* '(?<![a-z])cc(?![a-z])'
  );

commit;

-- Note: Consider later adding a CHECK constraint or enum if you want to enforce
-- allowable values at the schema level. For now this migration only normalizes
-- existing rows.


