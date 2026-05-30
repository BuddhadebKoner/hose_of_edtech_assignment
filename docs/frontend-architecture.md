# Frontend Architecture Documentation

> **Complete Frontend Structure Reference for QuizMaster Platform**  
> This document provides an in-depth overview of all pages, components, routing, state management, and UI patterns used in the application. Use this as a single source of truth for frontend migration, updates, or onboarding.

---

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Routing Architecture](#routing-architecture)
5. [Authentication & Context](#authentication--context)
6. [Page Components](#page-components)
7. [Shared Components](#shared-components)
8. [UI Component Library](#ui-component-library)
9. [Styling & Design System](#styling--design-system)
10. [State Management Patterns](#state-management-patterns)
11. [API Integration](#api-integration)
12. [Migration Checklist](#migration-checklist)

---

## Overview

QuizMaster is a modern quiz platform built with **Next.js 14** (App Router), featuring:
- **Dual-role authentication**: Students and Admins with separate contexts
- **Real-time quiz taking**: Timer-based assessments with auto-submit
- **AI-powered question generation**: OpenAI integration for content creation
- **Responsive design**: Mobile-first approach with Tailwind CSS
- **Type-safe**: Full TypeScript implementation

---

## Technology Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **UI Components** | Custom components with @base-ui/react |
| **State Management** | React Context API |
| **Forms** | Controlled components with validation |
| **Fonts** | Geist Sans & Geist Mono (Google Fonts) |
| **Icons** | Inline SVG |

---

## Project Structure

```
app/
├── (admin)/              # Admin route group
│   ├── admin/
│   │   ├── page.tsx                    # Admin dashboard
│   │   └── quiz/
│   │       ├── new/page.tsx            # Create quiz
│   │       └── [id]/
│   │           ├── page.tsx            # Edit quiz
│   │           └── attempts/page.tsx   # View attempts
│   └── layout.tsx        # Admin layout with sidebar
├── (auth)/               # Auth route group
│   ├── login/page.tsx    # Login page (dual-tab)
│   └── signup/page.tsx   # Student signup
├── (student)/            # Student route group
│   ├── dashboard/page.tsx              # Student dashboard
│   ├── profile/page.tsx                # Student profile
│   └── quiz/
│       └── [id]/
│           ├── page.tsx                # Quiz detail
│           ├── attempt/page.tsx        # Take quiz
│           └── result/[attemptId]/page.tsx  # View result
├── api/                  # API routes (backend)
├── layout.tsx            # Root layout
├── page.tsx              # Landing page
├── providers.tsx         # Context providers wrapper
└── globals.css           # Global styles

components/
├── ui/                   # Reusable UI primitives
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   ├── table.tsx
│   ├── dialog.tsx
│   ├── dropdown-menu.tsx
│   ├── skeleton.tsx
│   └── avatar.tsx
├── navbar.tsx            # Global navigation
├── footer.tsx            # Global footer
└── admin-sidebar.tsx     # Admin sidebar navigation

context/
├── admin-auth-context.tsx    # Admin authentication
└── student-auth-context.tsx  # Student authentication
```


---

## Routing Architecture

### Route Groups

Next.js App Router uses **route groups** (folders in parentheses) to organize routes without affecting the URL structure:

#### 1. **(auth)** - Authentication Routes
- **Purpose**: Login and signup pages
- **Layout**: No special layout, uses minimal navigation
- **Routes**:
  - `/login` → Dual-tab login (Student/Admin)
  - `/signup` → Student registration

#### 2. **(student)** - Student Portal
- **Purpose**: Student-facing features
- **Layout**: Uses Navbar + Footer
- **Protection**: Redirects to `/login` if not authenticated
- **Routes**:
  - `/dashboard` → Quiz list, stats, recent attempts
  - `/profile` → User profile, attempt history
  - `/quiz/[id]` → Quiz overview
  - `/quiz/[id]/attempt` → Take quiz (timer, questions)
  - `/quiz/[id]/result/[attemptId]` → View results

#### 3. **(admin)** - Admin Panel
- **Purpose**: Quiz management and analytics
- **Layout**: Sidebar navigation + mobile hamburger
- **Protection**: Redirects to `/admin` (login) if not authenticated
- **Routes**:
  - `/admin` → Dashboard (quiz list, create, manage)
  - `/admin/quiz/new` → Create new quiz
  - `/admin/quiz/[id]` → Edit quiz, manage questions, AI generation
  - `/admin/quiz/[id]/attempts` → View all attempts with analytics

#### 4. **Root Routes**
- `/` → Landing page (marketing, features, CTA)
- `/api/*` → API routes (backend)

### Dynamic Routes

| Pattern | Example | Purpose |
|---------|---------|---------|
| `[id]` | `/quiz/abc123` | Quiz detail by ID |
| `[attemptId]` | `/result/xyz789` | Attempt result by ID |

---

## Authentication & Context

### Context Providers

Two separate authentication contexts manage user state:

#### **StudentAuthContext** (`context/student-auth-context.tsx`)

```typescript
interface StudentAuthContextValue {
  student: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<Result>;
  register: (name: string, email: string, password: string) => Promise<Result>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}
```

**Features**:
- Student login/register
- Cross-tab synchronization (BroadcastChannel)
- Auto-refresh on mount
- Logout broadcasts to all tabs

#### **AdminAuthContext** (`context/admin-auth-context.tsx`)

```typescript
interface AdminAuthContextValue {
  admin: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<Result>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}
```

**Features**:
- Admin-only login
- Cross-tab synchronization
- No registration (admin seeded via env)

### Provider Hierarchy

```tsx
// app/providers.tsx
<AdminAuthProvider>
  <StudentAuthProvider>
    {children}
  </StudentAuthProvider>
</AdminAuthProvider>
```

### Auth Guards

Pages use `useEffect` to redirect unauthenticated users:

```typescript
useEffect(() => {
  if (!loading && !student) {
    router.push("/login");
  }
}, [loading, student, router]);
```


---

## Page Components

### Landing Page (`app/page.tsx`)

**Purpose**: Marketing homepage with feature showcase

**Sections**:
1. **Hero**: Gradient background, CTA buttons, stats
2. **Features**: 6 feature cards with icons
3. **How It Works**: 4-step process
4. **For Students & Admins**: Dual-column benefits
5. **CTA**: Final call-to-action with gradient background

**Key Features**:
- Dynamic CTA based on auth state
- Responsive grid layouts
- Gradient backgrounds with blur effects
- SVG icons inline

**State**:
```typescript
const { student } = useStudentAuth();
const { admin } = useAdminAuth();
const isLoggedIn = !!student || !!admin;
```

---

### Authentication Pages

#### Login Page (`app/(auth)/login/page.tsx`)

**Features**:
- **Dual-tab interface**: Student/Admin switcher
- **Separate forms**: Independent state for each role
- **Real-time validation**: Email, password validation
- **Error handling**: Per-form error messages

**State Management**:
```typescript
const [activeTab, setActiveTab] = useState<"student" | "admin">("student");
const [studentEmail, setStudentEmail] = useState("");
const [studentPassword, setStudentPassword] = useState("");
const [adminEmail, setAdminEmail] = useState("");
const [adminPassword, setAdminPassword] = useState("");
```

**Validation**:
- Email: Regex pattern, required
- Password: Min 6 characters, required

#### Signup Page (`app/(auth)/signup/page.tsx`)

**Features**:
- **Student-only registration**
- **Progressive validation**: Shows errors on blur
- **Password strength indicator**: Visual feedback
- **Comprehensive validation**:
  - Name: 2-50 chars, letters only
  - Email: Valid format, max 100 chars
  - Password: 8+ chars, uppercase, lowercase, number

**Validation State**:
```typescript
interface ValidationErrors {
  name?: string;
  email?: string;
  password?: string;
}
const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
```

---

### Student Pages

#### Dashboard (`app/(student)/dashboard/page.tsx`)

**Layout**:
1. **Header**: Welcome message, profile/logout buttons
2. **Stats Row**: 3 cards (Available Quizzes, Total Attempts, Avg Score)
3. **Quiz Grid**: Published quizzes with attempt info
4. **Recent Attempts Table**: Last 10 attempts

**Data Loading**:
```typescript
const [quizzes, setQuizzes] = useState<Quiz[]>([]);
const [attempts, setAttempts] = useState<MyAttempt[]>([]);

useEffect(() => {
  const loadData = async () => {
    const [quizData, attemptData] = await Promise.all([
      getQuizzes(),
      getMyAttempts(),
    ]);
    setQuizzes(quizData);
    setAttempts(attemptData);
  };
  loadData();
}, [student]);
```

**Quiz Card Features**:
- Best score display
- Attempt count
- Tags and time limit
- "Start Quiz" or "Retake Quiz" button

#### Profile Page (`app/(student)/profile/page.tsx`)

**Sections**:
1. **Account Info**: Avatar, name, email
2. **Stats Grid**: 4 cards (Total Attempts, Quizzes Taken, Avg Score, Best Score)
3. **Overall Accuracy**: Progress bar with percentage
4. **Attempt History**: Full table of all attempts

**Computed Stats**:
```typescript
const uniqueQuizzes = new Set(attempts.map(a => a.quiz.id)).size;
const avgScore = Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length);
const bestScore = Math.max(...attempts.map(a => a.percentage));
const totalCorrect = attempts.reduce((sum, a) => sum + a.score, 0);
const totalQuestions = attempts.reduce((sum, a) => sum + a.totalQuestions, 0);
```


#### Quiz Detail Page (`app/(student)/quiz/[id]/page.tsx`)

**Purpose**: Preview quiz before starting

**Sections**:
1. **Header**: Quiz title, description, back button
2. **Quiz Overview Card**:
   - Stats: Question count, time limit, attempt count
   - Tags display
   - Best score (if attempted)
   - Start/Retake button
3. **Previous Attempts Table**: User's attempt history for this quiz

**Data Loading**:
```typescript
const [quiz, setQuiz] = useState<Quiz | null>(null);
const [questions, setQuestions] = useState<Question[]>([]);
const [attempts, setAttempts] = useState<MyAttempt[]>([]);

useEffect(() => {
  const loadData = async () => {
    const [quizData, questionData, attemptData] = await Promise.all([
      getQuiz(quizId),
      getQuestions(quizId),
      getMyAttempts(),
    ]);
    setQuiz(quizData);
    setQuestions(questionData);
    setAttempts(attemptData.filter(a => a.quiz.id === quizId));
  };
  loadData();
}, [quizId]);
```

#### Quiz Attempt Page (`app/(student)/quiz/[id]/attempt/page.tsx`)

**Purpose**: Take the quiz with timer and question navigation

**Layout**:
- **Top Bar**: Quiz title, question progress, timer, answered count
- **Main Area**: Current question with options
- **Sidebar**: Question navigator grid (desktop)
- **Navigation**: Previous/Next/Submit buttons

**State Management**:
```typescript
const [questions, setQuestions] = useState<Question[]>([]);
const [answers, setAnswers] = useState<(number | null)[]>([]);
const [currentIndex, setCurrentIndex] = useState(0);
const [timeLeft, setTimeLeft] = useState<number | null>(null);
const [showConfirm, setShowConfirm] = useState(false);
```

**Timer Logic**:
```typescript
useEffect(() => {
  if (timeLeft === null || timeLeft <= 0) return;
  
  const timer = setInterval(() => {
    setTimeLeft(prev => prev === null ? null : prev - 1);
  }, 1000);
  
  return () => clearInterval(timer);
}, [timeLeft]);

// Auto-submit on timer expiry
useEffect(() => {
  if (timeLeft === 0 && !hasSubmittedRef.current) {
    handleSubmit();
  }
}, [timeLeft, handleSubmit]);
```

**Features**:
- Real-time timer with color coding (red < 60s, yellow < 5min)
- Question navigator with answered/unanswered indicators
- Confirmation dialog before submit
- Warning for unanswered questions
- Browser unload warning

#### Result Page (`app/(student)/quiz/[id]/result/[attemptId]/page.tsx`)

**Purpose**: Display quiz results with score breakdown

**Sections**:
1. **Header**: Navigation buttons
2. **Score Summary Card**:
   - Grade label (Excellent, Great Job, etc.)
   - Percentage score (large display)
   - Correct/Wrong breakdown
   - Visual progress bar
   - Completion timestamp
3. **Action Buttons**: Dashboard, Quiz Details, Retake

**Grade Calculation**:
```typescript
function gradeLabel(percentage: number) {
  if (percentage >= 90) return { label: "Excellent!", color: "text-green-600" };
  if (percentage >= 70) return { label: "Great Job!", color: "text-green-600" };
  if (percentage >= 50) return { label: "Good Effort", color: "text-yellow-600" };
  if (percentage >= 30) return { label: "Needs Improvement", color: "text-orange-600" };
  return { label: "Keep Practicing", color: "text-red-600" };
}
```

---

### Admin Pages

#### Admin Dashboard (`app/(admin)/admin/page.tsx`)

**Features**:
- **Login Form**: Shows if not authenticated
- **Quiz Management Table**: List all quizzes
- **Create Quiz Dialog**: Modal form
- **Actions**: Edit, Attempts, Publish/Unpublish, Delete

**Create Quiz Dialog**:
```typescript
const [dialogOpen, setDialogOpen] = useState(false);
const [newTitle, setNewTitle] = useState("");
const [newDescription, setNewDescription] = useState("");
const [newTimeLimit, setNewTimeLimit] = useState("");
const [newTags, setNewTags] = useState("");
```

**Quiz Table Columns**:
- Title
- Status (Published/Draft badge)
- Time limit
- Tags
- Actions (Edit, Attempts, Publish, Delete)


#### Create Quiz Page (`app/(admin)/admin/quiz/new/page.tsx`)

**Purpose**: Create new quiz with metadata

**Form Fields**:
- **Title** (required): 3-100 characters
- **Description** (optional): Max 500 characters
- **Time Limit** (optional): 0-1440 minutes
- **Question Limit** (required): 1-30 questions per attempt
- **Tags** (optional): Comma-separated, max 10 tags

**Validation**:
```typescript
interface ValidationErrors {
  title?: string;
  description?: string;
  timeLimit?: string;
  tags?: string;
  questionLimit?: string;
}

const validateTitle = (title: string): string | undefined => {
  if (!title.trim()) return "Title is required";
  if (title.trim().length < 3) return "Title must be at least 3 characters";
  if (title.trim().length > 100) return "Title must not exceed 100 characters";
  return undefined;
};
```

**Progressive Validation**:
- Validates on blur
- Shows character count
- Real-time error messages

#### Edit Quiz Page (`app/(admin)/admin/quiz/[id]/page.tsx`)

**Purpose**: Comprehensive quiz editor with AI generation

**Sections**:

##### 1. AI Question Generator (Top, Highlighted)
**Features**:
- **Topic Input**: Generate questions on any topic
- **Count Selector**: 1-10 questions
- **Test AI Button**: Verify AI connection
- **Generate Button**: Create questions
- **Bulk Add**: Add all generated questions at once

**State**:
```typescript
const [topic, setTopic] = useState("");
const [count, setCount] = useState(5);
const [aiLoading, setAiLoading] = useState(false);
const [aiQuestions, setAiQuestions] = useState<GeneratedQuestion[]>([]);
```

**AI Generation Flow**:
```typescript
const handleGenerate = async () => {
  setAiLoading(true);
  try {
    const data = await generateQuestions(quizId, topic, count);
    setAiQuestions(data);
  } catch (err) {
    setAiError(err.message);
  } finally {
    setAiLoading(false);
  }
};
```

**Generated Question Display**:
- Question text
- All options (correct one highlighted)
- Explanation
- Individual "Add to quiz" button
- Bulk "Add All" button

##### 2. Quiz Details Card
**Editable Fields**:
- Title
- Description
- Time limit
- Question limit
- Tags

**Actions**:
- Save quiz
- Publish/Unpublish
- Delete quiz

##### 3. Questions Management
**Features**:
- **Question Table**: List all questions with order
- **Add/Edit Form**: Inline question editor
- **Fields**:
  - Question text
  - 4 options
  - Correct option selector
  - Order number
  - Explanation

**Question Form State**:
```typescript
const [questionForm, setQuestionForm] = useState({
  questionText: "",
  options: ["", "", "", ""],
  correctIndex: 0,
  explanation: "",
  order: 0,
});
const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
```

#### Attempts Analytics Page (`app/(admin)/admin/quiz/[id]/attempts/page.tsx`)

**Purpose**: View all student attempts with analytics

**Sections**:

##### 1. Summary Stats (6 Cards)
- Total Attempts
- Unique Students
- Average Score
- Highest Score
- Lowest Score
- Pass Rate (≥50%)

##### 2. Score Distribution Chart
**Ranges**:
- 90-100% (Green)
- 70-89% (Light Green)
- 50-69% (Yellow)
- 30-49% (Orange)
- 0-29% (Red)

**Visualization**:
```typescript
const distribution = [
  { label: "90-100%", count: 0, color: "bg-green-500" },
  { label: "70-89%", count: 0, color: "bg-green-400" },
  // ... etc
];

// Horizontal bar chart with percentage width
<div style={{ width: `${(count / maxCount) * 100}%` }} />
```

##### 3. Attempts Table
**Columns**:
- # (Index)
- Student Name
- Email
- Score (X/Y)
- Percentage (color-coded)
- Completion Date

**Computed Stats**:
```typescript
const totalAttempts = attempts.length;
const avgScore = Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / totalAttempts);
const uniqueStudents = new Set(attempts.map(a => a.user.id)).size;
const passCount = attempts.filter(a => a.percentage >= 50).length;
const passRate = Math.round((passCount / totalAttempts) * 100);
```


---

## Shared Components

### Navbar (`components/navbar.tsx`)

**Purpose**: Global navigation with auth-aware UI

**Features**:
- **Logo**: Links to homepage
- **Desktop Nav**: Home, Dashboard, Profile, Admin Panel (role-based)
- **Mobile Menu**: Hamburger with slide-in menu
- **Profile Dropdown**: Avatar, user info, navigation, logout
- **Scroll Effect**: Backdrop blur on scroll

**State**:
```typescript
const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
const [profileOpen, setProfileOpen] = useState(false);
const [scrolled, setScrolled] = useState(false);
```

**Auth Integration**:
```typescript
const { student, logout: studentLogout } = useStudentAuth();
const { admin, logout: adminLogout } = useAdminAuth();
const isLoggedIn = !!student || !!admin;
const userName = student?.name || admin?.name || admin?.email || "";
const userRole = admin ? "admin" : "student";
```

**Profile Dropdown**:
- User avatar (initial)
- Name and email
- Role badge
- Navigation links (role-specific)
- Sign out button

**Mobile Menu**:
- Slide-in animation
- Full navigation
- Auth buttons (if not logged in)
- Close on navigation

### Footer (`components/footer.tsx`)

**Purpose**: Site-wide footer with links

**Sections**:
1. **Brand**: Logo and tagline
2. **Platform Links**: Dashboard, Take Quiz, Profile
3. **Admin Links**: Admin Panel, Create Quiz
4. **Account Links**: Login, Signup

**Bottom Bar**:
- Copyright notice
- Tech stack badge
- Project attribution

### Admin Sidebar (`components/admin-sidebar.tsx`)

**Purpose**: Admin navigation sidebar

**Features**:
- **Collapsible**: Desktop collapse/expand
- **Mobile Overlay**: Full-screen on mobile
- **Navigation Items**:
  - Dashboard
  - Create Quiz
- **User Info**: Admin avatar, email
- **Sign Out**: Bottom button

**State**:
```typescript
const [collapsed, setCollapsed] = useState(false);
```

**Responsive Behavior**:
- Desktop: Fixed sidebar, collapsible
- Mobile: Overlay with backdrop, hamburger trigger

**Active State**:
```typescript
const pathname = usePathname();
const isActive = pathname === item.href;
```

---

## UI Component Library

### Button (`components/ui/button.tsx`)

**Variants**:
- `default`: Primary button (violet gradient)
- `outline`: Border with transparent background
- `secondary`: Secondary color
- `ghost`: No background, hover effect
- `destructive`: Red/destructive action
- `link`: Text link style

**Sizes**:
- `xs`: Extra small (h-6)
- `sm`: Small (h-7)
- `default`: Default (h-8)
- `lg`: Large (h-9)
- `icon`: Square icon button (size-8)
- `icon-xs`, `icon-sm`, `icon-lg`: Icon variants

**Usage**:
```tsx
<Button variant="default" size="lg">
  Click me
</Button>
```

### Card (`components/ui/card.tsx`)

**Components**:
- `Card`: Container
- `CardHeader`: Title area
- `CardTitle`: Bold title
- `CardDescription`: Muted subtitle
- `CardContent`: Main content
- `CardFooter`: Bottom section (with border)
- `CardAction`: Top-right action area

**Sizes**:
- `default`: Standard padding
- `sm`: Compact padding

**Usage**:
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>
```

### Input (`components/ui/input.tsx`)

**Features**:
- Border focus ring
- Error state (aria-invalid)
- Disabled state
- File input styling
- Placeholder styling

**Usage**:
```tsx
<Input
  type="email"
  placeholder="you@example.com"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  className={errors.email ? "border-destructive" : ""}
/>
```


### Table (`components/ui/table.tsx`)

**Components**:
- `Table`: Wrapper with horizontal scroll
- `TableHeader`: Header row container
- `TableBody`: Body rows container
- `TableFooter`: Footer section
- `TableRow`: Individual row
- `TableHead`: Header cell
- `TableCell`: Data cell
- `TableCaption`: Table caption

**Usage**:
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Email</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {data.map(item => (
      <TableRow key={item.id}>
        <TableCell>{item.name}</TableCell>
        <TableCell>{item.email}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### Dialog (`components/ui/dialog.tsx`)

**Components**:
- `Dialog`: Root component
- `DialogTrigger`: Button to open
- `DialogContent`: Modal content
- `DialogHeader`: Title area
- `DialogTitle`: Modal title
- `DialogDescription`: Subtitle
- `DialogFooter`: Action buttons

**Usage**:
```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
    <DialogFooter>
      <Button type="submit">Submit</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Skeleton (`components/ui/skeleton.tsx`)

**Purpose**: Loading placeholder

**Usage**:
```tsx
<Skeleton className="h-8 w-48" />
<Skeleton className="h-32 w-full" />
```

### Dropdown Menu (`components/ui/dropdown-menu.tsx`)

**Components**:
- `DropdownMenu`: Root
- `DropdownMenuTrigger`: Button
- `DropdownMenuContent`: Menu container
- `DropdownMenuItem`: Menu item
- `DropdownMenuSeparator`: Divider

**Usage**:
```tsx
<DropdownMenu>
  <DropdownMenuTrigger>
    <Button>Menu</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={handleAction}>
      Action
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Avatar (`components/ui/avatar.tsx`)

**Components**:
- `Avatar`: Container
- `AvatarImage`: Image element
- `AvatarFallback`: Fallback text/icon

**Usage**:
```tsx
<Avatar>
  <AvatarImage src={user.avatar} alt={user.name} />
  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
</Avatar>
```

---

## Styling & Design System

### Color Palette

**Brand Colors**:
- Primary: Violet (600) to Indigo (600) gradient
- Secondary: Muted gray tones
- Accent: Violet/Indigo highlights

**Semantic Colors**:
- Success: Green (600/400)
- Warning: Yellow (600/400)
- Error: Red (600/400)
- Info: Blue (600/400)

**Status Colors**:
- Published: Emerald (green)
- Draft: Amber (yellow)
- Pass (≥70%): Green
- Moderate (40-69%): Yellow
- Fail (<40%): Red

### Typography

**Fonts**:
- Sans: Geist Sans (primary)
- Mono: Geist Mono (code)

**Scale**:
- `text-xs`: 0.75rem
- `text-sm`: 0.875rem
- `text-base`: 1rem
- `text-lg`: 1.125rem
- `text-xl`: 1.25rem
- `text-2xl`: 1.5rem
- `text-3xl`: 1.875rem
- `text-4xl`: 2.25rem
- `text-5xl`: 3rem

**Weights**:
- `font-normal`: 400
- `font-medium`: 500
- `font-semibold`: 600
- `font-bold`: 700
- `font-extrabold`: 800

### Spacing

**Padding/Margin Scale**:
- `p-1`: 0.25rem (4px)
- `p-2`: 0.5rem (8px)
- `p-3`: 0.75rem (12px)
- `p-4`: 1rem (16px)
- `p-6`: 1.5rem (24px)
- `p-8`: 2rem (32px)
- `p-10`: 2.5rem (40px)

### Border Radius

- `rounded-lg`: 0.5rem (8px)
- `rounded-xl`: 0.75rem (12px)
- `rounded-2xl`: 1rem (16px)
- `rounded-full`: 9999px (circle)

### Shadows

- `shadow-sm`: Small shadow
- `shadow-md`: Medium shadow
- `shadow-lg`: Large shadow
- `shadow-xl`: Extra large shadow
- `shadow-2xl`: 2X large shadow

### Gradients

**Primary Gradient**:
```css
bg-gradient-to-r from-violet-600 to-indigo-600
```

**Background Gradients**:
```css
bg-gradient-to-br from-violet-50 via-white to-indigo-50
dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950/30
```


### Responsive Breakpoints

```css
sm: 640px   /* Small devices */
md: 768px   /* Medium devices */
lg: 1024px  /* Large devices */
xl: 1280px  /* Extra large devices */
2xl: 1536px /* 2X large devices */
```

**Usage**:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* Responsive grid */}
</div>
```

### Dark Mode

**Implementation**: CSS variables with `dark:` prefix

**Example**:
```tsx
<div className="bg-white text-gray-900 dark:bg-gray-900 dark:text-white">
  Content
</div>
```

**Color Variables**:
- `background`: Page background
- `foreground`: Primary text
- `card`: Card background
- `card-foreground`: Card text
- `muted`: Muted background
- `muted-foreground`: Muted text
- `border`: Border color
- `input`: Input background
- `ring`: Focus ring color

---

## State Management Patterns

### Local State (useState)

**Used for**:
- Form inputs
- UI toggles (modals, dropdowns)
- Loading states
- Error messages

**Example**:
```typescript
const [email, setEmail] = useState("");
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

### Context State (useContext)

**Used for**:
- Authentication state
- User data
- Cross-component state

**Example**:
```typescript
const { student, loading, login, logout } = useStudentAuth();
```

### Server State (useEffect + fetch)

**Used for**:
- API data fetching
- Data synchronization

**Pattern**:
```typescript
const [data, setData] = useState<Data[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchData();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  loadData();
}, [dependency]);
```

### Form State Management

**Pattern**:
```typescript
// Form values
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");

// Validation
const [errors, setErrors] = useState<ValidationErrors>({});
const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

// Handlers
const handleEmailChange = (value: string) => {
  setEmail(value);
  if (touched.email) {
    const error = validateEmail(value);
    setErrors(prev => ({ ...prev, email: error }));
  }
};

const handleBlur = (field: string) => {
  setTouched(prev => ({ ...prev, [field]: true }));
  // Validate field
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  // Mark all as touched
  setTouched({ email: true, password: true });
  // Validate all
  const errors = validateAll();
  if (Object.keys(errors).length > 0) {
    setErrors(errors);
    return;
  }
  // Submit
  await submitForm();
};
```

### Timer State Management

**Pattern** (Quiz Attempt):
```typescript
const [timeLeft, setTimeLeft] = useState<number | null>(null);
const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
const hasSubmittedRef = useRef(false);

// Initialize timer
useEffect(() => {
  if (quiz.timeLimit) {
    setTimeLeft(quiz.timeLimit * 60);
  }
}, [quiz]);

// Countdown
useEffect(() => {
  if (timeLeft === null || timeLeft <= 0) return;
  
  timerRef.current = setInterval(() => {
    setTimeLeft(prev => prev === null ? null : prev - 1);
  }, 1000);
  
  return () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };
}, [timeLeft]);

// Auto-submit
useEffect(() => {
  if (timeLeft === 0 && !hasSubmittedRef.current) {
    handleSubmit();
  }
}, [timeLeft, handleSubmit]);
```

---

## API Integration

### API Client Functions

Located in `lib/api/`:

#### Auth API (`lib/api/auth.ts`)
```typescript
export async function loginStudent(email: string, password: string): Promise<AuthResponse>
export async function loginAdmin(email: string, password: string): Promise<AuthResponse>
export async function registerStudent(name: string, email: string, password: string): Promise<AuthResponse>
export async function logout(): Promise<void>
export async function getCurrentUser(): Promise<User | null>
```

#### Quiz API (`lib/api/quizzes.ts`)
```typescript
export async function getQuizzes(): Promise<Quiz[]>
export async function getQuiz(id: string): Promise<Quiz>
export async function createQuiz(data: CreateQuizInput): Promise<Quiz>
export async function updateQuiz(id: string, data: UpdateQuizInput): Promise<Quiz>
export async function deleteQuiz(id: string): Promise<void>
export async function togglePublish(id: string, isPublished: boolean): Promise<Quiz>
export async function getQuestions(quizId: string): Promise<Question[]>
export async function createQuestion(quizId: string, data: CreateQuestionInput): Promise<Question>
export async function updateQuestion(quizId: string, questionId: string, data: UpdateQuestionInput): Promise<Question>
export async function deleteQuestion(quizId: string, questionId: string): Promise<void>
export async function generateQuestions(quizId: string, topic: string, count: number): Promise<GeneratedQuestion[]>
```

#### Attempt API (`lib/api/attempts.ts`)
```typescript
export async function getMyAttempts(): Promise<MyAttempt[]>
export async function getQuizAttempts(quizId: string): Promise<QuizAttempt[]>
export async function getAttemptSummary(attemptId: string): Promise<AttemptSummary>
export async function submitAttempt(quizId: string, answers: number[], questionIds: string[]): Promise<AttemptResult>
```

### API Call Pattern

```typescript
// 1. Set loading state
setLoading(true);
setError(null);

try {
  // 2. Make API call
  const data = await apiFunction(params);
  
  // 3. Update state with data
  setData(data);
} catch (err) {
  // 4. Handle error
  const message = err instanceof Error ? err.message : "An error occurred";
  setError(message);
} finally {
  // 5. Clear loading state
  setLoading(false);
}
```

### Error Handling

**Pattern**:
```typescript
try {
  await apiCall();
} catch (err) {
  if (err instanceof Error) {
    setError(err.message);
  } else {
    setError("An unexpected error occurred");
  }
}
```

**Display**:
```tsx
{error && (
  <p className="text-sm text-destructive">{error}</p>
)}
```


---

## Migration Checklist

### Pre-Migration Assessment

- [ ] Review all page components and their dependencies
- [ ] Document custom hooks and utilities
- [ ] List all API endpoints used
- [ ] Identify third-party dependencies
- [ ] Note environment variables required

### Component Migration

#### Phase 1: Foundation
- [ ] Set up new project with Next.js 14
- [ ] Install dependencies (Tailwind, TypeScript, etc.)
- [ ] Configure Tailwind with design tokens
- [ ] Set up folder structure
- [ ] Create root layout and providers

#### Phase 2: UI Components
- [ ] Migrate Button component
- [ ] Migrate Card component
- [ ] Migrate Input component
- [ ] Migrate Table component
- [ ] Migrate Dialog component
- [ ] Migrate Dropdown Menu component
- [ ] Migrate Skeleton component
- [ ] Migrate Avatar component

#### Phase 3: Shared Components
- [ ] Migrate Navbar component
- [ ] Migrate Footer component
- [ ] Migrate Admin Sidebar component

#### Phase 4: Context & Auth
- [ ] Set up StudentAuthContext
- [ ] Set up AdminAuthContext
- [ ] Implement auth guards
- [ ] Test cross-tab synchronization

#### Phase 5: Public Pages
- [ ] Migrate Landing page
- [ ] Migrate Login page
- [ ] Migrate Signup page

#### Phase 6: Student Pages
- [ ] Migrate Dashboard page
- [ ] Migrate Profile page
- [ ] Migrate Quiz Detail page
- [ ] Migrate Quiz Attempt page
- [ ] Migrate Result page

#### Phase 7: Admin Pages
- [ ] Migrate Admin Dashboard
- [ ] Migrate Create Quiz page
- [ ] Migrate Edit Quiz page
- [ ] Migrate Attempts Analytics page

#### Phase 8: API Integration
- [ ] Set up API client functions
- [ ] Test all API endpoints
- [ ] Implement error handling
- [ ] Add loading states

#### Phase 9: Testing & Polish
- [ ] Test all user flows
- [ ] Test responsive design
- [ ] Test dark mode
- [ ] Test authentication flows
- [ ] Test timer functionality
- [ ] Test AI generation
- [ ] Optimize performance
- [ ] Add accessibility features

### Post-Migration Verification

- [ ] All routes accessible
- [ ] Authentication working
- [ ] Quiz creation working
- [ ] Quiz taking working
- [ ] Results display correctly
- [ ] Admin analytics working
- [ ] AI generation working
- [ ] Mobile responsive
- [ ] Dark mode working
- [ ] Cross-browser testing

---

## Key Patterns & Best Practices

### 1. Loading States

**Always show loading UI**:
```tsx
if (loading) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}
```

### 2. Error Handling

**Display errors prominently**:
```tsx
{error && (
  <Card>
    <CardContent className="py-6">
      <p className="text-sm text-destructive">{error}</p>
      <Button variant="outline" className="mt-2" onClick={retry}>
        Retry
      </Button>
    </CardContent>
  </Card>
)}
```

### 3. Empty States

**Provide helpful empty states**:
```tsx
{items.length === 0 && (
  <div className="py-12 text-center">
    <div className="mx-auto h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
      <Icon />
    </div>
    <p className="mt-4 font-semibold">No items yet</p>
    <p className="mt-1 text-sm text-muted-foreground">
      Get started by creating your first item.
    </p>
    <Button className="mt-4" onClick={onCreate}>
      Create Item
    </Button>
  </div>
)}
```

### 4. Confirmation Dialogs

**Confirm destructive actions**:
```tsx
const handleDelete = async () => {
  if (!confirm("Are you sure? This action cannot be undone.")) {
    return;
  }
  await deleteItem();
};
```

### 5. Optimistic Updates

**Update UI before API response**:
```tsx
const handleToggle = async (item: Item) => {
  // Optimistic update
  setItems(prev => prev.map(i => 
    i.id === item.id ? { ...i, active: !i.active } : i
  ));
  
  try {
    await toggleItem(item.id);
  } catch (err) {
    // Revert on error
    setItems(prev => prev.map(i => 
      i.id === item.id ? { ...i, active: item.active } : i
    ));
    setError(err.message);
  }
};
```

### 6. Debouncing

**Debounce search inputs**:
```typescript
const [searchTerm, setSearchTerm] = useState("");
const [debouncedTerm, setDebouncedTerm] = useState("");

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedTerm(searchTerm);
  }, 300);
  
  return () => clearTimeout(timer);
}, [searchTerm]);

useEffect(() => {
  if (debouncedTerm) {
    performSearch(debouncedTerm);
  }
}, [debouncedTerm]);
```

### 7. Accessibility

**Always include**:
- `aria-label` for icon buttons
- `alt` text for images
- Keyboard navigation support
- Focus management
- Screen reader announcements

**Example**:
```tsx
<button
  onClick={handleClick}
  aria-label="Close dialog"
  className="..."
>
  <CloseIcon />
</button>
```

### 8. Performance

**Optimize re-renders**:
```typescript
// Use useCallback for functions passed as props
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);

// Use useMemo for expensive computations
const sortedItems = useMemo(() => {
  return items.sort((a, b) => a.name.localeCompare(b.name));
}, [items]);
```

---

## Conclusion

This document provides a complete reference for the QuizMaster frontend architecture. Use it as a guide for:

- **Onboarding**: New developers can understand the entire structure
- **Migration**: Moving to a new framework or updating dependencies
- **Maintenance**: Understanding component relationships and patterns
- **Feature Development**: Following established patterns and conventions

For questions or updates, refer to the source code in the `app/`, `components/`, and `context/` directories.

---

**Document Version**: 1.0  
**Last Updated**: 2026-05-30  
**Maintained By**: Development Team
