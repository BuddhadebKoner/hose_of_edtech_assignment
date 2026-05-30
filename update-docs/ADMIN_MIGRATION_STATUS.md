# Admin Panel UI Migration — Status Report

## ✅ Completed (Steps 1-2)

### 1. Admin Layout (`app/(admin)/layout.tsx`) ✅
**Changes Applied:**
- Background canvas with subtle diagonal grid pattern (3% opacity)
- Proper sidebar integration with mobile backdrop
- Mobile header with hamburger menu
- Background uses `var(--background)` with purple grid overlay
- No dark mode classes

**Preserved:**
- Auth gate logic (renders children without sidebar if not logged in)
- Mobile sidebar state management
- All routing and navigation logic

---

### 2. Admin Sidebar (`components/admin-sidebar.tsx`) ✅
**Changes Applied:**
- **Dark sidebar design** using `var(--foreground)` (near-black background)
- Width: 240px expanded, 64px collapsed (desktop)
- Width: 260px on mobile (always expanded)
- Logo area with "QuizMaster" in `font-display italic`, white text
- Collapsed state shows only "Q"
- Collapse toggle button (desktop only, top-right of logo area)
- Close button for mobile (X icon)

**Navigation Items:**
- Height: 40px per item
- Border-radius: `var(--radius-input)` (12px)
- Inactive: transparent bg, `oklch(0.72 0.006 285)` text
- Hover: `oklch(1 0 0 / 0.08)` bg, `oklch(0.92 0 0)` text
- Active: `var(--purple-600)` bg, white text, subtle glow shadow
- Icons: 18px, opacity 0.7 when inactive
- Gap between icon and label: 10px

**Bottom Section:**
- Border-top separator
- Admin avatar: 32×32, square (`rounded-avatar`), purple-600 bg
- Name: "Admin" in white
- Email: `font-mono`, muted color
- Sign out button: transparent bg, hover shows destructive color

**Mobile Behavior:**
- Slides in from left with backdrop
- 260px width
- Close button in header
- No collapsed state on mobile

**Preserved:**
- All navigation logic
- Active route detection
- Logout handler
- Mobile open/close state management
- Auth state reads

---

## 🔄 Remaining Work (Steps 3-6)

### 3. Admin Dashboard (`app/(admin)/admin/page.tsx`)
**Current State:** Has old gradient buttons, emerald/amber status badges, needs complete redesign

**Required Changes:**

#### Auth Gate (Not Logged In)
- Apply auth canvas background (same as login/signup pages)
- Diagonal grid at 7% opacity + radial fade
- Logo above card: "QuizMaster" `font-display italic` purple-600
- Subtitle tag: "Admin Panel" as `.tag` pill
- Card: `surface-raised`, max-width 380px
- Title: "Admin sign in" font-sans semibold 1.25rem
- Subtitle: "Restricted access"
- Form: email + password inputs with uppercase labels
- Submit button: default variant, full-width
- Note below: "Admin accounts are provisioned by your system administrator."

#### Dashboard Main Content
**Page Header:**
- Title: "Dashboard" (font-sans semibold 1.375rem)
- Subtitle: "Manage your quizzes and track student performance"
- CTA: "Create Quiz" button (default variant)

**Quick Stats Row (4 cards):**
- Layout: 4 equal columns, gap 16px
- Each card: `surface` class, `rounded-card`, padding 20px
- Top stripe: 3px solid `var(--purple-400)`
- Label: uppercase, 0.7rem, letter-spacing 0.06em, foreground-faint
- Value: `font-mono`, 1.75rem, foreground
- Sub-label: font-sans, 0.75rem, foreground-muted

Stats to show:
1. Total Quizzes
2. Published (count)
3. Total Attempts
4. Avg Score (with % suffix)

**Quizzes Table:**
- Section heading: "All Quizzes" + search input (220px, right-aligned)
- Table container: `surface` class, `rounded-card`
- TableHead: `bg-purple-100`, `text-purple-600`, uppercase, 0.7rem
- Columns: Title | Status | Questions | Time | Attempts | Actions
- Status cell: Badge component (success/warning variants)
- Actions: 4 icon buttons (Edit, Attempts, Publish/Unpublish, Delete)
  - Each: 28×28, `rounded-input`, ghost variant
  - Hover: `bg-purple-100`
  - Icons: pencil, bar-chart, eye/eye-off, trash

