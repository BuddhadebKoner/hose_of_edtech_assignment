# Software Requirements Specification
## EdTech Quiz & Assessment Platform
**House of Edtech — Fullstack Developer Assignment | v1.0 | May 2026**

---

## 1. System Overview

Full-stack web app — Next.js 16 (App Router) + TypeScript, MongoDB, Tailwind CSS + shadcn/ui.  
One seeded admin manages quizzes. Students self-register, attempt published quizzes, view history in profile.

| Attribute | Value |
|---|---|
| Stack | Next.js 16 + TypeScript, MongoDB, Tailwind CSS + shadcn/ui |
| Auth | JWT in httpOnly cookie — custom, no NextAuth |
| AI Feature | Groq / Gemini API — auto question generation |
| Deployment | Vercel + MongoDB Atlas |
| Roles | `admin` (1 seeded), `student` (self-register) |

---

## 2. User Roles

### 2.1 Admin
Single admin. Seeded in DB at startup — no signup page. Credentials from env vars.

- Create / Edit / Delete quizzes
- Create / Edit / Delete questions inside quizzes
- Publish or unpublish a quiz (toggle)
- AI-generate questions from a topic prompt
- View all student attempts for any quiz

### 2.2 Student
- Self-register with name + email + password only
- Login with email + password
- Browse currently published quizzes
- Attempt any published quiz
- View personal attempt history + scores in profile

---

## 3. Data Models (MongoDB / Mongoose)

### 3.1 User
```
collection: users
```

| Field | Type | Constraints | Notes |
|---|---|---|---|
| _id | ObjectId | auto | Primary key |
| name | String | required, trim | Display name |
| email | String | required, unique, lowercase | Login identifier |
| password | String | required, bcrypt hashed | Min 8 chars before hash |
| role | String | enum: `admin` \| `student`, default: `student` | Admin seeded only |
| createdAt | Date | auto | Mongoose timestamps |
| updatedAt | Date | auto | Mongoose timestamps |

```ts
// models/User.ts
import mongoose, { Schema, Document } from 'mongoose'

export interface IUser extends Document {
  name: string
  email: string
  password: string
  role: 'admin' | 'student'
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'student'], default: 'student' }
}, { timestamps: true })

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
```

---

### 3.2 Quiz
```
collection: quizzes
```

| Field | Type | Constraints | Notes |
|---|---|---|---|
| _id | ObjectId | auto | Primary key |
| title | String | required, trim | Quiz title |
| description | String | optional | Short summary |
| createdBy | ObjectId ref User | required | Always admin |
| isPublished | Boolean | default: false | Controls student visibility |
| timeLimit | Number | optional, minutes | 0 = no limit |
| tags | [String] | optional | Topic tags |
| createdAt / updatedAt | Date | auto | Mongoose timestamps |

```ts
// models/Quiz.ts
import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IQuiz extends Document {
  title: string
  description?: string
  createdBy: Types.ObjectId
  isPublished: boolean
  timeLimit?: number
  tags?: string[]
}

const QuizSchema = new Schema<IQuiz>({
  title: { type: String, required: true, trim: true },
  description: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  isPublished: { type: Boolean, default: false },
  timeLimit: { type: Number, default: 0 },
  tags: [{ type: String }]
}, { timestamps: true })

export default mongoose.models.Quiz || mongoose.model<IQuiz>('Quiz', QuizSchema)
```

---

### 3.3 Question
```
collection: questions
```
Separated from Quiz for easier CRUD and AI generation.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| _id | ObjectId | auto | Primary key |
| quizId | ObjectId ref Quiz | required, indexed | Parent quiz |
| questionText | String | required | The question body |
| options | [String] | required, length: 4 | Always 4 choices |
| correctIndex | Number | required, 0–3 | Index of correct option |
| explanation | String | optional | Post-submit explanation |
| order | Number | default: 0 | Display order |
| createdAt / updatedAt | Date | auto | Mongoose timestamps |

```ts
// models/Question.ts
import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IQuestion extends Document {
  quizId: Types.ObjectId
  questionText: string
  options: string[]
  correctIndex: number
  explanation?: string
  order: number
}

const QuestionSchema = new Schema<IQuestion>({
  quizId: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
  questionText: { type: String, required: true },
  options: { type: [String], required: true, validate: (v: string[]) => v.length === 4 },
  correctIndex: { type: Number, required: true, min: 0, max: 3 },
  explanation: { type: String },
  order: { type: Number, default: 0 }
}, { timestamps: true })

export default mongoose.models.Question || mongoose.model<IQuestion>('Question', QuestionSchema)
```

