"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

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
import { useAdminAuth } from "@/context/admin-auth-context";
import { getQuiz } from "@/lib/api/quizzes";
import { getQuizAttempts, type QuizAttempt } from "@/lib/api/attempts";

export default function QuizAttemptsPage() {
   const router = useRouter();
   const params = useParams();
   const quizId = Array.isArray(params.id) ? params.id[0] : (params.id as string);
   const { admin, loading } = useAdminAuth();

   const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
   const [quizTitle, setQuizTitle] = useState("");
   const [loadingData, setLoadingData] = useState(true);
   const [error, setError] = useState<string | null>(null);

   useEffect(() => {
      if (!loading && !admin) {
         router.push("/admin");
      }
   }, [admin, loading, router]);

   useEffect(() => {
      if (!admin || !quizId) return;

      const load = async () => {
         setLoadingData(true);
         setError(null);
         try {
            const [quiz, data] = await Promise.all([
               getQuiz(quizId),
               getQuizAttempts(quizId),
            ]);
            setQuizTitle(quiz.title);
            setAttempts(data);
         } catch (err) {
            const message =
               err instanceof Error ? err.message : "Failed to load attempts";
            setError(message);
         } finally {
            setLoadingData(false);
         }
      };

      load();
   }, [admin, quizId]);

   if ((loading || loadingData) && !admin) {
      return (
         <div className="mx-auto w-full max-w-4xl space-y-4 px-4 py-10">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-32 w-full" />
         </div>
      );
   }

   if (!admin) return null;

   // Compute summary stats
   const totalAttempts = attempts.length;
   const avgScore =
      totalAttempts > 0
         ? Math.round(
              attempts.reduce((sum, a) => sum + a.percentage, 0) / totalAttempts
           )
         : 0;
   const highestScore =
      totalAttempts > 0 ? Math.max(...attempts.map((a) => a.percentage)) : 0;
   const lowestScore =
      totalAttempts > 0 ? Math.min(...attempts.map((a) => a.percentage)) : 0;
   const uniqueStudents = new Set(attempts.map((a) => a.user.id)).size;
   const passCount = attempts.filter((a) => a.percentage >= 50).length;
   const passRate =
      totalAttempts > 0 ? Math.round((passCount / totalAttempts) * 100) : 0;

   // Score distribution
   const distribution = [
      { label: "90-100%", count: 0, color: "bg-green-500" },
      { label: "70-89%", count: 0, color: "bg-green-400" },
      { label: "50-69%", count: 0, color: "bg-yellow-400" },
      { label: "30-49%", count: 0, color: "bg-orange-400" },
      { label: "0-29%", count: 0, color: "bg-red-400" },
   ];
   for (const a of attempts) {
      if (a.percentage >= 90) distribution[0].count++;
      else if (a.percentage >= 70) distribution[1].count++;
      else if (a.percentage >= 50) distribution[2].count++;
      else if (a.percentage >= 30) distribution[3].count++;
      else distribution[4].count++;
   }
   const maxDistCount = Math.max(1, ...distribution.map((d) => d.count));

   return (
      <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-10">
         {/* Header */}
         <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
               <h1 className="text-2xl font-semibold">Attempts & Analytics</h1>
               <p className="text-sm text-muted-foreground">
                  {quizTitle ? `Quiz: ${quizTitle}` : "Student submissions"}
               </p>
            </div>
            <div className="flex flex-wrap gap-2">
               <Button
                  variant="outline"
                  onClick={() => router.push(`/admin/quiz/${quizId}`)}
               >
                  Back to quiz
               </Button>
               <Button variant="outline" onClick={() => router.push("/admin")}>
                  Dashboard
               </Button>
            </div>
         </div>

         {/* Summary Stats */}
         {!loadingData && totalAttempts > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
               <Card>
                  <CardContent className="flex flex-col items-center justify-center py-5">
                     <p className="text-2xl font-bold">{totalAttempts}</p>
                     <p className="text-xs text-muted-foreground">Total Attempts</p>
                  </CardContent>
               </Card>
               <Card>
                  <CardContent className="flex flex-col items-center justify-center py-5">
                     <p className="text-2xl font-bold">{uniqueStudents}</p>
                     <p className="text-xs text-muted-foreground">Unique Students</p>
                  </CardContent>
               </Card>
               <Card>
                  <CardContent className="flex flex-col items-center justify-center py-5">
                     <p className="text-2xl font-bold">{avgScore}%</p>
                     <p className="text-xs text-muted-foreground">Avg. Score</p>
                  </CardContent>
               </Card>
               <Card>
                  <CardContent className="flex flex-col items-center justify-center py-5">
                     <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {highestScore}%
                     </p>
                     <p className="text-xs text-muted-foreground">Highest</p>
                  </CardContent>
               </Card>
               <Card>
                  <CardContent className="flex flex-col items-center justify-center py-5">
                     <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {lowestScore}%
                     </p>
                     <p className="text-xs text-muted-foreground">Lowest</p>
                  </CardContent>
               </Card>
               <Card>
                  <CardContent className="flex flex-col items-center justify-center py-5">
                     <p className="text-2xl font-bold">{passRate}%</p>
                     <p className="text-xs text-muted-foreground">Pass Rate (≥50%)</p>
                  </CardContent>
               </Card>
            </div>
         )}

         {/* Score Distribution */}
         {!loadingData && totalAttempts > 0 && (
            <Card>
               <CardHeader>
                  <CardTitle>Score Distribution</CardTitle>
                  <CardDescription>
                     Breakdown of student performance across score ranges.
                  </CardDescription>
               </CardHeader>
               <CardContent>
                  <div className="space-y-3">
                     {distribution.map((d) => (
                        <div
                           key={d.label}
                           className="flex items-center gap-3"
                        >
                           <span className="w-16 text-right text-xs text-muted-foreground">
                              {d.label}
                           </span>
                           <div className="flex-1">
                              <div className="h-6 overflow-hidden rounded bg-muted">
                                 <div
                                    className={`h-full rounded ${d.color} transition-all`}
                                    style={{
                                       width: `${(d.count / maxDistCount) * 100}%`,
                                    }}
                                 />
                              </div>
                           </div>
                           <span className="w-8 text-right text-sm font-medium">
                              {d.count}
                           </span>
                        </div>
                     ))}
                  </div>
               </CardContent>
            </Card>
         )}

         {/* Attempt List */}
         <Card>
            <CardHeader>
               <CardTitle>All Attempts</CardTitle>
               <CardDescription>
                  Individual student submissions for this quiz.
               </CardDescription>
            </CardHeader>
            <CardContent>
               {loadingData ? (
                  <div className="space-y-3">
                     <Skeleton className="h-6 w-full" />
                     <Skeleton className="h-6 w-full" />
                  </div>
               ) : error ? (
                  <p className="text-sm text-destructive">{error}</p>
               ) : attempts.length === 0 ? (
                  <div className="py-8 text-center">
                     <p className="text-muted-foreground">
                        No students have attempted this quiz yet.
                     </p>
                  </div>
               ) : (
                  <Table>
                     <TableHeader>
                        <TableRow>
                           <TableHead>#</TableHead>
                           <TableHead>Student</TableHead>
                           <TableHead>Email</TableHead>
                           <TableHead>Score</TableHead>
                           <TableHead>Percentage</TableHead>
                           <TableHead>Completed</TableHead>
                        </TableRow>
                     </TableHeader>
                     <TableBody>
                        {attempts.map((attempt, index) => (
                           <TableRow key={attempt.id}>
                              <TableCell className="text-muted-foreground">
                                 {index + 1}
                              </TableCell>
                              <TableCell className="font-medium">
                                 {attempt.user.name || "Student"}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                 {attempt.user.email}
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
                           </TableRow>
                        ))}
                     </TableBody>
                  </Table>
               )}
            </CardContent>
         </Card>
      </div>
   );
}