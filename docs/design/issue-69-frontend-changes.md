# Issue #69 Frontend Changes Plan

## Overview
This document outlines the frontend changes needed to implement the enhanced schema with program categories and application difficulty.

## 🎯 Priority Order

### Phase 1: Admin Interface (Immediate)
1. Admin Program Forms
2. Admin Category Management
3. CSV Upload Updates

### Phase 2: API Updates
1. Program API endpoints
2. Category API endpoints

### Phase 3: Public UI (Future)
1. Program cards display
2. Search and filtering

## 📋 Detailed Frontend Changes

### 1. Admin Program Forms (`src/components/admin/programs-management.tsx`)

#### Current Interface Updates
```typescript
// Current Program interface
interface Program {
  id: string
  name: string
  // ... existing fields
}

// Updated Program interface
interface Program {
  id: string
  name: string
  // ... existing fields
  
  // New fields for Issue #69
  application_difficulty?: 'SSR' | 'SR' | 'R' | 'N'
  difficulty_description?: string
  category_ids: string[]
  primary_category_id?: string
  career_paths: string[]
  categories?: ProgramCategory[]
}
```

#### Form Updates Needed
1. **Category Selection**
   - Multi-select dropdown for categories
   - Primary category selection (radio button)
   - Display category abbreviations

2. **Difficulty Selection**
   - Radio button group for SSR/SR/R/N
   - Text area for difficulty description
   - Visual indicators for difficulty levels

3. **Career Paths Selection**
   - Multi-select for career paths
   - Dynamic options based on selected categories
   - Support for custom career paths
   - Real-time validation and error handling

#### UI Components to Add
```tsx
// Category selection component
<CategorySelector
  categories={availableCategories}
  selectedIds={program.category_ids}
  primaryId={program.primary_category_id}
  onChange={handleCategoryChange}
/>

// Difficulty selection component
<DifficultySelector
  value={program.application_difficulty}
  description={program.difficulty_description}
  onChange={handleDifficultyChange}
/>

// Career paths selector with custom path support
<CareerPathSelector
  selectedPaths={program.career_paths}
  availablePaths={getAvailableCareerPaths(program.category_ids)}
  customPath={customPath}
  onCustomPathChange={setCustomPath}
  onAddCustomPath={handleAddCustomPath}
  onRemovePath={handleRemovePath}
  onTogglePath={handleTogglePath}
  onChange={handleCareerPathChange}
/>
```

### 2. Admin Category Management (New)

#### New Files to Create
- `src/components/admin/category-management.tsx`
- `src/components/admin/category-form-modal.tsx`
- `src/components/admin/career-path-selector.tsx`
- `src/app/admin/categories/page.tsx`
- `src/app/api/admin/categories/route.ts`
- `src/app/api/admin/categories/[id]/route.ts`

#### Category Management Interface
```typescript
interface CategoryFormData {
  name: string
  abbreviation: string
  description?: string
  career_paths: string[]
}

interface CategoryManagementProps {
  categories: ProgramCategory[]
  onCategoryUpdate: (category: ProgramCategory) => void
  onCategoryDelete: (id: string) => void
}
```

#### Features Needed
1. **Category CRUD Operations**
   - Create new categories
   - Edit existing categories
   - Delete categories (with validation)
   - List all categories

2. **Category Form Fields**
   - Name (required, unique)
   - Abbreviation (required, unique, max 10 chars)
   - Description (optional)
   - Career paths (array of strings with custom path support)

3. **Validation**
   - Name uniqueness
   - Abbreviation uniqueness
   - Career paths not empty
   - Custom path validation

4. **Career Path Management Features**
   - Select from predefined career paths
   - Add custom career paths
   - Remove selected paths
   - Real-time validation for duplicates
   - Quick selection from common paths

### 3. CSV Upload Updates (`src/app/admin/csv-upload/page.tsx`)

#### Current CSV Template Updates
```csv
# Add new columns to CSV template
name,initial,school_id,degree,website_url,duration_years,currency,total_tuition,is_stem,description,credits,delivery_method,schedule_type,location,add_ons,start_date,application_difficulty,difficulty_description,category_ids,primary_category_id,career_paths
```