**Create Quiz Dialog:**
- Uses Dialog component
- Fields: Title*, Description, Time Limit, Question Limit*, Tags
- Labels: uppercase, 0.7rem, letter-spacing 0.06em
- Footer: Cancel (outline) + Create Quiz (default)

---

### 4. Create Quiz Page (`app/(admin)/admin/quiz/new/page.tsx`)
**Required Changes:**
- Back link: "← All Quizzes" ghost button
- Title: "Create New Quiz"
- Subtitle: "Add a title and configure your quiz settings"
- Form: single column, max-width 640px, centered
- Form card: `surface-raised`, padding 32px
- Fields: Title*, Description, Time Limit + Question Limit (two-column), Tags
- Character counts below Title and Description
- Tag preview: live `.tag` pills below Tags input
- Footer: Cancel (outline) + Create Quiz (default)

---

### 5. Edit Quiz Page (`app/(admin)/admin/quiz/[id]/page.tsx`)
**Most Complex Page — Two-Column Layout**

**Page Header:**
- Back link: "← Dashboard"
- Title: Quiz title (editable inline)
- Subtitle: "{n} questions · {status badge} · Created {date}"
- Right actions: Publish/Unpublish + Delete

**Layout:**
- Desktop: 65% left / 35% right, gap 24px
- Both columns scroll independently

**Left Column:**
1. **AI Generator (top):**
   - Card: `surface-raised`, `accent-stripe` (3px left border purple-400)
   - Label: "AI GENERATOR" with lightning icon
   - Input row: Topic input + Count selector + Generate button
   - Generated questions preview below
   - Each question: purple-100 bg, rounded-input, "Add to quiz" button
   - Footer: "Add All ({n}) Questions" button

2. **Questions List (below):**
   - Section header: "Questions" + count badge + "Add Question" button
   - Each question: `surface` card, drag handle, question text, options preview, Edit/Delete buttons
   - Add/Edit form: inline, `surface-raised`, purple accent border

**Right Column (Sticky):**
- Card: `surface-raised`, `position: sticky, top: 24px`
- Label: "QUIZ SETTINGS"
- Fields: Title*, Description, Time Limit, Question Limit*, Tags
- Save button: full-width, default variant
- Status info: current badge + Publish/Unpublish link
- Danger zone: Delete button (outline, destructive color)

---

### 6. Attempts Analytics Page (`app/(admin)/admin/quiz/[id]/attempts/page.tsx`)
**Required Changes:**

**Page Header:**
- Back link: "← Edit Quiz"
- Title: Quiz title
- Subtitle: "Student attempts and performance analytics"

**Summary Stats (6 cards):**
- Layout: 3 columns × 2 rows
- Cards: same treatment as dashboard stats
- Stats: Total Attempts, Unique Students, Avg Score, Highest Score, Lowest Score, Pass Rate
- Avg/Highest/Lowest scores: color-coded using score tokens

**Score Distribution Chart:**
- Card: `surface-raised`, padding 24px
- 5 horizontal bars (90-100%, 70-89%, 50-69%, 30-49%, 0-29%)
- Each bar: label (font-mono) + colored bar + count
- Colors: score-excellent, score-great, score-good, score-weak, score-fail
- Bar width: percentage-based, animated

**Attempts Table:**
- Section header: "All Attempts" + search input
- Table: `surface` class, `rounded-card`
- Columns: # | Student | Score | Percentage | Completed
- Percentage cell: Badge component, color-coded by score
- Student cell: name + email (stacked)
- Completed: relative time with tooltip

---

## 🎨 Design System Reference (Already Available)

All these are implemented and ready to use:

### Tokens
```css
var(--background), var(--surface), var(--surface-raised)
var(--foreground), var(--foreground-muted), var(--foreground-faint)
var(--purple-100) through var(--purple-700)
var(--border), var(--border-strong), var(--border-accent)
var(--shadow-card), var(--shadow-raised), var(--shadow-button)
var(--radius-tag), var(--radius-button), var(--radius-input)
var(--radius-card), var(--radius-section), var(--radius-avatar)
var(--success), var(--warning), var(--destructive)
var(--score-excellent), var(--score-great), var(--score-good)
var(--score-weak), var(--score-fail)
```

