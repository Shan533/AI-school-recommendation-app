# Project File Structure

This document outlines the file and directory structure for the AI School Recommend App.

```
AI_school_recommend_app/
├── docs/
│   ├── design-doc.md
│   ├── implementation-plan.md
│   ├── setup-instructions.md
│   ├── testing-guide.md
│   └── file-structure.md
├── csv/
│   ├── rotten-tomatoes.schools.csv
│   ├── rotten-tomatoes.programs.csv
│   ├── rotten-tomatoes.programs.updated.csv
│   └── programs-for-import.csv
├── scripts/
│   └── prepare-programs-csv.mjs
├── public/
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   ├── admin/
│   │   │   ├── csv-upload/
│   │   │   │   └── page.tsx
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── programs/
│   │   │   │   └── page.tsx
│   │   │   └── schools/
│   │   │       └── page.tsx
│   │   ├── api/
│   │   │   ├── admin/
│   │   │   │   ├── programs/
│   │   │   │   │   └── route.ts
│   │   │   │   └── schools/
│   │   │   │       └── route.ts
│   │   │   └── auth/
│   │   │       └── logout/
│   │   │           └── route.ts
│   │   ├── profile/
│   │   │   └── page.tsx
│   │   ├── programs/
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── schools/
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── navigation.tsx
│   │   ├── review-form.tsx
│   │   ├── reviews-list.tsx
│   │   └── ui/
│   │       ├── avatar.tsx
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── form.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── separator.tsx
│   │       ├── star-rating.tsx
│   │       ├── table.tsx
│   │       └── textarea.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── helpers.ts
│   │   │   └── server.ts
│   │   └── utils.ts
│   └── middleware.ts
├── supabase/
│   └── migrations/
│       ├── 0000_init.sql
│       └── 0001_update_programs_table.sql
├── .env
├── .gitignore
├── components.json
├── env.local.example
├── eslint.config.mjs
├── next.config.ts
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── README.md
├── tsconfig.json
```

### Directory Descriptions

-   **`docs/`**: Contains all project documentation, including design documents, implementation plans, and setup instructions.
-   **`csv/`**: Holds raw CSV data for schools and programs, as well as processed files for database import.
-   **`scripts/`**: Contains utility and migration scripts for data processing and other operational tasks.
-   **`public/`**: Stores static assets like images, fonts, and icons that are publicly accessible.
-   **`src/`**: The main application source code directory.
    -   **`src/app/`**: Core of the Next.js application, using the App Router.
        -   **`(public)/`**: Routes that are accessible without authentication.
        -   **`admin/`**: Protected routes for the admin dashboard.
        -   **`api/`**: API routes for server-side logic.
    -   **`src/components/`**: Reusable React components.
        -   **`ui/`**: Components from shadcn/ui.
    -   **`src/lib/`**: Libraries, helpers, and utility functions.
        -   **`supabase/`**: Supabase client and server configurations.
-   **`supabase/`**: Configuration and migration files for the Supabase database.
    -   **`migrations/`**: SQL files that define the database schema versions.
