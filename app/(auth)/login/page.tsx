"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
   Card,
   CardContent,
   CardDescription,
   CardFooter,
   CardHeader,
   CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAdminAuth } from "@/context/admin-auth-context";
import { useStudentAuth } from "@/context/student-auth-context";

type LoginTab = "student" | "admin";

export default function LoginPage() {
   const router = useRouter();
   const { login: loginStudent, loading: studentLoading } = useStudentAuth();
   const { login: loginAdmin, loading: adminLoading } = useAdminAuth();

   const [activeTab, setActiveTab] = useState<LoginTab>("student");

   const [studentEmail, setStudentEmail] = useState("");
   const [studentPassword, setStudentPassword] = useState("");
   const [studentError, setStudentError] = useState<string | null>(null);

   const [adminEmail, setAdminEmail] = useState("");
   const [adminPassword, setAdminPassword] = useState("");
   const [adminError, setAdminError] = useState<string | null>(null);

   const handleStudentSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setStudentError(null);
      const result = await loginStudent(studentEmail, studentPassword);
      if (result.ok) {
         router.push("/dashboard");
      } else {
         setStudentError(result.error ?? "Login failed");
      }
   };

   const handleAdminSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setAdminError(null);
      const result = await loginAdmin(adminEmail, adminPassword);
      if (result.ok) {
         router.push("/admin");
      } else {
         setAdminError(result.error ?? "Login failed");
      }
   };

   return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950/30">
         {/* Top Navigation */}
         <nav className="flex items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-center gap-2.5 group" id="login-nav-logo">
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
            <div className="flex items-center gap-3">
               <Link href="/" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground" id="login-nav-home">
                  Home
               </Link>
               <Link href="/signup" className="rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-md transition-all hover:shadow-lg hover:brightness-110" id="login-nav-signup">
                  Sign up free
               </Link>
            </div>
         </nav>

         {/* Main */}
         <div className="flex flex-1 flex-col items-center justify-center px-4 pb-16">
            {/* Heading */}
            <div className="mb-8 text-center">
               <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                  Welcome back
               </h1>
               <p className="mt-2 text-muted-foreground">
                  Sign in to continue to QuizMaster
               </p>
            </div>

            <Card className="w-full max-w-md shadow-xl shadow-violet-100/50 dark:shadow-violet-900/10">
               {/* Tab Switcher */}
               <div className="flex border-b border-border">
                  <button
                     onClick={() => setActiveTab("student")}
                     className={`flex-1 py-3.5 text-center text-sm font-semibold transition-all duration-200 ${
                        activeTab === "student"
                           ? "border-b-2 border-violet-600 text-violet-600"
                           : "text-muted-foreground hover:text-foreground"
                     }`}
                     id="login-tab-student"
                  >
                     <span className="flex items-center justify-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        Student
                     </span>
                  </button>
                  <button
                     onClick={() => setActiveTab("admin")}
                     className={`flex-1 py-3.5 text-center text-sm font-semibold transition-all duration-200 ${
                        activeTab === "admin"
                           ? "border-b-2 border-violet-600 text-violet-600"
                           : "text-muted-foreground hover:text-foreground"
                     }`}
                     id="login-tab-admin"
                  >
                     <span className="flex items-center justify-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                        Admin
                     </span>
                  </button>
               </div>

               {/* Student Login */}
               {activeTab === "student" && (
                  <>
                     <CardHeader>
                        <CardTitle>Student Login</CardTitle>
                        <CardDescription>Sign in with your student email and password.</CardDescription>
                     </CardHeader>
                     <CardContent>
                        <form className="space-y-4" onSubmit={handleStudentSubmit}>
                           <div className="space-y-2">
                              <label className="text-sm font-medium" htmlFor="student-email">Email</label>
                              <Input id="student-email" type="email" autoComplete="email" placeholder="you@example.com" value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} required />
                           </div>
                           <div className="space-y-2">
                              <label className="text-sm font-medium" htmlFor="student-password">Password</label>
                              <Input id="student-password" type="password" autoComplete="current-password" placeholder="••••••••" value={studentPassword} onChange={(e) => setStudentPassword(e.target.value)} required />
                           </div>
                           {studentError ? (<p className="text-sm text-destructive">{studentError}</p>) : null}
                           <Button type="submit" disabled={studentLoading} className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md hover:shadow-lg hover:brightness-110">
                              {studentLoading ? "Signing in..." : "Sign in as Student"}
                           </Button>
                        </form>
                     </CardContent>
                     <CardFooter className="flex flex-col items-center gap-3 text-sm">
                        <div className="flex items-center gap-1">
                           <span className="text-muted-foreground">New here?</span>
                           <Link className="font-semibold text-violet-600 hover:text-violet-700 hover:underline" href="/signup">Create a student account</Link>
                        </div>
                        <div className="flex items-center gap-1">
                           <span className="text-muted-foreground">Are you an admin?</span>
                           <button onClick={() => setActiveTab("admin")} className="font-semibold text-violet-600 hover:text-violet-700 hover:underline">Switch to Admin login</button>
                        </div>
                     </CardFooter>
                  </>
               )}

               {/* Admin Login */}
               {activeTab === "admin" && (
                  <>
                     <CardHeader>
                        <CardTitle>Admin Login</CardTitle>
                        <CardDescription>Sign in with your admin credentials.</CardDescription>
                     </CardHeader>
                     <CardContent>
                        <form className="space-y-4" onSubmit={handleAdminSubmit}>
                           <div className="space-y-2">
                              <label className="text-sm font-medium" htmlFor="admin-email">Admin Email</label>
                              <Input id="admin-email" type="email" autoComplete="email" placeholder="admin@example.com" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required />
                           </div>
                           <div className="space-y-2">
                              <label className="text-sm font-medium" htmlFor="admin-password">Password</label>
                              <Input id="admin-password" type="password" autoComplete="current-password" placeholder="••••••••" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} required />
                           </div>
                           {adminError ? <p className="text-sm text-destructive">{adminError}</p> : null}
                           <Button type="submit" disabled={adminLoading} className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md hover:shadow-lg hover:brightness-110">
                              {adminLoading ? "Signing in..." : "Sign in as Admin"}
                           </Button>
                        </form>
                     </CardContent>
                     <CardFooter className="flex flex-col items-center gap-3 text-sm">
                        <p className="text-xs text-muted-foreground">Admin credentials are seeded via environment variables.</p>
                        <div className="flex items-center gap-1">
                           <span className="text-muted-foreground">Not an admin?</span>
                           <button onClick={() => setActiveTab("student")} className="font-semibold text-violet-600 hover:text-violet-700 hover:underline">Switch to Student login</button>
                        </div>
                        <Link href="/admin" className="text-xs text-muted-foreground hover:text-foreground hover:underline">
                           Go directly to Admin Panel →
                        </Link>
                     </CardFooter>
                  </>
               )}
            </Card>

            {/* Bottom navigation links */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
               <Link href="/" className="hover:text-foreground transition-colors">← Back to Home</Link>
               <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
               <Link href="/signup" className="hover:text-foreground transition-colors">Create Account</Link>
               <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
               <Link href="/admin" className="hover:text-foreground transition-colors">Admin Panel</Link>
            </div>
         </div>
      </div>
   );
}