#### CSV Processing Updates
1. **New Field Mapping**
   - `application_difficulty`: Validate against SSR/SR/R/N
   - `difficulty_description`: Optional text field
   - `category_ids`: Comma-separated UUIDs
   - `primary_category_id`: Single UUID
   - `career_paths`: Comma-separated strings

2. **Validation Updates**
   - Validate difficulty values
   - Validate category IDs exist
   - Validate primary category is in category_ids
   - Validate career paths format

3. **Error Handling**
   - Show validation errors for new fields
   - Provide mapping suggestions for categories
   - Handle invalid difficulty values

#### Updated CSV Processing Logic
```typescript
interface CSVProgramRow {
  // ... existing fields
  application_difficulty?: string
  difficulty_description?: string
  category_ids?: string
  primary_category_id?: string
  career_paths?: string
}

function processCSVRow(row: CSVProgramRow): ProgramFormData {
  return {
    // ... existing processing
    application_difficulty: validateDifficulty(row.application_difficulty),
    difficulty_description: row.difficulty_description,
    category_ids: parseCategoryIds(row.category_ids),
    primary_category_id: row.primary_category_id,
    career_paths: parseCareerPaths(row.career_paths)
  }
}
```

### 4. API Updates

#### Program API (`src/app/api/admin/programs/route.ts`)

##### POST /api/admin/programs
```typescript
// Updated request body
interface CreateProgramRequest {
  // ... existing fields
  application_difficulty?: 'SSR' | 'SR' | 'R' | 'N'
  difficulty_description?: string
  category_ids: string[]
  primary_category_id?: string
  career_paths: string[]
}

// Updated response
interface CreateProgramResponse {
  program: EnhancedProgram
  categories: ProgramCategory[]
}
```

##### PUT /api/admin/programs/[id]
```typescript
// Similar updates for update endpoint
interface UpdateProgramRequest extends CreateProgramRequest {
  id: string
}
```

#### Category API (New)

##### GET /api/admin/categories
```typescript
interface CategoriesResponse {
  categories: ProgramCategory[]
  total: number
}
```

##### POST /api/admin/categories
```typescript
interface CreateCategoryRequest {
  name: string
  abbreviation: string
  description?: string
  career_paths: string[]
}

interface CreateCategoryResponse {
  category: ProgramCategory
}
```

##### PUT /api/admin/categories/[id]
```typescript
interface UpdateCategoryRequest extends CreateCategoryRequest {
  id: string
}
```

##### DELETE /api/admin/categories/[id]
```typescript
interface DeleteCategoryResponse {
  success: boolean
  message: string
}
```

### 5. TypeScript Types Updates

#### Update `src/lib/types/schema-enhancements.ts`
```typescript
// Remove icon and color fields
interface ProgramCategory {
  id: string
  name: string
  abbreviation: string
  description?: string
  career_paths: string[]
  created_at: string
  updated_at: string
}

// Update Program interface
interface EnhancedProgram {
  // ... existing fields
  application_difficulty?: ApplicationDifficulty
  difficulty_description?: string
  category_ids: string[]
  primary_category_id?: string
  career_paths: string[]
  categories?: ProgramCategoryWithMapping[]
}

// Update form data types
interface ProgramFormData {
  // ... existing fields
  application_difficulty?: ApplicationDifficulty
  difficulty_description?: string
  category_ids: string[]
  primary_category_id?: string
  career_paths: string[]
}
```

### 6. Validation Updates

#### Update `src/lib/validation.ts`
```typescript
// Update validation functions
export function validateEnhancedProgramData(data: Record<string, unknown>): string[] {
  const errors: string[] = []
  
  // ... existing validation
  
  // New validations
  const difficultyError = validateApplicationDifficulty(data.application_difficulty)
  if (difficultyError) errors.push(difficultyError)
  
  // Validate category IDs
  if (data.category_ids && Array.isArray(data.category_ids)) {
    if (data.category_ids.length === 0) {
      errors.push('At least one category must be selected')
    }
  }
  
  // Validate primary category is in category_ids
  if (data.primary_category_id && data.category_ids) {
    if (!data.category_ids.includes(data.primary_category_id)) {
      errors.push('Primary category must be selected from categories')
    }
  }
  
  return errors
}
```

