# UI Upgrade Design Document

## Overview
This document outlines a comprehensive UI upgrade for the AI School Recommend App, focusing on enhanced data presentation, improved user experience, and new career exploration features.

## Current State Analysis

### Existing Pages
- **Homepage**: Basic feature cards, limited program preview
- **Programs Page**: Card-based grid layout with basic search
- **Schools Page**: Card-based grid layout with basic search
- **Admin Pages**: Table-based views (good reference for public pages)

### Current Limitations
- Limited information density on homepage
- No career exploration features
- Basic filtering capabilities
- No category-based program discovery
- Limited data visualization

## New UI Architecture

### 0. Global Navigation Updates

- Add `Categories` to the main navigator linking to `/categories`.
- Routing overview:
  - `/categories`: Category index listing all categories with their related careers and a View All Programs action
  - `/categories/[categoryId]`: Category detail (optional lightweight page), includes description and entry to programs
  - `/categories/[categoryId]/programs`: Programs filtered by the selected category (table/card toggle supported)
  - `/careers/[careerId]`: Career detail with related programs

- Expected flows:
  - Navbar → `Categories` → Category Index →
    - Click `View All Programs` on a category → Filtered Programs for that category
    - Click a career chip under a category → Career Detail → Related Programs

### 1. Enhanced Homepage Design

#### Layout Structure
```
┌─────────────────────────────────────────────────────────┐
│                    Hero Section                         │
│              (Search + Attractive Content)             │
├─────────────────────────────────────────────────────────┤
│  Top Schools (QS Ranking)  │  Popular Programs (Rating) │
│  ┌─────────────────────┐   │  ┌─────────────────────┐   │
│  │ #1 MIT             │   │  │ CS @ MIT (4.8★)     │   │
│  │ #2 Stanford        │   │  │ DS @ Stanford (4.7★)│   │
│  │ #3 Harvard         │   │  │ AI @ CMU (4.6★)     │   │
│  │ #4 Oxford          │   │  │ UX @ Berkeley (4.5★)│   │
│  │ #5 Cambridge       │   │  │ CS @ Harvard (4.4★) │   │
│  └─────────────────────┘   │  └─────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│  Career Explorer (Scrolling Cards)                     │
│  [Software Engineer] [Data Scientist] [UX Designer]    │
│  [Product Manager] [AI Researcher] [DevOps Engineer]   │
│  [Cybersecurity] [Mobile Developer] [ML Engineer]      │
└─────────────────────────────────────────────────────────┘
```

#### Key Features
- **Hero Search Bar**: Global search with autocomplete
- **Top Schools Table**: QS-ranked schools (left column)
- **Popular Programs Table**: Highest-rated programs (right column)
- **Career Explorer**: Scrolling horizontal cards with career names
- **Rotten Tomatoes Style**: Expert choice (QS ranking) vs Student choice (ratings)

### 2. Enhanced Programs Page

#### Table View Content
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Program Name    │ School        │ Degree │ Duration │ Tuition │ Difficulty │ Category │
├─────────────────────────────────────────────────────────────────────────────────┤
│ CS Master's     │ MIT           │ MS     │ 2 years  │ $80k    │ SSR       │ CS       │
│ Data Science    │ Stanford      │ MS     │ 1.5 years│ $75k    │ SR        │ DS       │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Table Columns
1. **Program Name** (with initial/abbreviation)
2. **School** (with location)
3. **Degree Type** (Bachelor's, Master's, PhD, Certificate)
4. **Duration** (years/months)
5. **Tuition** (with currency)
6. **Difficulty** (SSR, SR, R, N - with color coding)
7. **Category** (CS, DS, UX, AI, etc.)

#### Custom Sorting Options
- **Default Sort**: By program name (alphabetical)
- **Custom Sorts**: 
  - By difficulty (SSR → SR → R → N)
  - By tuition (low to high, high to low)
  - By duration (short to long, long to short)
  - By school name (alphabetical)
  - By category (grouped by category)

