import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
   AUTH_COOKIE_NAME,
   getSecureCookieConfig,
   signAccessToken,
   type AuthRole,
} from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { Admin } from "@/lib/models/admin";
import { User } from "@/lib/models/users";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { seedAdmin } from "@/lib/seed-admin";
import { createSession } from "@/lib/session";

const loginSchema = z.object({
   email: z.string().email("Please enter a valid email address"),
   password: z.string().min(1, "Password is required"),
   role: z.enum(["admin", "student"]).optional(),
});

export async function POST(req: Request) {
   const body = await req.json().catch(() => null);
   const parsed = loginSchema.safeParse(body);

   if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json({ error: firstError.message }, { status: 400 });
   }

   const ip = getClientIp(req);
   const limiter = checkRateLimit(`login:${ip}`, 10, 60 * 1000);
   if (!limiter.ok) {
      return NextResponse.json(
         { error: "Too many login attempts. Please try again later." },
         {
            status: 429,
            headers: { "Retry-After": limiter.retryAfter.toString() },
         }
      );
   }

   const { email, password, role } = parsed.data;
   const normalizedEmail = email.toLowerCase();

   const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();

   await dbConnect();

   const needsAdminSeed = role === "admin" || (!role && adminEmail === normalizedEmail);
   if (needsAdminSeed) {
      if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
         return NextResponse.json(
            { error: "Admin credentials not configured" },
            { status: 500 }
         );
      }
      await seedAdmin();
   }

   let account: { _id: string; name?: string; email: string; role: AuthRole } | null = null;

   if (role === "admin") {
      const admin = await Admin.findOne({ email: normalizedEmail });
      if (admin) {
         account = {
            _id: admin._id.toString(),
            name: admin.name,
            email: admin.email,
            role: "admin",
         };
         const valid = await bcrypt.compare(password, admin.password);
         if (!valid) {
            return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
         }
      }
   } else if (role === "student") {
      const user = await User.findOne({ email: normalizedEmail });
      if (user) {
         account = {
            _id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: "student",
         };
         const valid = await bcrypt.compare(password, user.password);
         if (!valid) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
         }
      }
   } else {
      const user = await User.findOne({ email: normalizedEmail });
      if (user) {
         const valid = await bcrypt.compare(password, user.password);
         if (!valid) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
         }
         account = {
            _id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: "student",
         };
      } else {
         const admin = await Admin.findOne({ email: normalizedEmail });
         if (admin) {
            const valid = await bcrypt.compare(password, admin.password);
            if (!valid) {
               return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
            }
            account = {
               _id: admin._id.toString(),
               name: admin.name,
               email: admin.email,
               role: "admin",
            };
         }
      }
   }

   if (!account) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
   }

   // Create session (invalidates all previous sessions for this user)
   const session = await createSession({
      userId: account._id,
      role: account.role,
      ip,
      userAgent: req.headers.get("user-agent") || undefined,
   });

   // Sign JWT with session ID
   const token = await signAccessToken({
      userId: account._id,
      email: account.email,
      role: account.role,
      sessionId: session.sessionId,
   });

   const response = NextResponse.json(
      {
         id: account._id,
         name: account.name,
         email: account.email,
         role: account.role,
      },
      { status: 200 }
   );

   response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      ...getSecureCookieConfig(),
   });

   return response;
}