## 🎨 UI/UX Considerations

### 1. Category Selection UI
- **Multi-select with checkboxes** for categories
- **Radio buttons** for primary category selection
- **Badge display** showing selected categories with abbreviations
- **Search/filter** for large category lists

### 2. Difficulty Selection UI
- **Visual indicators** for difficulty levels (colors, icons)
- **Tooltip explanations** for each difficulty level
- **Optional description field** for additional context

### 3. Career Paths UI
- **Tag-based selection** for career paths
- **Dynamic options** based on selected categories
- **Add custom paths** functionality

### 4. Form Layout
- **Grouped sections** for related fields
- **Clear labels** and help text
- **Validation feedback** in real-time
- **Responsive design** for mobile admin

## 🧪 Testing Strategy

### 1. Component Tests
- Test category selection component
- Test difficulty selection component
- Test career paths selector
- Test form validation

### 2. Integration Tests
- Test admin form submission
- Test CSV upload with new fields
- Test category management CRUD
- Test API endpoints

### 3. E2E Tests
- Test complete admin workflow
- Test CSV import process
- Test category management workflow

## 📱 Mobile Considerations

### Admin Interface
- **Responsive forms** for mobile admin access
- **Touch-friendly** selection components
- **Simplified layouts** for smaller screens
- **Easy navigation** between form sections

## 🚀 Implementation Timeline

### Week 1: Database & Types
- [ ] Run migration script
- [ ] Update TypeScript types
- [ ] Update validation functions

### Week 2: Admin Forms
- [ ] Update program management forms
- [ ] Add category selection components
- [ ] Add difficulty selection components

### Week 3: Category Management
- [ ] Create category management interface
- [ ] Implement category CRUD operations
- [ ] Add category API endpoints

### Week 4: CSV Upload
- [ ] Update CSV template
- [ ] Update CSV processing logic
- [ ] Add validation for new fields

### Week 5: Testing & Polish
- [ ] Comprehensive testing
- [ ] Bug fixes
- [ ] UI/UX improvements
- [ ] Documentation updates

## 🔄 Rollback Plan

If issues arise:
1. **Database**: Remove new columns, drop new tables
2. **Frontend**: Revert form changes, remove new components
3. **API**: Remove new endpoints, revert program API changes
4. **CSV**: Revert to original template and processing

## 📊 Success Metrics

### Technical Metrics
- All existing functionality preserved
- New features working correctly
- Form validation working properly
- CSV upload processing new fields

### User Experience Metrics
- Admin users can easily manage categories
- Program forms are intuitive and efficient
- CSV upload process is smooth
- No regression in existing workflows

## 🎯 Detailed Component Designs

### 1. Career Path Selector Component

#### Component Interface
```typescript
interface CareerPathSelectorProps {
  selectedPaths: string[]
  availablePaths: string[]
  customPath: string
  onCustomPathChange: (path: string) => void
  onAddCustomPath: () => void
  onRemovePath: (path: string) => void
  onTogglePath: (path: string) => void
  allowCustomPaths?: boolean
  maxPaths?: number
}
```

#### Features
- **Selected Paths Display**: Show selected paths as removable badges
- **Available Paths Selection**: Checkbox grid for predefined paths
- **Custom Path Input**: Text input with add button for custom paths
- **Quick Selection**: Common paths quick-select buttons
- **Real-time Validation**: Prevent duplicates and validate input
- **Responsive Design**: Mobile-friendly layout

