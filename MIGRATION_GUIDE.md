# Authentication System Migration Guide

## Overview

This guide explains the changes made to the authentication system and how to use the new implementation.

## What Changed?

### Before (Weak Authentication)
- ❌ JWT token alone was trusted
- ❌ No session tracking in database
- ❌ Logout didn't invalidate tokens globally
- ❌ Multiple sessions could exist simultaneously
- ❌ Old tokens remained valid after new login
- ❌ No cross-tab logout synchronization
- ❌ Middleware only verified JWT signature

### After (Strict Authentication)
- ✅ JWT + Database session validation
- ✅ Sessions tracked in MongoDB
- ✅ Logout invalidates session globally
- ✅ Single active session per user enforced
- ✅ New login invalidates all previous sessions
- ✅ Cross-tab logout synchronization
- ✅ Middleware validates JWT + session + user

## Breaking Changes

### 1. JWT Payload Structure

**Old:**
```typescript
{
   userId: string;
   email: string;
   role: "admin" | "student";
}
```

**New:**
```typescript
{
   userId: string;
   email: string;
   role: "admin" | "student";
   sessionId: string;  // NEW - required for session validation
}
```

**Impact:** All existing tokens are invalid and users must log in again.

### 2. Auth Context API

**Old:**
```typescript
// Used API client functions
import { loginStudent, logout } from '@/lib/api/auth';

const me = await loginStudent({ email, password });
await logout();
```

**New:**
```typescript
// Uses server actions
import { loginStudentAction, logoutAction } from '@/actions/auth';

const result = await loginStudentAction(email, password);
if (result.success) {
   // Handle success
}
await logoutAction();
```

**Impact:** Update any custom auth logic to use server actions.

### 3. Auth Guards

**Old:**
```typescript
// Returned payload directly
const payload = await getSessionPayload();
if (!payload) return error;
```

**New:**
```typescript
// Validates session from database
const user = await getCurrentUser();
if (!user) return error;
```

**Impact:** Auth guards now validate sessions, not just JWT.

## New Files

### Core Authentication
- `lib/models/session.ts` - Session model
- `lib/session.ts` - Session management utilities
- `lib/auth-server.ts` - Server-side auth utilities
- `lib/auth-sync.ts` - Cross-tab synchronization
- `actions/auth.ts` - Server actions for auth

### Documentation
- `docs/authentication.md` - Complete auth system documentation
- `MIGRATION_GUIDE.md` - This file

## Modified Files

### Updated for Session Support
- `lib/auth.ts` - Added sessionId to JWT, added cookie helpers
- `middleware.ts` - Added session validation
- `lib/auth-guards.ts` - Refactored to use getCurrentUser
- `app/api/auth/login/route.ts` - Creates sessions
- `app/api/auth/register/route.ts` - Creates sessions
- `app/api/auth/logout/route.ts` - Invalidates sessions
- `app/api/auth/me/route.ts` - Uses getCurrentUser
- `context/student-auth-context.tsx` - Uses server actions + cross-tab sync
- `context/admin-auth-context.tsx` - Uses server actions + cross-tab sync

## Migration Steps

### For Developers

1. **Pull Latest Code**
   ```bash
   git pull origin main
   ```

2. **Install Dependencies** (if any new ones)
   ```bash
   npm install
   ```

3. **Set Environment Variables**
   Ensure these are set in `.env.local`:
   ```env
   JWT_SECRET=your-secret-key
   ADMIN_EMAIL=admin@example.com
   ADMIN_PASSWORD=secure-password
   MONGODB_URI=mongodb://localhost:27017/quiz-app
   ```

4. **Database Setup**
   - No migration needed
   - Session collection will be created automatically
   - Indexes will be created on first use

5. **Test Locally**
   ```bash
   npm run dev
   ```
   - Log in as student
   - Log in as admin
   - Test logout in multiple tabs
   - Verify old tokens don't work

### For Users

1. **All users must log in again**
   - Old sessions are invalid
   - This is a one-time requirement

2. **Test cross-tab logout**
   - Open app in multiple tabs
   - Log out in one tab
   - Verify all tabs log out

## Code Migration Examples

### Example 1: Using Auth in Server Components

**Before:**
```typescript
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth';

export default async function Page() {
   const token = cookies().get('__quiz_token')?.value;
   const payload = token ? await verifyAccessToken(token) : null;
   
   if (!payload) {
      redirect('/login');
   }
   
   return <div>Hello {payload.email}</div>;
}
```

**After:**
```typescript
import { getCurrentUser } from '@/lib/auth-server';
import { redirect } from 'next/navigation';

export default async function Page() {
   const user = await getCurrentUser();
   
   if (!user) {
      redirect('/login');
   }
   
   return <div>Hello {user.name}</div>;
}
```

### Example 2: Using Auth in API Routes

**Before:**
```typescript
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth';

export async function GET() {
   const token = cookies().get('__quiz_token')?.value;
   if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
   }
   
   const payload = await verifyAccessToken(token);
   // ... rest of logic
}
```

**After:**
```typescript
import { requireStudent } from '@/lib/auth-guards';

export async function GET() {
   const user = await requireStudent();
   if (user instanceof NextResponse) return user;
   
   // user is authenticated and is a student
   // ... rest of logic
}
```

### Example 3: Using Auth in Client Components

