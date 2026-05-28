# Authentication Flow Diagrams

## 🔐 Login Flow

```
┌─────────────┐
│   Browser   │
│   (Tab 1)   │
└──────┬──────┘
       │
       │ 1. Submit credentials
       │    POST /api/auth/login
       ▼
┌─────────────────────────────────────────┐
│         Server (Login Route)            │
├─────────────────────────────────────────┤
│ 2. Validate credentials                 │
│    ├─ Check email exists                │
│    └─ Verify password (bcrypt)          │
│                                          │
│ 3. Invalidate old sessions              │
│    Session.updateMany(                  │
│      { userId, isValid: true },         │
│      { $set: { isValid: false } }       │
│    )                                     │
│                                          │
│ 4. Create new session                   │
│    const session = await Session.create({│
│      userId,                             │
│      role,                               │
│      sessionId: generateSessionId(),    │
│      expiresAt: +7 days                 │
│    })                                    │
│                                          │
│ 5. Sign JWT with sessionId              │
│    const token = await signAccessToken({ │
│      userId,                             │
│      email,                              │
│      role,                               │
│      sessionId: session.sessionId       │
│    })                                    │
│                                          │
│ 6. Set secure cookie                    │
│    response.cookies.set({               │
│      name: '__quiz_token',              │
│      value: token,                      │
│      httpOnly: true,                    │
│      secure: true,                      │
│      sameSite: 'strict'                 │
│    })                                    │
└──────┬──────────────────────────────────┘
       │
       │ 7. Return user data
       ▼
┌─────────────┐
│   Browser   │
│   (Tab 1)   │
├─────────────┤
│ 8. Update   │
│    context  │
│    state    │
│             │
│ 9. Broadcast│
│    login    │
│    event    │
└──────┬──────┘
       │
       │ BroadcastChannel
       │
       ▼
┌─────────────┐
│   Browser   │
│   (Tab 2)   │
├─────────────┤
│ 10. Receive │
│     login   │
│     event   │
│             │
│ 11. Refresh │
│     auth    │
│     state   │
└─────────────┘
```

## 🚪 Logout Flow

```
┌─────────────┐
│   Browser   │
│   (Tab 1)   │
└──────┬──────┘
       │
       │ 1. Click logout
       │    Call logoutAction()
       ▼
┌─────────────────────────────────────────┐
│      Server (Logout Action)             │
├─────────────────────────────────────────┤
│ 2. Get current user                     │
│    const user = await getCurrentUser()  │
│    ├─ Extract JWT from cookie           │
│    ├─ Verify JWT signature              │
│    └─ Get sessionId from JWT            │
│                                          │
│ 3. Invalidate session in DB             │
│    await Session.updateOne(             │
│      { sessionId: user.sessionId },     │
│      { $set: { isValid: false } }       │
│    )                                     │
│                                          │
│ 4. Clear cookie                         │
│    response.cookies.set({               │
│      name: '__quiz_token',              │
│      value: '',                         │
│      maxAge: 0                          │
│    })                                    │
└──────┬──────────────────────────────────┘
       │
       │ 5. Return success
       ▼
┌─────────────┐
│   Browser   │
│   (Tab 1)   │
├─────────────┤
│ 6. Clear    │
│    context  │
│    state    │
│             │
│ 7. Broadcast│
│    logout   │
│    event    │
│             │
│ 8. Redirect │
│    to login │
└──────┬──────┘
       │
       │ BroadcastChannel
       │
       ▼
┌─────────────┐
│   Browser   │
│   (Tab 2)   │
├─────────────┤
│ 9. Receive  │
│    logout   │
│    event    │
│             │
│ 10. Clear   │
│     context │
│     state   │
│             │
│ 11. Redirect│
│     to login│
└─────────────┘
```

## 🛡️ Middleware Validation Flow

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ 1. Request protected route
       │    GET /dashboard
       ▼
┌─────────────────────────────────────────┐
│      Middleware (Edge Runtime)          │
├─────────────────────────────────────────┤
│ 2. Extract JWT from cookie              │
│    const token = req.cookies.get(       │
│      '__quiz_token'                     │
│    )?.value                             │
│                                          │
│ 3. Verify JWT signature                 │
│    const payload = await                │
│      verifyAccessToken(token)           │
│    ├─ Check signature ✓                 │
│    ├─ Check expiration ✓                │
│    └─ Extract sessionId ✓               │
│                                          │
│ 4. Validate role for route              │
│    if (isAdminRoute && role !== 'admin')│
│      return 403 Forbidden               │
│    if (isStudentRoute && role !== 'student')│
│      return 403 Forbidden               │
│                                          │
│ 5. Allow request                        │
│    return NextResponse.next()           │
│                                          │
│ Note: Full session validation (DB check)│
│ happens in API routes and server        │
│ components using getCurrentUser()       │
└──────┬──────────────────────────────────┘
       │
       │ 6. Request proceeds
       ▼
