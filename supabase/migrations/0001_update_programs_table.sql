ALTER TABLE public.programs
RENAME COLUMN duration_months TO duration_years;

ALTER TABLE public.programs
ALTER COLUMN duration_years TYPE REAL;

ALTER TABLE public.programs
ADD COLUMN requirements JSONB;
