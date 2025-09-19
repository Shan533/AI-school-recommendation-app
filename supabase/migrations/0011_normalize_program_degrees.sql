-- Normalize program degree values to a standard set
-- Target values: Bachelor | Master | PhD | Associate | Certificate | Diploma
-- Idempotent and safe to run multiple times.

begin;

-- Trim whitespace
update public.programs
set degree = btrim(degree)
where degree is not null;

-- Master variants
update public.programs
set degree = 'Master'
where degree is not null
  and degree <> 'Master'
  and (
    degree ~* '^(ms|m\.s\.|m sc|m\. sc\.|master|masters)$' or
    degree ~* 'm[a\.]?s(?![a-z])'
  );

-- Bachelor variants
update public.programs
set degree = 'Bachelor'
where degree is not null
  and degree <> 'Bachelor'
  and (
    degree ~* '^(bs|b\.s\.|b sc|b\. sc\.|bachelor|bachelors)$' or
    degree ~* 'b[a\.]?s(?![a-z])'
  );

-- PhD variants
update public.programs
set degree = 'PhD'
where degree is not null
  and degree <> 'PhD'
  and (
    degree ~* '^(phd|ph\.d\.|doctorate|doctoral)$'
  );

-- Associate variants
update public.programs
set degree = 'Associate'
where degree is not null
  and degree <> 'Associate'
  and (
    degree ~* '^(associate|aas|a\.a\.s\.)$'
  );

-- Certificate variants
update public.programs
set degree = 'Certificate'
where degree is not null
  and degree <> 'Certificate'
  and (
    degree ~* '^(certificate|cert)$'
  );

-- Diploma variants
update public.programs
set degree = 'Diploma'
where degree is not null
  and degree <> 'Diploma'
  and (
    degree ~* '^(diploma)$'
  );

commit;

