# Quick Setup Instructions

Follow these steps to get your AI School Recommend App running:

## 1. 🗄️ Database Setup

### Run SQL Migration:
1. Open your [Supabase Dashboard](https://app.supabase.com/)
2. Go to **SQL Editor**
3. Copy and paste the entire contents of `supabase/migrations/0000_init.sql`
4. Click **Run** to create all tables and security policies

## 2. 🔑 Environment Variables

### Get Your Credentials:
1. In Supabase Dashboard → **Settings** → **API**
2. Copy your **Project URL** and **anon key**

### Create `.env.local`:
Create a file named `.env.local` in your project root:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 3. 🚀 Start Development

```bash
# Install dependencies (if not already done)
npm install

# Start the development server
npm run dev
```

Visit `http://localhost:3000` to see your app!

## 4. 👤 Create Admin User

1. **Register**: Go to `/register` and create an account
2. **Make Admin**: In Supabase Dashboard:
   - **Table Editor** → **profiles** table
   - Find your user record
   - Set `is_admin` column to `true`
3. **Test**: Visit `/admin/dashboard` - you should now have access!

## 5. 📝 Add Test Data

### Option A: Manual Entry
- Go to `/admin/schools` and add a few schools
- Go to `/admin/programs` and add some programs

### Option B: CSV Upload
- Use the sample CSV files from the testing guide
- Go to `/admin/csv-upload` and upload them

## 6. ✅ Verify Everything Works

- Visit `/schools` and `/programs` to see your data
- Click on individual schools/programs to test detail pages
- Test the responsive design on mobile

## 🎉 You're Ready!

Your Phase 1 implementation is complete and ready for testing. Check out `docs/testing-guide.md` for comprehensive testing instructions.

## 🆘 Need Help?

Common issues:
- **"Supabase client could not be created"** → Check `.env.local` and restart server
- **Admin pages redirect to login** → Make sure your user has `is_admin: true`
- **Empty pages** → Add some test data first

## 🚀 Production Deployment

### Environment Variables for Production

For **Vercel** (recommended):
1. Go to your project dashboard → **Settings** → **Environment Variables**
2. Add these variables for "Production" environment:
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = your-supabase-anon-key
   ```

For **other platforms** (Netlify, Railway, etc.):
- Add the same environment variables in your platform's settings
- Ensure they're available at build time

### Deployment Steps:
```bash
# 1. Build and test locally
npm run build
npm run start

# 2. Deploy to Vercel (if using Vercel)
npx vercel --prod

# 3. Verify production deployment works
# Test admin access, database connections, etc.
```

## 📞 Quick Commands

```bash
# Development
npm run dev

# Production build & test
npm run build
npm run start

# Code quality
npm run lint

# Deploy to Vercel
npx vercel --prod
```