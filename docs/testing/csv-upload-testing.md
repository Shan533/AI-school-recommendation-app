# CSV Upload Testing Guide

This guide covers testing the CSV bulk upload functionality for schools and programs in the admin interface.

## Prerequisites

1. Ensure your Next.js development server is running: `npm run dev`
2. You must be logged in as an admin user
3. Navigate to the admin dashboard: `http://localhost:3000/admin/dashboard`

## Navigate to CSV Upload

- Go to `http://localhost:3000/admin/csv-upload`
- You should see the "CSV Upload" page with:
  - File upload section
  - Upload history or results section

## Testing Schools CSV Upload

### Create Test Schools CSV
Create a CSV file named `test-schools.csv` with the following content:

```csv
name,initial,type,country,location,year_founded,qs_ranking,website_url
MIT,MIT,University,United States,"Cambridge, MA",1861,1,https://mit.edu
Harvard University,HU,University,United States,"Cambridge, MA",1636,3,https://harvard.edu
Stanford University,SU,University,United States,"Stanford, CA",1885,5,https://stanford.edu
Oxford University,OU,University,United Kingdom,"Oxford, UK",1096,7,https://ox.ac.uk
```

### Test Schools Upload
1. **Select File**: Click "Choose File" and select your `test-schools.csv`
2. **Upload**: Click the upload button
3. **Verify Results**: 
   - [ ] Check success/error messages
   - [ ] Verify schools were added to the database
   - [ ] Check that all fields are imported correctly
4. **Check Database**: Go to `/admin/schools` to verify schools appear in the table

### Test Schools CSV Validation
Create a CSV with invalid data to test validation:

```csv
name,initial,type,country,location,year_founded,qs_ranking,website_url
,INVALID,Invalid Type,Invalid Country,,1800,9999,not-a-url
```

**Expected Results:**
- [ ] Should show validation errors for missing required fields
- [ ] Should reject invalid data types
- [ ] Should provide specific error messages

## Testing Programs CSV Upload

### Get School IDs First
Before uploading programs, you need the school IDs:
1. Go to `/admin/schools` and note the IDs of schools you want to associate programs with
2. Or check the database directly in Supabase dashboard

### Create Test Programs CSV
Create a CSV file named `test-programs.csv`:

```csv
name,initial,school_id,degree,duration_months,currency,total_tuition,is_stem,description
Computer Science,CS,1,MS,24,USD,60000,true,Advanced computer science program
Business Administration,MBA,1,MBA,24,USD,70000,false,Business leadership program
Data Science,DS,2,MS,18,USD,55000,true,Data science and analytics program
Engineering,ENG,2,MS,24,USD,65000,true,Engineering program
```

**Note**: Replace the `school_id` values with actual IDs from your database.

### Test Programs Upload
1. **Select File**: Click "Choose File" and select your `test-programs.csv`
2. **Upload**: Click the upload button
3. **Verify Results**:
   - [ ] Check success/error messages
   - [ ] Verify programs were added to the database
   - [ ] Check that school associations are correct
   - [ ] Verify all fields are imported correctly
4. **Check Database**: Go to `/admin/programs` to verify programs appear in the table

### Test Programs CSV Validation
Create a CSV with invalid data:

```csv
name,initial,school_id,degree,duration_months,currency,total_tuition,is_stem,description
,INVALID,999,Invalid Degree,-1,INVALID,-1000,invalid,Invalid description
```

**Expected Results:**
- [ ] Should show validation errors for missing required fields
- [ ] Should reject invalid school IDs (foreign key constraint)
- [ ] Should reject invalid data types and ranges
- [ ] Should provide specific error messages

## Advanced CSV Testing

### Test Large File Upload
1. **Create Large CSV**: Generate a CSV with 100+ schools or programs
2. **Upload**: Test with larger files
3. **Verify Performance**:
   - [ ] Upload completes without timeout
   - [ ] Progress indicators work
   - [ ] Memory usage is reasonable
   - [ ] Database handles bulk insert efficiently

