"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

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
import { getQuiz, getQuestions, type Quiz, type Question } from "@/lib/api/quizzes";
import { getMyAttempts, type MyAttempt } from "@/lib/api/attempts";

export default function StudentQuizDetailPage() {
   const router = useRouter();
   const params = useParams();
   const quizId = Array.isArray(params.id) ? params.id[0] : (params.id as string);
   const { student, loading } = useStudentAuth();

   const [quiz, setQuiz] = useState<Quiz | null>(null);
   const [questions, setQuestions] = useState<Question[]>([]);
   const [attempts, setAttempts] = useState<MyAttempt[]>([]);
   const [loadingData, setLoadingData] = useState(true);
   const [error, setError] = useState<string | null>(null);

   const loadData = useCallback(async () => {
      if (!quizId) return;
      setLoadingData(true);
      setError(null);
      try {
         const [quizData, questionData, attemptData] = await Promise.all([
            getQuiz(quizId),
            getQuestions(quizId),
            getMyAttempts(),
         ]);
         setQuiz(quizData);
         setQuestions(questionData);
         setAttempts(attemptData.filter((a) => a.quiz.id === quizId));
      } catch (err) {
         const message = err instanceof Error ? err.message : "Failed to load quiz";
         setError(message);
      } finally {
         setLoadingData(false);
      }
   }, [quizId]);

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

   if (loading || loadingData) {
      return (
         <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-10">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
         </div>
      );
   }

   if (!student) return null;

   if (error) {
      return (
         <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-10">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
               Back to dashboard
            </Button>
         </div>
      );
   }

   if (!quiz) return null;

   const bestAttempt = attempts.length > 0
      ? attempts.reduce((best, a) => (a.percentage > best.percentage ? a : best))
      : null;

   return (
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10">
         {/* Header */}
         <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
               <h1 className="text-2xl font-semibold">{quiz.title}</h1>
               {quiz.description ? (
                  <p className="text-sm text-muted-foreground">{quiz.description}</p>
               ) : null}
            </div>
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
               Back to dashboard
            </Button>
         </div>

         {/* Quiz Info */}
         <Card>
            <CardHeader>
               <CardTitle>Quiz Overview</CardTitle>
               <CardDescription>Review the details before you start.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg border p-4 text-center">
                     <p className="text-2xl font-bold">{questions.length}</p>
                     <p className="text-xs text-muted-foreground">Questions</p>
                  </div>
                  <div className="rounded-lg border p-4 text-center">
                     <p className="text-2xl font-bold">
                        {quiz.timeLimit ? `${quiz.timeLimit} min` : "∞"}
                     </p>
                     <p className="text-xs text-muted-foreground">Time Limit</p>
                  </div>
                  <div className="rounded-lg border p-4 text-center">
                     <p className="text-2xl font-bold">{attempts.length}</p>
                     <p className="text-xs text-muted-foreground">Your Attempts</p>
                  </div>
               </div>

               {quiz.tags && quiz.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                     {quiz.tags.map((tag) => (
                        <span
                           key={tag}
                           className="rounded-full border px-3 py-1 text-xs text-muted-foreground"
                        >
                           {tag}
                        </span>
                     ))}
                  </div>
               )}

               {bestAttempt && (
                  <div className="rounded-lg bg-muted/50 p-4">
                     <p className="text-sm font-medium">Your Best Score</p>
                     <p className="text-2xl font-bold">
                        {bestAttempt.score}/{bestAttempt.totalQuestions}{" "}
                        <span className="text-base font-normal text-muted-foreground">
                           ({bestAttempt.percentage}%)
                        </span>
                     </p>
                  </div>
               )}

               {questions.length === 0 && (
                  <p className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
                     This quiz has no questions yet. You cannot start it.
                  </p>
               )}
            </CardContent>
            <CardFooter>
               <Button
                  className="w-full"
                  size="lg"
                  disabled={questions.length === 0}
                  onClick={() => router.push(`/quiz/${quizId}/attempt`)}
               >
                  {attempts.length > 0 ? "Retake Quiz" : "Start Quiz"}
               </Button>
            </CardFooter>
         </Card>

         {/* Previous Attempts */}
         {attempts.length > 0 && (
            <Card>
               <CardHeader>
                  <CardTitle>Your Attempts</CardTitle>
                  <CardDescription>
                     View your past results for this quiz.
                  </CardDescription>
               </CardHeader>
               <CardContent>
                  <Table>
                     <TableHeader>
                        <TableRow>
                           <TableHead>#</TableHead>
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
                                          `/quiz/${quizId}/result/${attempt.id}`
                                       )
                                    }
                                 >
                                    View
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
   );
}