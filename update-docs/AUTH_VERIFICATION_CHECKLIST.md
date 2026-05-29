# Authentication System Verification Checklist

Use this checklist to verify the authentication refactor is working correctly.

## 🔧 Pre-Testing Setup

- [ ] Environment variables set in `.env.local`:
  - [ ] `JWT_SECRET` (min 32 characters)
  - [ ] `ADMIN_EMAIL`
  - [ ] `ADMIN_PASSWORD`
  - [ ] `MONGODB_URI`
- [ ] MongoDB running and accessible
- [ ] Dependencies installed (`npm install`)
- [ ] Development server running (`npm run dev`)

## 📝 Database Verification

- [ ] MongoDB connection successful
- [ ] `users` collection exists
- [ ] `admins` collection exists
- [ ] `sessions` collection created (after first login)
- [ ] Session indexes created:
  - [ ] `sessionId` (unique)
  - [ ] `userId + role + isValid` (compound)
  - [ ] `expiresAt` (TTL)

## 🔐 Student Authentication Flow

### Registration
- [ ] Navigate to `/signup`
- [ ] Fill in valid student details
- [ ] Submit registration form
- [ ] ✅ User created in database
- [ ] ✅ Session created in database
- [ ] ✅ JWT cookie set
- [ ] ✅ Redirected to dashboard
- [ ] ✅ User data displayed correctly

### Login
- [ ] Navigate to `/login`
- [ ] Enter valid student credentials
- [ ] Submit login form
- [ ] ✅ Session created in database
- [ ] ✅ JWT cookie set
- [ ] ✅ Redirected to dashboard
- [ ] ✅ User data displayed correctly

### Logout
- [ ] Click logout button
- [ ] ✅ Session invalidated in database
- [ ] ✅ Cookie cleared
- [ ] ✅ Redirected to login page
- [ ] ✅ Cannot access protected routes

## 👨‍💼 Admin Authentication Flow

### Login
- [ ] Navigate to `/admin`
- [ ] Enter admin credentials (from env)
- [ ] Submit login form
- [ ] ✅ Admin seeded if not exists
- [ ] ✅ Session created in database
- [ ] ✅ JWT cookie set
- [ ] ✅ Redirected to admin dashboard
- [ ] ✅ Admin data displayed correctly

### Logout
- [ ] Click logout button
- [ ] ✅ Session invalidated in database
- [ ] ✅ Cookie cleared
- [ ] ✅ Redirected to admin login
- [ ] ✅ Cannot access admin routes

## 🔒 Single Session Enforcement

### Test 1: New Login Invalidates Old Session
- [ ] Login as student in Browser 1
- [ ] Verify dashboard accessible in Browser 1
- [ ] Login as same student in Browser 2
- [ ] ✅ Browser 1 becomes unauthorized
- [ ] ✅ Browser 1 redirected to login on next request
- [ ] ✅ Only one active session in database

### Test 2: Check Database
- [ ] Login as student
- [ ] Check sessions collection
- [ ] ✅ Only 1 active session for this user
- [ ] Login again from different browser
- [ ] Check sessions collection
- [ ] ✅ Previous session has `isValid: false`
- [ ] ✅ New session has `isValid: true`

## 🔄 Cross-Tab Logout Synchronization

### Test 1: Logout Propagation
- [ ] Open app in Tab 1
- [ ] Login as student
- [ ] Open app in Tab 2 (same browser)
- [ ] Verify both tabs show authenticated state
- [ ] Logout in Tab 1
- [ ] ✅ Tab 2 immediately logs out (within 1 second)
- [ ] ✅ Tab 2 redirected to login
- [ ] ✅ Both tabs show logged out state

### Test 2: Multiple Tabs
- [ ] Open app in 5 different tabs
- [ ] Login in Tab 1
- [ ] Verify all tabs show authenticated state
- [ ] Logout in Tab 3
- [ ] ✅ All 5 tabs log out immediately
- [ ] ✅ All tabs redirected to login

### Test 3: Browser Support
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari
- [ ] Test in Edge
- [ ] ✅ Cross-tab logout works in all browsers
- [ ] ✅ Graceful fallback if BroadcastChannel not supported

## 🛡️ Middleware Protection

### Student Routes
- [ ] Logout (ensure not authenticated)
- [ ] Try to access `/dashboard`
- [ ] ✅ Redirected to `/login`
- [ ] Try to access `/profile`
- [ ] ✅ Redirected to `/login`
- [ ] Try to access `/quiz/123`
- [ ] ✅ Redirected to `/login`

