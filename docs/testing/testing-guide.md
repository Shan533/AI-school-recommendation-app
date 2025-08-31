# Testing Guide: AI School Recommend App

**⚠️ This guide has been reorganized. Please use the new testing documentation structure:**

## 📋 New Testing Documentation Structure

The testing documentation has been reorganized into a dedicated testing directory with focused guides:

### 🧪 Current Testing Guides
- **[Testing Plan](./testing/testing-plan.md)** - Main testing overview and index
- **[Core Setup Testing](./testing/core-setup-testing.md)** - Environment setup and basic functionality
- **[Admin CRUD Testing](./testing/admin-crud-testing.md)** - Complete CRUD operations for schools and programs
- **[CSV Upload Testing](./testing/csv-upload-testing.md)** - Bulk data import functionality
- **[Public Pages Testing](./testing/public-pages-testing.md)** - User-facing school and program browsing

### 🔮 Future Testing Guides (Phase 2 & 3)
- **[User Reviews Testing](./testing/user-reviews-testing.md)** - Review and rating system
- **[Collections Testing](./testing/collections-testing.md)** - User collections and favorites
- **[AI Recommendations Testing](./testing/ai-recommendations-testing.md)** - Recommendation engine

## 🚀 Quick Start

For immediate testing, start with:
1. **[Core Setup Testing](./testing/core-setup-testing.md)** - Environment verification
2. **[Admin CRUD Testing](./testing/admin-crud-testing.md)** - Data management
3. **[Public Pages Testing](./testing/public-pages-testing.md)** - User experience

---

**Note**: This original testing guide is kept for reference but the new structure provides better organization and future scalability.

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

## 🧪 Testing Checklist

### 1. Basic Setup Testing
- [✅] **Start Server**: Navigate to `http://localhost:3000`
- [✅] **Home Page**: Verify the landing page loads correctly
- [✅] **Navigation**: Test all navigation links work
- [✅] **Responsive Design**: Test on different screen sizes

### 2. Database Connection Testing
- [✅] **Schools Page**: Visit `/schools` - should load without errors (may be empty initially)
- [✅] **Programs Page**: Visit `/programs` - should load without errors (may be empty initially)
- [✅] **Admin Dashboard**: Visit `/admin/dashboard` - should redirect to login if not authenticated

### 3. Admin Authentication Testing

#### Create an Admin User:
1. **Register a User**: Go to `/register` and create an account
2. **Make User Admin**: In Supabase dashboard:
   - Go to **Table Editor** → **profiles**
   - Find your user record
   - Set `is_admin` to `true`
3. **Test Admin Access**: 
   - [✅] Visit `/admin/dashboard` - should now work
   - [✅] Verify all admin navigation works

#### User Management (`/admin/users`):
- [✅] **Navigate to Users Page**: Go to `/admin/users`
- [✅] **View Users**: Verify that the list of registered users is displayed.
- [✅] **Make a User Admin**: Find a non-admin user and click "Make Admin".
- [✅] **Verify Admin Status**: The user's badge should change to "Admin".
- [✅] **Login as New Admin**: (Optional) Log out and log in as the new admin user to confirm they have access to admin pages.
- [✅] **Remove Admin**: Click "Remove Admin" on the new admin user. The badge should revert to "User".
   
### 4. Admin CRUD Testing

#### Schools Management (`/admin/schools`):
- [✅] **Add School**: Fill out the form with test data:
  ```
  Name: Stanford University
  Initial: SU
  Type: University
  Country: United States
  Location: Stanford, CA
  Year Founded: 1885
  QS Ranking: 5
  Website: https://stanford.edu
  ```
- [✅] **View School**: Verify the new school appears in the table.
- [✅] **Add Multiple Schools**: Create 2-3 more schools for testing.
- [✅] **Edit School**: Click "Edit" on a school, update some fields (e.g., change the name or location), and save. Confirm the changes are reflected in the table.
- [✅] **Delete School**: Click "Delete" on a school, confirm the deletion, and verify the school is removed from the table.

