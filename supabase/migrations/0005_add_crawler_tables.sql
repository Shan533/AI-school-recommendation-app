-- Create unreviewed_schools table for crawler data
-- Exact same structure as schools table + crawler fields
CREATE TABLE unreviewed_schools (
    -- Exact same columns as schools table
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    initial TEXT,
    type TEXT,
    country TEXT,
    location TEXT,
    year_founded INTEGER,
    qs_ranking INTEGER,
    website_url TEXT,
    created_by UUID REFERENCES auth.users,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Crawler-specific fields (additional to main table)
    crawled_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'merged')),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    source_url VARCHAR, -- crawler source url
    confidence_score DECIMAL(3,2) DEFAULT 0.0, -- data quality confidence (0.0-1.0)
    raw_data JSONB, -- raw crawler data, for debugging and extension
    matched_school_id UUID REFERENCES schools(id), -- if matched to existing school, record ID
    diff_notes TEXT -- admin recorded diff notes
);

-- Create unreviewed_programs table for program crawler data
-- Exact same structure as programs table + crawler fields
CREATE TABLE unreviewed_programs (
    -- Exact same columns as programs table
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    initial TEXT,
    school_id UUID, -- 注意：这里不设置REFERENCES，因为可能是新学校
    degree TEXT NOT NULL,
    website_url TEXT,
    duration_years REAL,
    currency TEXT,
    total_tuition INTEGER,
    is_stem BOOLEAN,
    description TEXT,
    credits INTEGER,
    delivery_method TEXT,
    schedule_type TEXT,
    location TEXT,
    add_ons JSONB,
    start_date DATE,
    created_by UUID REFERENCES auth.users,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Crawler-specific fields (additional to main table)
    crawled_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'merged')),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    source_url VARCHAR, -- crawler source url
    confidence_score DECIMAL(3,2) DEFAULT 0.0, -- data quality confidence (0.0-1.0)
    raw_data JSONB, -- raw crawler data, for debugging and extension
    matched_program_id UUID REFERENCES programs(id), -- if matched to existing program, record ID
    matched_school_id UUID REFERENCES schools(id), -- if matched to existing school, record ID
    diff_notes TEXT, -- admin recorded diff notes
    
    -- Additional field for school name matching during crawling
    school_name TEXT -- school name, for matching and displaying
);

-- Create crawler_jobs table to track crawling sessions
CREATE TABLE crawler_jobs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    job_name VARCHAR NOT NULL, -- 如 'daily_school_crawl', 'weekly_program_update'
    status VARCHAR DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    total_items INTEGER DEFAULT 0,
    successful_items INTEGER DEFAULT 0,
    failed_items INTEGER DEFAULT 0,
    error_log TEXT,
    metadata JSONB, -- crawler configuration, statistics, etc.
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create crawler_logs table for detailed logging
CREATE TABLE crawler_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    job_id UUID REFERENCES crawler_jobs(id),
    level VARCHAR NOT NULL CHECK (level IN ('DEBUG', 'INFO', 'WARNING', 'ERROR')),
    message TEXT NOT NULL,
    context JSONB, -- related context information
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE unreviewed_schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE unreviewed_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawler_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawler_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for unreviewed_schools
CREATE POLICY "Unreviewed schools are viewable by authenticated users" ON unreviewed_schools
    FOR SELECT USING (auth.role() = 'authenticated');
    
CREATE POLICY "Only admins can approve/reject unreviewed schools" ON unreviewed_schools
    FOR UPDATE USING (auth.role() = 'admin');

CREATE POLICY "Authenticated users can insert unreviewed schools" ON unreviewed_schools
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create policies for unreviewed_programs
CREATE POLICY "Unreviewed programs are viewable by authenticated users" ON unreviewed_programs
    FOR SELECT USING (auth.role() = 'authenticated');
    
CREATE POLICY "Only admins can approve/reject unreviewed programs" ON unreviewed_programs
    FOR UPDATE USING (auth.role() = 'admin');

CREATE POLICY "Authenticated users can insert unreviewed programs" ON unreviewed_programs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create policies for crawler_jobs
CREATE POLICY "Crawler jobs are viewable by admins only" ON crawler_jobs
    FOR ALL USING (auth.role() = 'admin');

-- Create policies for crawler_logs
CREATE POLICY "Crawler logs are viewable by admins only" ON crawler_logs
    FOR ALL USING (auth.role() = 'admin');

-- Create indexes for better performance
CREATE INDEX idx_unreviewed_schools_status ON unreviewed_schools(status);
CREATE INDEX idx_unreviewed_schools_crawled_at ON unreviewed_schools(crawled_at);
CREATE INDEX idx_unreviewed_schools_matched_school_id ON unreviewed_schools(matched_school_id);
CREATE INDEX idx_unreviewed_schools_name ON unreviewed_schools(name);
CREATE INDEX idx_unreviewed_schools_country ON unreviewed_schools(country);

CREATE INDEX idx_unreviewed_programs_status ON unreviewed_programs(status);
CREATE INDEX idx_unreviewed_programs_crawled_at ON unreviewed_programs(crawled_at);
CREATE INDEX idx_unreviewed_programs_school_name ON unreviewed_programs(school_name);
CREATE INDEX idx_unreviewed_programs_matched_program_id ON unreviewed_programs(matched_program_id);
CREATE INDEX idx_unreviewed_programs_name ON unreviewed_programs(name);

CREATE INDEX idx_crawler_jobs_status ON crawler_jobs(status);
CREATE INDEX idx_crawler_jobs_started_at ON crawler_jobs(started_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_unreviewed_schools_updated_at 
    BEFORE UPDATE ON unreviewed_schools 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_unreviewed_programs_updated_at 
    BEFORE UPDATE ON unreviewed_programs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE unreviewed_schools IS 'Schools data from web crawlers with exact same structure as main schools table, pending review and approval';
COMMENT ON TABLE unreviewed_programs IS 'Programs data from web crawlers with exact same structure as main programs table, pending review and approval';
COMMENT ON TABLE crawler_jobs IS 'Tracks crawling job execution and status';
COMMENT ON TABLE crawler_logs IS 'Detailed logs from crawler execution for debugging and monitoring';