### Test Mixed Data Types
Create a CSV with various data scenarios:

```csv
name,initial,school_id,degree,duration_months,currency,total_tuition,is_stem,description
"Program with, comma",PC,1,MS,24,USD,60000,true,"Description with quotes"
Program with spaces,PS,1,MS,24,USD,60000,true,Description with spaces
Program-With-Dashes,PWD,1,MS,24,USD,60000,true,Description-with-dashes
```

**Expected Results:**
- [ ] CSV parsing handles special characters correctly
- [ ] Quotes and commas in text fields are preserved
- [ ] Data is imported without corruption

### Test Error Recovery
1. **Upload Invalid CSV**: Upload a malformed CSV file
2. **Check Error Handling**:
   - [ ] Application doesn't crash
   - [ ] Clear error messages are displayed
   - [ ] User can try uploading again
   - [ ] No partial data is committed to database

## CSV Format Requirements

### Schools CSV Format
Required columns:
- `name` (required) - School name
- `initial` (optional) - School abbreviation
- `type` (optional) - School type (University, College, etc.)
- `country` (optional) - Country name
- `location` (optional) - City, State/Province
- `year_founded` (optional) - Year founded (integer)
- `qs_ranking` (optional) - QS World Ranking (integer)
- `website_url` (optional) - School website URL

### Programs CSV Format
Required columns:
- `name` (required) - Program name
- `initial` (optional) - Program abbreviation
- `school_id` (required) - ID of existing school
- `degree` (required) - Degree type (MS, MBA, PhD, etc.)
- `duration_months` (optional) - Program duration in months
- `currency` (optional) - Currency code (USD, EUR, etc.)
- `total_tuition` (optional) - Total tuition cost
- `is_stem` (optional) - STEM designation (true/false)
- `description` (optional) - Program description

## Success Criteria

CSV upload functionality is working correctly if:
- [ ] Schools CSV uploads and creates schools successfully
- [ ] Programs CSV uploads and creates programs successfully
- [ ] Validation errors are clearly displayed
- [ ] Large files are handled efficiently
- [ ] Special characters in data are preserved
- [ ] Foreign key relationships are maintained
- [ ] Upload progress is indicated to users
- [ ] Error recovery works properly

## Troubleshooting

### Common CSV Upload Issues

**Issue: "Invalid CSV format"**
- **Solution**: Check CSV file format, ensure proper comma separation
- **Check**: No extra commas in text fields, proper quoting

**Issue: "School not found" (for programs CSV)**
- **Solution**: Verify school_id values exist in the schools table
- **Check**: Use correct school IDs from the database

**Issue: "Upload timeout"**
- **Solution**: Try smaller files or check server configuration
- **Check**: File size and server timeout settings

**Issue: "Database constraint error"**
- **Solution**: Check for duplicate data or invalid foreign keys
- **Check**: Ensure unique constraints are not violated

### Debug CSV Issues
1. **Check File Format**: Open CSV in text editor to verify format
2. **Validate Data**: Check for invalid characters or malformed data
3. **Check Console**: Look for JavaScript errors in browser console
4. **Check Network**: Monitor network tab for API errors
5. **Check Database**: Verify data integrity in Supabase dashboard

## 🔄 Next Steps

After completing CSV upload testing:
1. Verify **[Public Pages](./public-pages-testing.md)** display uploaded data
2. Test **[Admin CRUD Operations](./admin-crud-testing.md)** on uploaded data
3. Check **[Error Handling Scenarios](./error-handling-testing.md)**

## 📚 Related Documentation

- **[Testing Plan](./testing-plan.md)** - Main testing overview
- **[Admin CRUD Testing](./admin-crud-testing.md)** - Manual CRUD operations
- **[Setup Instructions](../setup-instructions.md)** - Environment setup
