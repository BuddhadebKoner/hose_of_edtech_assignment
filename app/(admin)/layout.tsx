"use client";

import type { ReactNode } from "react";

import AdminSidebar from "@/components/admin-sidebar";
import { useAdminAuth } from "@/context/admin-auth-context";

export default function AdminLayout({ children }: { children: ReactNode }) {
   const { admin } = useAdminAuth();

   // If not logged in as admin, render without sidebar (login form)
   if (!admin) {
      return <>{children}</>;
   }

   return (
      <div className="flex min-h-screen">
         <AdminSidebar />
         <main className="flex-1 overflow-y-auto bg-background">
            {children}
         </main>
      </div>
   );
}
