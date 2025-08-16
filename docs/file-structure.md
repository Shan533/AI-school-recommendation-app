# Project File Structure

This document outlines the file and directory structure for the AI School Recommend App.

```
AI_school_recommend_app/
├── docs/
│   ├── design-doc.md
│   ├── implementation-plan.md
│   └── file-structure.md
├── public/
│   ├── next.svg
│   └── vercel.svg
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
│       └── 0000_init.sql
├── .gitignore
├── components.json
├── env.local.example
├── next-env.d.ts
├── next.config.mjs
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── README.md
├── tailwind.config.ts
└── tsconfig.json
```
