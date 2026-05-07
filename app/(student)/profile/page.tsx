"use client";

import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from "@/components/ui/table";
import { useStudentAuth } from "@/context/student-auth-context";
import { getMyAttempts, type MyAttempt } from "@/lib/api/attempts";

export default function StudentProfilePage() {
   const router = useRouter();
   const { student, loading, logout } = useStudentAuth();

   const [attempts, setAttempts] = useState<MyAttempt[]>([]);
   const [loadingData, setLoadingData] = useState(true);
   const [error, setError] = useState<string | null>(null);

   const loadData = useCallback(async () => {
      setLoadingData(true);
      setError(null);
      try {
         const data = await getMyAttempts();
         setAttempts(data);
      } catch (err) {
         const message = err instanceof Error ? err.message : "Failed to load data";
         setError(message);
      } finally {
         setLoadingData(false);
      }
   }, []);

   useEffect(() => {
      if (!loading && !student) {
         router.push("/login");
      }
   }, [loading, student, router]);

   useEffect(() => {
      if (student) {
         loadData();
      }
   }, [student, loadData]);

   if (loading) {
      return (
         <div className="flex min-h-screen flex-col">
            <Navbar />
            <div className="mx-auto w-full max-w-4xl flex-1 space-y-4 px-4 py-10">
               <Skeleton className="h-8 w-48" />
               <Skeleton className="h-48 w-full" />
            </div>
            <Footer />
         </div>
      );
   }

   if (!student) return null;

   // Stats
   const uniqueQuizzes = new Set(attempts.map((a) => a.quiz.id)).size;
   const avgScore =
      attempts.length > 0
         ? Math.round(
              attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length
           )
         : 0;
   const bestScore =
      attempts.length > 0
         ? Math.max(...attempts.map((a) => a.percentage))
         : 0;
   const totalCorrect = attempts.reduce((sum, a) => sum + a.score, 0);
   const totalQuestions = attempts.reduce((sum, a) => sum + a.totalQuestions, 0);

   return (
      <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="mx-auto w-full max-w-4xl flex-1 space-y-6 px-4 py-10">
         {/* Header */}
         <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
               <h1 className="text-2xl font-semibold">My Profile</h1>
               <p className="text-sm text-muted-foreground">
                  Your account and quiz statistics.
               </p>
            </div>
            <div className="flex flex-wrap gap-2">
               <Button variant="outline" onClick={() => router.push("/dashboard")}>
                  Dashboard
               </Button>
               <Button variant="outline" onClick={() => logout()}>
                  Sign out
               </Button>
            </div>
         </div>

         {/* Account Info */}
         <Card>
            <CardHeader>
               <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
               <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                     {student.name?.charAt(0).toUpperCase() ?? "S"}
                  </div>
                  <div>
                     <p className="text-lg font-semibold">{student.name}</p>
                     <p className="text-sm text-muted-foreground">{student.email}</p>
                  </div>
               </div>
            </CardContent>
         </Card>

         {/* Stats */}
         <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <Card>
               <CardContent className="flex flex-col items-center justify-center py-6">
                  <p className="text-3xl font-bold">{attempts.length}</p>
                  <p className="text-xs text-muted-foreground">Total Attempts</p>
               </CardContent>
            </Card>
            <Card>
               <CardContent className="flex flex-col items-center justify-center py-6">
                  <p className="text-3xl font-bold">{uniqueQuizzes}</p>
                  <p className="text-xs text-muted-foreground">Quizzes Taken</p>
               </CardContent>
            </Card>
            <Card>
               <CardContent className="flex flex-col items-center justify-center py-6">
                  <p className="text-3xl font-bold">{avgScore}%</p>
                  <p className="text-xs text-muted-foreground">Avg. Score</p>
               </CardContent>
            </Card>
            <Card>
               <CardContent className="flex flex-col items-center justify-center py-6">
                  <p className="text-3xl font-bold">{bestScore}%</p>
                  <p className="text-xs text-muted-foreground">Best Score</p>
               </CardContent>
            </Card>
         </div>

         {/* Accuracy */}
         {attempts.length > 0 && (
            <Card>
               <CardHeader>
                  <CardTitle>Overall Accuracy</CardTitle>
                  <CardDescription>
                     {totalCorrect} correct out of {totalQuestions} total questions
                  </CardDescription>
               </CardHeader>
               <CardContent>
                  <div className="h-4 overflow-hidden rounded-full bg-muted">
                     <div
                        className="h-full rounded-full bg-green-500 transition-all"
                        style={{
                           width: `${
                              totalQuestions > 0
                                 ? Math.round((totalCorrect / totalQuestions) * 100)
                                 : 0
                           }%`,
                        }}
                     />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                     {totalQuestions > 0
                        ? Math.round((totalCorrect / totalQuestions) * 100)
                        : 0}
                     % accuracy across all quizzes
                  </p>
               </CardContent>
            </Card>
         )}

         {/* Attempt History */}
         <Card>
            <CardHeader>
               <CardTitle>Attempt History</CardTitle>
               <CardDescription>All your quiz submissions.</CardDescription>
            </CardHeader>
            <CardContent>
               {loadingData ? (
                  <div className="space-y-3">
                     <Skeleton className="h-6 w-full" />
                     <Skeleton className="h-6 w-full" />
                     <Skeleton className="h-6 w-full" />
                  </div>
               ) : error ? (
                  <p className="text-sm text-destructive">{error}</p>
               ) : attempts.length === 0 ? (
                  <div className="py-8 text-center">
                     <p className="text-muted-foreground">
                        You haven't taken any quizzes yet.
                     </p>
                     <Button
                        variant="outline"
                        className="mt-3"
                        onClick={() => router.push("/dashboard")}
                     >
                        Browse Quizzes
                     </Button>
                  </div>
               ) : (
                  <Table>
                     <TableHeader>
                        <TableRow>
                           <TableHead>#</TableHead>
                           <TableHead>Quiz</TableHead>
                           <TableHead>Score</TableHead>
                           <TableHead>Percentage</TableHead>
                           <TableHead>Date</TableHead>
                           <TableHead>Action</TableHead>
                        </TableRow>
                     </TableHeader>
                     <TableBody>
                        {attempts.map((attempt, index) => (
                           <TableRow key={attempt.id}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell className="font-medium">
                                 {attempt.quiz.title}
                              </TableCell>
                              <TableCell>
                                 {attempt.score}/{attempt.totalQuestions}
                              </TableCell>
                              <TableCell>
                                 <span
                                    className={
                                       attempt.percentage >= 70
                                          ? "font-medium text-green-600 dark:text-green-400"
                                          : attempt.percentage >= 40
                                          ? "font-medium text-yellow-600 dark:text-yellow-400"
                                          : "font-medium text-red-600 dark:text-red-400"
                                    }
                                 >
                                    {attempt.percentage}%
                                 </span>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                 {new Date(attempt.completedAt).toLocaleString()}
                              </TableCell>
                              <TableCell>
                                 <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                       router.push(
                                          `/quiz/${attempt.quiz.id}/result/${attempt.id}`
                                       )
                                    }
                                 >
                                    View Result
                                 </Button>
                              </TableCell>
                           </TableRow>
                        ))}
                     </TableBody>
                  </Table>
               )}
            </CardContent>
         </Card>
      </div>
      <Footer />
      </div>
   );
}