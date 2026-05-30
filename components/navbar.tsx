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
         className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled ? "border-b border-border backdrop-blur-[16px]" : ""
            }`}
         style={{
            background: scrolled ? 'oklch(0.97 0.004 285 / 0.85)' : 'transparent',
            backdropFilter: scrolled ? 'blur(16px) saturate(1.4)' : 'none'
         }}
      >
         <nav className="mx-auto flex h-[52px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Logo */}
            <Link href="/" className="flex items-center group" id="nav-logo">
               <span className="font-display italic font-semibold text-purple-600 text-lg">
                  QuizMaster
               </span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden items-center gap-1 md:flex">
               <Link
                  href="/"
                  className="px-3 py-2 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground relative"
                  id="nav-home"
               >
                  Home
               </Link>
               {isLoggedIn && userRole === "student" && (
                  <>
                     <Link
                        href="/dashboard"
                        className="px-3 py-2 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground relative"
                        id="nav-dashboard"
                     >
                        Dashboard
                     </Link>
                     <Link
                        href="/profile"
                        className="px-3 py-2 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground relative"
                        id="nav-profile"
                     >
                        Profile
                     </Link>
                  </>
               )}
               {isLoggedIn && userRole === "admin" && (
                  <Link
                     href="/admin"
                     className="px-3 py-2 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground relative"
                     id="nav-admin"
                  >
                     Admin Panel
                  </Link>
               )}
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-3">
               {loading ? (
                  <div className="h-9 w-9 animate-pulse rounded-avatar bg-purple-100" />
               ) : isLoggedIn ? (
                  <div className="relative" ref={profileRef}>
                     <button
                        onClick={() => setProfileOpen(!profileOpen)}
                        className="flex h-9 w-9 items-center justify-center rounded-avatar bg-purple-100 text-sm font-semibold text-purple-600 border-[1.5px] border-purple-200 transition-all duration-200 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
                        id="nav-profile-btn"
                        aria-label="User menu"
                     >
                        {userInitial}
                     </button>

                     {profileOpen && (
                        <div className="absolute right-0 top-12 w-64 overflow-hidden rounded-card border border-border bg-surface-raised shadow-raised animate-in fade-in slide-in-from-top-2 duration-200 backdrop-blur-sm">
                           <div className="border-b border-border px-3 py-3">
                              <p className="text-sm font-semibold text-foreground">{userName || "User"}</p>
                              <p className="text-xs text-foreground-muted">
                                 {student?.email || admin?.email}
                              </p>
                              <span className="tag mt-2 inline-block text-[10px]">
                                 {userRole}
                              </span>
                           </div>
                           <div className="py-1">
                              {userRole === "student" && (
                                 <>
                                    <button
                                       onClick={() => { setProfileOpen(false); router.push("/dashboard"); }}
                                       className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground-muted transition-colors hover:bg-purple-100 hover:text-foreground"
                                    >
                                       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
                                       Dashboard
                                    </button>
                                    <button
                                       onClick={() => { setProfileOpen(false); router.push("/profile"); }}
                                       className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground-muted transition-colors hover:bg-purple-100 hover:text-foreground"
                                    >
                                       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                       My Profile
                                    </button>
                                 </>
                              )}
                              {userRole === "admin" && (
                                 <button
                                    onClick={() => { setProfileOpen(false); router.push("/admin"); }}
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground-muted transition-colors hover:bg-purple-100 hover:text-foreground"
                                 >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
                                    Admin Panel
                                 </button>
                              )}
                           </div>
                           <div className="border-t border-border py-1">
                              <button
                                 onClick={handleLogout}
                                 className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive-surface"
                              >
                                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
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
                        className="px-4 py-2 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground"
                        id="nav-login"
                     >
                        Log in
                     </Link>
                     <Link
                        href="/signup"
                        className="rounded-button bg-purple-500 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-purple-600 shadow-button"
                        id="nav-signup"
                     >
                        Sign up free
                     </Link>
                  </div>
               )}

               {/* Mobile Hamburger */}
               <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground-muted transition-colors hover:bg-purple-100 hover:text-foreground md:hidden"
                  id="nav-mobile-toggle"
                  aria-label="Toggle menu"
               >
                  {mobileMenuOpen ? (
                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  ) : (
                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" /></svg>
                  )}
               </button>
            </div>
         </nav>

         {/* Mobile Menu */}
         {mobileMenuOpen && (
            <div className="border-t border-border backdrop-blur-[16px] md:hidden animate-in slide-in-from-top-1 duration-200" style={{ background: 'oklch(0.97 0.004 285 / 0.85)', backdropFilter: 'blur(16px) saturate(1.4)' }}>
               <div className="space-y-1 px-4 pb-4 pt-2">
                  <Link
                     href="/"
                     onClick={() => setMobileMenuOpen(false)}
                     className="block px-3 py-2.5 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground border-b border-border"
                  >
                     Home
                  </Link>
                  {isLoggedIn && userRole === "student" && (
                     <>
                        <Link
                           href="/dashboard"
                           onClick={() => setMobileMenuOpen(false)}
                           className="block px-3 py-2.5 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground border-b border-border"
                        >
                           Dashboard
                        </Link>
                        <Link
                           href="/profile"
                           onClick={() => setMobileMenuOpen(false)}
                           className="block px-3 py-2.5 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground border-b border-border"
                        >
                           Profile
                        </Link>
                     </>
                  )}
                  {isLoggedIn && userRole === "admin" && (
                     <Link
                        href="/admin"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-3 py-2.5 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground border-b border-border"
                     >
                        Admin Panel
                     </Link>
                  )}
                  {!isLoggedIn && !loading && (
                     <div className="flex flex-col gap-2 pt-2">
                        <Link
                           href="/login"
                           onClick={() => setMobileMenuOpen(false)}
                           className="rounded-button border border-border px-4 py-2.5 text-center text-sm font-medium text-foreground transition-colors hover:bg-purple-100"
                        >
                           Log in
                        </Link>
                        <Link
                           href="/signup"
                           onClick={() => setMobileMenuOpen(false)}
                           className="rounded-button bg-purple-500 px-4 py-2.5 text-center text-sm font-medium text-white shadow-button hover:bg-purple-600"
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
