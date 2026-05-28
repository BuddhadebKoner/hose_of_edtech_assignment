import { NextRequest, NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, getClearCookieConfig, verifyAccessToken } from "@/lib/auth";

const PUBLIC_PAGES = new Set(["/", "/login", "/signup"]);
const ADMIN_LOGIN_PATH = "/admin";

function isAdminRoute(pathname: string) {
   return pathname === "/admin" || pathname.startsWith("/admin/");
}

function isStudentRoute(pathname: string) {
   return (
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/profile") ||
      pathname.startsWith("/quiz")
   );
}

function redirectTo(req: NextRequest, pathname: string) {
   const url = req.nextUrl.clone();
   url.pathname = pathname;
   url.search = "";
   return NextResponse.redirect(url);
}

function redirectWithClearCookie(req: NextRequest, pathname: string) {
   const response = redirectTo(req, pathname);
   response.cookies.set(AUTH_COOKIE_NAME, "", getClearCookieConfig());
   return response;
}

function jsonError(status: number, message: string) {
   return NextResponse.json({ error: message }, { status });
}

function jsonErrorWithClearCookie(status: number, message: string) {
   const response = jsonError(status, message);
   response.cookies.set(AUTH_COOKIE_NAME, "", getClearCookieConfig());
   return response;
}

/**
 * Lightweight session validation for Edge Runtime
 * Full validation happens in API routes and server components
 * 
 * Note: We only verify JWT here. Full session validation (checking DB)
 * happens in server components and API routes using getCurrentUser()
 * This is a trade-off for Edge Runtime compatibility.
 */
export async function middleware(req: NextRequest) {
   const { pathname } = req.nextUrl;
   const isApi = pathname.startsWith("/api");

   // Allow auth endpoints
   if (pathname.startsWith("/api/auth")) {
      return NextResponse.next();
   }

   // Allow public pages
   if (PUBLIC_PAGES.has(pathname)) {
      return NextResponse.next();
   }

   const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;

   // No token - redirect to login or return 401
   if (!token) {
      if (pathname === ADMIN_LOGIN_PATH) {
         return NextResponse.next();
      }

      if (isApi) {
         return jsonError(401, "Unauthorized");
      }

      if (isAdminRoute(pathname)) {
         return redirectTo(req, ADMIN_LOGIN_PATH);
      }

      if (isStudentRoute(pathname)) {
         return redirectTo(req, "/login");
      }

      return NextResponse.next();
   }

   // Verify JWT
   try {
      // Step 1: Verify JWT signature and extract payload
      const payload = await verifyAccessToken(token);

      if (!payload.sessionId) {
         // Old token without sessionId - invalid
         if (isApi) {
            return jsonErrorWithClearCookie(401, "Unauthorized");
         }
         return redirectWithClearCookie(req, "/login");
      }

      // Step 2: Basic role validation
      // Note: Full session validation (DB check) happens in:
      // - Server components via getCurrentUser()
      // - API routes via requireAuth/requireAdmin/requireStudent
      // This ensures session is still valid in database

      // Step 3: Enforce role-based access control
      if (payload.role === "admin") {
         if (isStudentRoute(pathname)) {
            return isApi
               ? jsonError(403, "Forbidden")
               : redirectTo(req, ADMIN_LOGIN_PATH);
         }
         return NextResponse.next();
      }

      if (payload.role === "student") {
         if (isAdminRoute(pathname)) {
            if (pathname === ADMIN_LOGIN_PATH) {
               return redirectTo(req, "/dashboard");
            }
            return isApi ? jsonError(403, "Forbidden") : redirectTo(req, "/dashboard");
         }
         return NextResponse.next();
      }

      // Unknown role
      if (isApi) {
         return jsonErrorWithClearCookie(401, "Unauthorized");
      }
      return redirectWithClearCookie(req, "/login");
   } catch (error) {
      // JWT verification failed
      console.error("Middleware auth error:", error);

      if (isApi) {
         return jsonErrorWithClearCookie(401, "Unauthorized");
      }

      if (isAdminRoute(pathname)) {
         return redirectWithClearCookie(req, ADMIN_LOGIN_PATH);
      }

      return redirectWithClearCookie(req, "/login");
   }
}

export const config = {
   matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
