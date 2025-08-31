# Admin CRUD Testing Guide

This guide helps you test the complete CRUD (Create, Read, Update, Delete) functionality for schools and programs management in the admin interface.

## Prerequisites

1. Ensure your Next.js development server is running: `npm run dev`
2. You must be logged in as an admin user
3. Navigate to the admin dashboard: `http://localhost:3000/admin/dashboard`

## Testing Schools CRUD Operations

### Navigate to Schools Management
- Go to `http://localhost:3000/admin/schools`
- You should see the "Schools Management" page with:
  - Add New School form at the top
  - Existing Schools table at the bottom

### Test CREATE (Add New School)
1. Fill out the "Add New School" form with test data:
   - School Name: "Test University" (required)
   - Abbreviation: "TU"
   - Type: "University" 
   - Country: "USA"
   - Location: "Test City, CA"
   - Year Founded: 2000
   - QS Ranking: 100
   - Website URL: "https://test-university.edu"
2. Click "Add School"
3. ✅ Verify the school appears in the table below

### Test READ (View Schools)
- [ ] **View All Schools**: Verify the table displays all schools
- [ ] **School Details**: Check that all school information is displayed correctly
- [ ] **Table Sorting**: Test sorting by different columns
- [ ] **Responsive Table**: Verify table works on mobile devices

### Test UPDATE (Edit School)
1. Find the test school in the table
2. Click the "Edit" button in the Actions column
3. A dialog should open with the school's current information pre-filled
4. Modify some fields (e.g., change name to "Updated Test University")
5. Click "Update School"
6. ✅ Verify the changes appear in the table immediately
7. ✅ Check that the dialog closes automatically

### Test DELETE (Delete School)
1. Find the test school in the table
2. Click the "Delete" button in the Actions column
3. A confirmation dialog should appear
4. Click "Delete School" to confirm
5. ✅ Verify the school disappears from the table immediately
6. ✅ Check that the dialog closes automatically

## Testing Programs CRUD Operations

### Navigate to Programs Management
- Go to `http://localhost:3000/admin/programs`
- You should see the "Programs Management" page with:
  - Add New Program form at the top (with multiple sections)
  - Existing Programs table at the bottom

### Test CREATE (Add New Program)
1. First ensure you have at least one school created
2. Fill out the "Add New Program" form:
   - **Basic Information:**
     - Program Name: "Test Computer Science Program" (required)
     - Abbreviation: "TCSP"
     - School: Select from dropdown (required)
     - Degree: "MS" (required)
     - Description: "A test computer science program"
   - **Program Details:**
     - Duration: 2
     - Credits: 36
     - Delivery Method: "Onsite"
     - Schedule Type: "Full-time"
     - STEM Designated: Check the box
   - **Financial Information:**
     - Currency: "USD"
     - Total Tuition: 50000
   - **Admission Requirements:**
     - IELTS Score: 6.5
     - TOEFL Score: 80
     - Minimum GPA: 3.0
     - Check "Personal Statement Required"
3. Click "Add Program"
4. ✅ Verify the program appears in the table below

### Test READ (View Programs)
- [ ] **View All Programs**: Verify the table displays all programs
- [ ] **Program Details**: Check that all program information is displayed correctly
- [ ] **School Association**: Verify programs show correct school information
- [ ] **Requirements Display**: Check that admission requirements are shown
- [ ] **Table Sorting**: Test sorting by different columns

### Test UPDATE (Edit Program)
1. Find the test program in the table
2. Click the "Edit" button in the Actions column
3. A large dialog should open with all program information pre-filled across multiple sections
4. Modify some fields across different sections:
   - Change program name to "Updated Test Computer Science Program"
   - Change duration to 1.5 years
   - Change delivery method to "Hybrid"
   - Update IELTS score to 7.0
   - Check "CV/Resume Required"
5. Click "Update Program"
6. ✅ Verify the changes appear in the table immediately
7. ✅ Check that requirements are updated correctly
8. ✅ Verify the dialog closes automatically

### Test DELETE (Delete Program)
1. Find the test program in the table
2. Click the "Delete" button in the Actions column
3. A confirmation dialog should appear
4. Click "Delete Program" to confirm
5. ✅ Verify the program disappears from the table immediately
6. ✅ Check that the dialog closes automatically
7. ✅ Verify associated requirements are also deleted (no orphaned data)

## Advanced CRUD Testing

### Numerical Range Validation Testing

#### Frontend Input Controls Testing

**Test IELTS Score Field:**
1. Try entering 10.0 (should be capped at 9.0)
2. Try entering -1 (should be capped at 0)
3. Try entering 6.3 (should snap to 6.5 due to 0.5 step)

**Test Duration Field:**
1. Try entering 0.3 (should be capped at 0.5)
2. Try entering 10 (should be capped at 8.0)

**Test Credits Field:**
1. Try entering 0 (should be capped at 1)
2. Try entering 300 (should be capped at 200)

#### Backend API Validation Testing