┌─────────────────────────────────────────┐
│   Route Handler / Server Component      │
├─────────────────────────────────────────┤
│ 7. Full session validation              │
│    const user = await getCurrentUser()  │
│    ├─ Verify JWT (again)                │
│    ├─ Query session from DB ✓           │
│    ├─ Check isValid === true ✓          │
│    ├─ Check expiresAt > now ✓           │
│    └─ Verify session matches JWT ✓      │
│                                          │
│ 8. Process request with validated user  │
└──────┬──────────────────────────────────┘
       │
       │ 9. Response
       ▼
┌─────────────┐
│   Browser   │
└─────────────┘
```

## 🔄 Single Session Enforcement

```
┌─────────────┐                    ┌─────────────┐
│  Browser 1  │                    │  Browser 2  │
│  (Old Tab)  │                    │  (New Tab)  │
└──────┬──────┘                    └──────┬──────┘
       │                                  │
       │ Already logged in                │
       │ Session A active                 │
       │                                  │
       │                                  │ 1. Login with
       │                                  │    same account
       │                                  ▼
       │                           ┌─────────────┐
       │                           │   Server    │
       │                           ├─────────────┤
       │                           │ 2. Validate │
       │                           │    creds    │
       │                           │             │
       │                           │ 3. Invalidate│
       │                           │    ALL old  │
       │                           │    sessions │
       │                           │    ↓        │
       │                           │ Session A   │
       │                           │ isValid =   │
       │                           │ false ✗     │
       │                           │             │
       │                           │ 4. Create   │
       │                           │    new      │
       │                           │    session  │
       │                           │    ↓        │
       │                           │ Session B   │
       │                           │ isValid =   │
       │                           │ true ✓      │
       │                           └──────┬──────┘
       │                                  │
       │                                  │ 5. Return
       │                                  │    success
       │                                  ▼
       │                           ┌─────────────┐
       │                           │  Browser 2  │
       │                           │  Logged in  │
       │                           └─────────────┘
       │
       │ 6. Next request
       │    (any action)
       ▼
┌─────────────┐
│ Middleware  │
├─────────────┤
│ Validate    │
│ Session A   │
│             │
│ Query DB:   │
│ Session A   │
│ isValid =   │
│ false ✗     │
│             │
│ 7. REJECT   │
│    401      │
└──────┬──────┘
       │
       │ 8. Clear cookie
       │    Redirect login
       ▼
┌─────────────┐
│  Browser 1  │
│  Logged out │
└─────────────┘
```

## 🔀 Cross-Tab Logout Sync

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Tab 1     │  │   Tab 2     │  │   Tab 3     │
│  Logged in  │  │  Logged in  │  │  Logged in  │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       │ 1. Click       │                │
       │    logout      │                │
       ▼                │                │
┌─────────────┐         │                │
│   Server    │         │                │
├─────────────┤         │                │
│ Invalidate  │         │                │
│ session     │         │                │
│ in DB       │         │                │
└──────┬──────┘         │                │
       │                │                │
       │ 2. Success     │                │
       ▼                │                │
┌─────────────┐         │                │
│   Tab 1     │         │                │
├─────────────┤         │                │
│ Clear state │         │                │
│             │         │                │
│ 3. Broadcast│         │                │
│    logout   │         │                │
│    event    │         │                │
└──────┬──────┘         │                │
       │                │                │
       │ BroadcastChannel                │
       ├────────────────┼────────────────┤
       │                │                │
       │                ▼                ▼
       │         ┌─────────────┐  ┌─────────────┐
       │         │   Tab 2     │  │   Tab 3     │
       │         ├─────────────┤  ├─────────────┤
       │         │ 4. Receive  │  │ 4. Receive  │
       │         │    logout   │  │    logout   │
       │         │    event    │  │    event    │
       │         │             │  │             │
       │         │ 5. Clear    │  │ 5. Clear    │
       │         │    state    │  │    state    │
       │         │             │  │             │
       │         │ 6. Redirect │  │ 6. Redirect │
       │         │    to login │  │    to login │
       │         └─────────────┘  └─────────────┘
       │
       ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Tab 1     │  │   Tab 2     │  │   Tab 3     │
│  Logged out │  │  Logged out │  │  Logged out │
└─────────────┘  └─────────────┘  └─────────────┘
```

## 🗄️ Database Session State

