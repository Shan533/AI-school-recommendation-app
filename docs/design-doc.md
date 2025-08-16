# Design Document: AI School Recommend App

This document outlines the design for the AI School Recommend App, a modern web application for discovering and reviewing university programs, built with a Next.js frontend and Supabase for the backend.

### 1. Overall Functionality

The application will provide the following core features, designed with simplicity and scalability in mind:

*   **User Authentication**: Secure user registration and login using Supabase Auth, supporting both email/password and social providers.
*   **Program & School Discovery**: A comprehensive and searchable database of university programs and schools.
*   **Detailed Information**: Each program and school will have a dedicated page with detailed information.
*   **User Reviews, Ratings, and Rankings**: Authenticated users can submit reviews and ratings for both schools and programs. The platform will feature a dual-ranking system for schools, similar to Rotten Tomatoes, displaying both an official ranking (e.g., QS) and an aggregated user rating.
*   **User Collections**: Users can "like" or save schools into collections (e.g., "My Favorites"), allowing them to easily track schools of interest.
*   **Filter-Based Recommendations with AI Explanation**: A feature where users receive personalized program recommendations based on a simple filtering of their preferences. An AI will then generate a user-friendly explanation for why each program is recommended, adding a persuasive, personalized touch.
*   **Admin Dashboard**: A protected area for administrators to manage application data, including manual CRUD operations and bulk CSV uploads for schools and programs.

### 2. Tech Stack

*   **Framework**: Next.js (utilizing App Router)
*   **Backend & Database**: Supabase (PostgreSQL, Auth, Storage)
*   **Styling**: Tailwind CSS & shadcn/ui
*   **Deployment**: Vercel

### 3. Data Schema (Supabase - PostgreSQL)

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
*   `country` (text)
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
*   `duration_months` (integer)
*   `currency` (text)
*   `total_tuition` (integer)
*   `is_stem` (boolean)
*   `description` (text)
*   `created_by` (uuid, foreign key to `auth.users.id`)
*   `created_at` (timestamp with time zone)

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

### 4. Application Structure (Next.js App Router)
The project structure will remain as originally planned, with new routes added for collections and user review pages.

### 5. Key User Flows

1.  **Onboarding**: New users register and are directed to their dashboard. Existing users log in.
2.  **Discovery, Reviewing, and Rating**: An authenticated user can search for schools and programs. They can view detail pages to submit reviews and ratings for either. They can also view a page showing all of their past reviews.
3.  **Collecting Schools**: On a school's detail page, a user can "like" or "save" it. This adds the school to their default collection. They can create and manage custom collections from their profile.
4.  **Recommendations Flow**: A user selects their preferences on a dedicated page. The system filters relevant programs and uses an AI to generate a brief, personalized paragraph explaining why each program is a good match, presenting this to the user.
5.  **Admin Bulk Upload**: An administrator navigates to the admin dashboard. They can upload a CSV file containing school or program data. The system will parse the file and create new records in the database.
