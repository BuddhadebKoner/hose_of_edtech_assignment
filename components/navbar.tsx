"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useStudentAuth } from "@/context/student-auth-context";
import { useAdminAuth } from "@/context/admin-auth-context";

export default function Navbar() {
   const router = useRouter();
   const { student, loading: studentLoading, logout: studentLogout } = useStudentAuth();
   const { admin, loading: adminLoading, logout: adminLogout } = useAdminAuth();
   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
   const [profileOpen, setProfileOpen] = useState(false);
   const profileRef = useRef<HTMLDivElement>(null);
   const [scrolled, setScrolled] = useState(false);

   const isLoggedIn = !!student || !!admin;
   const loading = studentLoading || adminLoading;
   const userName = student?.name || admin?.name || admin?.email || "";
   const userInitial = userName ? userName.charAt(0).toUpperCase() : "U";
   const userRole = admin ? "admin" : "student";

   useEffect(() => {
      const handleScroll = () => setScrolled(window.scrollY > 10);
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
   }, []);

   useEffect(() => {
      function handleClickOutside(e: MouseEvent) {
         if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
            setProfileOpen(false);
         }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
   }, []);

   const handleLogout = async () => {
      setProfileOpen(false);
      if (admin) {
         await adminLogout();
         router.push("/");
      } else if (student) {
         await studentLogout();
         router.push("/");
      }
   };

   return (
      <header
         className={`sticky top-0 z-50 w-full transition-all duration-300 ${
            scrolled
               ? "border-b border-border/50 bg-background/80 shadow-sm backdrop-blur-xl"
               : "bg-transparent"
         }`}
      >
         <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group" id="nav-logo">
               <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 transition-transform duration-200 group-hover:scale-105">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                     <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                     <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                  </svg>
               </div>
               <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                  QuizMaster
               </span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden items-center gap-1 md:flex">
               <Link
                  href="/"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  id="nav-home"
               >
                  Home
               </Link>
               {isLoggedIn && userRole === "student" && (
                  <>
                     <Link
                        href="/dashboard"
                        className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        id="nav-dashboard"
                     >
                        Dashboard
                     </Link>
                     <Link
                        href="/profile"
                        className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        id="nav-profile"
                     >
                        Profile
                     </Link>
                  </>
               )}
               {isLoggedIn && userRole === "admin" && (
                  <Link
                     href="/admin"
                     className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                     id="nav-admin"
                  >
                     Admin Panel
                  </Link>
               )}
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-3">
               {loading ? (
                  <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
               ) : isLoggedIn ? (
                  <div className="relative" ref={profileRef}>
                     <button
                        onClick={() => setProfileOpen(!profileOpen)}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-sm font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
                        id="nav-profile-btn"
                        aria-label="User menu"
                     >
                        {userInitial}
                     </button>

                     {profileOpen && (
                        <div className="absolute right-0 top-12 w-64 overflow-hidden rounded-xl border border-border/60 bg-popover p-1 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                           <div className="border-b border-border/40 px-3 py-3">
                              <p className="text-sm font-semibold text-foreground">{userName || "User"}</p>
                              <p className="text-xs text-muted-foreground">
                                 {student?.email || admin?.email}
                              </p>
                              <span className="mt-1 inline-block rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                                 {userRole}
                              </span>
                           </div>
                           <div className="py-1">
                              {userRole === "student" && (
                                 <>
                                    <button
                                       onClick={() => { setProfileOpen(false); router.push("/dashboard"); }}
                                       className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                                    >
                                       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                                       Dashboard
                                    </button>
                                    <button
                                       onClick={() => { setProfileOpen(false); router.push("/profile"); }}
                                       className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                                    >
                                       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                       My Profile
                                    </button>
                                 </>
                              )}
                              {userRole === "admin" && (
                                 <button
                                    onClick={() => { setProfileOpen(false); router.push("/admin"); }}
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                                 >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                                    Admin Panel
                                 </button>
                              )}
                           </div>
                           <div className="border-t border-border/40 py-1">
                              <button
                                 onClick={handleLogout}
                                 className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                              >
                                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                                 Sign out
                              </button>
                           </div>
                        </div>
                     )}
                  </div>
               ) : (
                  <div className="hidden items-center gap-2 sm:flex">
                     <Link
                        href="/login"
                        className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        id="nav-login"
                     >
                        Log in
                     </Link>
                     <Link
                        href="/signup"
                        className="rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-md transition-all duration-200 hover:shadow-lg hover:brightness-110"
                        id="nav-signup"
                     >
                        Sign up free
                     </Link>
                  </div>
               )}

               {/* Mobile Hamburger */}
               <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden"
                  id="nav-mobile-toggle"
                  aria-label="Toggle menu"
               >
                  {mobileMenuOpen ? (
                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  ) : (
                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
                  )}
               </button>
            </div>
         </nav>

         {/* Mobile Menu */}
         {mobileMenuOpen && (
            <div className="border-t border-border/40 bg-background/95 backdrop-blur-xl md:hidden animate-in slide-in-from-top-1 duration-200">
               <div className="space-y-1 px-4 pb-4 pt-2">
                  <Link
                     href="/"
                     onClick={() => setMobileMenuOpen(false)}
                     className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                     Home
                  </Link>
                  {isLoggedIn && userRole === "student" && (
                     <>
                        <Link
                           href="/dashboard"
                           onClick={() => setMobileMenuOpen(false)}
                           className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        >
                           Dashboard
                        </Link>
                        <Link
                           href="/profile"
                           onClick={() => setMobileMenuOpen(false)}
                           className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        >
                           Profile
                        </Link>
                     </>
                  )}
                  {isLoggedIn && userRole === "admin" && (
                     <Link
                        href="/admin"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                     >
                        Admin Panel
                     </Link>
                  )}
                  {!isLoggedIn && !loading && (
                     <div className="flex flex-col gap-2 pt-2">
                        <Link
                           href="/login"
                           onClick={() => setMobileMenuOpen(false)}
                           className="rounded-lg border border-border px-4 py-2.5 text-center text-sm font-medium text-foreground transition-colors hover:bg-accent"
                        >
                           Log in
                        </Link>
                        <Link
                           href="/signup"
                           onClick={() => setMobileMenuOpen(false)}
                           className="rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-center text-sm font-medium text-white shadow-md"
                        >
                           Sign up free
                        </Link>
                     </div>
                  )}
               </div>
            </div>
         )}
      </header>
   );
}
