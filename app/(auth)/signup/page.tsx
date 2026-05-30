"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStudentAuth } from "@/context/student-auth-context";

interface ValidationErrors {
   name?: string;
   email?: string;
   password?: string;
}

type PasswordStrength = "empty" | "weak" | "fair" | "strong" | "very-strong";

export default function SignupPage() {
   const router = useRouter();
   const { register, loading } = useStudentAuth();

   const [name, setName] = useState("");
   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");
   const [error, setError] = useState<string | null>(null);
   const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
   const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

   const validateName = (name: string): string | undefined => {
      if (!name.trim()) {
         return "Name is required";
      }
      if (name.trim().length < 2) {
         return "Name must be at least 2 characters";
      }
      if (name.trim().length > 50) {
         return "Name must not exceed 50 characters";
      }
      if (!/^[a-zA-Z\s'-]+$/.test(name)) {
         return "Name can only contain letters, spaces, hyphens, and apostrophes";
      }
      return undefined;
   };

   const validateEmail = (email: string): string | undefined => {
      if (!email) {
         return "Email is required";
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
         return "Please enter a valid email address";
      }
      if (email.length > 100) {
         return "Email must not exceed 100 characters";
      }
      return undefined;
   };

   const validatePassword = (password: string): string | undefined => {
      if (!password) {
         return "Password is required";
      }
      if (password.length < 8) {
         return "Password must be at least 8 characters";
      }
      if (password.length > 128) {
         return "Password must not exceed 128 characters";
      }
      if (!/[a-z]/.test(password)) {
         return "Password must contain at least one lowercase letter";
      }
      if (!/[A-Z]/.test(password)) {
         return "Password must contain at least one uppercase letter";
      }
      if (!/[0-9]/.test(password)) {
         return "Password must contain at least one number";
      }
      return undefined;
   };

   const calculatePasswordStrength = (password: string): PasswordStrength => {
      if (!password) return "empty";

      let score = 0;

      // Length check
      if (password.length >= 8) score++;
      if (password.length >= 12) score++;

      // Character variety
      if (/[a-z]/.test(password)) score++;
      if (/[A-Z]/.test(password)) score++;
      if (/[0-9]/.test(password)) score++;
      if (/[^a-zA-Z0-9]/.test(password)) score++; // Special characters

      if (score <= 2) return "weak";
      if (score === 3) return "fair";
      if (score === 4 || score === 5) return "strong";
      return "very-strong";
   };

   const getPasswordStrengthDisplay = (strength: PasswordStrength) => {
      switch (strength) {
         case "empty":
            return { text: "—", color: "text-foreground-faint" };
         case "weak":
            return { text: "Weak", color: "text-[var(--score-fail)]" };
         case "fair":
            return { text: "Fair", color: "text-[var(--score-weak)]" };
         case "strong":
            return { text: "Strong", color: "text-[var(--score-good)]" };
         case "very-strong":
            return { text: "Very strong", color: "text-[var(--score-excellent)]" };
      }
   };

   const handleNameChange = (value: string) => {
      setName(value);
      if (touched.name) {
         const error = validateName(value);
         setValidationErrors(prev => ({ ...prev, name: error }));
      }
      setError(null);
   };

   const handleEmailChange = (value: string) => {
      setEmail(value);
      if (touched.email) {
         const error = validateEmail(value);
         setValidationErrors(prev => ({ ...prev, email: error }));
      }
      setError(null);
   };

   const handlePasswordChange = (value: string) => {
      setPassword(value);
      if (touched.password) {
         const error = validatePassword(value);
         setValidationErrors(prev => ({ ...prev, password: error }));
      }
      setError(null);
   };

   const handleBlur = (field: string) => {
      setTouched(prev => ({ ...prev, [field]: true }));

      if (field === 'name') {
         const error = validateName(name);
         setValidationErrors(prev => ({ ...prev, name: error }));
      } else if (field === 'email') {
         const error = validateEmail(email);
         setValidationErrors(prev => ({ ...prev, email: error }));
      } else if (field === 'password') {
         const error = validatePassword(password);
         setValidationErrors(prev => ({ ...prev, password: error }));
      }
   };

   const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(null);

      // Mark all fields as touched
      setTouched({ name: true, email: true, password: true });

      // Validate all fields
      const errors: ValidationErrors = {};
      const nameError = validateName(name);
      const emailError = validateEmail(email);
      const passwordError = validatePassword(password);

      if (nameError) errors.name = nameError;
      if (emailError) errors.email = emailError;
      if (passwordError) errors.password = passwordError;

      if (Object.keys(errors).length > 0) {
         setValidationErrors(errors);
         return;
      }

      setValidationErrors({});
      const result = await register(name, email, password);
      if (result.ok) {
         router.push("/dashboard");
      } else {
         setError(result.error ?? "Registration failed. Please try again.");
      }
   };

   const passwordStrength = calculatePasswordStrength(password);
   const strengthDisplay = getPasswordStrengthDisplay(passwordStrength);

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
                     Create your account
                  </h1>
                  <p className="font-sans text-foreground-muted" style={{ fontSize: '0.875rem' }}>
                     Start testing your knowledge today
                  </p>
               </div>

               {/* Signup Form */}
               <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                     <label
                        className="block text-xs uppercase tracking-wider text-foreground-muted"
                        htmlFor="name"
                     >
                        Full name
                     </label>
                     <Input
                        id="name"
                        value={name}
                        onChange={(event) => handleNameChange(event.target.value)}
                        onBlur={() => handleBlur('name')}
                        placeholder="John Doe"
                        className={validationErrors.name ? "border-destructive" : ""}
                     />
                     {validationErrors.name && (
                        <p className="text-xs text-destructive mt-1">{validationErrors.name}</p>
                     )}
                  </div>

                  <div className="space-y-2">
                     <label
                        className="block text-xs uppercase tracking-wider text-foreground-muted"
                        htmlFor="email"
                     >
                        Email address
                     </label>
                     <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(event) => handleEmailChange(event.target.value)}
                        onBlur={() => handleBlur('email')}
                        placeholder="you@example.com"
                        className={validationErrors.email ? "border-destructive" : ""}
                     />
                     {validationErrors.email && (
                        <p className="text-xs text-destructive mt-1">{validationErrors.email}</p>
                     )}
                  </div>

                  <div className="space-y-2">
                     <label
                        className="block text-xs uppercase tracking-wider text-foreground-muted"
                        htmlFor="password"
                     >
                        Password
                     </label>
                     <Input
                        id="password"
                        type="password"
                        autoComplete="new-password"
                        value={password}
                        onChange={(event) => handlePasswordChange(event.target.value)}
                        onBlur={() => handleBlur('password')}
                        placeholder="••••••••"
                        className={validationErrors.password ? "border-destructive" : ""}
                     />
                     {validationErrors.password && (
                        <p className="text-xs text-destructive mt-1">{validationErrors.password}</p>
                     )}
                     {!validationErrors.password && password && (
                        <p className="font-mono text-xs mt-1 text-foreground-muted">
                           Strength: <span className={strengthDisplay.color}>{strengthDisplay.text}</span>
                        </p>
                     )}
                  </div>

                  {error && (
                     <p className="text-sm text-destructive font-medium">{error}</p>
                  )}

                  <Button
                     type="submit"
                     disabled={loading}
                     className="w-full mt-2"
                     variant="default"
                  >
                     {loading ? "Creating account..." : "Create account"}
                  </Button>

                  <div className="text-center mt-5">
                     <p className="text-sm text-foreground-muted">
                        Already have an account?{" "}
                        <Link href="/login" className="text-purple-500 font-medium hover:text-purple-600">
                           Sign in
                        </Link>
                     </p>
                  </div>
               </form>
            </div>

            {/* Bottom Links */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-foreground-muted">
               <Link href="/" className="hover:text-foreground transition-colors">
                  ← Back to Home
               </Link>
               <span className="h-1 w-1 rounded-full bg-foreground-muted opacity-40" />
               <Link href="/login" className="hover:text-foreground transition-colors">
                  Sign In
               </Link>
            </div>
         </div>
      </div>
   );
}
