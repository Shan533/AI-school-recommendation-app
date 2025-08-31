# Public Pages Testing Guide

This guide covers testing the public-facing pages where users can browse schools and programs without authentication.

## Prerequisites

1. Ensure your Next.js development server is running: `npm run dev`
2. Have some test data in the database (schools and programs)
3. You can test these pages without being logged in

## Testing Schools Public Pages

### Schools List Page (`/schools`)

#### Navigate to Schools List
- Go to `http://localhost:3000/schools`
- You should see the "Schools" page with:
  - Page title and description
  - Grid or list of school cards
  - Each school card showing basic information

#### Test Schools List Display
- [ ] **Load Schools**: Verify all schools are displayed
- [ ] **School Cards**: Check that each school card shows:
  - School name
  - Location (city, country)
  - QS ranking (if available)
  - School type
  - Year founded (if available)
- [ ] **Card Links**: Click on school cards to verify they link to individual school pages
- [ ] **Empty State**: If no schools exist, verify appropriate empty state message

#### Test Schools List Functionality
- [ ] **Search/Filter**: Test any search or filter functionality
- [ ] **Sorting**: Test sorting by different criteria (name, ranking, etc.)
- [ ] **Pagination**: If implemented, test pagination controls
- [ ] **Responsive Design**: Test on mobile, tablet, and desktop

### Individual School Page (`/schools/[id]`)

#### Navigate to School Details
- Click on a school card from the schools list
- Or go directly to `http://localhost:3000/schools/{school-id}`

#### Test School Details Display
- [ ] **School Information**: Verify all school details are displayed:
  - School name and abbreviation
  - Type and location
  - Year founded
  - QS ranking
  - Website URL (as clickable link)
- [ ] **Programs List**: Check that associated programs are listed
- [ ] **Program Links**: Verify program links work and go to program pages
- [ ] **Navigation**: Test breadcrumb navigation back to schools list

#### Test School Page Functionality
- [ ] **External Links**: Click school website link (should open in new tab)
- [ ] **Program Filtering**: If implemented, test filtering programs by degree type
- [ ] **Responsive Design**: Test layout on different screen sizes
- [ ] **Error Handling**: Try accessing non-existent school ID

## Testing Programs Public Pages

### Programs List Page (`/programs`)

#### Navigate to Programs List
- Go to `http://localhost:3000/programs`
- You should see the "Programs" page with:
  - Page title and description
  - Grid or list of program cards
  - Each program card showing program and school information

#### Test Programs List Display
- [ ] **Load Programs**: Verify all programs are displayed
- [ ] **Program Cards**: Check that each program card shows:
  - Program name and abbreviation
  - School name
  - Degree type
  - Duration
  - Tuition (if available)
  - STEM designation (if applicable)
- [ ] **Card Links**: Click on program cards to verify they link to individual program pages
- [ ] **Empty State**: If no programs exist, verify appropriate empty state message

#### Test Programs List Functionality
- [ ] **Search/Filter**: Test any search or filter functionality
- [ ] **Sorting**: Test sorting by different criteria (name, duration, tuition, etc.)
- [ ] **School Filtering**: If implemented, test filtering by school
- [ ] **Degree Filtering**: If implemented, test filtering by degree type
- [ ] **Pagination**: If implemented, test pagination controls
- [ ] **Responsive Design**: Test on mobile, tablet, and desktop

### Individual Program Page (`/programs/[id]`)

#### Navigate to Program Details
- Click on a program card from the programs list
- Or go directly to `http://localhost:3000/programs/{program-id}`

#### Test Program Details Display
- [ ] **Program Information**: Verify all program details are displayed:
  - Program name and abbreviation
  - School name (with link to school page)
  - Degree type
  - Duration and credits
  - Delivery method and schedule type
  - STEM designation
- [ ] **Financial Information**: Check tuition and currency display
- [ ] **Admission Requirements**: Verify requirements are shown:
  - IELTS/TOEFL scores
  - GPA requirements
  - Required documents (personal statement, CV, etc.)
- [ ] **Description**: Check program description is displayed
- [ ] **Navigation**: Test breadcrumb navigation back to programs list

#### Test Program Page Functionality
- [ ] **School Link**: Click school name link (should go to school page)
- [ ] **External Links**: Test any external application links
- [ ] **Responsive Design**: Test layout on different screen sizes
- [ ] **Error Handling**: Try accessing non-existent program ID

## Testing Navigation and User Experience

