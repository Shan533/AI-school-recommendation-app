# Issue #69: Schema Enhancement Design

## Overview
This document outlines the database schema changes needed to implement program categories, multiple ranking sources, and application difficulty levels as specified in issue #69.

## Current Schema Analysis

### Existing Tables
- `programs`: Basic program information with single degree field
- `schools`: School information with single `qs_ranking` field
- `requirements`: Program requirements (one-to-one with programs)
- `program_reviews` & `school_reviews`: Review systems
- `collections` & `collection_items`: User collections

### Current Limitations
1. **Single Category**: Programs only have a `degree` field (text)
2. **Single Ranking Source**: Only QS ranking supported
3. **No Difficulty Rating**: No application difficulty classification
4. **No Career Focus**: No career path organization

## Proposed Schema Changes

### 1. Program Categories System

#### New Table: `program_categories`
```sql
CREATE TABLE program_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  abbreviation VARCHAR(10) NOT NULL UNIQUE,  -- 新增缩写字段
  description TEXT,
  career_paths TEXT[],                       -- 改为数组，支持多选职业路径
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### New Table: `program_category_mapping`
```sql
CREATE TABLE program_category_mapping (
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES program_categories(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false, -- Primary category for the program
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (program_id, category_id)
);

-- Ensure one primary category per program
CREATE UNIQUE INDEX one_primary_category_per_program
ON program_category_mapping(program_id)
WHERE is_primary;

-- Careers normalization (Phase 1, included now)
CREATE TABLE careers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  aliases TEXT[] DEFAULT '{}',
  group_name TEXT, -- Engineering/Data/Security/Design/PM/etc
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE category_career_mapping (
  category_id UUID REFERENCES program_categories(id) ON DELETE CASCADE,
  career_id   UUID REFERENCES careers(id) ON DELETE CASCADE,
  PRIMARY KEY (category_id, career_id)
);

CREATE TABLE program_career_mapping (
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  career_id  UUID REFERENCES careers(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (program_id, career_id)
);

CREATE UNIQUE INDEX one_primary_career_per_program
ON program_career_mapping(program_id)
WHERE is_primary;
```

#### Initial Categories Data
```sql
INSERT INTO program_categories (name, abbreviation, description, career_paths) VALUES
('Computer Science', 'CS', 'Core computer science programs', ARRAY['Software Engineer', 'Backend Engineer', 'Frontend Engineer','Full Stack Engineer', 'DevOps Engineer']),
('Data Science', 'DS', 'Data science and analytics programs', ARRAY['Data Scientist', 'ML Engineer', 'Analyst']),
('Information Systems', 'IS', 'Information systems and management', ARRAY['System Analyst', 'IT Manager', 'Consultant']),
('User Experience', 'UX', 'UX/UI design programs', ARRAY['UX Designer', 'UI Designer', 'Product Designer']),
('Product Management', 'PM', 'Product management programs', ARRAY['Product Manager', 'Product Owner', 'Strategy']),
('Business Analytics', 'BA', 'Business intelligence and analytics', ARRAY['Business Analyst', 'Data Analyst', 'Consultant']),
('Cybersecurity', 'CSEC', 'Cybersecurity and information security', ARRAY['Security Engineer', 'Penetration Tester', 'Security Analyst']),
('Machine Learning', 'ML', 'AI and machine learning programs', ARRAY['ML Engineer', 'Data Scientist', 'Research Scientist']);
```

### 2. Multiple Ranking Sources System

#### New Table: `ranking_sources`
```sql
CREATE TABLE ranking_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  website_url TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### New Table: `rankings`
```sql
CREATE TABLE rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES ranking_sources(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  year INTEGER NOT NULL,
  category VARCHAR(100), -- e.g., "Overall", "Computer Science", "Business"
  metadata JSONB, -- Additional ranking data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, source_id, year, category)
);
```

#### Initial Ranking Sources Data
```sql
INSERT INTO ranking_sources (name, description, website_url) VALUES
('QS World University Rankings', 'Global university rankings by QS', 'https://www.topuniversities.com'),
('Times Higher Education', 'THE World University Rankings', 'https://www.timeshighereducation.com'),
('US News Global Universities', 'US News global university rankings', 'https://www.usnews.com'),
('Shanghai Ranking', 'Academic Ranking of World Universities', 'https://www.shanghairanking.com'),
('US News Computer Science', 'US News CS program rankings', 'https://www.usnews.com');
```

### 3. Application Difficulty System

#### Update Programs Table
```sql
-- Add application difficulty field to programs
ALTER TABLE programs ADD COLUMN application_difficulty VARCHAR(10) CHECK (application_difficulty IN ('SSR', 'SR', 'R', 'N'));

-- Add difficulty description
ALTER TABLE programs ADD COLUMN difficulty_description TEXT;

-- Add comments
COMMENT ON COLUMN programs.application_difficulty IS 'Application difficulty: SSR (Super Super Rare), SR (Super Rare), R (Rare), N (Normal)';
COMMENT ON COLUMN programs.difficulty_description IS 'Human-readable description of application difficulty';
```

#### Difficulty Scale Definition
- **SSR (Super Super Rare)**: < 5% acceptance rate (e.g., Stanford CS, MIT)
- **SR (Super Rare)**: 5-15% acceptance rate (e.g., top-tier programs)
- **R (Rare)**: 15-30% acceptance rate (e.g., competitive programs)
- **N (Normal)**: > 30% acceptance rate (e.g., standard programs)

### 4. Updated Programs Table Structure

#### Final Programs Table Schema
```sql
-- Current programs table with new fields
CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  initial TEXT,
  school_id UUID NOT NULL REFERENCES schools(id),
  degree TEXT NOT NULL, -- Keep existing degree field
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
  
  -- New fields for Issue #69
  application_difficulty VARCHAR(10) CHECK (application_difficulty IN ('SSR', 'SR', 'R', 'N')),
  difficulty_description TEXT,
  category_ids UUID[],                    -- 分类ID数组
  primary_category_id UUID REFERENCES program_categories(id), -- 主分类
  career_paths TEXT[],                    -- 程序相关职业路径
  
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Migration Strategy

### Phase 1 (0009): Program Difficulty
1. Add `application_difficulty` to programs
2. Add `difficulty_description` to programs
3. Add index on `application_difficulty`

### Phase 2 (0008): Categories and Careers
1. Create `program_categories` table
2. Create `program_category_mapping` table + unique primary index
3. Create `careers`, `category_career_mapping`, `program_career_mapping`
4. Seed categories (upsert)

### Phase 3: Data Migration
1. Create default categories for existing programs
2. Migrate QS rankings to new rankings table
3. Set default difficulty levels for existing programs (Phase 1)

## Frontend Impact Analysis

### Components to Update
1. **Admin Forms**:
   - Program add/edit forms need category selection
   - Difficulty level selection
   - Ranking source management

2. **Public Pages**:
   - Program cards show categories and difficulty
   - Filter by categories and difficulty
   - Search by categories

3. **Search & Filtering**:
   - Category-based filtering
   - Difficulty-based filtering
   - Multiple ranking display

### TypeScript Interfaces to Add
```typescript
interface ProgramCategory {
  id: string
  name: string
  abbreviation: string
  description?: string
  career_paths: string[]
}

// Updated Program interface
interface Program {
  // ... existing fields
  application_difficulty?: 'SSR' | 'SR' | 'R' | 'N'
  difficulty_description?: string
  category_ids: string[]
  primary_category_id?: string
  career_paths: string[]
  categories?: ProgramCategory[]
}
```

## Testing Strategy

### Database Tests
1. Test category creation and mapping
2. Test ranking system with multiple sources
3. Test difficulty level constraints
4. Test data migration scripts

### Frontend Tests
1. Test category selection in admin forms
2. Test difficulty display in program cards
3. Test filtering by categories and difficulty
4. Test search functionality with new fields

## Rollback Plan

### Safe Rollback Steps
1. Remove new columns from programs table
2. Drop new tables (categories, rankings, etc.)
3. Restore original QS ranking field
4. Update frontend to remove new features

### Data Preservation
- Backup existing data before migration
- Store original QS rankings in new system
- Preserve program-degree relationships

## Success Metrics

### Technical Metrics
- All existing functionality preserved
- New features working correctly
- Performance maintained or improved
- Test coverage maintained

### User Experience Metrics
- Improved program discovery through categories
- Better understanding of program difficulty
- Enhanced search and filtering capabilities
- More comprehensive ranking information

## Next Steps

1. **Create Migration Script**: Implement the database changes
2. **Update TypeScript Types**: Add new interfaces and types
3. **Update Admin Forms**: Add category and difficulty selection
4. **Update Public UI**: Display categories and difficulty
5. **Update Search/Filter**: Add category and difficulty filtering
6. **Testing**: Comprehensive testing of all changes
7. **Documentation**: Update API and user documentation
