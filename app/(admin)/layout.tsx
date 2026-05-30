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
      <div className="h-screen flex overflow-hidden" style={{ background: 'var(--background)' }}>
         <AdminSidebar
            mobileOpen={mobileSidebarOpen}
            onMobileClose={() => setMobileSidebarOpen(false)}
         />

         {/* Mobile backdrop */}
         {mobileSidebarOpen && (
            <div
               className="fixed inset-0 z-40 md:hidden"
               style={{ background: 'oklch(0 0 0 / 0.4)' }}
               onClick={() => setMobileSidebarOpen(false)}
               aria-hidden="true"
            />
         )}

         {/* Main content area - separate scroll container */}
         <div className="flex-1 flex flex-col h-screen overflow-hidden">
            {/* Mobile header with hamburger */}
            <header className="flex-shrink-0 flex h-14 items-center gap-3 px-4 md:hidden" style={{ background: 'var(--background)', borderBottom: '1px solid var(--border)' }}>
               <button
                  onClick={() => setMobileSidebarOpen(true)}
                  className="flex h-9 w-9 items-center justify-center rounded-input text-foreground-muted transition-colors hover:bg-purple-100 hover:text-foreground"
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

            {/* Scrollable main content */}
            <main
               className="flex-1 overflow-y-auto"
               style={{
                  background: 'var(--background)',
                  backgroundImage: `
                     repeating-linear-gradient(45deg, oklch(0.54 0.175 292 / 0.03) 0, oklch(0.54 0.175 292 / 0.03) 1px, transparent 1px, transparent 20px),
                     repeating-linear-gradient(-45deg, oklch(0.54 0.175 292 / 0.03) 0, oklch(0.54 0.175 292 / 0.03) 1px, transparent 1px, transparent 20px)
                  `,
                  backgroundSize: '40px 40px',
               }}
            >
               {children}
            </main>
         </div>
      </div>
   );
}
