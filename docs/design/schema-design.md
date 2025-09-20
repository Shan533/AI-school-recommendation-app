### Table Definitions

#### `users` (Managed by Supabase Auth)
Supabase's `auth.users` table will handle user data. A `profiles` table will store public user information.

#### `profiles`
*   `id` (uuid, primary key, foreign key to `auth.users.id`)
*   `name` (text, not null)
*   `profile_pic_url` (text)
*   `is_admin` (boolean, default: `false`)
*   `created_at` (timestamp with time zone)

#### `schools`
*   `id` (uuid, primary key)
*   `name` (text, not null)
*   `initial` (text)
*   `type` (text)
*   `region` (enum) - One of: 'United States', 'United Kingdom', 'Canada', 'Europe', 'Asia', 'Australia', 'Other'
*   `location` (text)
*   `year_founded` (integer)
*   `qs_ranking` (integer)
*   `website_url` (text)
*   `created_by` (uuid, foreign key to `auth.users.id`)
*   `created_at` (timestamp with time zone)

#### `programs`
*   `id` (uuid, primary key)
*   `name` (text, not null)
*   `initial` (text)
*   `school_id` (uuid, foreign key to `schools.id`, not null)
*   `degree` (text, not null)
*   `website_url` (text)
*   `duration_years` (real) - *Updated from `duration_months`*
*   `credits` (integer) - *ADD: Total credits for the program*
*   `currency` (text)
*   `total_tuition` (integer)
*   `is_stem` (boolean)
*   `description` (text)
*   `delivery_method` (text) - *ADD: e.g., 'Onsite', 'Online', 'Hybrid'*
*   `schedule_type` (text) - *ADD: e.g., 'Full-time', 'Part-time'*
*   `location` (text) - *ADD: Program-specific location, defaults to school location*
*   `add_ons` (jsonb) - *ADD: For storing additional structured info like scholarships*
*   `start_date` (date) - *ADD: Program start date*
*   `application_difficulty` (varchar) - *One of 'SSR' | 'SR' | 'R' | 'N'; indexed*
*   `difficulty_description` (text)
*   `category_ids` (uuid[]) - *ADD: Array of category IDs for this program*
*   `primary_category_id` (uuid, foreign key to `program_categories.id`) - *ADD: Primary category ID*
*   `created_by` (uuid, foreign key to `auth.users.id`)
*   `created_at` (timestamp with time zone)

#### `requirements` (ADD)
*This table stores academic and application requirements for a program, forming a one-to-one relationship with the `programs` table.*
*   `program_id` (uuid, primary key, foreign key to `programs.id`, not null)
*   `ielts_score` (real)
*   `toefl_score` (real)
*   `gre_score` (integer)
*   `min_gpa` (real)
*   `other_tests` (text)
*   `requires_personal_statement` (boolean, default: `false`)
*   `requires_portfolio` (boolean, default: `false`)
*   `requires_cv` (boolean, default: `false`)
*   `letters_of_recommendation` (integer)
*   `application_fee` (integer)
*   `application_deadline` (date)

#### `program_reviews`
*   `id` (uuid, primary key)
*   `rating` (integer, not null, check 1-5)
*   `comment` (text, not null)
*   `user_id` (uuid, foreign key to `auth.users.id`, not null)
*   `program_id` (uuid, foreign key to `programs.id`, not null)
*   `created_at` (timestamp with time zone)

#### `school_reviews`
*   `id` (uuid, primary key)
*   `rating` (integer, not null, check 1-5)
*   `comment` (text)
*   `user_id` (uuid, foreign key to `auth.users.id`, not null)
*   `school_id` (uuid, foreign key to `schools.id`, not null)
*   `created_at` (timestamp with time zone)

#### `collections`
*   `id` (uuid, primary key)
*   `user_id` (uuid, foreign key to `auth.users.id`, not null)
*   `name` (text, not null)
*   `created_at` (timestamp with time zone)

#### `collection_items`
*   `id` (uuid, primary key)
*   `collection_id` (uuid, foreign key to `collections.id`, not null)
*   `school_id` (uuid, foreign key to `schools.id`, not null)
*   `created_at` (timestamp with time zone)

### Program Categories & Careers System

