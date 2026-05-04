import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { dbConnect } from "@/lib/db";
import { User } from "@/lib/models/users";

const registerSchema = z.object({
   name: z.string().min(2).max(50),
   email: z.string().email(),
   password: z.string().min(8),
});

export async function POST(req: Request) {
   const body = await req.json().catch(() => null);
   const parsed = registerSchema.safeParse(body);

   if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
   }

   const { name, email, password } = parsed.data;
   const normalizedEmail = email.toLowerCase();
   const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();

   if (adminEmail && normalizedEmail === adminEmail) {
      return NextResponse.json({ error: "Email reserved" }, { status: 409 });
   }

   await dbConnect();

   const existing = await User.findOne({ email: normalizedEmail });
   if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
   }

   const hashed = await bcrypt.hash(password, 12);
   const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashed,
      role: "student",
   });

   return NextResponse.json(
      { id: user._id, name: user.name, email: user.email, role: user.role },
      { status: 201 }
   );
}
