"use client";

import type { ReactNode } from "react";

import { AdminAuthProvider } from "@/context/admin-auth-context";
import { StudentAuthProvider } from "@/context/student-auth-context";

export default function Providers({ children }: { children: ReactNode }) {
   return (
      <AdminAuthProvider>
         <StudentAuthProvider>{children}</StudentAuthProvider>
      </AdminAuthProvider>
   );
}