**Send invalid data via browser dev tools:**
```javascript
// Test in browser console on admin/programs page
fetch('/api/admin/programs/1', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Test Program',
    degree: 'Master',
    school_id: 1,
    ielts_score: 15, // Invalid: over 9.0
    duration_years: 0.1, // Invalid: under 0.5
    credits: 300 // Invalid: over 200
  })
})
```

**Expected Results:**
- Should return 400 error with specific validation messages
- Example: "IELTS Score must be between 0 and 9, Duration must be between 0.5 and 8, Credits must be between 1 and 200"

### Validated Numerical Ranges

- **IELTS Score**: 0.0 - 9.0 (step: 0.5)
- **TOEFL Score**: 0 - 120 (step: 1)
- **GRE Score**: 260 - 340 (step: 1)
- **GPA**: 0.00 - 4.00 (step: 0.01)
- **Duration**: 0.5 - 8.0 years (step: 0.5)
- **Credits**: 1 - 200 (step: 1)
- **Total Tuition**: ≥ 0 (step: 100, no upper limit)
- **Application Fee**: ≥ 0 (step: 1, no upper limit)
- **Letters of Recommendation**: 0 - 10 (step: 1)
- **Year Founded**: 1000 - 2025 (step: 1)
- **QS Ranking**: 1 - 2000 (step: 1)

## Error Scenarios to Test

### School Deletion with Existing Programs
1. Create a school and a program associated with it
2. Try to delete the school that has programs
3. ✅ Should show error: "Cannot delete school with existing programs"
4. Delete or reassign the program first, then try deleting the school again
5. ✅ Should succeed after programs are removed

### Invalid Data Handling
1. Try editing a school/program with empty required fields
2. ✅ Should show appropriate error messages
3. Try entering invalid data (e.g., negative numbers for rankings)
4. ✅ Should handle gracefully

### Network Error Handling
1. Disconnect internet or stop the server
2. Try to edit or delete items
3. ✅ Should show error messages like "Failed to update/delete"
4. ✅ UI should not break or show loading state indefinitely

## API Endpoint Testing (Optional)

You can also test the API endpoints directly using tools like Postman or curl:

### Schools API
- GET `/api/admin/schools/[id]` - Get single school
- PUT `/api/admin/schools/[id]` - Update school
- DELETE `/api/admin/schools/[id]` - Delete school

### Programs API
- GET `/api/admin/programs/[id]` - Get single program with requirements
- PUT `/api/admin/programs/[id]` - Update program and requirements
- DELETE `/api/admin/programs/[id]` - Delete program and requirements

### Example curl commands:
```bash
# Get a school (replace {id} with actual ID)
curl -H "Content-Type: application/json" http://localhost:3000/api/admin/schools/{id}

# Update a school
curl -X PUT -H "Content-Type: application/json" \
  -d '{"name":"Updated School","location":"New Location"}' \
  http://localhost:3000/api/admin/schools/{id}

# Delete a school
curl -X DELETE http://localhost:3000/api/admin/schools/{id}
```

## Success Criteria

All tests should pass with:
- ✅ No JavaScript errors in browser console
- ✅ Smooth UI interactions with proper loading states
- ✅ Data persistence across page refreshes
- ✅ Proper error handling and user feedback
- ✅ Responsive design works on mobile/desktop
- ✅ All numerical validations work correctly
- ✅ Foreign key constraints are enforced

## Troubleshooting

If you encounter issues:

1. **Authentication errors**: Ensure you're logged in as an admin
2. **Network errors**: Check that the dev server is running
3. **Data not updating**: Check browser console for JavaScript errors
4. **UI issues**: Try refreshing the page or clearing browser cache
5. **Schema errors**: Fixed multiple issues:
   - The `updated_at` column issue - API endpoints no longer try to update non-existent columns
   - The "Cannot coerce to single JSON object" error when checking for existing requirements
   - The "Program not found or update failed" error - RLS policy issue resolved by using admin client
   - **RLS Policy Issue**: Update operations now use admin client to bypass Row Level Security policies

## Implementation Summary

### ✅ What's Been Implemented:
- Dynamic API routes for individual schools and programs
- PUT endpoints for updating schools and programs
- DELETE endpoints with proper validation and cascade handling
- Client-side React components with edit/delete functionality
- Modal dialogs for editing with pre-filled forms
- Confirmation dialogs for deletion
- Proper error handling and loading states
- Real-time UI updates after operations
- Comprehensive numerical validation

### 🔧 Technical Details:
- Server-side validation and authorization
- **Numerical range validation** with user-friendly error messages
- Proper handling of program requirements (insert/update/delete)
- Foreign key constraint validation (can't delete school with programs)
- JSON parsing for complex fields (add-ons)
- TypeScript interfaces for type safety
- Responsive design with Tailwind CSS

## 🔄 Next Steps

After completing CRUD testing:
1. Test **[CSV Upload Functionality](./csv-upload-testing.md)**
2. Verify **[Public Pages](./public-pages-testing.md)**
3. Check **[Error Handling Scenarios](./error-handling-testing.md)**

## 📚 Related Documentation

- **[Testing Plan](./testing-plan.md)** - Main testing overview
- **[Core Setup Testing](./core-setup-testing.md)** - Environment setup
- **[Design Document](../design-doc.md)** - Application architecture
