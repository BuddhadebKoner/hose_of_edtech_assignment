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

export default function SignupPage() {
   const router = useRouter();
   const { register, loading } = useStudentAuth();

   const [name, setName] = useState("");
   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");
   const [error, setError] = useState<string | null>(null);

   const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(null);
      const result = await register(name, email, password);
      if (result.ok) {
         router.push("/dashboard");
      } else {
         setError(result.error ?? "Registration failed");
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
                        onChange={(event) => setName(event.target.value)}
                        required
                     />
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
                        onChange={(event) => setEmail(event.target.value)}
                        required
                     />
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
                        onChange={(event) => setPassword(event.target.value)}
                        required
                     />
                  </div>
                  {error ? <p className="text-sm text-destructive">{error}</p> : null}
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