#### `program_categories`
*   `id` (uuid, primary key)
*   `name` (varchar(50), not null, unique) - e.g., 'Computer Science', 'Data Science'
*   `abbreviation` (varchar(10), not null, unique) - e.g., 'CS', 'DS'
*   `description` (text)
*   `created_at` (timestamp with time zone)
*   `updated_at` (timestamp with time zone)

#### `program_category_mapping`
*   `program_id` (uuid, foreign key to `programs.id`, not null)
*   `category_id` (uuid, foreign key to `program_categories.id`, not null)
*   `is_primary` (boolean, default: false) - Primary category for the program
*   `created_at` (timestamp with time zone)
*   *Primary key: (program_id, category_id)*
*   *Constraint: At most one primary category per program*

#### `careers`
*   `id` (uuid, primary key)
*   `name` (varchar(50), not null, unique) - e.g., 'Software Engineer', 'Data Scientist'
*   `abbreviation` (varchar(10), not null, unique) - e.g., 'SWE', 'DS'
*   `description` (text)
*   `industry` (varchar(50)) - Industry classification
*   `career_type` (varchar(20), check constraint) - One of: 'Software', 'Data', 'AI', 'Hardware', 'Product', 'Design', 'Security', 'Infrastructure', 'Management', 'Finance', 'Healthcare', 'Research'
*   `created_at` (timestamp with time zone)
*   `updated_at` (timestamp with time zone)

#### `category_career_mapping`
*   `category_id` (uuid, foreign key to `program_categories.id`, not null)
*   `career_id` (uuid, foreign key to `careers.id`, not null)
*   `is_default` (boolean, default: true) - Whether this is a default career path for the category
*   `created_at` (timestamp with time zone)
*   *Primary key: (category_id, career_id)*

#### `program_career_mapping`
*   `program_id` (uuid, foreign key to `programs.id`, not null)
*   `career_id` (uuid, foreign key to `careers.id`, not null)
*   `is_custom` (boolean, default: false) - Whether this is a custom added career path
*   `created_at` (timestamp with time zone)
*   *Primary key: (program_id, career_id)*

### Helper Functions

#### `get_program_categories(program_uuid UUID)`
Returns all categories for a specific program with mapping details.
*   Returns: `category_id`, `category_name`, `category_description`, `is_primary`

#### `get_program_careers(program_uuid UUID)`
Returns all career paths (default + custom) for a specific program.
*   Returns: `career_id`, `career_name`, `career_abbreviation`, `career_description`, `industry`, `career_type`, `is_custom`

#### `get_programs_by_career(career_uuid UUID)`
Returns all programs that lead to a specific career path.
*   Returns: `program_id`, `program_name`, `school_name`, `primary_category_name`

### Indexes & Constraints

#### Program Categories
*   `idx_program_categories_name` - Index on `program_categories.name`
*   `idx_program_categories_abbreviation` - Index on `program_categories.abbreviation`

#### Program Category Mapping
*   `idx_program_category_mapping_program_id` - Index on `program_category_mapping.program_id`
*   `idx_program_category_mapping_category_id` - Index on `program_category_mapping.category_id`
*   `idx_program_category_mapping_primary` - Partial index on `is_primary` where `is_primary = true`
*   `one_primary_category_per_program` - Unique constraint ensuring at most one primary category per program

#### Careers
*   `idx_careers_name` - Index on `careers.name`
*   `idx_careers_abbreviation` - Index on `careers.abbreviation`
*   `idx_careers_industry` - Index on `careers.industry`
*   `idx_careers_type` - Index on `careers.career_type`

#### Career Mappings
*   `idx_category_career_mapping_category_id` - Index on `category_career_mapping.category_id`
*   `idx_category_career_mapping_career_id` - Index on `category_career_mapping.career_id`
*   `idx_category_career_mapping_default` - Partial index on `is_default` where `is_default = true`
*   `idx_program_career_mapping_program_id` - Index on `program_career_mapping.program_id`
*   `idx_program_career_mapping_career_id` - Index on `program_career_mapping.career_id`
*   `idx_program_career_mapping_custom` - Partial index on `is_custom` where `is_custom = true`

#### Validation Constraints
*   `check_career_name_not_empty` - Ensures career names are not empty
*   `check_category_name_not_empty` - Ensures category names are not empty