#### UI Layout
```tsx
<div className="space-y-4">
  {/* Selected Paths */}
  <div className="space-y-2">
    <Label>已选择的路径:</Label>
    <div className="flex flex-wrap gap-2">
      {selectedPaths.map(path => (
        <Badge key={path} variant="secondary" className="flex items-center gap-1">
          {path}
          <button onClick={() => onRemovePath(path)}>×</button>
        </Badge>
      ))}
    </div>
  </div>

  {/* Available Paths */}
  <div className="space-y-2">
    <Label>从分类中选择:</Label>
    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
      {availablePaths.map(path => (
        <label key={path} className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={selectedPaths.includes(path)}
            onChange={() => onTogglePath(path)}
          />
          <span>{path}</span>
        </label>
      ))}
    </div>
  </div>

  {/* Custom Path Input */}
  <div className="space-y-2">
    <Label>添加自定义路径:</Label>
    <div className="flex gap-2">
      <Input
        value={customPath}
        onChange={(e) => onCustomPathChange(e.target.value)}
        placeholder="输入自定义职业路径"
      />
      <Button
        onClick={onAddCustomPath}
        disabled={!customPath.trim() || selectedPaths.includes(customPath.trim())}
      >
        添加
      </Button>
    </div>
  </div>
</div>
```

### 2. Category Form Modal Component

#### Component Interface
```typescript
interface CategoryFormModalProps {
  category?: ProgramCategory | null
  isOpen: boolean
  onClose: () => void
  onSave: (data: CategoryFormData) => Promise<void>
}

interface CategoryFormData {
  name: string
  abbreviation: string
  description?: string
  career_paths: string[]
}
```

#### Features
- **Form Validation**: Real-time validation for all fields
- **Career Path Management**: Full career path CRUD within the form
- **Duplicate Prevention**: Check for existing names and abbreviations
- **Quick Path Selection**: Predefined career paths for quick selection
- **Responsive Modal**: Mobile-friendly modal design

#### Form Layout
```tsx
<form className="space-y-4">
  {/* Basic Information */}
  <div className="grid grid-cols-2 gap-4">
    <div>
      <Label htmlFor="name">分类名称 *</Label>
      <Input id="name" required />
    </div>
    <div>
      <Label htmlFor="abbreviation">缩写 *</Label>
      <Input id="abbreviation" maxLength={10} required />
    </div>
  </div>

  <div>
    <Label htmlFor="description">描述</Label>
    <Textarea id="description" rows={3} />
  </div>

  {/* Career Paths Management */}
  <CareerPathSelector
    selectedPaths={formData.career_paths}
    availablePaths={CAREER_PATHS}
    onAddCustomPath={handleAddCareerPath}
    onRemovePath={handleRemoveCareerPath}
    onTogglePath={handleToggleCareerPath}
  />
</form>
```

### 3. Program Form Integration

#### Updated Program Form Structure
```tsx
const ProgramForm = ({ program, onSave }: ProgramFormProps) => {
  const [formData, setFormData] = useState<ProgramFormData>({
    // ... existing fields
    category_ids: program?.category_ids || [],
    primary_category_id: program?.primary_category_id || '',
    career_paths: program?.career_paths || [],
    application_difficulty: program?.application_difficulty,
    difficulty_description: program?.difficulty_description || ''
  })

  const [customCareerPath, setCustomCareerPath] = useState('')

  // Get available career paths based on selected categories
  const availableCareerPaths = useMemo(() => {
    const categoryPaths = categories
      .filter(cat => formData.category_ids.includes(cat.id))
      .flatMap(cat => cat.career_paths)
    
    return [...new Set([...categoryPaths, ...CAREER_PATHS])]
  }, [formData.category_ids, categories])

  const handleAddCustomCareerPath = () => {
    if (customCareerPath.trim() && !formData.career_paths.includes(customCareerPath.trim())) {
      setFormData(prev => ({
        ...prev,
        career_paths: [...prev.career_paths, customCareerPath.trim()]
      }))
      setCustomCareerPath('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Existing form fields */}
      
      {/* Category Selection */}
      <CategorySelector
        categories={categories}
        selectedIds={formData.category_ids}
        primaryId={formData.primary_category_id}
        onChange={(ids, primary) => {
          setFormData(prev => ({
            ...prev,
            category_ids: ids,
            primary_category_id: primary
          }))
        }}
      />

      {/* Difficulty Selection */}
      <DifficultySelector
        value={formData.application_difficulty}
        description={formData.difficulty_description}
        onChange={(difficulty, description) => {
          setFormData(prev => ({
            ...prev,
            application_difficulty: difficulty,
            difficulty_description: description
          }))
        }}
      />

      {/* Career Paths Selection */}
      <CareerPathSelector
        selectedPaths={formData.career_paths}
        availablePaths={availableCareerPaths}
        customPath={customCareerPath}
        onCustomPathChange={setCustomCareerPath}
        onAddCustomPath={handleAddCustomCareerPath}
        onRemovePath={(path) => {
          setFormData(prev => ({
            ...prev,
            career_paths: prev.career_paths.filter(p => p !== path)
          }))
        }}
        onTogglePath={(path) => {
          setFormData(prev => ({
            ...prev,
            career_paths: prev.career_paths.includes(path)
              ? prev.career_paths.filter(p => p !== path)
              : [...prev.career_paths, path]
          }))
        }}
      />
    </form>
  )
}
```

