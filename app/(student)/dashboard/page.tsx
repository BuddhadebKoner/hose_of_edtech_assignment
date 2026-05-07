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
   CardFooter,
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
import { getQuizzes, type Quiz } from "@/lib/api/quizzes";
import { getMyAttempts, type MyAttempt } from "@/lib/api/attempts";

export default function StudentDashboardPage() {
   const router = useRouter();
   const { student, loading, logout } = useStudentAuth();

   const [quizzes, setQuizzes] = useState<Quiz[]>([]);
   const [attempts, setAttempts] = useState<MyAttempt[]>([]);
   const [loadingData, setLoadingData] = useState(true);
   const [error, setError] = useState<string | null>(null);

   const loadData = useCallback(async () => {
      setLoadingData(true);
      setError(null);
      try {
         const [quizData, attemptData] = await Promise.all([
            getQuizzes(),
            getMyAttempts(),
         ]);
         setQuizzes(quizData);
         setAttempts(attemptData);
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

   function getAttemptForQuiz(quizId: string) {
      return attempts.filter((a) => a.quiz.id === quizId);
   }

   function getBestAttempt(quizId: string) {
      const quizAttempts = getAttemptForQuiz(quizId);
      if (quizAttempts.length === 0) return null;
      return quizAttempts.reduce((best, a) => (a.percentage > best.percentage ? a : best));
   }

   if (loading) {
      return (
         <div className="flex min-h-screen flex-col">
            <Navbar />
            <div className="mx-auto w-full max-w-5xl flex-1 space-y-4 px-4 py-10">
               <Skeleton className="h-8 w-48" />
               <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-48 w-full" />
               </div>
            </div>
            <Footer />
         </div>
      );
   }

   if (!student) {
      return null;
   }

   return (
      <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="mx-auto w-full max-w-5xl flex-1 space-y-8 px-4 py-10">
         {/* Header */}
         <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
               <h1 className="text-2xl font-semibold">Welcome, {student.name}</h1>
               <p className="text-sm text-muted-foreground">
                  Browse published quizzes and track your progress.
               </p>
            </div>
            <div className="flex flex-wrap gap-2">
               <Button variant="outline" onClick={() => router.push("/profile")}>
                  My Profile
               </Button>
               <Button variant="outline" onClick={() => logout()}>
                  Sign out
               </Button>
            </div>
         </div>

         {error ? (
            <Card>
               <CardContent className="py-6">
                  <p className="text-sm text-destructive">{error}</p>
                  <Button variant="outline" className="mt-2" onClick={loadData}>
                     Retry
                  </Button>
               </CardContent>
            </Card>
         ) : null}

         {/* Stats Row */}
         {!loadingData && (
            <div className="grid gap-4 md:grid-cols-3">
               <Card>
                  <CardContent className="flex flex-col items-center justify-center py-6">
                     <p className="text-3xl font-bold">{quizzes.length}</p>
                     <p className="text-sm text-muted-foreground">Available Quizzes</p>
                  </CardContent>
               </Card>
               <Card>
                  <CardContent className="flex flex-col items-center justify-center py-6">
                     <p className="text-3xl font-bold">{attempts.length}</p>
                     <p className="text-sm text-muted-foreground">Total Attempts</p>
                  </CardContent>
               </Card>
               <Card>
                  <CardContent className="flex flex-col items-center justify-center py-6">
                     <p className="text-3xl font-bold">
                        {attempts.length > 0
                           ? `${Math.round(
                                attempts.reduce((sum, a) => sum + a.percentage, 0) /
                                   attempts.length
                             )}%`
                           : "—"}
                     </p>
                     <p className="text-sm text-muted-foreground">Avg. Score</p>
                  </CardContent>
               </Card>
            </div>
         )}

         {/* Published Quizzes */}
         <div>
            <h2 className="mb-4 text-lg font-semibold">Available Quizzes</h2>
            {loadingData ? (
               <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-48 w-full" />
               </div>
            ) : quizzes.length === 0 ? (
               <Card>
                  <CardContent className="py-8 text-center">
                     <p className="text-muted-foreground">
                        No quizzes available yet. Check back later!
                     </p>
                  </CardContent>
               </Card>
            ) : (
               <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {quizzes.map((quiz) => {
                     const best = getBestAttempt(quiz.id);
                     const attemptCount = getAttemptForQuiz(quiz.id).length;
                     return (
                        <Card
                           key={quiz.id}
                           className="group cursor-pointer transition-shadow hover:shadow-md"
                           onClick={() => router.push(`/quiz/${quiz.id}`)}
                        >
                           <CardHeader className="pb-2">
                              <CardTitle className="text-base">{quiz.title}</CardTitle>
                              {quiz.description ? (
                                 <CardDescription className="line-clamp-2">
                                    {quiz.description}
                                 </CardDescription>
                              ) : null}
                           </CardHeader>
                           <CardContent className="space-y-2 pb-2">
                              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                 {quiz.timeLimit ? (
                                    <span className="rounded-full border px-2 py-0.5">
                                       ⏱ {quiz.timeLimit} min
                                    </span>
                                 ) : null}
                                 {quiz.tags?.map((tag) => (
                                    <span
                                       key={tag}
                                       className="rounded-full border px-2 py-0.5"
                                    >
                                       {tag}
                                    </span>
                                 ))}
                              </div>
                              {best ? (
                                 <div className="rounded-md bg-muted/50 px-3 py-2">
                                    <p className="text-xs font-medium">
                                       Best: {best.score}/{best.totalQuestions} ({best.percentage}
                                       %)
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                       {attemptCount} attempt{attemptCount !== 1 ? "s" : ""}
                                    </p>
                                 </div>
                              ) : (
                                 <p className="text-xs text-muted-foreground italic">
                                    Not attempted yet
                                 </p>
                              )}
                           </CardContent>
                           <CardFooter className="pt-2">
                              <Button
                                 size="sm"
                                 className="w-full"
                                 variant={best ? "outline" : "default"}
                                 onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/quiz/${quiz.id}`);
                                 }}
                              >
                                 {best ? "Retake Quiz" : "Start Quiz"}
                              </Button>
                           </CardFooter>
                        </Card>
                     );
                  })}
               </div>
            )}
         </div>

         {/* Recent Attempts */}
         {!loadingData && attempts.length > 0 && (
            <Card>
               <CardHeader>
                  <CardTitle>Recent Attempts</CardTitle>
                  <CardDescription>Your last quiz submissions.</CardDescription>
               </CardHeader>
               <CardContent>
                  <Table>
                     <TableHeader>
                        <TableRow>
                           <TableHead>Quiz</TableHead>
                           <TableHead>Score</TableHead>
                           <TableHead>Percentage</TableHead>
                           <TableHead>Date</TableHead>
                           <TableHead>Action</TableHead>
                        </TableRow>
                     </TableHeader>
                     <TableBody>
                        {attempts.slice(0, 10).map((attempt) => (
                           <TableRow key={attempt.id}>
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
                                          ? "text-green-600 dark:text-green-400"
                                          : attempt.percentage >= 40
                                          ? "text-yellow-600 dark:text-yellow-400"
                                          : "text-red-600 dark:text-red-400"
                                    }
                                 >
                                    {attempt.percentage}%
                                 </span>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                 {new Date(attempt.completedAt).toLocaleDateString()}
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
               </CardContent>
            </Card>
         )}
      </div>
      <Footer />
      </div>
   );
}