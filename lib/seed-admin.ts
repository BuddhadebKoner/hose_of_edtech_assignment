import bcrypt from "bcryptjs";

import { Admin } from "@/lib/models/admin";

export async function seedAdmin() {
   const email = process.env.ADMIN_EMAIL;
   const password = process.env.ADMIN_PASSWORD;
   const name = process.env.ADMIN_NAME ?? "Admin";

   if (!email || !password) {
      throw new Error("Missing ADMIN_EMAIL or ADMIN_PASSWORD in environment");
   }

   const normalizedEmail = email.toLowerCase();
   const existing = await Admin.findOne({ email: normalizedEmail });

   if (existing) {
      return existing;
   }

   const hashed = await bcrypt.hash(password, 12);

   return Admin.create({
      name,
      email: normalizedEmail,
      password: hashed,
      role: "admin",
   });
}