### 4. Validation Enhancements

#### Enhanced Validation Functions
```typescript
export function validateCareerPaths(careerPaths: string[]): string[] {
  const errors: string[] = []
  
  if (careerPaths.length === 0) {
    errors.push('At least one career path must be selected')
  }
  
  if (careerPaths.length > 20) {
    errors.push('Cannot select more than 20 career paths')
  }
  
  // Check for duplicates
  const uniquePaths = new Set(careerPaths)
  if (uniquePaths.size !== careerPaths.length) {
    errors.push('Career paths must be unique')
  }
  
  // Validate each path
  careerPaths.forEach(path => {
    if (typeof path !== 'string' || path.trim().length === 0) {
      errors.push('All career paths must be valid non-empty strings')
    } else if (path.length > 50) {
      errors.push('Career path names must be less than 50 characters')
    }
  })
  
  return errors
}

export function validateCategoryFormData(data: CategoryFormData): string[] {
  const errors: string[] = []
  
  // Name validation
  if (!data.name || data.name.trim().length === 0) {
    errors.push('Category name is required')
  } else if (data.name.length > 50) {
    errors.push('Category name must be less than 50 characters')
  }
  
  // Abbreviation validation
  if (!data.abbreviation || data.abbreviation.trim().length === 0) {
    errors.push('Category abbreviation is required')
  } else if (data.abbreviation.length > 10) {
    errors.push('Category abbreviation must be less than 10 characters')
  }
  
  // Career paths validation
  errors.push(...validateCareerPaths(data.career_paths))
  
  return errors
}
```

### 5. API Integration

#### Category API Endpoints
```typescript
// GET /api/admin/categories
export async function GET() {
  const { data: categories, error } = await supabase
    .from('program_categories')
    .select('*')
    .order('name')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ categories })
}

// POST /api/admin/categories
export async function POST(request: Request) {
  const data = await request.json()
  
  const errors = validateCategoryFormData(data)
  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 400 })
  }

  const { data: category, error } = await supabase
    .from('program_categories')
    .insert([data])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ category })
}
```

## 🎨 UI/UX Enhancements

### 1. Visual Design
- **Consistent Badge Design**: All selected items use consistent badge styling
- **Color Coding**: Different colors for different types of selections
- **Loading States**: Proper loading indicators for async operations
- **Error States**: Clear error messages and validation feedback

### 2. Interaction Design
- **Keyboard Navigation**: Full keyboard support for accessibility
- **Drag and Drop**: Future enhancement for reordering career paths
- **Bulk Operations**: Select multiple items for bulk actions
- **Search and Filter**: Search through available career paths

### 3. Mobile Optimization
- **Touch-Friendly**: Large touch targets for mobile devices
- **Responsive Grid**: Career path selection adapts to screen size
- **Swipe Actions**: Swipe to remove selected items on mobile
- **Bottom Sheet**: Modal forms slide up from bottom on mobile
