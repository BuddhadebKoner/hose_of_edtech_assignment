"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudentAuth } from "@/context/student-auth-context";
import { getAttemptSummary, type AttemptSummary } from "@/lib/api/attempts";

function gradeLabel(percentage: number) {
   if (percentage >= 90) return { label: "Excellent!", color: "text-green-600 dark:text-green-400" };
   if (percentage >= 70) return { label: "Great Job!", color: "text-green-600 dark:text-green-400" };
   if (percentage >= 50) return { label: "Good Effort", color: "text-yellow-600 dark:text-yellow-400" };
   if (percentage >= 30) return { label: "Needs Improvement", color: "text-orange-600 dark:text-orange-400" };
   return { label: "Keep Practicing", color: "text-red-600 dark:text-red-400" };
}

export default function QuizResultPage() {
   const router = useRouter();
   const params = useParams();
   const quizId = Array.isArray(params.id) ? params.id[0] : (params.id as string);
   const attemptId = Array.isArray(params.attemptId) ? params.attemptId[0] : (params.attemptId as string);
   const { student, loading } = useStudentAuth();

   const [attempt, setAttempt] = useState<AttemptSummary | null>(null);
   const [loadingData, setLoadingData] = useState(true);
   const [error, setError] = useState<string | null>(null);

   useEffect(() => {
      if (!loading && !student) {
         router.push("/login");
      }
   }, [loading, student, router]);

   useEffect(() => {
      const loadAttempt = async () => {
         if (!attemptId || !student) return;
         setLoadingData(true);
         setError(null);
         try {
            const attemptData = await getAttemptSummary(attemptId);
            setAttempt(attemptData);
         } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to load attempt";
            setError(message);
         } finally {
            setLoadingData(false);
         }
      };

      if (student) {
         loadAttempt();
      }
   }, [student, attemptId]);

   if (loading || loadingData) {
      return (
         <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-10">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-48 w-full" />
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

   if (!attempt) return null;

   const grade = gradeLabel(attempt.percentage);
   const correctCount = attempt.score;
   const wrongCount = attempt.totalQuestions - attempt.score;

   return (
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10">
         {/* Header */}
         <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
               <h1 className="text-2xl font-semibold">Quiz Result</h1>
               <p className="text-sm text-muted-foreground">{attempt.quiz.title}</p>
            </div>
            <div className="flex flex-wrap gap-2">
               <Button variant="outline" onClick={() => router.push("/dashboard")}>
                  Dashboard
               </Button>
               <Button
                  variant="outline"
                  onClick={() => router.push(`/quiz/${quizId}`)}
               >
                  Quiz Details
               </Button>
               <Button onClick={() => router.push(`/quiz/${quizId}/attempt`)}>
                  Retake Quiz
               </Button>
            </div>
         </div>

         {/* Score Summary */}
         <Card>
            <CardContent className="py-8">
               <div className="text-center">
                  <p className={`text-xl font-semibold ${grade.color}`}>
                     {grade.label}
                  </p>
                  <p className="mt-2 text-5xl font-bold">{attempt.percentage}%</p>
                  <p className="mt-2 text-lg text-muted-foreground">
                     {attempt.score} out of {attempt.totalQuestions} correct
                  </p>
                  <div className="mx-auto mt-4 flex max-w-xs justify-center gap-6 text-sm">
                     <div className="text-center">
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">
                           {correctCount}
                        </p>
                        <p className="text-xs text-muted-foreground">Correct</p>
                     </div>
                     <div className="text-center">
                        <p className="text-lg font-bold text-red-600 dark:text-red-400">
                           {wrongCount}
                        </p>
                        <p className="text-xs text-muted-foreground">Wrong</p>
                     </div>
                  </div>
                  {/* Score bar */}
                  <div className="mx-auto mt-4 h-3 max-w-sm overflow-hidden rounded-full bg-muted">
                     <div
                        className={`h-full rounded-full transition-all ${attempt.percentage >= 70
                           ? "bg-green-500"
                           : attempt.percentage >= 40
                              ? "bg-yellow-500"
                              : "bg-red-500"
                           }`}
                        style={{ width: `${attempt.percentage}%` }}
                     />
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                     Completed on{" "}
                     {new Date(attempt.completedAt).toLocaleString()}
                  </p>
               </div>
            </CardContent>
         </Card>

         {/* Bottom Actions */}
         <div className="flex flex-wrap justify-center gap-2 border-t pt-6">
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
               Back to Dashboard
            </Button>
            <Button onClick={() => router.push(`/quiz/${quizId}/attempt`)}>
               Retake Quiz
            </Button>
         </div>
      </div>
   );
}
