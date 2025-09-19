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
