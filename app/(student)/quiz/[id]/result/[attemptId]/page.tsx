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
import { useStudentAuth } from "@/context/student-auth-context";
import { getAttemptDetail, type AttemptDetail } from "@/lib/api/attempts";

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
   const attemptId = Array.isArray(params.attemptId)
      ? params.attemptId[0]
      : (params.attemptId as string);
   const { student, loading } = useStudentAuth();

   const [attempt, setAttempt] = useState<AttemptDetail | null>(null);
   const [loadingData, setLoadingData] = useState(true);
   const [error, setError] = useState<string | null>(null);

   const loadData = useCallback(async () => {
      if (!attemptId) return;
      setLoadingData(true);
      setError(null);
      try {
         const data = await getAttemptDetail(attemptId);
         setAttempt(data);
      } catch (err) {
         const message = err instanceof Error ? err.message : "Failed to load result";
         setError(message);
      } finally {
         setLoadingData(false);
      }
   }, [attemptId]);

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
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
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

   if (!attempt) return null;

   const grade = gradeLabel(attempt.percentage);
   const correctCount = attempt.questions.filter(
      (q) => q.userAnswer === q.correctIndex
   ).length;
   const wrongCount = attempt.questions.filter(
      (q) => q.userAnswer !== null && q.userAnswer !== -1 && q.userAnswer !== q.correctIndex
   ).length;
   const unansweredCount = attempt.questions.filter(
      (q) => q.userAnswer === null || q.userAnswer === -1
   ).length;

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
                     <div className="text-center">
                        <p className="text-lg font-bold text-muted-foreground">
                           {unansweredCount}
                        </p>
                        <p className="text-xs text-muted-foreground">Skipped</p>
                     </div>
                  </div>
                  {/* Score bar */}
                  <div className="mx-auto mt-4 h-3 max-w-sm overflow-hidden rounded-full bg-muted">
                     <div
                        className={`h-full rounded-full transition-all ${
                           attempt.percentage >= 70
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

         {/* Question-by-Question Review */}
         <div>
            <h2 className="mb-4 text-lg font-semibold">Question Review</h2>
            <div className="space-y-4">
               {attempt.questions.map((question, qIndex) => {
                  const isCorrect = question.userAnswer === question.correctIndex;
                  const isUnanswered =
                     question.userAnswer === null || question.userAnswer === -1;
                  return (
                     <Card
                        key={question.id}
                        className={`border-l-4 ${
                           isCorrect
                              ? "border-l-green-500"
                              : isUnanswered
                              ? "border-l-muted-foreground/30"
                              : "border-l-red-500"
                        }`}
                     >
                        <CardHeader className="pb-3">
                           <CardTitle className="flex items-start gap-3 text-sm">
                              <span
                                 className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                    isCorrect
                                       ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                       : isUnanswered
                                       ? "bg-muted text-muted-foreground"
                                       : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                                 }`}
                              >
                                 {isCorrect ? "✓" : isUnanswered ? "−" : "✗"}
                              </span>
                              <span className="leading-relaxed">
                                 Q{qIndex + 1}. {question.questionText}
                              </span>
                           </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 pb-3">
                           {question.options.map((option, optIndex) => {
                              const isCorrectOption =
                                 optIndex === question.correctIndex;
                              const isUserPick =
                                 optIndex === question.userAnswer;
                              let bgClass = "";
                              let label = "";

                              if (isCorrectOption && isUserPick) {
                                 bgClass =
                                    "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950";
                                 label = "✓ Your answer (Correct)";
                              } else if (isCorrectOption) {
                                 bgClass =
                                    "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950";
                                 label = "✓ Correct answer";
                              } else if (isUserPick) {
                                 bgClass =
                                    "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950";
                                 label = "✗ Your answer";
                              }

                              return (
                                 <div
                                    key={`opt-${optIndex}`}
                                    className={`flex items-start gap-3 rounded-lg border p-3 text-sm ${bgClass}`}
                                 >
                                    <span
                                       className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-medium ${
                                          isCorrectOption
                                             ? "border-green-500 bg-green-500 text-white"
                                             : isUserPick
                                             ? "border-red-500 bg-red-500 text-white"
                                             : "border-muted-foreground/30"
                                       }`}
                                    >
                                       {String.fromCharCode(65 + optIndex)}
                                    </span>
                                    <div className="flex-1">
                                       <span>{option}</span>
                                       {label && (
                                          <span
                                             className={`ml-2 text-xs font-medium ${
                                                isCorrectOption
                                                   ? "text-green-600 dark:text-green-400"
                                                   : "text-red-600 dark:text-red-400"
                                             }`}
                                          >
                                             {label}
                                          </span>
                                       )}
                                    </div>
                                 </div>
                              );
                           })}
                        </CardContent>
                        {question.explanation && (
                           <CardFooter className="border-t pt-3">
                              <div className="text-sm">
                                 <p className="font-medium text-muted-foreground">
                                    Explanation:
                                 </p>
                                 <p className="text-muted-foreground">
                                    {question.explanation}
                                 </p>
                              </div>
                           </CardFooter>
                        )}
                     </Card>
                  );
               })}
            </div>
         </div>

         {/* Bottom Actions */}
         <div className="flex flex-wrap gap-2 border-t pt-6">
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