---

### 3.4 Attempt
```
collection: attempts
```

| Field | Type | Constraints | Notes |
|---|---|---|---|
| _id | ObjectId | auto | Primary key |
| quizId | ObjectId ref Quiz | required, indexed | Which quiz |
| userId | ObjectId ref User | required, indexed | Which student |
| answers | [Number] | required | Selected option index per question |
| score | Number | required | Correct count |
| totalQuestions | Number | required | Snapshot at submit time |
| percentage | Number | required | score/total * 100 |
| completedAt | Date | default: now | Submission timestamp |

```ts
// models/Attempt.ts
import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IAttempt extends Document {
  quizId: Types.ObjectId
  userId: Types.ObjectId
  answers: number[]
  score: number
  totalQuestions: number
  percentage: number
  completedAt: Date
}

const AttemptSchema = new Schema<IAttempt>({
  quizId: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  answers: [{ type: Number, required: true }],
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  percentage: { type: Number, required: true },
  completedAt: { type: Date, default: Date.now }
})

export default mongoose.models.Attempt || mongoose.model<IAttempt>('Attempt', AttemptSchema)
```

---

## 4. API Routes

All routes under `/api`. Auth via JWT in httpOnly cookie. Role enforced in `middleware.ts`.

### 4.1 Auth Routes

| Method | Route | Access | Body | Response |
|---|---|---|---|---|
| POST | `/api/auth/register` | Public | `{ name, email, password }` | 201 user obj (no password) |
| POST | `/api/auth/login` | Public | `{ email, password }` | 200 + set httpOnly JWT cookie |
| POST | `/api/auth/logout` | Auth | none | 200 + clear cookie |
| GET | `/api/auth/me` | Auth | none | 200 current user obj |

**Register validation (Zod):**
```ts
z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8)
})
```

**Login logic:**
1. Find user by email
2. bcrypt.compare(password, user.password)
3. Sign JWT `{ userId, role, email }` expiry 7d
4. Set cookie `__quiz_token` — httpOnly, Secure, SameSite=Strict, Path=/

---

### 4.2 Quiz Routes

| Method | Route | Access | Notes |
|---|---|---|---|
| GET | `/api/quizzes` | Student + Admin | Students see `isPublished: true` only. Admin sees all. |
| POST | `/api/quizzes` | Admin only | Create quiz. `isPublished` defaults false. |
| GET | `/api/quizzes/:id` | Student + Admin | Students blocked if not published → 403. |
| PUT | `/api/quizzes/:id` | Admin only | Update title, desc, timeLimit, tags, isPublished. |
| DELETE | `/api/quizzes/:id` | Admin only | Deletes quiz + all its questions + attempts (cascade). |
| PATCH | `/api/quizzes/:id/publish` | Admin only | Toggle `isPublished` boolean. |

**POST /api/quizzes body:**
```ts
z.object({
  title: z.string().min(3).max(100),
  description: z.string().optional(),
  timeLimit: z.number().min(0).optional(),
  tags: z.array(z.string()).optional()
})
```

---

### 4.3 Question Routes

| Method | Route | Access | Notes |
|---|---|---|---|
| GET | `/api/quizzes/:id/questions` | Student + Admin | `correctIndex` and `explanation` hidden from student response during active attempt. |
| POST | `/api/quizzes/:id/questions` | Admin only | Add single question. |
| PUT | `/api/quizzes/:id/questions/:qid` | Admin only | Edit question text, options, correctIndex, explanation. |
| DELETE | `/api/quizzes/:id/questions/:qid` | Admin only | Remove single question. |
| POST | `/api/quizzes/:id/questions/ai-generate` | Admin only | Send topic to AI → return array for admin preview. Admin saves manually. |

**POST /api/quizzes/:id/questions body:**
```ts
z.object({
  questionText: z.string().min(5),
  options: z.array(z.string()).length(4),
  correctIndex: z.number().min(0).max(3),
  explanation: z.string().optional(),
  order: z.number().optional()
})
```

**POST /api/quizzes/:id/questions/ai-generate body:**
```ts
z.object({
  topic: z.string().min(3),
  count: z.number().min(1).max(10).default(5)
})
```

**AI response schema (JSON returned to admin for review):**
```json
[
  {
    "questionText": "What is photosynthesis?",
    "options": ["A", "B", "C", "D"],
    "correctIndex": 2,
    "explanation": "Because..."
  }
]
```

