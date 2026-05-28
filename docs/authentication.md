# Authentication System Documentation

## Overview

This application implements a production-grade authentication system with the following features:

- **Session-based authentication** with JWT tokens
- **Single active session per user** - logging in from a new device/browser invalidates previous sessions
- **Cross-tab logout synchronization** - logging out in one tab logs out all tabs instantly
- **Strict server-side validation** - middleware validates both JWT and database session
- **Role-based access control** - separate admin and student roles with strict isolation
- **Secure cookie handling** - httpOnly, secure, sameSite=strict
- **Server actions** - all auth operations happen server-side

## Architecture

### 1. Session Model (`lib/models/session.ts`)

Sessions are stored in MongoDB with the following structure:

```typescript
interface ISession {
   userId: ObjectId;
   role: "student" | "admin";
   sessionId: string;
   userAgent?: string;
   ip?: string;
   expiresAt: Date;
   isValid: boolean;
}
```

**Key Features:**
- TTL index automatically deletes expired sessions
- Compound indexes for efficient queries
- Single session enforcement per user

### 2. JWT Structure

JWTs contain the following payload:

```typescript
{
   userId: string;
   email: string;
   role: "admin" | "student";
   sessionId: string;  // Links JWT to database session
}
```

**Important:** The JWT alone is NOT sufficient for authentication. The `sessionId` must be validated against the database.

### 3. Authentication Flow

#### Login Flow:
1. User submits credentials
2. Server validates credentials
3. Server invalidates all previous sessions for this user
4. Server creates new session in database
5. Server signs JWT with sessionId
6. Server sets secure httpOnly cookie
7. Client receives user data
8. Client broadcasts login event to other tabs

#### Logout Flow:
1. User clicks logout
2. Server retrieves sessionId from JWT
3. Server invalidates session in database
4. Server clears cookie
5. Client clears auth state
6. Client broadcasts logout event to other tabs
7. All other tabs immediately log out

#### Request Validation Flow (Middleware):
1. Extract JWT from cookie
2. Verify JWT signature
3. Extract sessionId from JWT
4. Validate role for route
5. Allow or deny request

**Note:** Middleware runs in Edge Runtime and only validates JWT. Full session validation (database check) happens in:
- Server components via `getCurrentUser()`
- API routes via `requireAuth()`, `requireAdmin()`, `requireStudent()`

This two-layer approach ensures:
- Fast middleware execution (no DB queries)
- Full session validation where it matters (API routes, server components)
- Edge Runtime compatibility

### 4. Middleware (`middleware.ts`)

The middleware performs JWT validation and role-based routing:

- ✅ Verifies JWT signature
- ✅ Validates sessionId exists in JWT
- ✅ Enforces role-based access control
- ✅ Automatically clears invalid cookies
- ✅ Prevents admin/student cross-access

**Important:** Middleware runs in Edge Runtime and only validates JWT. Full session validation (checking database) happens in:
- **Server Components:** Use `getCurrentUser()` from `lib/auth-server.ts`
- **API Routes:** Use `requireAuth()`, `requireAdmin()`, or `requireStudent()` from `lib/auth-guards.ts`

This two-layer approach provides:
- **Fast middleware** - No database queries, runs on Edge
- **Strict validation** - Full session checks in API routes and server components
- **Edge compatibility** - Works with Next.js Edge Runtime

**Protected Routes:**
- `/admin/*` - Admin only
- `/dashboard` - Student only
- `/profile` - Student only
- `/quiz/*` - Student only
- `/api/*` - Role-based (except `/api/auth/*`)

### 5. Server Actions (`actions/auth.ts`)

All authentication operations use server actions:

- `loginStudentAction(email, password)` - Student login
- `loginAdminAction(email, password)` - Admin login
- `registerStudentAction(name, email, password)` - Student registration
- `logoutAction()` - Logout (invalidates session)
- `getCurrentUserAction()` - Get current authenticated user

**Benefits:**
- Type-safe
- Server-side only
- No API route needed
- Automatic revalidation

### 6. Auth Guards (`lib/auth-guards.ts`)

For API routes that need authentication:

```typescript
// Require any authenticated user
const user = await requireAuth();
if (user instanceof NextResponse) return user;

// Require student role
const student = await requireStudent();
if (student instanceof NextResponse) return student;

// Require admin role
const admin = await requireAdmin();
if (admin instanceof NextResponse) return admin;
```

### 7. Cross-Tab Synchronization (`lib/auth-sync.ts`)

Uses BroadcastChannel API to sync auth state across tabs:

- When user logs out in one tab, all tabs log out instantly
- When user logs in in one tab, all tabs refresh auth state
- Fallback for browsers without BroadcastChannel support

### 8. Auth Context Providers

**Student Auth Context** (`context/student-auth-context.tsx`):
```typescript
const { student, loading, login, register, logout, refresh } = useStudentAuth();
```

**Admin Auth Context** (`context/admin-auth-context.tsx`):
```typescript
const { admin, loading, login, logout, refresh } = useAdminAuth();
```

Both providers:
- Use server actions for auth operations
- Implement cross-tab sync
- Auto-redirect on logout
- Handle loading states

## Security Features

### 1. Single Session Enforcement

When a user logs in:
- All previous sessions are invalidated
- Old tabs/devices become unauthorized immediately
- Middleware rejects old tokens even if JWT is valid

### 2. Session Validation