### Admin Routes
- [ ] Logout (ensure not authenticated)
- [ ] Try to access `/admin/quiz/new`
- [ ] ✅ Redirected to `/admin`
- [ ] Try to access `/admin/quiz/123`
- [ ] ✅ Redirected to `/admin`

### Cross-Role Access
- [ ] Login as student
- [ ] Try to access `/admin`
- [ ] ✅ Redirected to `/dashboard`
- [ ] Try to access `/admin/quiz/new`
- [ ] ✅ Redirected to `/dashboard`
- [ ] Logout and login as admin
- [ ] Try to access `/dashboard`
- [ ] ✅ Redirected to `/admin`
- [ ] Try to access `/quiz/123`
- [ ] ✅ Redirected to `/admin`

### API Routes
- [ ] Logout (ensure not authenticated)
- [ ] Try to call `/api/quizzes` (GET)
- [ ] ✅ Returns 401 Unauthorized
- [ ] Try to call `/api/attempts` (POST)
- [ ] ✅ Returns 401 Unauthorized
- [ ] Login as student
- [ ] Try to call admin-only API
- [ ] ✅ Returns 403 Forbidden

## 🔑 Session Validation

### Test 1: Invalid Session ID
- [ ] Login as student
- [ ] Get JWT from cookie
- [ ] Manually invalidate session in database:
  ```javascript
  db.sessions.updateOne(
    { sessionId: "..." },
    { $set: { isValid: false } }
  )
  ```
- [ ] Refresh page
- [ ] ✅ Middleware rejects request
- [ ] ✅ Cookie cleared
- [ ] ✅ Redirected to login

### Test 2: Expired Session
- [ ] Login as student
- [ ] Manually set session expiration to past:
  ```javascript
  db.sessions.updateOne(
    { sessionId: "..." },
    { $set: { expiresAt: new Date('2020-01-01') } }
  )
  ```
- [ ] Refresh page
- [ ] ✅ Middleware rejects request
- [ ] ✅ Cookie cleared
- [ ] ✅ Redirected to login

### Test 3: Deleted Session
- [ ] Login as student
- [ ] Delete session from database:
  ```javascript
  db.sessions.deleteOne({ sessionId: "..." })
  ```
- [ ] Refresh page
- [ ] ✅ Middleware rejects request
- [ ] ✅ Cookie cleared
- [ ] ✅ Redirected to login

### Test 4: Tampered JWT
- [ ] Login as student
- [ ] Modify JWT cookie (change sessionId)
- [ ] Refresh page
- [ ] ✅ Middleware rejects request
- [ ] ✅ Cookie cleared
- [ ] ✅ Redirected to login

## 🔐 Security Tests

### Password Security
- [ ] Try to register with weak password
- [ ] ✅ Validation error shown
- [ ] Register with strong password
- [ ] ✅ Password hashed in database (bcrypt)
- [ ] ✅ Cannot see plain password

### Cookie Security
- [ ] Login as student
- [ ] Open browser DevTools
- [ ] Check cookie settings:
  - [ ] ✅ `httpOnly: true`
  - [ ] ✅ `secure: true` (production)
  - [ ] ✅ `sameSite: strict`
  - [ ] ✅ `maxAge: 604800` (7 days)
- [ ] Try to access cookie via JavaScript:
  ```javascript
  document.cookie
  ```
- [ ] ✅ Cannot access httpOnly cookie

### Rate Limiting
- [ ] Try to login with wrong password 10 times
- [ ] ✅ Rate limit triggered
- [ ] ✅ Error message shown
- [ ] ✅ Must wait before trying again

### Role Isolation
- [ ] Login as student
- [ ] Check user object in context
- [ ] ✅ `role: "student"`
- [ ] ✅ Cannot access admin routes
- [ ] ✅ Cannot call admin APIs
- [ ] Logout and login as admin
- [ ] Check user object in context
- [ ] ✅ `role: "admin"`
- [ ] ✅ Cannot access student routes

## 📱 Client-Side Context

### Student Context
- [ ] Login as student
- [ ] Check `useStudentAuth()` hook:
  - [ ] ✅ `student` object populated
  - [ ] ✅ `loading` is false
  - [ ] ✅ `login` function works
  - [ ] ✅ `register` function works
  - [ ] ✅ `logout` function works
  - [ ] ✅ `refresh` function works

