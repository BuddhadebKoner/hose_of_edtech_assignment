import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, verifyAccessToken } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { Admin } from "@/lib/models/admin";
import { User } from "@/lib/models/users";

export async function GET() {
   const cookieStore = await cookies();
   const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

   if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
   }

   try {
      const payload = await verifyAccessToken(token);
      await dbConnect();

      if (payload.role === "admin") {
         const admin = await Admin.findById(payload.userId);
         if (!admin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
         }
         return NextResponse.json({
            id: admin._id,
            name: admin.name,
            email: admin.email,
            role: "admin",
         });
      }

      const user = await User.findById(payload.userId);
      if (!user) {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      return NextResponse.json({
         id: user._id,
         name: user.name,
         email: user.email,
         role: "student",
      });
   } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
   }
}
