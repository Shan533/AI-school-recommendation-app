# Core Setup Testing Guide

This guide covers the essential setup and basic functionality testing for the AI School Recommend App.

## 🚀 Prerequisites

1. **Database Setup**: Run the SQL migration script in your Supabase SQL editor:
   ```sql
   -- Copy and paste the contents of supabase/migrations/0000_init.sql
   ```

2. **Environment Variables**: Create `.env.local` with your Supabase credentials:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

## 🧪 Core Setup Testing Checklist

### 1. Basic Setup Testing
- [ ] **Start Server**: Navigate to `http://localhost:3000`
- [ ] **Home Page**: Verify the landing page loads correctly
- [ ] **Navigation**: Test all navigation links work
- [ ] **Responsive Design**: Test on different screen sizes

### 2. Database Connection Testing
- [ ] **Schools Page**: Visit `/schools` - should load without errors (may be empty initially)
- [ ] **Programs Page**: Visit `/programs` - should load without errors (may be empty initially)
- [ ] **Admin Dashboard**: Visit `/admin/dashboard` - should redirect to login if not authenticated

### 3. Admin Authentication Testing

#### Create an Admin User:
1. **Register a User**: Go to `/register` and create an account
2. **Make User Admin**: In Supabase dashboard:
   - Go to **Table Editor** → **profiles**
   - Find your user record
   - Set `is_admin` to `true`
3. **Test Admin Access**: 
   - [ ] Visit `/admin/dashboard` - should now work
   - [ ] Verify all admin navigation works

#### User Management (`/admin/users`):
- [ ] **Navigate to Users Page**: Go to `/admin/users`
- [ ] **View Users**: Verify that the list of registered users is displayed
- [ ] **Make a User Admin**: Find a non-admin user and click "Make Admin"
- [ ] **Verify Admin Status**: The user's badge should change to "Admin"
- [ ] **Login as New Admin**: (Optional) Log out and log in as the new admin user to confirm they have access to admin pages
- [ ] **Remove Admin**: Click "Remove Admin" on the new admin user. The badge should revert to "User"

## 🐛 Common Setup Issues & Solutions

### Issue: "Supabase client could not be created"
**Solution**: Check your `.env.local` file and restart the dev server

### Issue: Admin pages redirect to login
**Solution**: Ensure your user has `is_admin: true` in the profiles table

### Issue: Database connection errors
**Solution**: 
- Verify Supabase project is active
- Check environment variables are correct
- Ensure migration script has been run

### Issue: Pages show empty state
**Solution**: This is normal for a fresh installation. Add some test data through admin interface first.

## ✅ Success Criteria

Your core setup is working correctly if:
- [ ] All pages load without errors
- [ ] Database connection is established
- [ ] Authentication system works
- [ ] Admin access is properly configured
- [ ] Navigation functions correctly
- [ ] Mobile responsiveness works

## 📊 Sample Test Data

Use this sample data to populate your database for testing:

### Schools:
1. **MIT** - Cambridge, MA, USA (QS: 1)
2. **Stanford** - Stanford, CA, USA (QS: 5)
3. **Harvard** - Cambridge, MA, USA (QS: 3)
4. **Oxford** - Oxford, UK (QS: 7)

### Programs (for each school):
1. **Computer Science (MS)** - 24 months, STEM
2. **Business Administration (MBA)** - 24 months, Non-STEM
3. **Data Science (MS)** - 18 months, STEM

## 🔄 Next Steps

After completing core setup testing:
1. Proceed to **[Admin CRUD Testing](./admin-crud-testing.md)**
2. Test **[CSV Upload Functionality](./csv-upload-testing.md)**
3. Verify **[Public Pages](./public-pages-testing.md)**

## 📚 Related Documentation

- **[Testing Plan](./testing-plan.md)** - Main testing overview
- **[Setup Instructions](../setup-instructions.md)** - Detailed setup guide
- **[Design Document](../design-doc.md)** - Application architecture
