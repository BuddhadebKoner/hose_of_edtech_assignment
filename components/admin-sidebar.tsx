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

   const userInitial = admin.email ? admin.email.charAt(0).toUpperCase() : "A";

   return (
      <aside
         className={`fixed inset-y-0 left-0 z-50 flex h-screen flex-col transition-all duration-200 md:static md:z-auto md:translate-x-0 ${collapsed ? "md:w-16" : "md:w-60"
            } ${mobileOpen ? "translate-x-0 w-[260px]" : "-translate-x-full w-[260px]"}`}
         style={{
            background: 'var(--foreground)',
            borderRight: '1px solid oklch(1 0 0 / 0.08)',
         }}
      >
         {/* Header / Logo Area */}
         <div
            className="flex h-14 items-center justify-between px-5"
            style={{ borderBottom: '1px solid oklch(1 0 0 / 0.08)' }}
         >
            <Link
               href="/admin"
               className="flex items-center"
               onClick={handleMobileClose}
            >
               {collapsed ? (
                  <span
                     className="font-display italic font-semibold hidden md:block"
                     style={{ color: 'white', fontSize: '1.1rem' }}
                  >
                     Q
                  </span>
               ) : (
                  <span
                     className="font-display italic font-semibold"
                     style={{ color: 'white', fontSize: '1.1rem' }}
                  >
                     QuizMaster
                  </span>
               )}
            </Link>

            {/* Close button (mobile) */}
            <button
               onClick={handleMobileClose}
               className="flex h-8 w-8 items-center justify-center rounded-input transition-colors md:hidden"
               style={{
                  background: 'oklch(1 0 0 / 0.08)',
                  color: 'oklch(0.72 0.006 285)',
               }}
               aria-label="Close sidebar"
               type="button"
            >
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
               </svg>
            </button>

            {/* Collapse toggle (desktop) */}
            <button
               onClick={() => setCollapsed(!collapsed)}
               className="hidden md:flex h-8 w-8 items-center justify-center rounded-input transition-colors hover:bg-[oklch(1_0_0_/_0.14)]"
               style={{
                  background: 'oklch(1 0 0 / 0.08)',
                  color: 'oklch(0.72 0.006 285)',
               }}
               aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
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

         {/* Navigation Items */}
         <nav className="flex-1 overflow-y-auto px-2 py-4">
            <div className="space-y-0.5">
               {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                     <Link
                        key={item.href}
                        href={item.href}
                        onClick={handleMobileClose}
                        className={`flex items-center gap-2.5 h-10 px-3 mx-2 rounded-input text-sm font-normal transition-all duration-150 ${collapsed ? "md:justify-center md:w-10 md:mx-auto md:px-0" : ""
                           }`}
                        style={{
                           background: isActive ? 'var(--purple-600)' : 'transparent',
                           color: isActive ? 'white' : 'oklch(0.72 0.006 285)',
                           fontWeight: isActive ? 500 : 400,
                           boxShadow: isActive ? '0 2px 8px oklch(0.34 0.170 292 / 0.4)' : 'none',
                        }}
                        onMouseEnter={(e) => {
                           if (!isActive) {
                              e.currentTarget.style.background = 'oklch(1 0 0 / 0.08)';
                              e.currentTarget.style.color = 'oklch(0.92 0 0)';
                           }
                        }}
                        onMouseLeave={(e) => {
                           if (!isActive) {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = 'oklch(0.72 0.006 285)';
                           }
                        }}
                        title={collapsed ? item.label : undefined}
                     >
                        <span className="flex-shrink-0" style={{ opacity: isActive ? 1 : 0.7 }}>
                           {item.icon}
                        </span>
                        <span className={`${collapsed ? "md:hidden" : ""}`}>{item.label}</span>
                     </Link>
                  );
               })}
            </div>
         </nav>

         {/* Bottom - User Info + Logout */}
         <div
            className="mt-auto px-2 py-3"
            style={{ borderTop: '1px solid oklch(1 0 0 / 0.08)' }}
         >
            {/* Admin info */}
            <div
               className={`flex items-center gap-3 px-2 py-2 mb-2 ${collapsed ? "md:justify-center" : ""
                  }`}
            >
               <div
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-avatar text-xs font-semibold"
                  style={{
                     background: 'var(--purple-600)',
                     color: 'white',
                     border: '1.5px solid var(--purple-500)',
                  }}
               >
                  {userInitial}
               </div>
               <div className={`flex-1 overflow-hidden ${collapsed ? "md:hidden" : ""}`}>
                  <p className="text-xs font-medium" style={{ color: 'white' }}>
                     Admin
                  </p>
                  <p
                     className="truncate font-mono text-[0.7rem]"
                     style={{ color: 'oklch(0.55 0.006 285)' }}
                  >
                     {admin.email}
                  </p>
               </div>
            </div>

            {/* Sign out button */}
            <button
               onClick={async () => {
                  handleMobileClose();
                  await logout();
                  router.push("/");
               }}
               className={`flex w-full items-center gap-2 h-9 px-3 rounded-input text-sm transition-colors ${collapsed ? "md:justify-center md:w-10 md:mx-auto md:px-0" : ""
                  }`}
               style={{
                  background: 'transparent',
                  color: 'oklch(0.60 0.006 285)',
               }}
               onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'oklch(1 0 0 / 0.08)';
                  e.currentTarget.style.color = 'var(--destructive)';
               }}
               onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'oklch(0.60 0.006 285)';
               }}
               title={collapsed ? "Sign out" : undefined}
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
