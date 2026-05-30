"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminAuth } from "@/context/admin-auth-context";
import { useStudentAuth } from "@/context/student-auth-context";

type LoginTab = "student" | "admin";

interface ValidationErrors {
   email?: string;
   password?: string;
}

export default function LoginPage() {
   const router = useRouter();
   const { login: loginStudent, loading: studentLoading } = useStudentAuth();
   const { login: loginAdmin, loading: adminLoading } = useAdminAuth();

   const [activeTab, setActiveTab] = useState<LoginTab>("student");

   const [studentEmail, setStudentEmail] = useState("");
   const [studentPassword, setStudentPassword] = useState("");
   const [studentError, setStudentError] = useState<string | null>(null);
   const [studentValidationErrors, setStudentValidationErrors] = useState<ValidationErrors>({});

   const [adminEmail, setAdminEmail] = useState("");
   const [adminPassword, setAdminPassword] = useState("");
   const [adminError, setAdminError] = useState<string | null>(null);
   const [adminValidationErrors, setAdminValidationErrors] = useState<ValidationErrors>({});

   const validateEmail = (email: string): string | undefined => {
      if (!email) {
         return "Email is required";
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
         return "Please enter a valid email address";
      }
      return undefined;
   };

   const validatePassword = (password: string): string | undefined => {
      if (!password) {
         return "Password is required";
      }
      if (password.length < 6) {
         return "Password must be at least 6 characters";
      }
      return undefined;
   };

   const handleStudentEmailChange = (email: string) => {
      setStudentEmail(email);
      if (studentValidationErrors.email) {
         setStudentValidationErrors(prev => ({ ...prev, email: undefined }));
      }
      setStudentError(null);
   };

   const handleStudentPasswordChange = (password: string) => {
      setStudentPassword(password);
      if (studentValidationErrors.password) {
         setStudentValidationErrors(prev => ({ ...prev, password: undefined }));
      }
      setStudentError(null);
   };

   const handleAdminEmailChange = (email: string) => {
      setAdminEmail(email);
      if (adminValidationErrors.email) {
         setAdminValidationErrors(prev => ({ ...prev, email: undefined }));
      }
      setAdminError(null);
   };

   const handleAdminPasswordChange = (password: string) => {
      setAdminPassword(password);
      if (adminValidationErrors.password) {
         setAdminValidationErrors(prev => ({ ...prev, password: undefined }));
      }
      setAdminError(null);
   };

   const handleStudentSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setStudentError(null);

      const errors: ValidationErrors = {};
      const emailError = validateEmail(studentEmail);
      const passwordError = validatePassword(studentPassword);

      if (emailError) errors.email = emailError;
      if (passwordError) errors.password = passwordError;

      if (Object.keys(errors).length > 0) {
         setStudentValidationErrors(errors);
         return;
      }

      setStudentValidationErrors({});
      const result = await loginStudent(studentEmail, studentPassword);
      if (result.ok) {
         router.push("/dashboard");
      } else {
         setStudentError(result.error ?? "Login failed. Please check your credentials.");
      }
   };

   const handleAdminSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setAdminError(null);

      const errors: ValidationErrors = {};
      const emailError = validateEmail(adminEmail);
      const passwordError = validatePassword(adminPassword);

      if (emailError) errors.email = emailError;
      if (passwordError) errors.password = passwordError;

      if (Object.keys(errors).length > 0) {
         setAdminValidationErrors(errors);
         return;
      }

      setAdminValidationErrors({});
      const result = await loginAdmin(adminEmail, adminPassword);
      if (result.ok) {
         router.push("/admin");
      } else {
         setAdminError(result.error ?? "Login failed. Please check your credentials.");
      }
   };

   return (
      <div className="min-h-screen w-full relative" style={{ background: 'var(--background)' }}>
         {/* Diagonal grid overlay */}
         <div
            className="absolute inset-0 z-0 pointer-events-none"
            style={{
               backgroundImage: `
                  repeating-linear-gradient(
                     45deg,
                     oklch(0.54 0.175 292 / 0.07) 0,
                     oklch(0.54 0.175 292 / 0.07) 1px,
                     transparent 1px,
                     transparent 20px
                  ),
                  repeating-linear-gradient(
                     -45deg,
                     oklch(0.54 0.175 292 / 0.07) 0,
                     oklch(0.54 0.175 292 / 0.07) 1px,
                     transparent 1px,
                     transparent 20px
                  )
               `,
               backgroundSize: '40px 40px',
            }}
         />

         {/* Radial fade */}
         <div
            className="absolute inset-0 z-0 pointer-events-none"
            style={{
               background: 'radial-gradient(ellipse 70% 60% at 50% 50%, var(--background) 40%, transparent 100%)',
            }}
         />

         {/* Content */}
         <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
            {/* Logo */}
            <div className="mb-8 text-center">
               <Link href="/">
                  <span
                     className="font-display italic font-semibold text-purple-600"
                     style={{ fontSize: '1.75rem', letterSpacing: '-0.01em' }}
                  >
                     QuizMaster
                  </span>
               </Link>
            </div>

            {/* Auth Card */}
            <div
               className="w-full max-w-[420px] surface-raised"
               style={{
                  padding: '36px 40px',
                  borderRadius: 'var(--radius-card)',
                  boxShadow: 'var(--shadow-raised)',
               }}
            >
               {/* Card Header */}
               <div className="mb-7">
                  <h1 className="font-sans font-semibold text-foreground" style={{ fontSize: '1.375rem', marginBottom: '4px' }}>
                     Welcome back
                  </h1>
                  <p className="font-sans text-foreground-muted" style={{ fontSize: '0.875rem' }}>
                     Sign in to your account
                  </p>
               </div>

               {/* Tab Switcher */}
               <div className="flex gap-6 mb-6" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                  <button
                     onClick={() => setActiveTab("student")}
                     className={`pb-1 text-sm transition-colors ${activeTab === "student"
                           ? "text-foreground font-medium border-b-2 border-purple-400"
                           : "text-foreground-muted font-normal"
                        }`}
                     style={{ marginBottom: '-5px' }}
                  >
                     Student
                  </button>
                  <button
                     onClick={() => setActiveTab("admin")}
                     className={`pb-1 text-sm transition-colors ${activeTab === "admin"
                           ? "text-foreground font-medium border-b-2 border-purple-400"
                           : "text-foreground-muted font-normal"
                        }`}
                     style={{ marginBottom: '-5px' }}
                  >
                     Admin
                  </button>
               </div>

               {/* Student Login Form */}
               {activeTab === "student" && (
                  <form className="space-y-5" onSubmit={handleStudentSubmit}>
                     <div className="space-y-2">
                        <label
                           className="block text-xs uppercase tracking-wider text-foreground-muted"
                           htmlFor="student-email"
                        >
                           Email address
                        </label>
                        <Input
                           id="student-email"
                           type="email"
                           autoComplete="email"
                           placeholder="you@example.com"
                           value={studentEmail}
                           onChange={(e) => handleStudentEmailChange(e.target.value)}
                           className={studentValidationErrors.email ? "border-destructive" : ""}
                        />
                        {studentValidationErrors.email && (
                           <p className="text-xs text-destructive mt-1">{studentValidationErrors.email}</p>
                        )}
                     </div>

                     <div className="space-y-2">
                        <label
                           className="block text-xs uppercase tracking-wider text-foreground-muted"
                           htmlFor="student-password"
                        >
                           Password
                        </label>
                        <Input
                           id="student-password"
                           type="password"
                           autoComplete="current-password"
                           placeholder="••••••••"
                           value={studentPassword}
                           onChange={(e) => handleStudentPasswordChange(e.target.value)}
                           className={studentValidationErrors.password ? "border-destructive" : ""}
                        />
                        {studentValidationErrors.password && (
                           <p className="text-xs text-destructive mt-1">{studentValidationErrors.password}</p>
                        )}
                     </div>

                     {studentError && (
                        <p className="text-sm text-destructive font-medium">{studentError}</p>
                     )}

                     <Button
                        type="submit"
                        disabled={studentLoading}
                        className="w-full mt-2"
                        variant="default"
                     >
                        {studentLoading ? "Signing in..." : "Sign in"}
                     </Button>

                     <div className="text-center mt-5">
                        <p className="text-sm text-foreground-muted">
                           Don't have an account?{" "}
                           <Link href="/signup" className="text-purple-500 font-medium hover:text-purple-600">
                              Sign up
                           </Link>
                        </p>
                     </div>
                  </form>
               )}

               {/* Admin Login Form */}
               {activeTab === "admin" && (
                  <form className="space-y-5" onSubmit={handleAdminSubmit}>
                     <div className="space-y-2">
                        <label
                           className="block text-xs uppercase tracking-wider text-foreground-muted"
                           htmlFor="admin-email"
                        >
                           Email address
                        </label>
                        <Input
                           id="admin-email"
                           type="email"
                           autoComplete="email"
                           placeholder="admin@example.com"
                           value={adminEmail}
                           onChange={(e) => handleAdminEmailChange(e.target.value)}
                           className={adminValidationErrors.email ? "border-destructive" : ""}
                        />
                        {adminValidationErrors.email && (
                           <p className="text-xs text-destructive mt-1">{adminValidationErrors.email}</p>
                        )}
                     </div>

                     <div className="space-y-2">
                        <label
                           className="block text-xs uppercase tracking-wider text-foreground-muted"
                           htmlFor="admin-password"
                        >
                           Password
                        </label>
                        <Input
                           id="admin-password"
                           type="password"
                           autoComplete="current-password"
                           placeholder="••••••••"
                           value={adminPassword}
                           onChange={(e) => handleAdminPasswordChange(e.target.value)}
                           className={adminValidationErrors.password ? "border-destructive" : ""}
                        />
                        {adminValidationErrors.password && (
                           <p className="text-xs text-destructive mt-1">{adminValidationErrors.password}</p>
                        )}
                     </div>

                     {adminError && (
                        <p className="text-sm text-destructive font-medium">{adminError}</p>
                     )}

                     <Button
                        type="submit"
                        disabled={adminLoading}
                        className="w-full mt-2"
                        variant="default"
                     >
                        {adminLoading ? "Signing in..." : "Sign in as Admin"}
                     </Button>

                     <div className="text-center mt-5">
                        <p className="text-xs text-foreground-faint mb-3">
                           Admin credentials are seeded via environment variables.
                        </p>
                        <p className="text-sm text-foreground-muted">
                           Not an admin?{" "}
                           <button
                              type="button"
                              onClick={() => setActiveTab("student")}
                              className="text-purple-500 font-medium hover:text-purple-600"
                           >
                              Switch to Student
                           </button>
                        </p>
                     </div>
                  </form>
               )}
            </div>

            {/* Bottom Links */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-foreground-muted">
               <Link href="/" className="hover:text-foreground transition-colors">
                  ← Back to Home
               </Link>
               <span className="h-1 w-1 rounded-full bg-foreground-muted opacity-40" />
               <Link href="/signup" className="hover:text-foreground transition-colors">
                  Create Account
               </Link>
            </div>
         </div>
      </div>
   );
}
