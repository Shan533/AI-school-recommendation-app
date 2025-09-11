# Design Document: AI School Recommend App

This document outlines the design for the AI School Recommend App, a modern web application for discovering and reviewing university programs, built with a Next.js frontend and Supabase for the backend.

### 1. Overall Functionality

The application will provide the following core features, designed with simplicity and scalability in mind:

*   **User Authentication**: Secure user registration and login using Supabase Auth, supporting both email/password and social providers.
*   **Program & School Discovery**: A comprehensive and searchable database of university programs and schools.
*   **Detailed Information**: Each program and school will have a dedicated page with detailed information.
*   **User Reviews, Ratings, and Rankings**: Authenticated users can submit reviews and ratings for both schools and programs. The platform will feature a dual-ranking system for schools, similar to Rotten Tomatoes, displaying both an official ranking (e.g., QS) and an aggregated user rating.
*   **User Collections**: Users can create, manage, and organize custom collections of their favorite programs and schools. Features include:
*   **Filter-Based Recommendations with AI Explanation**: A feature where users receive personalized program recommendations based on a simple filtering of their preferences. An AI will then generate a user-friendly explanation for why each program is recommended, adding a persuasive, personalized touch.
*   **Admin Dashboard**: A protected area for administrators to manage application data, including manual CRUD operations and bulk CSV uploads for schools and programs.

### 2. Tech Stack

*   **Framework**: Next.js 15 (utilizing App Router with Server Components)
*   **Backend & Database**: Supabase (PostgreSQL, Auth, Storage, RLS)
*   **Styling**: Tailwind CSS 4.x & shadcn/ui
*   **Testing**: Vitest with React Testing Library (Unified testing environment, 90.15% coverage)
*   **Containerization**: Docker
*   **Deployment**: Vercel with Analytics
*   **Form Handling**: React Hook Form with Zod validation

**[➡️ View the detailed Technical Architecture](./technical-architecture.md)**

### 3. Data Schema (Supabase - PostgreSQL)

The database schema has been moved to a dedicated document for clarity and easier maintenance.

**[➡️ View the detailed Database Schema Design](./schema-design.md)**

### 4. Application Structure (Next.js App Router)

The project follows the Next.js App Router structure with clear separation of concerns:

```
src/
├── app/                    # Next.js App Router pages
│   ├── (public)/          # Public routes (login, register)
│   ├── admin/             # Protected admin routes
│   ├── api/               # API routes and server actions
│   ├── auth/              # Authentication flows
│   ├── programs/          # Program browsing pages
│   ├── schools/           # School browsing pages
│   ├── collections/       # User collections management pages
│   └── profile/           # User profile pages
├── components/            # Reusable React components
│   ├── admin/            # Admin-specific components
│   ├── collections/      # Collection management components
│   ├── ui/               # shadcn/ui components
│   └── navigation.tsx    # Navigation component
└── lib/                  # Utility functions and configurations
    ├── supabase/         # Supabase client configurations
    ├── auth-actions.ts   # Authentication server actions
    ├── utils.ts          # Utility functions
    └── validation.ts     # Zod validation schemas
```

**[➡️ View the detailed File Structure](./file-structure.md)**

### 5. Key User Flows

1.  **Onboarding**: New users register and are directed to their dashboard. Existing users log in.
2.  **Discovery, Reviewing, and Rating**: An authenticated user can search for schools and programs. They can view detail pages to submit reviews and ratings for either. They can also view a page showing all of their past reviews.
3.  **Collections Management**: Users can create custom collections and add programs or schools to them from detail pages. They can manage collections from their profile page, including creating, editing, deleting collections, and adding personal notes to items. The system provides dedicated collection detail pages for viewing and managing saved items.
4.  **Recommendations Flow**: A user selects their preferences on a dedicated page. The system filters relevant programs and uses an AI to generate a brief, personalized paragraph explaining why each program is a good match, presenting this to the user.
5.  **Admin Bulk Upload**: An administrator navigates to the admin dashboard. They can upload a CSV file containing school or program data. The system will parse the file and create new records in the database.
