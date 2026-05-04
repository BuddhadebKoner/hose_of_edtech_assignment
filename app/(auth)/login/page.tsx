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

export default function LoginPage() {
   const router = useRouter();
   const { login: loginStudent, loading: studentLoading } = useStudentAuth();
   const { login: loginAdmin, loading: adminLoading } = useAdminAuth();

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
      <div className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-10 md:grid-cols-2">
         <Card>
            <CardHeader>
               <CardTitle>Student Login</CardTitle>
               <CardDescription>Use your email and password.</CardDescription>
            </CardHeader>
            <CardContent>
               <form className="space-y-4" onSubmit={handleStudentSubmit}>
                  <div className="space-y-2">
                     <label className="text-sm font-medium" htmlFor="student-email">
                        Email
                     </label>
                     <Input
                        id="student-email"
                        type="email"
                        autoComplete="email"
                        value={studentEmail}
                        onChange={(event) => setStudentEmail(event.target.value)}
                        required
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-sm font-medium" htmlFor="student-password">
                        Password
                     </label>
                     <Input
                        id="student-password"
                        type="password"
                        autoComplete="current-password"
                        value={studentPassword}
                        onChange={(event) => setStudentPassword(event.target.value)}
                        required
                     />
                  </div>
                  {studentError ? (
                     <p className="text-sm text-destructive">{studentError}</p>
                  ) : null}
                  <Button type="submit" disabled={studentLoading} className="w-full">
                     {studentLoading ? "Signing in..." : "Sign in"}
                  </Button>
               </form>
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-2 text-sm">
               <span className="text-muted-foreground">New here?</span>
               <Link className="font-medium text-primary hover:underline" href="/signup">
                  Create a student account
               </Link>
            </CardFooter>
         </Card>

         <Card>
            <CardHeader>
               <CardTitle>Admin Login</CardTitle>
               <CardDescription>Only the seeded admin can access.</CardDescription>
            </CardHeader>
            <CardContent>
               <form className="space-y-4" onSubmit={handleAdminSubmit}>
                  <div className="space-y-2">
                     <label className="text-sm font-medium" htmlFor="admin-email">
                        Admin Email
                     </label>
                     <Input
                        id="admin-email"
                        type="email"
                        autoComplete="email"
                        value={adminEmail}
                        onChange={(event) => setAdminEmail(event.target.value)}
                        required
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-sm font-medium" htmlFor="admin-password">
                        Password
                     </label>
                     <Input
                        id="admin-password"
                        type="password"
                        autoComplete="current-password"
                        value={adminPassword}
                        onChange={(event) => setAdminPassword(event.target.value)}
                        required
                     />
                  </div>
                  {adminError ? <p className="text-sm text-destructive">{adminError}</p> : null}
                  <Button type="submit" disabled={adminLoading} className="w-full">
                     {adminLoading ? "Signing in..." : "Sign in as admin"}
                  </Button>
               </form>
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground">
               Admin credentials are seeded via environment variables.
            </CardFooter>
         </Card>
      </div>
   );
}