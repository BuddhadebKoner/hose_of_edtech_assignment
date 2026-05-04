"use client";

import { useState } from "react";

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
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminAuth } from "@/context/admin-auth-context";

export default function AdminDashboardPage() {
   const { admin, loading, login, logout } = useAdminAuth();
   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");
   const [error, setError] = useState<string | null>(null);

   const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(null);
      const result = await login(email, password);
      if (!result.ok) {
         setError(result.error ?? "Login failed");
      }
   };

   if (loading && !admin) {
      return (
         <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-10">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-32 w-full" />
         </div>
      );
   }

   if (!admin) {
      return (
         <div className="mx-auto w-full max-w-md px-4 py-10">
            <Card>
               <CardHeader>
                  <CardTitle>Admin Sign In</CardTitle>
                  <CardDescription>Use the seeded admin credentials.</CardDescription>
               </CardHeader>
               <CardContent>
                  <form className="space-y-4" onSubmit={handleLogin}>
                     <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="admin-email">
                           Email
                        </label>
                        <Input
                           id="admin-email"
                           type="email"
                           autoComplete="email"
                           value={email}
                           onChange={(event) => setEmail(event.target.value)}
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
                           value={password}
                           onChange={(event) => setPassword(event.target.value)}
                           required
                        />
                     </div>
                     {error ? <p className="text-sm text-destructive">{error}</p> : null}
                     <Button className="w-full" type="submit" disabled={loading}>
                        {loading ? "Signing in..." : "Sign in"}
                     </Button>
                  </form>
               </CardContent>
               <CardFooter className="text-xs text-muted-foreground">
                  Admin account is created from environment variables.
               </CardFooter>
            </Card>
         </div>
      );
   }

   return (
      <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-10">
         <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
               <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
               <p className="text-sm text-muted-foreground">Manage quizzes and attempts.</p>
            </div>
            <Button variant="outline" onClick={() => logout()}>
               Sign out
            </Button>
         </div>

         <Card>
            <CardHeader>
               <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
               <p className="text-sm text-muted-foreground">
                  Quiz management UI will be added here.
               </p>
            </CardContent>
         </Card>
      </div>
   );
}