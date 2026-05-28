import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth-server";

export type SessionUser = {
   id: string;
   name?: string;
   email: string;
   role: "admin" | "student";
};

/**
 * Require authentication for API routes
 * Returns SessionUser or NextResponse error
 */
export async function requireAuth(): Promise<SessionUser | NextResponse> {
   try {
      const user = await getCurrentUser();

      if (!user) {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      return {
         id: user.id,
         name: user.name,
         email: user.email,
         role: user.role,
      };
   } catch (error) {
      console.error("Auth guard error:", error);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
   }
}

/**
 * Require student role for API routes
 * Returns SessionUser or NextResponse error
 */
export async function requireStudent(): Promise<SessionUser | NextResponse> {
   try {
      const user = await getCurrentUser();

      if (!user) {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      if (user.role !== "student") {
         return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      return {
         id: user.id,
         name: user.name,
         email: user.email,
         role: "student",
      };
   } catch (error) {
      console.error("Student auth guard error:", error);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
   }
}

/**
 * Require admin role for API routes
 * Returns SessionUser or NextResponse error
 */
export async function requireAdmin(): Promise<SessionUser | NextResponse> {
   try {
      const user = await getCurrentUser();

      if (!user) {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      if (user.role !== "admin") {
         return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      return {
         id: user.id,
         name: user.name,
         email: user.email,
         role: "admin",
      };
   } catch (error) {
      console.error("Admin auth guard error:", error);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
   }
}
