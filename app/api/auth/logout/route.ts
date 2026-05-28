import { NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, getClearCookieConfig } from "@/lib/auth";
import { getCurrentUser } from "@/lib/auth-server";
import { dbConnect } from "@/lib/db";
import { invalidateSession } from "@/lib/session";

export async function POST() {
   try {
      // Get current user to retrieve session ID
      const user = await getCurrentUser();

      if (user?.sessionId) {
         await dbConnect();
         // Invalidate the session in database
         await invalidateSession(user.sessionId);
      }

      const response = NextResponse.json({ ok: true });

      // Clear the auth cookie
      response.cookies.set({
         name: AUTH_COOKIE_NAME,
         value: "",
         ...getClearCookieConfig(),
      });

      return response;
   } catch (error) {
      console.error("Logout error:", error);

      // Still clear cookie even if session invalidation fails
      const response = NextResponse.json({ ok: true });
      response.cookies.set({
         name: AUTH_COOKIE_NAME,
         value: "",
         ...getClearCookieConfig(),
      });

      return response;
   }
}