#### Advanced Filtering
- **Degree Type**: Bachelor's, Master's, PhD, Certificate
- **Category**: CS, Data Science, UX, AI, etc.
- **Location/Region**: United States, Europe, Asia, etc.
- **Tuition Range**: Slider with min/max
- **Duration**: Slider with min/max years
- **QS Ranking**: Top 100, Top 200, etc.
- **STEM Programs**: Toggle filter
- **Delivery Method**: Onsite, Online, Hybrid

### 3. Enhanced Schools Page

#### Table View Content
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ School Name      │ Type    │ Location    │ QS Rank │ Programs │ Founded │ Region │
├─────────────────────────────────────────────────────────────────────────────────┤
│ MIT              │ Private │ Cambridge   │ #1      │ 45       │ 1861    │ US     │
│ Stanford         │ Private │ California  │ #2      │ 38       │ 1885    │ US     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Table Columns
1. **School Name** (with initial/abbreviation)
2. **Type** (Public, Private, Community)
3. **Location** (City, Country)
4. **QS Ranking** (with year)
5. **Program Count** (total programs available)
6. **Founded Year** (year established)
7. **Region** (United States, Europe, Asia, etc.)

### 4. Homepage Career Explorer (Scrolling Cards)

#### Scrolling Career Cards Component
```
┌─────────────────────────────────────────────────────────┐
│  Career Explorer - Discover Your Path                  │
├─────────────────────────────────────────────────────────┤
│  [Software Engineer] [Data Scientist] [UX Designer]    │
│  [Product Manager] [AI Researcher] [DevOps Engineer]   │
│  [Cybersecurity] [Mobile Developer] [ML Engineer]      │
│  [Frontend Dev] [Backend Dev] [Full Stack] [QA]       │
│  [Data Analyst] [Business Analyst] [Project Manager]   │
│  ←────────────── Auto-scrolling horizontally ──────────→│
└─────────────────────────────────────────────────────────┘
```

#### Career Card Features
- **Auto-scroll**: Continuous horizontal scrolling
- **Click to Explore**: Click any career to view details
- **Hover Effects**: Smooth hover animations
- **Responsive**: Adapts to different screen sizes

### 5. Career Detail Page

#### Page Structure
```
┌─────────────────────────────────────────────────────────┐
│                Software Engineer                        │
│  ┌─────────────────┐ ┌─────────────────────────────────┐ │
│  │   Overview      │ │        Related Programs         │ │
│  │                 │ │                                 │ │
│  │ • Industry: Tech│ │ • CS Master's @ MIT             │ │
│  │ • Growth: +15%  │ │ • Software Eng @ Stanford       │ │
│  │ • Salary: $120k │ │ • CS Bachelor's @ Berkeley      │ │
│  └─────────────────┘ └─────────────────────────────────┘ │
│                                                         │
│  [View All Related Programs] [Add to Collection]        │
└─────────────────────────────────────────────────────────┘
```

### 6. Category-Based Program Discovery

#### Category Page Structure
```
┌─────────────────────────────────────────────────────────┐
│              Computer Science Programs                  │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ 45 Programs Found | Filter: [All] [Bachelor's] [MS] │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  [Table/Card Toggle] [Sort by: Name, Rating, Tuition]  │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Program Name │ School │ Degree │ Duration │ Rating │ │
│  │ CS @ MIT     │ MIT    │ MS     │ 2 years  │ 4.8★   │ │
│  │ CS @ Stanford│ Stanford│ MS    │ 2 years  │ 4.7★   │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

#### Navigation Flow
1. **Homepage** → Click category card → **Category Page**
2. **Career Page** → Click career → **Career Detail** → **Related Programs**
3. **Programs Page** → Filter by category → **Filtered Results**

### 7. Category Index Page

#### Layout & Interaction
```
┌─────────────────────────────────────────────────────────┐
│                      Categories                         │
├─────────────────────────────────────────────────────────┤
│  [CS]  View All Programs →                              │
│   Careers: [Software Eng] [AI Researcher] [ML Eng] ...  │
│                                                         │
│  [Data Science]  View All Programs →                    │
│   Careers: [Data Scientist] [Data Analyst] [...]        │
│                                                         │
│  [UX / Design]  View All Programs →                     │
│   Careers: [UX Designer] [Product Designer] [...]       │
└─────────────────────────────────────────────────────────┘
```

- Each Category card shows:
  - Category name and short description (if available)
  - `View All Programs` button → `/categories/[categoryId]/programs`
  - Career chips (clickable) → `/careers/[careerId]`
- Mobile: category collapsible sections; careers as horizontally scrollable chips


## Technical Implementation

### 1. View Toggle Component
```typescript
interface ViewToggleProps {
  currentView: 'table' | 'cards'
  onViewChange: (view: 'table' | 'cards') => void
  storageKey: string // for localStorage persistence
}
```

### 2. Enhanced Table Component
```typescript
interface TableViewProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  sortable?: boolean
  filterable?: boolean
  onRowClick?: (item: T) => void
  defaultSort?: { column: keyof T; direction: 'asc' | 'desc' }
  customSortOptions?: SortOption<T>[]
}

