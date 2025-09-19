-- Migration: Enhance schema with program categories and application difficulty
-- This migration implements the schema changes for issue #69

-- ============================================================================
-- 1. PROGRAM CATEGORIES SYSTEM
-- ============================================================================

-- Create program_categories table
CREATE TABLE program_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  abbreviation VARCHAR(10) NOT NULL UNIQUE,  -- 新增缩写字段
  description TEXT,
  career_paths TEXT[],                       -- 改为数组，支持多选职业路径
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
-- 2. RANKINGS SYSTEM (暂时不实现，保留现有QS ranking)
-- ============================================================================
-- 暂时不实现多排名源系统，保持现有的 qs_ranking 字段

-- ============================================================================
-- 3. APPLICATION DIFFICULTY SYSTEM (moved to 0009)
-- ============================================================================

-- Add application difficulty fields to programs table
-- moved to 0009_add_program_difficulty.sql
ALTER TABLE programs 
ADD COLUMN category_ids UUID[],                    -- 分类ID数组
ADD COLUMN primary_category_id UUID REFERENCES program_categories(id); -- 主分类

-- Add comments for documentation
COMMENT ON COLUMN programs.application_difficulty IS 'Application difficulty: SSR (Super Super Rare), SR (Super Rare), R (Rare), N (Normal)';
COMMENT ON COLUMN programs.difficulty_description IS 'Human-readable description of application difficulty';

-- ============================================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE program_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_category_mapping ENABLE ROW LEVEL SECURITY;

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

-- 暂时不实现多排名源系统，保留现有的 qs_ranking 字段

-- ============================================================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Program categories indexes
CREATE INDEX idx_program_categories_name ON program_categories(name);
CREATE INDEX idx_program_categories_career_paths ON program_categories USING GIN(career_paths);

-- Program category mapping indexes
CREATE INDEX idx_program_category_mapping_program_id ON program_category_mapping(program_id);
CREATE INDEX idx_program_category_mapping_category_id ON program_category_mapping(category_id);
CREATE INDEX idx_program_category_mapping_primary ON program_category_mapping(is_primary) WHERE is_primary = true;

-- 暂时不实现多排名源系统，保留现有的 qs_ranking 字段

-- Programs difficulty indexes moved to 0009

-- ============================================================================
-- 7. INSERT INITIAL DATA
-- ============================================================================

