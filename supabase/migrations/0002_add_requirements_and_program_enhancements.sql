-- Migration: Add requirements table and enhance programs table
-- This migration implements the schema changes as designed in docs/schema-design.mdc

-- Add new columns to programs table
ALTER TABLE public.programs 
ADD COLUMN credits integer,
ADD COLUMN delivery_method text,
ADD COLUMN schedule_type text,
ADD COLUMN location text,
ADD COLUMN add_ons jsonb,
ADD COLUMN start_date date;

-- Create the requirements table with one-to-one relationship to programs
CREATE TABLE public.requirements (
  program_id uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  ielts_score real,
  toefl_score real,
  gre_score integer,
  min_gpa real,
  other_tests text,
  requires_personal_statement boolean DEFAULT false,
  requires_portfolio boolean DEFAULT false,
  requires_cv boolean DEFAULT false,
  letters_of_recommendation integer,
  application_fee integer,
  application_deadline date,
  PRIMARY KEY (program_id)
);

-- Enable RLS for requirements table
ALTER TABLE public.requirements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for requirements table
CREATE POLICY "Requirements are viewable by everyone." 
ON requirements FOR SELECT USING (true);

CREATE POLICY "Admins can create requirements." 
ON requirements FOR INSERT WITH CHECK (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Admins can update requirements." 
ON requirements FOR UPDATE WITH CHECK (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Admins can delete requirements." 
ON requirements FOR DELETE USING (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
);

-- Remove the old requirements jsonb column from programs table
ALTER TABLE public.programs DROP COLUMN IF EXISTS requirements;

-- Add comments to document the new structure
COMMENT ON TABLE public.requirements IS 'Academic and application requirements for programs, one-to-one relationship with programs table';
COMMENT ON COLUMN public.programs.credits IS 'Total credits required for the program';
COMMENT ON COLUMN public.programs.delivery_method IS 'How the program is delivered: Onsite, Online, or Hybrid';
COMMENT ON COLUMN public.programs.schedule_type IS 'Program schedule: Full-time or Part-time';
COMMENT ON COLUMN public.programs.location IS 'Program-specific location, defaults to school location if not specified';
COMMENT ON COLUMN public.programs.add_ons IS 'Additional program features like scholarships, stored as JSON';
COMMENT ON COLUMN public.programs.start_date IS 'Program start date';
