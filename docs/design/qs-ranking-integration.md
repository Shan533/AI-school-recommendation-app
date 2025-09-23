# QS Ranking Integration Plan

## 📊 Issue #86: Add QS ranking information to new UI components

**GitHub Issue**: [#86](https://github.com/Shan533/AI-school-recommendation-app/issues/86)

## 🎯 Objective
Integrate QS World University Rankings data into the new table/card UI components for both programs and schools pages.

## 📋 Current Status
- ✅ New table/card view components implemented
- ✅ Filtering and sorting functionality working
- ❌ QS ranking data not displayed in UI
- ❌ QS ranking data missing from database

## 🔍 Investigation Results
- Schools table has `qs_ranking` column but all values are `null`
- Programs don't have direct QS ranking (schools do)
- Need to join programs with their school's QS ranking

## 📝 Implementation Tasks

### Database Updates
- [ ] Populate `schools.qs_ranking` with actual QS ranking data
- [ ] Verify data integrity and completeness
- [ ] Add migration if needed for data population

### UI Components Updates
- [ ] **Programs Table**: Add "School QS Ranking" column
- [ ] **Programs Cards**: Display school QS ranking in card view
- [ ] **Schools Table**: Add "QS Ranking" column (currently missing)
- [ ] **Schools Cards**: Display QS ranking in card view

### Filtering & Sorting
- [ ] Add QS ranking filter to schools filter controls
- [ ] Add QS ranking sort option to both programs and schools
- [ ] Update filter options to include ranking ranges

### Data Integration
- [ ] Update programs query to join with school QS ranking
- [ ] Update schools query to include QS ranking
- [ ] Handle null values gracefully in UI

## 🎨 UI Design Considerations
- Display ranking as "QS #123" format
- Show "Unranked" for schools without QS data
- Use consistent styling across table and card views
- Consider color coding for top rankings (e.g., top 50, top 100)

## 📊 Expected Data Structure
```typescript
// Programs with school QS ranking
interface ProgramWithRanking extends Program {
  schools?: {
    name: string
    qs_ranking: number | null
    // ... other school fields
  }
}

// Schools with QS ranking
interface SchoolWithRanking extends School {
  qs_ranking: number | null
}
```

## 🚀 Success Criteria
- [ ] QS rankings visible in both table and card views
- [ ] Filtering by QS ranking range works
- [ ] Sorting by QS ranking works
- [ ] Graceful handling of missing ranking data
- [ ] Consistent UI/UX across all views

## 🔗 Related Components
- `src/components/programs/programs-list.tsx`
- `src/components/schools/schools-list.tsx`
- `src/components/ui/table-view.tsx`
- `src/components/ui/schools-filter-controls.tsx`
- `src/app/programs/page.tsx`
- `src/app/schools/page.tsx`

## 📅 Priority
**High** - This is a key differentiator for the school recommendation app and provides valuable information for users making decisions.

## 🏷️ Labels
`enhancement`, `ui`, `data`, `ranking`