-- Insert initial program categories
-- Upsert refined and expanded categories
INSERT INTO program_categories (name, abbreviation, description, career_paths) VALUES
('Computer Science', 'CS', 'Core computer science programs', ARRAY[
  'Software Engineer','Backend Engineer','Frontend Engineer','Full Stack Engineer',
  'Systems Engineer','Research Engineer'
]),
('Software Engineering', 'SE', 'Software engineering programs focused on large-scale design and delivery', ARRAY[
  'Software Engineer','Platform Engineer','Build/Release Engineer','Quality Engineer','Engineering Productivity'
]),
('Data Science', 'DS', 'Data science and analytics programs', ARRAY[
  'Data Scientist','ML Engineer','Applied Scientist','Data Analyst','Quant Researcher'
]),
('Data Engineering', 'DE', 'Data platforms, pipelines, and warehousing', ARRAY[
  'Data Engineer','Analytics Engineer','ETL Engineer','Data Platform Engineer'
]),
('Machine Learning', 'ML', 'AI and machine learning programs', ARRAY[
  'ML Engineer','Research Scientist','Applied Scientist','MLOps Engineer'
]),
('Information Systems', 'IS', 'Information systems and technology management', ARRAY[
  'Systems Analyst','IT Manager','Enterprise Architect','Business Systems Analyst','Solutions Architect'
]),
('Business Analytics', 'BA', 'Business intelligence and analytics', ARRAY[
  'Business Analyst','BI Developer','Analytics Consultant','Product Analyst'
]),
('Human-Computer Interaction', 'HCI', 'HCI/UX research and design programs', ARRAY[
  'UX Designer','Product Designer','UX Researcher','UX Writer','Accessibility Specialist'
]),
('Product Management', 'PM', 'Product management programs', ARRAY[
  'Product Manager','Technical Product Manager','Product Operations'
]),
('IT & Networking', 'ITN', 'Information technology, systems administration, and networking', ARRAY[
  'Systems Administrator','Network Engineer','IT Support Engineer','Cloud Administrator'
]),
('Cloud & Distributed Systems', 'CLOUD', 'Cloud computing, distributed systems, scalability', ARRAY[
  'Cloud Engineer','Site Reliability Engineer','Platform Engineer','DevOps Engineer','Solutions Architect'
]),
('Cybersecurity', 'CSEC', 'Cybersecurity and information security', ARRAY[
  'Security Engineer','Security Analyst','Security Architect','Penetration Tester','GRC/Compliance Analyst','Threat Intelligence Analyst'
]),
('Computer Engineering & Embedded Systems', 'CE', 'Computer engineering, embedded systems, and IoT', ARRAY[
  'Embedded Engineer','Firmware Engineer','Hardware/Software Engineer','IoT Engineer'
]),
('Robotics', 'ROB', 'Robotics, control, perception, and autonomy', ARRAY[
  'Robotics Engineer','Perception Engineer','Controls Engineer','Autonomy Engineer'
]),
('Computer Graphics & AR/VR', 'CGVR', 'Graphics, visualization, AR/VR, interactive media', ARRAY[
  'Graphics Engineer','Rendering Engineer','Visualization Engineer','AR/VR Engineer','Game/Engine Engineer'
]),
('Health Informatics', 'HI', 'Healthcare and clinical informatics', ARRAY[
  'Health Data Analyst','Clinical Informaticist','Healthcare Data Engineer'
]),
('Bioinformatics', 'BIOINF', 'Bioinformatics and computational biology', ARRAY[
  'Bioinformatics Scientist','Computational Biologist','Genomics Data Scientist'
]),
('Financial Engineering & FinTech', 'FINTECH', 'Quantitative finance, risk, trading, and fintech', ARRAY[
  'Quantitative Analyst','Quant Researcher','Risk Engineer','Payments/FinTech Engineer'
]),
('Engineering/Technology Management', 'EM', 'Engineering and technology leadership/management', ARRAY[
  'Program Manager','Technical Program Manager','Engineering Manager','Operations Manager'
])
ON CONFLICT (abbreviation) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  career_paths = EXCLUDED.career_paths;

-- 暂时不实现多排名源系统，保持现有的 qs_ranking 字段

-- ============================================================================
-- 9. CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to get program categories with mapping
CREATE OR REPLACE FUNCTION get_program_categories(program_uuid UUID)
RETURNS TABLE (
    category_id UUID,
    category_name VARCHAR(50),
    category_description TEXT,
    career_path VARCHAR(100),
    icon VARCHAR(50),
    color VARCHAR(7),
    is_primary BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pc.id,
        pc.name,
        pc.description,
        pc.career_path,
        pc.icon,
        pc.color,
        pcm.is_primary
    FROM program_categories pc
    JOIN program_category_mapping pcm ON pc.id = pcm.category_id
    WHERE pcm.program_id = program_uuid
    ORDER BY pcm.is_primary DESC, pc.name;
END;
$$ LANGUAGE plpgsql;

-- 暂时不实现多排名源系统，保留现有的 qs_ranking 字段

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

CREATE TRIGGER update_ranking_sources_updated_at 
    BEFORE UPDATE ON ranking_sources 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rankings_updated_at 
    BEFORE UPDATE ON rankings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 11. ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE program_categories IS 'Program categories for classification and filtering (CS, DS, UX, etc.)';
COMMENT ON TABLE program_category_mapping IS 'Many-to-many mapping between programs and categories';

COMMENT ON FUNCTION get_program_categories(UUID) IS 'Get all categories for a specific program with mapping details';

-- ============================================================================
-- 12. VALIDATION CONSTRAINTS
-- ============================================================================

-- Add constraint to ensure at least one primary category per program
-- This will be enforced at the application level, not database level
-- to allow for flexibility during data migration

-- Add constraint to ensure valid difficulty values
-- Already handled by CHECK constraint on application_difficulty column

-- Add constraint to ensure positive ranking values
ALTER TABLE rankings ADD CONSTRAINT check_positive_rank CHECK (rank > 0);

-- Add constraint to ensure valid year
ALTER TABLE rankings ADD CONSTRAINT check_valid_year CHECK (year >= 1900 AND year <= 2100);