#### Programs Management (`/admin/programs`):
- [ ] **Add Program**: Create a test program:
  ```
  Name: Master of Science in Computer Science
  Initial: MSCS
  School: (select from dropdown)
  Degree: MS
  Duration: 24 months
  Currency: USD
  Tuition: 50000
  STEM: Yes
  Description: Advanced computer science program...
  ```
- [✅] **View Program**: Verify program appears in table with school info
- [✅] **Add Multiple Programs**: Create programs for different schools
- [✅] **Edit Program**: Click "Edit" on a program, update some fields (e.g., change the name or duration), and save. Confirm the changes are reflected in the table.
- [✅] **Delete Program**: Click "Delete" on a program, confirm the deletion, and verify the program is removed from the table.

### 5. CSV Upload Testing (`/admin/csv-upload`)

#### Test Schools CSV:
Create a CSV file named `test-schools.csv`:
```csv
name,initial,type,country,location,year_founded,qs_ranking,website_url
MIT,MIT,University,United States,"Cambridge, MA",1861,1,https://mit.edu
Harvard University,HU,University,United States,"Cambridge, MA",1636,3,https://harvard.edu
```
- [✅] **Upload Schools**: Test the schools CSV upload
- [✅] **Verify Results**: Check success/error messages
- [✅] **Check Database**: Verify schools were added

#### Test Programs CSV:
1. **Get School IDs**: From Supabase dashboard, copy school IDs
2. Create `test-programs.csv`:
```csv
name,initial,school_id,degree,duration_months,currency,total_tuition,is_stem,description
Computer Science,CS,school-id-here,MS,24,USD,60000,true,Advanced CS program
Business Administration,MBA,school-id-here,MBA,24,USD,70000,false,Business leadership program
```
- [✅] **Upload Programs**: Test the programs CSV upload
- [✅] **Verify Results**: Check success/error messages

### 6. Public Pages Testing

#### Schools Public View:
- [✅] **Schools List** (`/schools`): Should show all schools with cards
- [✅] **School Details** (`/schools/[id]`): Click on a school, verify:
  - School information displays correctly
  - Associated programs are listed
  - External links work
  - Navigation works

#### Programs Public View:
- [✅] **Programs List** (`/programs`): Should show all programs with school info
- [✅] **Program Details** (`/programs/[id]`): Click on a program, verify:
  - Program information displays correctly
  - School information is shown
  - Links to school page work
  - External links work

### 7. Error Handling Testing

#### Test Error Scenarios:
- [✅] **Invalid URLs**: Try `/schools/invalid-id`, `/programs/invalid-id`
- [✅] **Unauthorized Access**: Try admin pages without login
- [✅] **Non-Admin Access**: Try admin pages with regular user
- [✅] **Invalid CSV**: Upload malformed CSV files

### 8. Mobile Responsiveness Testing

Test on different screen sizes:
- [✅] **Mobile** (320px-768px): All pages should be mobile-friendly
- [✅] **Tablet** (768px-1024px): Layout should adapt properly
- [✅] **Desktop** (1024px+): Full desktop experience

## 🐛 Common Issues & Solutions

### Issue: "Supabase client could not be created"
**Solution**: Check your `.env.local` file and restart the dev server

### Issue: Admin pages redirect to login
**Solution**: Ensure your user has `is_admin: true` in the profiles table

### Issue: CSV upload fails
**Solution**: 
- Check network tab for API errors
- Verify CSV format matches expected headers
- Ensure school IDs exist for programs CSV

### Issue: Pages show empty state
**Solution**: Add some test data through admin interface first

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

## ✅ Success Criteria

Your implementation is working correctly if:
- [✅] All pages load without errors
- [✅] Admin can add/view schools and programs
- [✅] CSV upload works for both schools and programs
- [✅] Public pages display data correctly
- [✅] Authentication and authorization work
- [✅] Mobile responsiveness works
- [✅] Error handling works appropriately

## 🚀 Next Steps After Testing

Once all tests pass, you're ready for:
1. **Phase 2**: User reviews and ratings system
2. **Phase 3**: Collections and AI recommendations
3. **Performance optimization**
4. **Production deployment**