Admin reviews → clicks Save → POST to `/api/quizzes/:id/questions` per question.

---

### 4.4 Attempt Routes

| Method | Route | Access | Notes |
|---|---|---|---|
| POST | `/api/attempts` | Student only | Submit answers. Body: `{ quizId, answers: [0,2,1,...] }`. Server scores. |
| GET | `/api/attempts/me` | Student only | All attempts by current user. Populated with quiz title. |
| GET | `/api/attempts/:id` | Student (own) \| Admin | Single attempt detail with question + answer breakdown + explanations. |
| GET | `/api/attempts?quizId=x` | Admin only | All attempts for a specific quiz. |

**POST /api/attempts body:**
```ts
z.object({
  quizId: z.string(),
  answers: z.array(z.number())
})
```

**Scoring logic (server-side):**
```ts
const questions = await Question.find({ quizId }).sort({ order: 1 })
const score = questions.reduce((acc, q, i) => 
  answers[i] === q.correctIndex ? acc + 1 : acc, 0)
const percentage = Math.round((score / questions.length) * 100)
```

---

## 5. Authentication & Middleware

### 5.1 JWT Strategy

- Sign: `jwt.sign({ userId, role, email }, JWT_SECRET, { expiresIn: '7d' })`
- Store: httpOnly cookie named `__quiz_token`
- Never exposed to browser JS — XSS safe
- On logout: clear cookie with `maxAge: 0`

### 5.2 middleware.ts (Next.js)

Runs on `/api/*` (except auth) and `/dashboard/*`, `/admin/*`, `/profile/*`, `/quiz/*`.

```ts
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const PUBLIC_PATHS = ['/api/auth/login', '/api/auth/register', '/login', '/signup', '/']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) return NextResponse.next()

  const token = req.cookies.get('__quiz_token')?.value
  if (!token) return redirectOrUnauth(req)

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET))
    const res = NextResponse.next()
    res.headers.set('x-user-id', payload.userId as string)
    res.headers.set('x-user-role', payload.role as string)

    // Admin route guard
    if (pathname.startsWith('/admin') && payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return res
  } catch {
    return redirectOrUnauth(req)
  }
}
```

### 5.3 Admin Seed (lib/seed.ts)

Called from `instrumentation.ts` — runs once on server start.

```ts
export async function seedAdmin() {
  await dbConnect()
  const exists = await User.findOne({ email: process.env.ADMIN_EMAIL })
  if (!exists) {
    const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD!, 12)
    await User.create({
      name: 'Admin',
      email: process.env.ADMIN_EMAIL,
      password: hashed,
      role: 'admin'
    })
    console.log('Admin seeded')
  }
}
```

No admin signup route ever exposed.

---

## 6. Frontend Pages (App Router)

| Route | Who | Description |
|---|---|---|
| `/` | Public | Landing page. Links to login/signup. |
| `/login` | Public | Email + password login form. |
| `/signup` | Public | Name + email + password register form. |
| `/dashboard` | Student | Grid of published quizzes with title, description, question count, time limit. |
| `/quiz/[id]` | Student | Quiz detail + Start button. |
| `/quiz/[id]/attempt` | Student | Question-by-question UI. Timer if `timeLimit > 0`. |
| `/quiz/[id]/result/[attemptId]` | Student | Score %, per-question breakdown, correct answers, explanations. |
| `/profile` | Student | All past attempts — quiz name, score, percentage, date. |
| `/admin` | Admin | Admin dashboard — quiz list, create button, attempt stats. |
| `/admin/quiz/new` | Admin | Create quiz form. |
| `/admin/quiz/[id]` | Admin | Edit quiz + manage questions + AI generate panel. |
| `/admin/quiz/[id]/attempts` | Admin | All student attempts for that quiz. |

---

## 7. Security Checklist

| # | Rule |
|---|---|
| 1 | Passwords: `bcrypt` with `saltRounds: 12` |
| 2 | JWT in httpOnly, Secure, SameSite=Strict cookie — no localStorage |
| 3 | All POST/PUT bodies validated with Zod — 400 on failure |
| 4 | `correctIndex` never sent in student-facing question response during attempt |
| 5 | Attempt ownership check — student cannot fetch another student's attempt |
| 6 | Admin routes return 403 for students — checked in middleware AND route handler |
| 7 | Rate limit on `/api/auth/login` — max 10 req/min per IP |
| 8 | No string interpolation in MongoDB queries — use Mongoose typed queries only |
| 9 | Environment secrets never committed — `.env.local` in `.gitignore` |

