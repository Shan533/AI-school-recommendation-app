---
alwaysApply: true
---

# Documentation Guidelines

This document provides guidelines on when and how to update the project documentation. Keeping documentation synchronized with the codebase is essential for maintainability, onboarding new developers, and ensuring a clear understanding of the project's state.

## Guiding Principle

**"The documentation should always reflect the current state of the `main` branch."**

If a change in the code or database structure makes any part of the documentation incorrect or incomplete, the documentation must be updated as part of the same pull request that introduces the change.

---

## When to Update Each Document

### 1. `docs/design-doc.md`

This document outlines the application's high-level architecture and core features.

**Update When:**
-   **Adding a New Feature:** A new feature is planned or implemented (e.g., adding user reviews, a recommendation engine).
-   **Making Architectural Changes:** You change a core part of the application's structure (e.g., switching state management libraries, changing from App Router to Pages Router, introducing a new service).
-   **Changing Data Flow:** The way data moves through the application is altered significantly.

*Note: For database schema details, refer to `docs/schema-design.md`.*

### 2. `docs/schema-design.md`

This document is the single source of truth for the database structure, including table definitions and relationships.

**Update When:**
-   **Any Change to the Database Schema:** You add, remove, or modify a table, column, view, or relationship. This should be done in conjunction with creating a new migration file.

### 3. `supabase/migrations/`

This is not a markdown file, but it is a critical part of the documentation that tracks the evolution of the database schema.

**Update When:**
-   **Any Change to the Database Schema:** You add, remove, or modify a table or column.
-   **Changing Row-Level Security (RLS) Policies:** You update the rules for who can access or modify data.
-   **Adding or Modifying Database Functions or Triggers.**

**How to Update:**
-   Use the Supabase CLI to create a new migration file (`supabase migration new <description>`).
-   Add the necessary SQL statements to the new file.
-   Ensure the changes are reflected in `docs/schema-design.md`.

### 4. `docs/file-structure.md`

This document provides an overview of the project's directory and file layout.

**Update When:**
-   **Adding a New Directory:** A new folder is created (e.g., a `scripts/` directory for utility scripts).
-   **Adding a New "Type" of File:** A new file with a distinct purpose is added (e.g., adding a global `constants.ts` file).
-   **Renaming or Deleting Files/Directories:** A major file or directory is moved, renamed, or removed.
-   **Changing File Organization Principles:** The established convention for where files should go is modified.

*Note: You do not need to update this for every single new component, but rather when the overall structure changes.*

### 5. `docs/implementation-plan.md` & `docs/testing-guide.md`

These documents outline the development roadmap and testing procedures.

**Update When:**
-   **Completing a Major Feature:** A significant part of the implementation plan is completed.
-   **Changing Project Roadmap:** The priorities or phases of development are changed.
-   **Introducing New Testing Methodologies:** A new type of testing is added (e.g., end-to-end testing with Cypress, unit tests with Jest).
-   **Adding Key Test Cases:** A new, critical testing scenario is identified that must be checked before deployment.

### 6. `README.md` & `docs/setup-instructions.md`

These documents cover the project overview and setup process.

**Update When:**
-   **Changing the Setup Process:** The steps to get the project running locally are changed (e.g., a new environment variable is required, a new dependency needs to be installed).
-   **Adding a Major New Feature:** The `README.md` should be updated to reflect the new capabilities of the application.
-   **Changing Core Technologies.**

---

## How to Update

1.  **Identify the Need:** As you are working on a change, recognize that it impacts one or more of the documents listed above.
2.  **Make the Code Changes:** Implement the feature or fix as usual.
3.  **Update the Documentation:** Before you commit your changes, open the relevant documentation file(s) and update them to reflect the new state.
4.  **Commit and Push Together:** Commit both your code changes and your documentation updates in the same commit or, at the very least, include them in the same pull request. This ensures that the history of the project remains consistent.