**Before:**
```typescript
'use client';
import { useStudentAuth } from '@/context/student-auth-context';

function MyComponent() {
   const { student, login, logout } = useStudentAuth();
   
   const handleLogin = async () => {
      const result = await login(email, password);
      if (result.ok) {
         // Success
      }
   };
   
   return <button onClick={logout}>Logout</button>;
}
```

**After:**
```typescript
'use client';
import { useStudentAuth } from '@/context/student-auth-context';

function MyComponent() {
   const { student, login, logout } = useStudentAuth();
   
   // API is the same! Context handles server actions internally
   const handleLogin = async () => {
      const result = await login(email, password);
      if (result.ok) {
         // Success
      }
   };
   
   return <button onClick={logout}>Logout</button>;
}
```

**Note:** Client component API remains the same, but now uses server actions internally.

## Testing Checklist

After migration, verify:

### Authentication Flow
- [ ] Student registration works
- [ ] Student login works
- [ ] Admin login works
- [ ] Logout works
- [ ] Invalid credentials are rejected
- [ ] Rate limiting works

### Session Management
- [ ] New login invalidates old sessions
- [ ] Logout invalidates session in database
- [ ] Expired sessions are rejected
- [ ] Invalid sessions are rejected
- [ ] Session collection is created in MongoDB

### Cross-Tab Sync
- [ ] Logout in one tab logs out all tabs
- [ ] Login in one tab refreshes other tabs
- [ ] Works in Chrome
- [ ] Works in Firefox
- [ ] Works in Safari
- [ ] Graceful fallback if BroadcastChannel not supported

### Middleware
- [ ] Blocks unauthenticated access to protected routes
- [ ] Blocks admin access to student routes
- [ ] Blocks student access to admin routes
- [ ] Clears invalid cookies automatically
- [ ] Validates sessions from database

### API Routes
- [ ] Auth guards work correctly
- [ ] Protected endpoints require authentication
- [ ] Role-based endpoints enforce roles
- [ ] Error responses are consistent

## Rollback Plan

If issues arise, you can rollback:

1. **Revert Git Commits**
   ```bash
   git revert <commit-hash>
   ```

2. **Clear Session Collection**
   ```javascript
   // In MongoDB shell
   db.sessions.drop()
   ```

3. **Users Must Log In Again**
   - After rollback, users need to log in again
   - Old tokens will work if JWT_SECRET unchanged

## Common Issues

### Issue: "Unauthorized" after login

**Cause:** Session not created or JWT missing sessionId

**Solution:**
1. Check MongoDB connection
2. Verify session collection exists
3. Check JWT payload includes sessionId
4. Clear cookies and try again

### Issue: Cross-tab logout not working

**Cause:** BroadcastChannel not supported or not initialized

**Solution:**
1. Check browser console for errors
2. Verify BroadcastChannel support
3. Check auth-sync initialization in context providers
4. Test in different browser

### Issue: Middleware rejecting valid tokens

**Cause:** Session validation failing

**Solution:**
1. Check session exists in database
2. Verify session.isValid is true
3. Check session.expiresAt is in future
4. Verify sessionId in JWT matches database

### Issue: Multiple sessions still active

**Cause:** Session invalidation not working

**Solution:**
1. Check createSession function
2. Verify updateMany query is correct
3. Check MongoDB indexes
4. Manually check sessions collection

## Performance Considerations

### Database Queries

The new system adds one database query per request:
- Middleware: 1 session lookup per protected route
- Auth guards: 1 session lookup + 1 user lookup per API call

**Optimization:**
- Sessions are indexed by sessionId (O(1) lookup)
- Consider Redis caching for high-traffic apps
- TTL index automatically cleans up expired sessions

### Cookie Size

JWT size increased slightly:
- Old: ~200 bytes
- New: ~250 bytes (added sessionId)

**Impact:** Negligible, well within cookie size limits.

## Security Improvements

1. **Session Hijacking Prevention**
   - Old tokens become invalid after new login
   - Sessions can be revoked server-side

2. **Logout Enforcement**
   - Logout actually invalidates authentication
   - No lingering valid tokens

3. **Single Session**
   - Prevents account sharing
   - Easier to track user activity

4. **Cross-Tab Security**
   - Consistent auth state across tabs
   - Immediate logout propagation

## Support

If you encounter issues:

1. Check this migration guide
2. Review `docs/authentication.md`
3. Check browser console for errors
4. Check server logs for auth errors
5. Verify environment variables
6. Test in incognito/private mode

## Timeline

- **Development:** Completed
- **Testing:** In progress
- **Deployment:** Pending
- **User Migration:** Automatic (users log in again)

## Questions?

Common questions:

**Q: Do I need to migrate existing user data?**
A: No, user data is unchanged. Only sessions are new.

**Q: Will users lose their data?**
A: No, only authentication sessions are affected.

**Q: How long will users be logged out?**
A: Until they log in again (one-time).

**Q: Can I keep old and new auth systems?**
A: No, they are incompatible. Full migration required.

**Q: What about API clients?**
A: API clients must handle new session-based auth.

## Conclusion

This migration significantly improves security and user experience. While it requires users to log in again, the benefits far outweigh the inconvenience:

- ✅ True logout functionality
- ✅ Single session enforcement
- ✅ Cross-tab synchronization
- ✅ Strict server-side validation
- ✅ Production-ready security

All users will need to log in once after deployment, but the system will be much more secure and reliable going forward.