---

## 8. Project Folder Structure

```
/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── register/route.ts
│   │   │   ├── login/route.ts
│   │   │   ├── logout/route.ts
│   │   │   └── me/route.ts
│   │   ├── quizzes/
│   │   │   ├── route.ts                        ← GET all, POST create
│   │   │   └── [id]/
│   │   │       ├── route.ts                    ← GET one, PUT, DELETE
│   │   │       ├── publish/route.ts            ← PATCH toggle
│   │   │       └── questions/
│   │   │           ├── route.ts                ← GET all, POST add
│   │   │           ├── [qid]/route.ts          ← PUT, DELETE
│   │   │           └── ai-generate/route.ts    ← POST generate
│   │   └── attempts/
│   │       ├── route.ts                        ← POST submit, GET ?quizId=
│   │       ├── me/route.ts                     ← GET student history
│   │       └── [id]/route.ts                   ← GET single attempt
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (student)/
│   │   ├── dashboard/page.tsx
│   │   ├── quiz/[id]/
│   │   │   ├── page.tsx
│   │   │   ├── attempt/page.tsx
│   │   │   └── result/[attemptId]/page.tsx
│   │   └── profile/page.tsx
│   ├── (admin)/
│   │   └── admin/
│   │       ├── page.tsx
│   │       └── quiz/
│   │           ├── new/page.tsx
│   │           └── [id]/
│   │               ├── page.tsx
│   │               └── attempts/page.tsx
│   └── layout.tsx
├── components/
│   ├── ui/                    ← shadcn components
│   ├── QuizCard.tsx
│   ├── QuestionForm.tsx
│   ├── AttemptCard.tsx
│   └── Navbar.tsx
├── lib/
│   ├── db.ts                  ← mongoose connect
│   ├── jwt.ts                 ← sign / verify helpers
│   ├── seed.ts                ← admin seeder
│   ├── ai.ts                  ← groq/gemini client
│   └── validators.ts          ← zod schemas
├── models/
│   ├── User.ts
│   ├── Quiz.ts
│   ├── Question.ts
│   └── Attempt.ts
├── middleware.ts
├── instrumentation.ts
└── .env.local
```

---

## 9. Environment Variables

```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-32-char-minimum-secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=StrongAdminPass123
GROQ_API_KEY=gsk_...
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

---

## 10. AI Question Generation — Full Flow

```
Admin → types topic + count
  → POST /api/quizzes/:id/questions/ai-generate
    → lib/ai.ts calls Groq API with structured prompt
      → parse JSON response
        → return array to admin UI
          → admin reviews / edits each question
            → admin clicks Save
              → POST /api/quizzes/:id/questions (one per question)
```

**Groq prompt template:**
```ts
const prompt = `
Generate ${count} multiple choice questions about "${topic}".
Return ONLY a JSON array. No markdown. No explanation outside JSON.
Schema:
[{
  "questionText": "string",
  "options": ["string","string","string","string"],
  "correctIndex": 0,
  "explanation": "string"
}]
`
```

---

## 11. Student Quiz Attempt Flow

```
/dashboard → click quiz card
  → /quiz/[id]          (quiz info + question count + time limit)
    → click Start
      → /quiz/[id]/attempt
        → fetch questions (correctIndex stripped server-side)
        → render one question at a time
        → timer countdown if timeLimit > 0
        → on Submit → POST /api/attempts
          → server scores → returns attemptId
            → redirect /quiz/[id]/result/[attemptId]
              → show score, breakdown, correct answers, explanations
```

---

## 12. Out of Scope — Do NOT Build

- No OAuth / social login
- No quiz retake restrictions (v1 allows multiple attempts — just track all)
- No real-time features / WebSockets
- No payment / subscription
- No file / image uploads
- No separate Express server — Next.js API routes only
- No unit tests required

---

## 13. Submission Checklist

- [ ] GitHub repo public with clean commit history
- [ ] Live deployment on Vercel
- [ ] Footer on every page: developer name + GitHub link + LinkedIn link
- [ ] Admin seeded — no manual DB insert needed for evaluator
- [ ] `.env.example` file in repo (no real secrets)
- [ ] README with local setup steps
- [ ] Deadline: **8 May 2026 by 2:00 PM**
- [ ] Submit at: https://forms.gle/KtzGirEkiGFZdZU87

---

*— End of Document —*