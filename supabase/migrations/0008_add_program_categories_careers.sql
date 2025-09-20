-- Migration: Enhance schema with program categories, careers, and application difficulty
-- This migration implements the schema changes for issue #69

-- ============================================================================
-- 1. PROGRAM CATEGORIES SYSTEM
-- ============================================================================

-- Create program_categories table
CREATE TABLE program_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  abbreviation VARCHAR(10) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create program_category_mapping table for many-to-many relationship
CREATE TABLE program_category_mapping (
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES program_categories(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false, -- Primary category for the program
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (program_id, category_id)
);

-- Ensure at most one primary category per program
CREATE UNIQUE INDEX one_primary_category_per_program
ON program_category_mapping(program_id)
WHERE is_primary;

-- ============================================================================
-- 2. CAREERS SYSTEM
-- ============================================================================

-- Create careers table
CREATE TABLE careers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  abbreviation VARCHAR(10) NOT NULL UNIQUE,
  description TEXT,
  industry VARCHAR(50), -- Industry classification
  career_type VARCHAR(20) CHECK (career_type IN ('Software', 'Data', 'AI', 'Hardware', 'Product', 'Design', 'Security', 'Infrastructure', 'Management', 'Finance', 'Healthcare', 'Research')), -- Career category
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create category_career_mapping table (default career paths for categories)
CREATE TABLE category_career_mapping (
  category_id UUID NOT NULL REFERENCES program_categories(id) ON DELETE CASCADE,
  career_id UUID NOT NULL REFERENCES careers(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT true, -- Whether this is a default career path for the category
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (category_id, career_id)
);

-- Create program_career_mapping table (custom career paths for programs)
CREATE TABLE program_career_mapping (
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  career_id UUID NOT NULL REFERENCES careers(id) ON DELETE CASCADE,
  is_custom BOOLEAN DEFAULT false, -- Whether this is a custom added career path
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (program_id, career_id)
);

-- ============================================================================
-- 3. UPDATE PROGRAMS TABLE
-- ============================================================================

ALTER TABLE programs 
ADD COLUMN category_ids UUID[],                    -- 分类ID数组
ADD COLUMN primary_category_id UUID REFERENCES program_categories(id); -- 主分类

-- Add comments for documentation
COMMENT ON COLUMN programs.category_ids IS 'Array of category IDs for this program';
COMMENT ON COLUMN programs.primary_category_id IS 'Primary category ID for this program';

-- ============================================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE program_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_category_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE careers ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_career_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_career_mapping ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. CREATE RLS POLICIES
-- ============================================================================

-- Program Categories Policies
CREATE POLICY "Program categories are viewable by everyone" 
ON program_categories FOR SELECT USING (true);

CREATE POLICY "Admins can manage program categories" 
ON program_categories FOR ALL USING (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
);

-- Program Category Mapping Policies
CREATE POLICY "Program category mappings are viewable by everyone" 
ON program_category_mapping FOR SELECT USING (true);

CREATE POLICY "Admins can manage program category mappings" 
ON program_category_mapping FOR ALL USING (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
);

-- Careers Policies
CREATE POLICY "Careers are viewable by everyone" 
ON careers FOR SELECT USING (true);

CREATE POLICY "Admins can manage careers" 
ON careers FOR ALL USING (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
);

-- Category Career Mapping Policies
CREATE POLICY "Category career mappings are viewable by everyone" 
ON category_career_mapping FOR SELECT USING (true);

CREATE POLICY "Admins can manage category career mappings" 
ON category_career_mapping FOR ALL USING (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
);

-- Program Career Mapping Policies
CREATE POLICY "Program career mappings are viewable by everyone" 
ON program_career_mapping FOR SELECT USING (true);

CREATE POLICY "Admins can manage program career mappings" 
ON program_career_mapping FOR ALL USING (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
);

-- ============================================================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Program categories indexes
CREATE INDEX idx_program_categories_name ON program_categories(name);
CREATE INDEX idx_program_categories_abbreviation ON program_categories(abbreviation);

-- Program category mapping indexes
CREATE INDEX idx_program_category_mapping_program_id ON program_category_mapping(program_id);
CREATE INDEX idx_program_category_mapping_category_id ON program_category_mapping(category_id);
CREATE INDEX idx_program_category_mapping_primary ON program_category_mapping(is_primary) WHERE is_primary = true;

-- Careers indexes
CREATE INDEX idx_careers_name ON careers(name);
CREATE INDEX idx_careers_abbreviation ON careers(abbreviation);
CREATE INDEX idx_careers_industry ON careers(industry);
CREATE INDEX idx_careers_type ON careers(career_type);

-- Category career mapping indexes
CREATE INDEX idx_category_career_mapping_category_id ON category_career_mapping(category_id);
CREATE INDEX idx_category_career_mapping_career_id ON category_career_mapping(career_id);
CREATE INDEX idx_category_career_mapping_default ON category_career_mapping(is_default) WHERE is_default = true;

-- Program career mapping indexes
CREATE INDEX idx_program_career_mapping_program_id ON program_career_mapping(program_id);
CREATE INDEX idx_program_career_mapping_career_id ON program_career_mapping(career_id);
CREATE INDEX idx_program_career_mapping_custom ON program_career_mapping(is_custom) WHERE is_custom = true;


-- ============================================================================
-- 9. CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to get program categories with mapping
CREATE OR REPLACE FUNCTION get_program_categories(program_uuid UUID)
RETURNS TABLE (
    category_id UUID,
    category_name VARCHAR(50),
    category_description TEXT,
    is_primary BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pc.id,
        pc.name,
        pc.description,
        pcm.is_primary
    FROM program_categories pc
    JOIN program_category_mapping pcm ON pc.id = pcm.category_id
    WHERE pcm.program_id = program_uuid
    ORDER BY pcm.is_primary DESC, pc.name;
END;
$$ LANGUAGE plpgsql;

-- Function to get careers for a program (default + custom)
CREATE OR REPLACE FUNCTION get_program_careers(program_uuid UUID)
RETURNS TABLE (
    career_id UUID,
    career_name VARCHAR(50),
    career_abbreviation VARCHAR(10),
    career_description TEXT,
    industry VARCHAR(50),
    career_type VARCHAR(20),
    is_custom BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    -- Get custom careers for this program
    SELECT 
        c.id,
        c.name,
        c.abbreviation,
        c.description,
        c.industry,
        c.career_type,
        pcm.is_custom
    FROM careers c
    JOIN program_career_mapping pcm ON c.id = pcm.career_id
    WHERE pcm.program_id = program_uuid
    
    UNION
    
    -- Get default careers from program's primary category
    SELECT 
        c.id,
        c.name,
        c.abbreviation,
        c.description,
        c.industry,
        c.career_type,
        false as is_custom
    FROM careers c
    JOIN category_career_mapping ccm ON c.id = ccm.career_id
    JOIN program_category_mapping pcm ON ccm.category_id = pcm.category_id
    WHERE pcm.program_id = program_uuid 
      AND pcm.is_primary = true
      AND ccm.is_default = true
      AND c.id NOT IN (
        SELECT career_id FROM program_career_mapping 
        WHERE program_id = program_uuid
      )
    
    ORDER BY is_custom DESC, career_name;
END;
$$ LANGUAGE plpgsql;

-- Function to get programs by career
CREATE OR REPLACE FUNCTION get_programs_by_career(career_uuid UUID)
RETURNS TABLE (
    program_id UUID,
    program_name VARCHAR(255),
    school_name VARCHAR(255),
    primary_category_name VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        p.id,
        p.name,
        s.name as school_name,
        pc.name as primary_category_name
    FROM programs p
    JOIN schools s ON p.school_id = s.id
    LEFT JOIN program_category_mapping pcm ON p.id = pcm.program_id AND pcm.is_primary = true
    LEFT JOIN program_categories pc ON pcm.category_id = pc.id
    WHERE p.id IN (
        -- Programs with custom career mapping
        SELECT program_id FROM program_career_mapping WHERE career_id = career_uuid
        UNION
        -- Programs with default career mapping from primary category
        SELECT pcm2.program_id 
        FROM program_category_mapping pcm2
        JOIN category_career_mapping ccm ON pcm2.category_id = ccm.category_id
        WHERE ccm.career_id = career_uuid 
          AND pcm2.is_primary = true
          AND ccm.is_default = true
          AND pcm2.program_id NOT IN (
            SELECT program_id FROM program_career_mapping WHERE career_id = career_uuid
          )
    )
    ORDER BY p.name;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 10. CREATE TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_program_categories_updated_at 
    BEFORE UPDATE ON program_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_careers_updated_at 
    BEFORE UPDATE ON careers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 11. ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE program_categories IS 'Program categories for classification and filtering (CS, DS, UX, etc.)';
COMMENT ON TABLE program_category_mapping IS 'Many-to-many mapping between programs and categories';
COMMENT ON TABLE careers IS 'Career paths and job roles in technology and related fields';
COMMENT ON TABLE category_career_mapping IS 'Default career paths for each program category';
COMMENT ON TABLE program_career_mapping IS 'Custom career paths for specific programs';

COMMENT ON FUNCTION get_program_categories(UUID) IS 'Get all categories for a specific program with mapping details';
COMMENT ON FUNCTION get_program_careers(UUID) IS 'Get all career paths (default + custom) for a specific program';
COMMENT ON FUNCTION get_programs_by_career(UUID) IS 'Get all programs that lead to a specific career path';

-- ============================================================================
-- 12. VALIDATION CONSTRAINTS
-- ============================================================================

-- Add constraint to ensure non-empty career names
ALTER TABLE careers ADD CONSTRAINT check_career_name_not_empty 
CHECK (LENGTH(TRIM(name)) > 0);

-- Add constraint to ensure non-empty category names
ALTER TABLE program_categories ADD CONSTRAINT check_category_name_not_empty 
CHECK (LENGTH(TRIM(name)) > 0);
