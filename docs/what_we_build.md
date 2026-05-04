## WHAT BUILD

**Domain: EdTech** — they literally ARE an EdTech company. Build something for their world. Smart move = impress with domain relevance.

**Best idea: AI-Powered Quiz & Assessment Platform**

Why: EdTech-relevant, non-CRUD-basic, AI optional feature built-in, CRUD ops natural, real users exist.

---

## CORE FEATURES (mandatory)

| Feature | What |
|---|---|
| Auth | JWT signup/login, role-based (student/teacher) |
| Quiz CRUD | Teacher create/edit/delete quizzes + questions |
| Attempt CRUD | Student attempt quiz, save answers, view results |
| Dashboard | Teacher see stats, student see history |
| AI Add-on | Auto-generate questions from topic using Groq/Gemini API |

---

## TECH STACK

```
Next.js 15/16 (App Router) + TypeScript
MongoDB (Mongoose) — flexible for quiz schema
Tailwind CSS + shadcn/ui
JWT auth (NextAuth or custom)
Groq API (free, fast) — AI question generator
Vercel — deploy
```

---

## WHAT NOT BUILD

❌ To-do list  
❌ Basic blog CRUD  
❌ Simple user management  
❌ Anything with no real domain logic  
❌ Overcomplicate — no microservices, no GraphQL, no overkill  

---

## FOLDER STRUCTURE (App Router)

```
/app
  /api
    /auth/[...] 
    /quiz/[id]/route.ts
    /attempt/route.ts
    /ai/generate/route.ts
  /(auth)/login, signup
  /(dashboard)/teacher, student
  /quiz/[id]/attempt
/components
/lib (db, auth, validators)
/models (Quiz, User, Attempt)
```

---

## DB SCHEMA (MongoDB)

```
User: { name, email, password(hashed), role: "teacher"|"student" }

Quiz: { title, description, createdBy(ref User), questions: [{
  question, options: [4], correctIndex, explanation
}], isPublished, tags }

Attempt: { quizId, userId, answers: [int], score, completedAt }
```

---

## AI FEATURE (Groq — free tier)

Teacher types topic → API call to Groq → returns 5 MCQs → teacher review/edit → save to quiz. This = killer differentiator.

---

## TIMELINE (4 days)

```
Day 1: Setup, auth, DB models
Day 2: Quiz CRUD (teacher side)
Day 3: Student attempt + results + dashboard
Day 4: AI feature + UI polish + deploy Vercel
```

---

## EVALUATION CHECKLIST

✅ CRUD ops — quiz + attempts  
✅ Auth + role-based access  
✅ TypeScript throughout  
✅ Tailwind + shadcn  
✅ MongoDB  
✅ Deployed on Vercel  
✅ AI add-on (Groq question gen)  
✅ Footer — your name + GitHub + LinkedIn  
✅ Clean code, no console.log clutter  

---

## SECRET WEAPON

Footer already required by them. Put your GitHub (`BuddhadebKoner`) + LinkedIn + `buddhadebkoner.in` there — they WILL check.