interface SortOption<T> {
  key: keyof T
  label: string
  direction: 'asc' | 'desc'
}
```

### 3. Advanced Filter Component
```typescript
interface FilterControlsProps {
  filters: FilterState
  onFilterChange: (filters: FilterState) => void
  availableOptions: FilterOptions
}
```

### 4. Career Scrolling Cards Component
```typescript
interface CareerScrollingCardsProps {
  careers: Career[]
  onCareerClick: (career: Career) => void
  autoScroll?: boolean
  scrollSpeed?: number
}

interface CareerCardProps {
  career: Career
  onClick: () => void
  isActive?: boolean
}
```

## Data Requirements

### New API Endpoints Needed
1. **GET /api/careers** - List all careers for scrolling cards
2. **GET /api/careers/[id]** - Career details with related programs
3. **GET /api/categories/[id]/programs** - Programs by category
4. **GET /api/homepage/top-schools** - Top schools by QS ranking
5. **GET /api/homepage/popular-programs** - Popular programs by rating

### Database Queries Optimization
- Add indexes for category filtering
- Optimize rating calculations
- Cache popular categories and programs
- Implement search suggestions

## User Experience Improvements

### 1. Information Density
- **Table View**: Show more data in less space with custom sorting
- **Card View**: Rich visual presentation
- **Homepage Tables**: Rotten Tomatoes style comparison (Expert vs Student choice)

### 2. Discovery Features
- **Category Exploration**: Easy program discovery
- **Career Scrolling**: Engaging career exploration on homepage
- **Career Mapping**: Clear career paths with related programs
- **Related Content**: Cross-linking between entities

### 3. Performance
- **Lazy Loading**: Load data as needed
- **Caching**: Cache frequently accessed data
- **Search Optimization**: Fast, relevant search results

## Implementation Phases

### Phase 1: Core Infrastructure
- [ ] View toggle component
- [ ] Enhanced table component
- [ ] Advanced filtering system
- [ ] LocalStorage persistence

### Phase 2: Homepage Enhancement
- [ ] Hero section with search
- [ ] Top Schools table (QS ranking)
- [ ] Popular Programs table (ratings)
- [ ] Career scrolling cards component

### Phase 3: Career Exploration
- [ ] Career detail page
- [ ] Career-program mapping
- [ ] Career scrolling cards integration
- [ ] Career filtering and search

### Phase 4: Enhanced Discovery
- [ ] Category program pages
- [ ] Advanced search with suggestions
- [ ] Related content recommendations
- [ ] User collection integration

### Phase 5: Performance & Polish
- [ ] Performance optimization
- [ ] Mobile responsiveness
- [ ] Accessibility improvements
- [ ] User testing and refinements

## Success Metrics

### User Engagement
- Time spent on site
- Pages per session
- Category exploration rate
- Career page visits

### Conversion Metrics
- Program detail page views
- Collection additions
- Review submissions
- External website clicks

### Technical Metrics
- Page load times
- Search response times
- Filter usage rates
- View toggle preferences

## Conclusion

This UI upgrade will transform the app from a basic program listing to a comprehensive career exploration platform. The new design emphasizes information density, discovery, and user engagement while maintaining the clean, professional aesthetic of the current design.

The phased implementation approach ensures we can deliver value incrementally while building toward the complete vision.
