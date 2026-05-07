import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, verifyAccessToken } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { Admin } from "@/lib/models/admin";
import { User } from "@/lib/models/users";

export type SessionUser = {
   id: string;
   name?: string;
   email: string;
   role: "admin" | "student";
};

async function getSessionPayload() {
   const cookieStore = await cookies();
   const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
   if (!token) {
      return null;
   }

   try {
      return await verifyAccessToken(token);
   } catch {
      return null;
   }
}

export async function requireAuth() {
   const payload = await getSessionPayload();
   if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
   }

   await dbConnect();

   if (payload.role === "admin") {
      const admin = await Admin.findById(payload.userId);
      if (!admin) {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const sessionAdmin: SessionUser = {
         id: admin._id.toString(),
         name: admin.name,
         email: admin.email,
         role: "admin",
      };

      return sessionAdmin;
   }

   const user = await User.findById(payload.userId);
   if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
   }

   const sessionUser: SessionUser = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: "student",
   };

   return sessionUser;
}

export async function requireStudent() {
   const payload = await getSessionPayload();
   if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
   }

   if (payload.role !== "student") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
   }

   await dbConnect();
   const user = await User.findById(payload.userId);
   if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
   }

   const sessionUser: SessionUser = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: "student",
   };

   return sessionUser;
}

export async function requireAdmin() {
   const payload = await getSessionPayload();
   if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
   }

   if (payload.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
   }

   await dbConnect();
   const admin = await Admin.findById(payload.userId);
   if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
   }

   const sessionAdmin: SessionUser = {
      id: admin._id.toString(),
      name: admin.name,
      email: admin.email,
      role: "admin",
   };

   return sessionAdmin;
}
