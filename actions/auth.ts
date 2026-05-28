"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { z } from "zod";

import {
   AUTH_COOKIE_NAME,
   getClearCookieConfig,
   getSecureCookieConfig,
   signAccessToken,
} from "@/lib/auth";
import { getCurrentUser } from "@/lib/auth-server";
import { dbConnect } from "@/lib/db";
import { Admin } from "@/lib/models/admin";
import { User } from "@/lib/models/users";
import { seedAdmin } from "@/lib/seed-admin";
import { createSession, invalidateSession } from "@/lib/session";

// Validation schemas
const loginSchema = z.object({
   email: z.string().email("Please enter a valid email address"),
   password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
   name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name must not exceed 50 characters")
      .regex(
         /^[a-zA-Z\s'-]+$/,
         "Name can only contain letters, spaces, hyphens, and apostrophes"
      ),
   email: z
      .string()
      .email("Please enter a valid email address")
      .max(100, "Email must not exceed 100 characters"),
   password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must not exceed 128 characters")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
});

export type AuthResult =
   | { success: true; user: { id: string; name?: string; email: string; role: string } }
   | { success: false; error: string };

/**
 * Student Login Server Action
 */
export async function loginStudentAction(
   email: string,
   password: string
): Promise<AuthResult> {
   try {
      const parsed = loginSchema.safeParse({ email, password });

      if (!parsed.success) {
         return { success: false, error: parsed.error.issues[0].message };
      }

      const normalizedEmail = email.toLowerCase();

      await dbConnect();

      const user = await User.findOne({ email: normalizedEmail });

      if (!user) {
         return { success: false, error: "Invalid email or password" };
      }

      const valid = await bcrypt.compare(password, user.password);

      if (!valid) {
         return { success: false, error: "Invalid email or password" };
      }

      // Create session (invalidates all previous sessions)
      const session = await createSession({
         userId: user._id.toString(),
         role: "student",
      });

      // Sign JWT with session ID
      const token = await signAccessToken({
         userId: user._id.toString(),
         email: user.email,
         role: "student",
         sessionId: session.sessionId,
      });

      // Set secure cookie
      const cookieStore = await cookies();
      cookieStore.set(AUTH_COOKIE_NAME, token, getSecureCookieConfig());

      return {
         success: true,
         user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: "student",
         },
      };
   } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "An error occurred during login" };
   }
}

/**
 * Admin Login Server Action
 */
export async function loginAdminAction(
   email: string,
   password: string
): Promise<AuthResult> {
   try {
      const parsed = loginSchema.safeParse({ email, password });

      if (!parsed.success) {
         return { success: false, error: parsed.error.issues[0].message };
      }

      const normalizedEmail = email.toLowerCase();

      await dbConnect();

      // Ensure admin exists
      if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
         return { success: false, error: "Admin credentials not configured" };
      }

      await seedAdmin();

      const admin = await Admin.findOne({ email: normalizedEmail });

      if (!admin) {
         return { success: false, error: "Invalid email or password" };
      }

      const valid = await bcrypt.compare(password, admin.password);

      if (!valid) {
         return { success: false, error: "Invalid email or password" };
      }

      // Create session (invalidates all previous sessions)
      const session = await createSession({
         userId: admin._id.toString(),
         role: "admin",
      });

      // Sign JWT with session ID
      const token = await signAccessToken({
         userId: admin._id.toString(),
         email: admin.email,
         role: "admin",
         sessionId: session.sessionId,
      });

      // Set secure cookie
      const cookieStore = await cookies();
      cookieStore.set(AUTH_COOKIE_NAME, token, getSecureCookieConfig());

      return {
         success: true,
         user: {
            id: admin._id.toString(),
            name: admin.name,
            email: admin.email,
            role: "admin",
         },
      };
   } catch (error) {
      console.error("Admin login error:", error);
      return { success: false, error: "An error occurred during login" };
   }
}

/**
 * Student Registration Server Action
 */
export async function registerStudentAction(
   name: string,
   email: string,
   password: string
): Promise<AuthResult> {
   try {
      const parsed = registerSchema.safeParse({ name, email, password });

      if (!parsed.success) {
         return { success: false, error: parsed.error.issues[0].message };
      }

      const normalizedEmail = email.toLowerCase();
      const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();

      if (adminEmail && normalizedEmail === adminEmail) {
         return { success: false, error: "This email is reserved and cannot be used" };
      }

      await dbConnect();

      const existing = await User.findOne({ email: normalizedEmail });

      if (existing) {
         return { success: false, error: "An account with this email already exists" };
      }

      const hashed = await bcrypt.hash(password, 12);

      const user = await User.create({
         name: name.trim(),
         email: normalizedEmail,
         password: hashed,
         role: "student",
      });

      // Create session for the new user
      const session = await createSession({
         userId: user._id.toString(),
         role: "student",
      });

      // Sign JWT with session ID
      const token = await signAccessToken({
         userId: user._id.toString(),
         email: user.email,
         role: "student",
         sessionId: session.sessionId,
      });

      // Set secure cookie
      const cookieStore = await cookies();
      cookieStore.set(AUTH_COOKIE_NAME, token, getSecureCookieConfig());

      return {
         success: true,
         user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: "student",
         },
      };
   } catch (error) {
      console.error("Registration error:", error);
      return { success: false, error: "An error occurred during registration" };
   }
}

/**
 * Logout Server Action
 * Invalidates the current session and clears the cookie
 */
export async function logoutAction(): Promise<{ success: boolean }> {
   try {
      // Get current user to retrieve session ID
      const user = await getCurrentUser();

      if (user?.sessionId) {
         await dbConnect();
         await invalidateSession(user.sessionId);
      }

      // Clear cookie
      const cookieStore = await cookies();
      cookieStore.set(AUTH_COOKIE_NAME, "", getClearCookieConfig());

      return { success: true };
   } catch (error) {
      console.error("Logout error:", error);
      return { success: true }; // Still clear cookie even if session invalidation fails
   }
}

/**
 * Get current authenticated user
 */
export async function getCurrentUserAction() {
   const user = await getCurrentUser();

   if (!user) {
      return null;
   }

   return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
   };
}
