import { NextRequest, NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, verifyAccessToken } from "@/lib/auth";

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

function jsonError(status: number, message: string) {
   return NextResponse.json({ error: message }, { status });
}

export async function middleware(req: NextRequest) {
   const { pathname } = req.nextUrl;
   const isApi = pathname.startsWith("/api");

   if (pathname.startsWith("/api/auth")) {
      return NextResponse.next();
   }

   if (PUBLIC_PAGES.has(pathname)) {
      return NextResponse.next();
   }

   const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;

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

   let payload: { role: string } | null = null;
   try {
      payload = await verifyAccessToken(token);
   } catch {
      if (isApi) {
         return jsonError(401, "Unauthorized");
      }
      return redirectTo(req, "/login");
   }

   if (payload?.role === "admin") {
      if (isStudentRoute(pathname)) {
         return isApi ? jsonError(403, "Forbidden") : redirectTo(req, ADMIN_LOGIN_PATH);
      }
      return NextResponse.next();
   }

   if (payload?.role === "student") {
      if (isAdminRoute(pathname)) {
         if (pathname === ADMIN_LOGIN_PATH) {
            return redirectTo(req, "/dashboard");
         }
         return isApi ? jsonError(403, "Forbidden") : redirectTo(req, "/dashboard");
      }
      return NextResponse.next();
   }

   return isApi ? jsonError(401, "Unauthorized") : redirectTo(req, "/login");
}

export const config = {
   matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