Every request validates:
1. JWT signature is valid
2. Session exists in database
3. Session is active (`isValid: true`)
4. Session is not expired
5. Session matches JWT claims

### 3. Secure Cookies

Cookies are configured with:
- `httpOnly: true` - Not accessible via JavaScript
- `secure: true` - HTTPS only (production)
- `sameSite: 'strict'` - CSRF protection
- `maxAge: 7 days` - Auto-expiration

### 4. Role Isolation

- Admin and student roles are strictly separated
- Middleware prevents cross-role access
- API guards enforce role requirements
- No role escalation possible

### 5. Password Security

- Passwords hashed with bcrypt (cost factor 12)
- Strong password requirements enforced
- Rate limiting on login attempts
- No password hints or recovery questions

## Usage Examples

### Server-Side (Server Actions)

```typescript
// In a server component or server action
import { getCurrentUser, requireAdmin } from '@/lib/auth-server';

// Get current user (returns null if not authenticated)
const user = await getCurrentUser();

// Require authentication (throws if not authenticated)
const user = await requireAuth();

// Require admin role (throws if not admin)
const admin = await requireAdmin();
```

### Client-Side (React Components)

```typescript
// Student component
'use client';
import { useStudentAuth } from '@/context/student-auth-context';

function StudentDashboard() {
   const { student, loading, logout } = useStudentAuth();
   
   if (loading) return <div>Loading...</div>;
   if (!student) return <div>Not authenticated</div>;
   
   return (
      <div>
         <h1>Welcome {student.name}</h1>
         <button onClick={logout}>Logout</button>
      </div>
   );
}
```

### API Routes

```typescript
// app/api/some-route/route.ts
import { requireStudent } from '@/lib/auth-guards';

export async function GET() {
   const user = await requireStudent();
   if (user instanceof NextResponse) return user;
   
   // User is authenticated and is a student
   return NextResponse.json({ data: 'protected data' });
}
```

## Migration Notes

### Breaking Changes

1. **JWT Structure Changed**: Old tokens without `sessionId` are invalid
2. **Session Required**: All existing sessions must be recreated
3. **API Changes**: Auth API routes now create sessions
4. **Context Changes**: Auth contexts now use server actions

### Migration Steps

1. All users will need to log in again (old tokens are invalid)
2. No database migration needed (sessions collection is new)
3. Update any custom auth logic to use new utilities
4. Test cross-tab logout functionality

## Troubleshooting

### User Can't Log In

1. Check JWT_SECRET is set in environment
2. Check MongoDB connection
3. Check session collection exists
4. Check for rate limiting

### Session Not Persisting

1. Check cookie settings
2. Check HTTPS in production
3. Check sameSite settings
4. Check browser cookie settings

### Cross-Tab Logout Not Working

1. Check BroadcastChannel support
2. Check same origin policy
3. Check browser console for errors
4. Verify auth-sync initialization

### Middleware Rejecting Valid Tokens

1. Check session exists in database
2. Check session is not expired
3. Check session.isValid is true
4. Check JWT sessionId matches database

## Best Practices

1. **Always validate sessions server-side** - Never trust JWT alone
2. **Use server actions for auth** - Avoid client-side auth logic
3. **Handle loading states** - Auth checks are async
4. **Implement proper error handling** - Auth can fail for many reasons
5. **Test cross-tab behavior** - Open multiple tabs and test logout
6. **Monitor session collection** - Clean up expired sessions periodically
7. **Rotate JWT secrets** - Change JWT_SECRET periodically in production
8. **Log auth events** - Track login/logout for security auditing

## Environment Variables

Required environment variables:

```env
JWT_SECRET=your-secret-key-here
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=secure-admin-password
MONGODB_URI=mongodb://localhost:27017/quiz-app
```

## Testing

### Manual Testing Checklist

- [ ] Student can register
- [ ] Student can login
- [ ] Student can logout
- [ ] Admin can login
- [ ] Admin can logout
- [ ] Logout in one tab logs out all tabs
- [ ] Login in new browser invalidates old session
- [ ] Middleware blocks unauthorized access
- [ ] Middleware blocks cross-role access
- [ ] API guards work correctly
- [ ] Sessions expire after 7 days
- [ ] Invalid tokens are rejected
- [ ] Expired sessions are rejected

### Security Testing

- [ ] Cannot access admin routes as student
- [ ] Cannot access student routes as admin
- [ ] Cannot reuse old tokens after logout
- [ ] Cannot reuse old tokens after new login
- [ ] Cannot tamper with JWT payload
- [ ] Cannot access httpOnly cookies via JavaScript
- [ ] CSRF protection works (sameSite=strict)
- [ ] Rate limiting prevents brute force

## Performance Considerations

1. **Session Queries**: Indexed by sessionId for O(1) lookup
2. **TTL Index**: Automatic cleanup of expired sessions
3. **Middleware Caching**: Consider caching session validation (with short TTL)
4. **Database Connection**: Reuse connections, don't create new ones per request

## Future Enhancements

Potential improvements:

1. **Refresh Tokens**: Implement refresh token rotation
2. **Session Management UI**: Allow users to view/revoke active sessions
3. **2FA**: Add two-factor authentication
4. **OAuth**: Add social login (Google, GitHub, etc.)
5. **Session Analytics**: Track login patterns and suspicious activity
6. **Remember Me**: Optional long-lived sessions
7. **Device Fingerprinting**: Enhanced security with device tracking
8. **IP Whitelisting**: Restrict admin access by IP
