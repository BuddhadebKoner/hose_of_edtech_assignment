import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { dbConnect } from "@/lib/db";
import { User } from "@/lib/models/users";

const registerSchema = z.object({
   name: z.string()
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name must not exceed 50 characters")
      .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes"),
   email: z.string()
      .email("Please enter a valid email address")
      .max(100, "Email must not exceed 100 characters"),
   password: z.string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must not exceed 128 characters")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
});

export async function POST(req: Request) {
   const body = await req.json().catch(() => null);
   const parsed = registerSchema.safeParse(body);

   if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json({ error: firstError.message }, { status: 400 });
   }

   const { name, email, password } = parsed.data;
   const normalizedEmail = email.toLowerCase();
   const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();

   if (adminEmail && normalizedEmail === adminEmail) {
      return NextResponse.json({ error: "This email is reserved and cannot be used" }, { status: 409 });
   }

   await dbConnect();

   const existing = await User.findOne({ email: normalizedEmail });
   if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
   }

   const hashed = await bcrypt.hash(password, 12);
   const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashed,
      role: "student",
   });

   return NextResponse.json(
      { id: user._id, name: user.name, email: user.email, role: user.role },
      { status: 201 }
   );
}
