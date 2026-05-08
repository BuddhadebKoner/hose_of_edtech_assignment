"use client";

import { useState, type ReactNode } from "react";

import AdminSidebar from "@/components/admin-sidebar";
import { useAdminAuth } from "@/context/admin-auth-context";

export default function AdminLayout({ children }: { children: ReactNode }) {
   const { admin } = useAdminAuth();
   const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

   // If not logged in as admin, render without sidebar (login form)
   if (!admin) {
      return <>{children}</>;
   }

   return (
      <div className="flex min-h-screen">
         <AdminSidebar
            mobileOpen={mobileSidebarOpen}
            onMobileClose={() => setMobileSidebarOpen(false)}
         />
         {mobileSidebarOpen && (
            <div
               className="fixed inset-0 z-40 bg-black/40 md:hidden"
               onClick={() => setMobileSidebarOpen(false)}
               aria-hidden="true"
            />
         )}
         <div className="flex min-h-screen flex-1 flex-col">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/40 bg-background/80 px-4 backdrop-blur md:hidden">
               <button
                  onClick={() => setMobileSidebarOpen(true)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  aria-label="Open sidebar"
                  type="button"
               >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                     <line x1="4" y1="6" x2="20" y2="6" />
                     <line x1="4" y1="12" x2="20" y2="12" />
                     <line x1="4" y1="18" x2="20" y2="18" />
                  </svg>
               </button>
               <span className="text-sm font-semibold text-foreground">Admin Panel</span>
            </header>
            <main className="flex-1 overflow-y-auto bg-background">
               {children}
            </main>
         </div>
      </div>
   );
}