```
┌─────────────────────────────────────────────────────┐
│              MongoDB Sessions Collection            │
├─────────────────────────────────────────────────────┤
│                                                     │
│  User A - Student                                   │
│  ┌─────────────────────────────────────────────┐   │
│  │ sessionId: "abc123..."                      │   │
│  │ userId: ObjectId("...")                     │   │
│  │ role: "student"                             │   │
│  │ isValid: true ✓                             │   │
│  │ expiresAt: 2026-06-04                       │   │
│  │ createdAt: 2026-05-28                       │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  User B - Admin                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ sessionId: "def456..."                      │   │
│  │ userId: ObjectId("...")                     │   │
│  │ role: "admin"                               │   │
│  │ isValid: true ✓                             │   │
│  │ expiresAt: 2026-06-04                       │   │
│  │ createdAt: 2026-05-28                       │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  User A - Old Session (Invalidated)                │
│  ┌─────────────────────────────────────────────┐   │
│  │ sessionId: "xyz789..."                      │   │
│  │ userId: ObjectId("...")                     │   │
│  │ role: "student"                             │   │
│  │ isValid: false ✗                            │   │
│  │ expiresAt: 2026-06-04                       │   │
│  │ createdAt: 2026-05-27                       │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  User C - Expired Session (Auto-deleted by TTL)    │
│  ┌─────────────────────────────────────────────┐   │
│  │ sessionId: "old123..."                      │   │
│  │ userId: ObjectId("...")                     │   │
│  │ role: "student"                             │   │
│  │ isValid: true                               │   │
│  │ expiresAt: 2026-05-20 (past) ✗              │   │
│  │ createdAt: 2026-05-13                       │   │
│  │ → Auto-deleted by TTL index                 │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## 🔐 JWT Structure

```
┌─────────────────────────────────────────────────────┐
│                    JWT Token                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Header                                             │
│  ┌─────────────────────────────────────────────┐   │
│  │ {                                           │   │
│  │   "alg": "HS256",                           │   │
│  │   "typ": "JWT"                              │   │
│  │ }                                           │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Payload                                            │
│  ┌─────────────────────────────────────────────┐   │
│  │ {                                           │   │
│  │   "userId": "507f1f77bcf86cd799439011",     │   │
│  │   "email": "student@example.com",           │   │
│  │   "role": "student",                        │   │
│  │   "sessionId": "abc123...",  ← CRITICAL     │   │
│  │   "iat": 1716854400,                        │   │
│  │   "exp": 1717459200                         │   │
│  │ }                                           │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Signature                                          │
│  ┌─────────────────────────────────────────────┐   │
│  │ HMACSHA256(                                 │   │
│  │   base64UrlEncode(header) + "." +           │   │
│  │   base64UrlEncode(payload),                 │   │
│  │   JWT_SECRET                                │   │
│  │ )                                           │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## 🔄 Request Lifecycle

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ HTTP Request
       │ Cookie: __quiz_token=eyJhbGc...
       ▼
┌─────────────────────────────────────────┐
│            Middleware                   │
├─────────────────────────────────────────┤
│ 1. Extract JWT from cookie              │
│ 2. Verify JWT signature                 │
│ 3. Extract sessionId from JWT           │
│ 4. Query session from MongoDB           │
│ 5. Validate session is active           │
│ 6. Validate role matches route          │
│ 7. Allow or deny request                │
└──────┬──────────────────────────────────┘
       │
       │ If allowed
       ▼
┌─────────────────────────────────────────┐
│         Route Handler / API             │
├─────────────────────────────────────────┤
│ Optional: Use auth guards               │
│ const user = await requireStudent()     │
│                                          │
│ Process request                         │
│ Access user.id, user.role, etc.         │
└──────┬──────────────────────────────────┘
       │
       │ Response
       ▼
┌─────────────┐
│   Browser   │
└─────────────┘
```

## 📊 Session Lifecycle

```
┌─────────────┐
│   Created   │  ← Login / Register
└──────┬──────┘
       │
       │ isValid: true
       │ expiresAt: +7 days
       ▼
┌─────────────┐
│   Active    │  ← Used for authentication
└──────┬──────┘
       │
       ├─────────────────┬─────────────────┬──────────────┐
       │                 │                 │              │
       │ New login       │ Logout          │ Expiration   │
       │ (same user)     │                 │              │
       ▼                 ▼                 ▼              │
┌─────────────┐   ┌─────────────┐   ┌─────────────┐     │
│ Invalidated │   │ Invalidated │   │   Expired   │     │
│ isValid:    │   │ isValid:    │   │ expiresAt   │     │
│ false       │   │ false       │   │ < now       │     │
└─────────────┘   └─────────────┘   └──────┬──────┘     │
                                            │            │
                                            │ TTL index  │
                                            ▼            │
                                     ┌─────────────┐     │
                                     │   Deleted   │     │
                                     │ (auto)      │     │
                                     └─────────────┘     │
                                                         │
                                            Still valid  │
                                                         ▼
                                                  ┌─────────────┐
                                                  │   Active    │
                                                  │ (continues) │
                                                  └─────────────┘
```

---

**Legend:**
- ✓ = Valid/Allowed
- ✗ = Invalid/Denied
- → = Flow direction
- ← = Annotation

**Last Updated:** 2026-05-28
