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
import { useStudentAuth } from "@/context/student-auth-context";

interface ValidationErrors {
   name?: string;
   email?: string;
   password?: string;
}

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

   return (
      <div className="mx-auto w-full max-w-md px-4 py-10">
         <Card>
            <CardHeader>
               <CardTitle>Create Student Account</CardTitle>
               <CardDescription>Sign up with your name, email, and password.</CardDescription>
            </CardHeader>
            <CardContent>
               <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                     <label className="text-sm font-medium" htmlFor="name">
                        Full Name
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
                        <p className="text-xs text-destructive">{validationErrors.name}</p>
                     )}
                  </div>
                  <div className="space-y-2">
                     <label className="text-sm font-medium" htmlFor="email">
                        Email
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
                        <p className="text-xs text-destructive">{validationErrors.email}</p>
                     )}
                  </div>
                  <div className="space-y-2">
                     <label className="text-sm font-medium" htmlFor="password">
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
                        <p className="text-xs text-destructive">{validationErrors.password}</p>
                     )}
                     {!validationErrors.password && password && (
                        <div className="text-xs text-muted-foreground space-y-1">
                           <p className="font-medium">Password requirements:</p>
                           <ul className="list-disc list-inside space-y-0.5">
                              <li className={password.length >= 8 ? "text-green-600" : ""}>At least 8 characters</li>
                              <li className={/[a-z]/.test(password) ? "text-green-600" : ""}>One lowercase letter</li>
                              <li className={/[A-Z]/.test(password) ? "text-green-600" : ""}>One uppercase letter</li>
                              <li className={/[0-9]/.test(password) ? "text-green-600" : ""}>One number</li>
                           </ul>
                        </div>
                     )}
                  </div>
                  {error ? <p className="text-sm text-destructive font-medium">{error}</p> : null}
                  <Button type="submit" disabled={loading} className="w-full">
                     {loading ? "Creating account..." : "Create account"}
                  </Button>
               </form>
            </CardContent>
            <CardFooter className="text-sm">
               <span className="text-muted-foreground">Already have an account?</span>
               <Link className="ml-2 font-medium text-primary hover:underline" href="/login">
                  Sign in
               </Link>
            </CardFooter>
         </Card>
      </div>
   );
}