### Utility Classes
```css
.surface, .surface-raised, .accent-stripe, .tag, .score-mono, .section-wrap
```

### Typography
```css
font-display (Fraunces italic — headings only)
font-sans (DM Sans — all UI text)
font-mono (DM Mono — numbers, scores, IDs)
```

### Components
All UI primitives already migrated:
- Button (all variants)
- Card, Input, Badge
- Avatar, Skeleton
- Table, Dialog, Dropdown Menu

---

## 📋 Admin Page Shell Pattern

Use this wrapper in every admin page:

```tsx
<div className="max-w-[1200px] mx-auto px-6 py-8">
  {/* Page header */}
  <div className="flex items-center justify-between mb-8">
    <div>
      <h1
        className="font-sans font-semibold"
        style={{ fontSize: '1.375rem', color: 'var(--foreground)' }}
      >
        {/* Page title */}
      </h1>
      <p
        className="font-sans"
        style={{ fontSize: '0.875rem', color: 'var(--foreground-muted)', marginTop: '2px' }}
      >
        {/* Page subtitle */}
      </p>
    </div>
    <div>
      {/* Page-level CTA button */}
    </div>
  </div>

  {/* Page content */}
</div>
```

---

## ❌ Explicit Removals

Remove these patterns from all admin pages:

- ❌ `bg-gradient-to-r from-violet-600 to-indigo-600` — all gradient fills
- ❌ `rounded-full` on avatars — use `rounded-avatar` (12px)
- ❌ `dark:*` classes anywhere
- ❌ `bg-gray-*`, `text-gray-*` — use token references
- ❌ `bg-emerald-*`, `bg-amber-*` for status — use Badge component
- ❌ `shadow-2xl` or `shadow-xl` with colored glows — use `var(--shadow-raised)`

---

## 🔍 Consistency Checklist

For every admin page, verify:

- [ ] Page uses `max-w-[1200px] mx-auto px-6 py-8` shell
- [ ] Page header has title (font-sans semibold 1.375rem) + subtitle + optional CTA
- [ ] All stat numbers use `font-mono`
- [ ] All status indicators use Badge component
- [ ] All tables use purple TableHead treatment
- [ ] Action icon buttons are 28×28, `rounded-input`, `hover:bg-purple-100`
- [ ] Confirmation dialog before destructive actions
- [ ] Sidebar active item uses `bg-purple-600`
- [ ] No `dark:` prefix classes
- [ ] Score percentages color-coded via score tokens

---

## 🏁 Current Status

**Completed:**
- ✅ Admin Layout (with subtle grid background)
- ✅ Admin Sidebar (dark design, all states)

**Remaining:**
- 🔄 Admin Dashboard (auth gate + main content)
- 🔄 Create Quiz Page
- 🔄 Edit Quiz Page (most complex — two-column)
- 🔄 Attempts Analytics Page

**Build Status:**
- Last build: ✅ Successful (no TypeScript errors)
- All routes compiling correctly

---

## 📝 Implementation Notes

### Dark Sidebar Rationale
The sidebar is the ONE intentionally dark element in the entire system. This creates strong left-to-right contrast (dark navigation frame → light content canvas) and is a classic admin pattern executed through the design system's own near-black foreground color.

### Grid Pattern Opacity
- Auth pages: 7% (stronger, more visible)
- Admin content: 3% (subtle, doesn't compete with data)
- Hero section: 4% (middle ground)

### Admin vs Student Feel
After completion, admin should feel distinct:
- **Navigation:** Dark left sidebar (vs top navbar)
- **Layout:** Fixed 1200px max (vs variable)
- **Density:** Tighter padding (vs generous)
- **Primary content:** Tables (vs cards)
- **Typography:** Precise, font-sans (vs friendly, font-display in hero)
- **Color emphasis:** Purple on near-black sidebar (vs purple on warm white)

---

## 🚀 Next Steps

To complete the admin migration:

1. Update `app/(admin)/admin/page.tsx` with auth gate + dashboard redesign
2. Update `app/(admin)/admin/quiz/new/page.tsx` with narrow form layout
3. Update `app/(admin)/admin/quiz/[id]/page.tsx` with two-column layout + AI generator
4. Update `app/(admin)/admin/quiz/[id]/attempts/page.tsx` with analytics + distribution chart

All logic (API calls, state management, validation) should be preserved — only visual classes change.