### Admin Context
- [ ] Login as admin
- [ ] Check `useAdminAuth()` hook:
  - [ ] ✅ `admin` object populated
  - [ ] ✅ `loading` is false
  - [ ] ✅ `login` function works
  - [ ] ✅ `logout` function works
  - [ ] ✅ `refresh` function works

## 🔄 Server Actions

### Login Actions
- [ ] Call `loginStudentAction(email, password)`
- [ ] ✅ Returns `{ success: true, user: {...} }`
- [ ] ✅ Session created in database
- [ ] ✅ Cookie set
- [ ] Call with wrong password
- [ ] ✅ Returns `{ success: false, error: "..." }`

### Register Action
- [ ] Call `registerStudentAction(name, email, password)`
- [ ] ✅ Returns `{ success: true, user: {...} }`
- [ ] ✅ User created in database
- [ ] ✅ Session created in database
- [ ] ✅ Cookie set

### Logout Action
- [ ] Login first
- [ ] Call `logoutAction()`
- [ ] ✅ Returns `{ success: true }`
- [ ] ✅ Session invalidated in database
- [ ] ✅ Cookie cleared

### Get Current User Action
- [ ] Login first
- [ ] Call `getCurrentUserAction()`
- [ ] ✅ Returns user object
- [ ] Logout
- [ ] Call `getCurrentUserAction()`
- [ ] ✅ Returns null

## 🧪 Edge Cases

### Concurrent Logins
- [ ] Login as student in Browser 1
- [ ] Immediately login as same student in Browser 2
- [ ] ✅ Only one session remains active
- [ ] ✅ Browser 1 becomes unauthorized

### Session Expiration
- [ ] Login as student
- [ ] Wait 7 days (or manually set expiration)
- [ ] Try to access protected route
- [ ] ✅ Session expired
- [ ] ✅ Redirected to login

### Network Errors
- [ ] Disconnect network
- [ ] Try to login
- [ ] ✅ Error handled gracefully
- [ ] ✅ User-friendly error message

### Invalid Input
- [ ] Try to login with invalid email
- [ ] ✅ Validation error
- [ ] Try to register with short password
- [ ] ✅ Validation error
- [ ] Try to register with existing email
- [ ] ✅ Conflict error

## 📊 Database Monitoring

### Session Collection
- [ ] Login as multiple users
- [ ] Check sessions collection:
  - [ ] ✅ One session per user
  - [ ] ✅ All sessions have `isValid: true`
  - [ ] ✅ All sessions have future `expiresAt`
- [ ] Logout one user
- [ ] Check sessions collection:
  - [ ] ✅ That session has `isValid: false`

### TTL Index
- [ ] Create session with past expiration
- [ ] Wait 60 seconds
- [ ] Check sessions collection
- [ ] ✅ Expired session auto-deleted by TTL index

## 🎯 Final Verification

### Complete Flow Test
- [ ] Register new student account
- [ ] ✅ Registration successful
- [ ] ✅ Automatically logged in
- [ ] ✅ Redirected to dashboard
- [ ] Open second tab
- [ ] ✅ Second tab shows authenticated
- [ ] Logout in first tab
- [ ] ✅ Both tabs log out immediately
- [ ] ✅ Both tabs redirected to login
- [ ] Login again
- [ ] ✅ New session created
- [ ] ✅ Old session invalidated
- [ ] Close all tabs
- [ ] Open new tab
- [ ] ✅ Still authenticated (cookie persists)
- [ ] Wait 7 days (or manually expire)
- [ ] ✅ Session expired
- [ ] ✅ Must login again

### Admin Flow Test
- [ ] Login as admin
- [ ] ✅ Admin dashboard accessible
- [ ] ✅ Can create quizzes
- [ ] ✅ Can view attempts
- [ ] Try to access student routes
- [ ] ✅ Blocked by middleware
- [ ] Logout
- [ ] ✅ Session invalidated
- [ ] ✅ Cannot access admin routes

## ✅ Sign-Off

- [ ] All tests passed
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Documentation reviewed
- [ ] Code reviewed
- [ ] Security audit passed
- [ ] Performance acceptable
- [ ] Ready for production

---

**Tested By:** _______________
**Date:** _______________
**Status:** ⬜ PASS / ⬜ FAIL
**Notes:** _______________________________________________

---

## 🐛 Issues Found

If any tests fail, document here:

| Test | Issue | Severity | Status |
|------|-------|----------|--------|
|      |       |          |        |

## 📝 Additional Notes

Add any observations or recommendations:

---

**Last Updated:** 2026-05-28
