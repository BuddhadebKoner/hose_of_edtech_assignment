import { cookies } from "next/headers";

import { AUTH_COOKIE_NAME, verifyAccessToken, type AuthPayload } from "./auth";
import { dbConnect } from "./db";
import { Admin } from "./models/admin";
import { User } from "./models/users";
import { validateSession } from "./session";

export interface AuthenticatedUser {
   id: string;
   email: string;
   name?: string;
   role: "admin" | "student";
   sessionId: string;
}

/**
 * Get the current authenticated user from request
 * Validates both JWT and session from database
 * Returns null if not authenticated
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
   try {
      const cookieStore = await cookies();
      const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

      if (!token) {
         return null;
      }

      // Verify JWT signature
      let payload: AuthPayload;
      try {
         payload = await verifyAccessToken(token);
      } catch {
         return null;
      }

      // Validate session exists and is active
      await dbConnect();
      const session = await validateSession(payload.sessionId);

      if (!session) {
         return null;
      }

      // Verify session belongs to the user in the token
      if (session.userId !== payload.userId || session.role !== payload.role) {
         return null;
      }

      // Fetch user data from database
      if (payload.role === "admin") {
         const admin = await Admin.findById(payload.userId);
         if (!admin) {
            return null;
         }

         return {
            id: admin._id.toString(),
            email: admin.email,
            name: admin.name,
            role: "admin",
            sessionId: payload.sessionId,
         };
      } else {
         const user = await User.findById(payload.userId);
         if (!user) {
            return null;
         }

         return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: "student",
            sessionId: payload.sessionId,
         };
      }
   } catch {
      return null;
   }
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
   const user = await getCurrentUser();

   if (!user) {
      throw new Error("Unauthorized");
   }

   return user;
}

/**
 * Require admin role - throws if not admin
 */
export async function requireAdmin(): Promise<AuthenticatedUser> {
   const user = await requireAuth();

   if (user.role !== "admin") {
      throw new Error("Forbidden: Admin access required");
   }

   return user;
}

/**
 * Require student role - throws if not student
 */
export async function requireStudent(): Promise<AuthenticatedUser> {
   const user = await requireAuth();

   if (user.role !== "student") {
      throw new Error("Forbidden: Student access required");
   }

   return user;
}