### Global Navigation
- [ ] **Navigation Bar**: Test all navigation links work
- [ ] **Logo/Home**: Click logo to return to home page
- [ ] **Schools Link**: Navigate to schools list
- [ ] **Programs Link**: Navigate to programs list
- [ ] **Login/Register**: Test authentication links (if visible)

### Cross-Page Navigation
- [ ] **School to Programs**: From school page, click on program links
- [ ] **Program to School**: From program page, click on school link
- [ ] **Breadcrumbs**: Test breadcrumb navigation throughout
- [ ] **Back Button**: Test browser back button functionality

### Mobile Experience
- [ ] **Mobile Navigation**: Test hamburger menu (if implemented)
- [ ] **Touch Targets**: Verify buttons and links are large enough for touch
- [ ] **Scrolling**: Test smooth scrolling on mobile devices
- [ ] **Orientation**: Test landscape and portrait orientations

## Testing Error Scenarios

### Invalid Page Access
- [ ] **Non-existent School**: Try `/schools/999999`
  - Should show 404 page or appropriate error message
  - Should not crash the application
- [ ] **Non-existent Program**: Try `/programs/999999`
  - Should show 404 page or appropriate error message
  - Should not crash the application
- [ ] **Invalid URLs**: Try various invalid URL patterns
  - Should handle gracefully with proper error pages

### Data Loading Errors
- [ ] **Network Issues**: Simulate slow network or disconnection
  - Should show loading states
  - Should handle timeouts gracefully
  - Should provide retry options
- [ ] **Empty Data**: Test with no schools or programs in database
  - Should show appropriate empty state messages
  - Should not show broken layouts

## Performance Testing

### Page Load Performance
- [ ] **Initial Load**: Measure time to load schools/programs lists
- [ ] **Image Loading**: Check that school logos or images load efficiently
- [ ] **Lazy Loading**: If implemented, test lazy loading of content
- [ ] **Caching**: Test browser caching behavior

### Responsive Performance
- [ ] **Mobile Load Times**: Test page load times on mobile devices
- [ ] **Tablet Performance**: Test performance on tablet devices
- [ ] **Desktop Performance**: Test performance on desktop browsers

## Accessibility Testing

### Basic Accessibility
- [ ] **Keyboard Navigation**: Test all functionality with keyboard only
- [ ] **Screen Reader**: Test with screen reader software
- [ ] **Color Contrast**: Verify sufficient color contrast for text
- [ ] **Alt Text**: Check images have appropriate alt text

### WCAG Compliance
- [ ] **Focus Indicators**: Verify focus indicators are visible
- [ ] **Semantic HTML**: Check proper use of heading tags and landmarks
- [ ] **Form Labels**: Verify all form elements have proper labels
- [ ] **Error Messages**: Check error messages are accessible

## Success Criteria

Public pages are working correctly if:
- [ ] All schools and programs are displayed correctly
- [ ] Navigation between pages works smoothly
- [ ] Individual school and program pages show complete information
- [ ] Links between schools and programs work correctly
- [ ] Pages are responsive on all device sizes
- [ ] Error scenarios are handled gracefully
- [ ] Page load times are reasonable
- [ ] Accessibility standards are met

## Troubleshooting

### Common Public Page Issues

**Issue: "Page not found" errors**
- **Solution**: Check that schools/programs exist in database
- **Check**: Verify URL structure and routing

**Issue: "Slow page loading"**
- **Solution**: Check database queries and optimize if needed
- **Check**: Verify image sizes and loading strategies

**Issue: "Broken layout on mobile"**
- **Solution**: Check responsive CSS and viewport settings
- **Check**: Test on actual mobile devices

**Issue: "Missing data"**
- **Solution**: Verify data exists in database
- **Check**: Check API endpoints and data fetching logic

## 🔄 Next Steps

After completing public pages testing:
1. Test **[Admin CRUD Operations](./admin-crud-testing.md)** to add more test data
2. Verify **[CSV Upload Functionality](./csv-upload-testing.md)** works with public display
3. Check **[Error Handling Scenarios](./error-handling-testing.md)**

## 📚 Related Documentation

- **[Testing Plan](./testing-plan.md)** - Main testing overview
- **[Core Setup Testing](./core-setup-testing.md)** - Environment setup
- **[Admin CRUD Testing](./admin-crud-testing.md)** - Data management
- **[Design Document](../design-doc.md)** - Application architecture
