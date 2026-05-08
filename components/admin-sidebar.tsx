"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useAdminAuth } from "@/context/admin-auth-context";

type NavItem = {
   label: string;
   href: string;
   icon: React.ReactNode;
};

type AdminSidebarProps = {
   mobileOpen?: boolean;
   onMobileClose?: () => void;
};

const navItems: NavItem[] = [
   {
      label: "Dashboard",
      href: "/admin",
      icon: (
         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
         </svg>
      ),
   },
   {
      label: "Create Quiz",
      href: "/admin/quiz/new",
      icon: (
         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
         </svg>
      ),
   },
];

export default function AdminSidebar({ mobileOpen = false, onMobileClose }: AdminSidebarProps) {
   const pathname = usePathname();
   const router = useRouter();
   const { admin, logout } = useAdminAuth();
   const [collapsed, setCollapsed] = useState(false);

   const handleMobileClose = () => {
      if (onMobileClose) {
         onMobileClose();
      }
   };

   if (!admin) return null;

   return (
      <aside
         className={`fixed inset-y-0 left-0 z-50 flex h-screen w-72 max-w-[85vw] flex-col border-r border-border/40 bg-sidebar transition-all duration-300 md:static md:z-auto md:translate-x-0 ${collapsed ? "md:w-[72px]" : "md:w-64"
            } ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
         {/* Header */}
         <div className="flex h-16 items-center justify-between border-b border-border/40 px-4">
            <Link href="/admin" className="flex items-center gap-2" onClick={handleMobileClose}>
               <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                     <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                     <circle cx="12" cy="12" r="3" />
                  </svg>
               </div>
               <span className={`text-sm font-bold text-sidebar-foreground ${collapsed ? "md:hidden" : ""
                  }`}
               >
                  Admin Panel
               </span>
            </Link>
            <button
               onClick={handleMobileClose}
               className="flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground md:hidden"
               aria-label="Close sidebar"
               type="button"
            >
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
               </svg>
            </button>
            <button
               onClick={() => setCollapsed(!collapsed)}
               className="hidden h-8 w-8 items-center justify-center rounded-lg text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground md:flex"
               aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
               id="admin-sidebar-toggle"
               type="button"
            >
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {collapsed ? (
                     <>
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                     </>
                  ) : (
                     <>
                        <line x1="19" y1="12" x2="5" y2="12" />
                        <polyline points="12 19 5 12 12 5" />
                     </>
                  )}
               </svg>
            </button>
         </div>

         {/* Nav Items */}
         <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {navItems.map((item) => {
               const isActive = pathname === item.href;
               return (
                  <Link
                     key={item.href}
                     href={item.href}
                     onClick={handleMobileClose}
                     className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${isActive
                           ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                           : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        } ${collapsed ? "md:justify-center" : ""}`}
                     title={collapsed ? item.label : undefined}
                  >
                     <span className="flex-shrink-0">{item.icon}</span>
                     <span className={`${collapsed ? "md:hidden" : ""}`}>{item.label}</span>
                  </Link>
               );
            })}
         </nav>

         {/* Bottom - User Info */}
         <div className="border-t border-border/40 p-3">
            <div
               className={`flex items-center gap-3 rounded-lg p-2 ${collapsed ? "md:justify-center" : ""
                  }`}
            >
               <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-xs font-bold text-white">
                  A
               </div>
               <div className={`flex-1 overflow-hidden ${collapsed ? "md:hidden" : ""}`}>
                  <p className="truncate text-xs font-semibold text-sidebar-foreground">Admin</p>
                  <p className="truncate text-[11px] text-sidebar-foreground/60">{admin.email}</p>
               </div>
            </div>
            <button
               onClick={async () => {
                  handleMobileClose();
                  await logout();
                  router.push("/");
               }}
               className={`mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30 ${collapsed ? "md:justify-center" : ""
                  }`}
               title={collapsed ? "Sign out" : undefined}
               id="admin-signout-btn"
               type="button"
            >
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
               </svg>
               <span className={`${collapsed ? "md:hidden" : ""}`}>Sign out</span>
            </button>
         </div>
      </aside>
   );
}
