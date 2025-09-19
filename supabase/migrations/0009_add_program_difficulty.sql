-- Add application difficulty fields to programs

ALTER TABLE programs 
ADD COLUMN application_difficulty VARCHAR(10) CHECK (application_difficulty IN ('SSR', 'SR', 'R', 'N')),
ADD COLUMN difficulty_description TEXT;

COMMENT ON COLUMN programs.application_difficulty IS 'Application difficulty: SSR (Super Super Rare), SR (Super Rare), R (Rare), N (Normal)';
COMMENT ON COLUMN programs.difficulty_description IS 'Human-readable description of application difficulty';

CREATE INDEX idx_programs_application_difficulty ON programs(application_difficulty);

-- Normalize schools.country -> region enum

-- Create enum for region values (standardized)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'region_type') THEN
    CREATE TYPE region_type AS ENUM ('United States', 'United Kingdom', 'Canada', 'Europe', 'Asia', 'Australia', 'Other');
  END IF;
END $$;

-- Rename and migrate
ALTER TABLE public.schools RENAME COLUMN country TO region_text;
ALTER TABLE public.schools ADD COLUMN region region_type;

UPDATE public.schools
SET region = (CASE
  WHEN region_text ILIKE 'us' OR region_text ILIKE 'usa' OR region_text ILIKE 'u.s.' OR region_text ILIKE 'united states%' OR region_text ILIKE 'america' THEN 'United States'
  WHEN region_text ILIKE 'uk' OR region_text ILIKE 'united kingdom%' OR region_text ILIKE 'great britain' OR region_text ILIKE 'england' OR region_text ILIKE 'scotland' OR region_text ILIKE 'wales' OR region_text ILIKE 'northern ireland' THEN 'United Kingdom'
  WHEN region_text ILIKE 'eu' OR region_text ILIKE 'europe%' OR region_text ILIKE '%germany%' OR region_text ILIKE '%france%' OR region_text ILIKE '%spain%' OR region_text ILIKE '%italy%' OR region_text ILIKE '%netherlands%' OR region_text ILIKE '%sweden%' OR region_text ILIKE '%finland%' OR region_text ILIKE '%denmark%' OR region_text ILIKE '%norway%' THEN 'Europe'
  WHEN region_text ILIKE 'asia%' OR region_text ILIKE '%china%' OR region_text ILIKE '%japan%' OR region_text ILIKE '%korea%' OR region_text ILIKE '%india%' OR region_text ILIKE '%singapore%' OR region_text ILIKE '%hong kong%' OR region_text ILIKE '%taiwan%' OR region_text ILIKE '%malaysia%' OR region_text ILIKE '%thailand%' OR region_text ILIKE '%indonesia%' OR region_text ILIKE '%vietnam%' THEN 'Asia'
  WHEN region_text ILIKE '%australia%' THEN 'Australia'
  WHEN region_text ILIKE 'canada' OR region_text ILIKE '%ontario%' OR region_text ILIKE '%quebec%' OR region_text ILIKE '%british columbia%' OR region_text ILIKE '%alberta%' OR region_text ILIKE '%manitoba%' OR region_text ILIKE '%saskatchewan%' OR region_text ILIKE '%nova scotia%' OR region_text ILIKE '%new brunswick%' OR region_text ILIKE '%newfoundland%' OR region_text ILIKE '%prince edward island%' THEN 'Canada'
  ELSE 'Other'
END)::region_type;

-- Keep region_text temporarily to avoid breaking dependent views. Drop in a follow-up after views are updated.
-- ALTER TABLE public.schools DROP COLUMN region_text;
CREATE INDEX IF NOT EXISTS idx_schools_region ON public.schools(region);
