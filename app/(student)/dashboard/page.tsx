"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudentAuth } from "@/context/student-auth-context";

export default function StudentDashboardPage() {
   const router = useRouter();
   const { student, loading, logout } = useStudentAuth();

   useEffect(() => {
      if (!loading && !student) {
         router.push("/login");
      }
   }, [loading, student, router]);

   if (loading) {
      return (
         <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-10">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
         </div>
      );
   }

   if (!student) {
      return null;
   }

   return (
      <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-10">
         <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
               <h1 className="text-2xl font-semibold">Welcome, {student.name}</h1>
               <p className="text-sm text-muted-foreground">Browse published quizzes.</p>
            </div>
            <Button variant="outline" onClick={() => logout()}>
               Sign out
            </Button>
         </div>

         <Card>
            <CardHeader>
               <CardTitle>Published Quizzes</CardTitle>
            </CardHeader>
            <CardContent>
               <p className="text-sm text-muted-foreground">
                  Quiz listing will appear here once quiz APIs are connected.
               </p>
            </CardContent>
         </Card>
      </div>
   );
}