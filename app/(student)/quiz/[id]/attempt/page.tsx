"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudentAuth } from "@/context/student-auth-context";
import { getQuiz, getQuestions, type Quiz, type Question } from "@/lib/api/quizzes";
import { submitAttempt } from "@/lib/api/attempts";

export default function QuizAttemptPage() {
   const router = useRouter();
   const params = useParams();
   const quizId = Array.isArray(params.id) ? params.id[0] : (params.id as string);
   const { student, loading } = useStudentAuth();

   const [quiz, setQuiz] = useState<Quiz | null>(null);
   const [questions, setQuestions] = useState<Question[]>([]);
   const [answers, setAnswers] = useState<(number | null)[]>([]);
   const [currentIndex, setCurrentIndex] = useState(0);
   const [loadingData, setLoadingData] = useState(true);
   const [submitting, setSubmitting] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [showConfirm, setShowConfirm] = useState(false);

   // Timer
   const [timeLeft, setTimeLeft] = useState<number | null>(null);
   const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
   const hasSubmittedRef = useRef(false);

   const loadData = useCallback(async () => {
      if (!quizId) return;
      setLoadingData(true);
      setError(null);
      try {
         const [quizData, questionData] = await Promise.all([
            getQuiz(quizId),
            getQuestions(quizId),
         ]);

         if (questionData.length === 0) {
            setError("This quiz has no questions.");
            setLoadingData(false);
            return;
         }

         setQuiz(quizData);
         setQuestions(questionData);
         setAnswers(new Array(questionData.length).fill(null));

         // Initialize timer
         if (quizData.timeLimit && quizData.timeLimit > 0) {
            setTimeLeft(quizData.timeLimit * 60);
         }
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

   // Timer countdown
   useEffect(() => {
      if (timeLeft === null || timeLeft <= 0) return;

      timerRef.current = setInterval(() => {
         setTimeLeft((prev) => {
            if (prev === null) return null;
            if (prev <= 1) {
               return 0;
            }
            return prev - 1;
         });
      }, 1000);

      return () => {
         if (timerRef.current) clearInterval(timerRef.current);
      };
   }, [timeLeft !== null && timeLeft > 0]); // eslint-disable-line react-hooks/exhaustive-deps

   // Auto-submit on timer expiry
   const handleSubmit = useCallback(async () => {
      if (hasSubmittedRef.current || !quizId) return;
      hasSubmittedRef.current = true;
      setSubmitting(true);
      setShowConfirm(false);

      if (timerRef.current) {
         clearInterval(timerRef.current);
      }

      const finalAnswers = answers.map((a) => (a === null ? -1 : a));
      const questionIds = questions.map((q) => q.id);

      try {
         const result = await submitAttempt(quizId, finalAnswers, questionIds);
         // Pass result data via router state to avoid additional API call
         router.push(`/quiz/${quizId}/result/${result.id}?score=${result.score}&total=${result.totalQuestions}&percentage=${result.percentage}&completed=${result.completedAt}`);
      } catch (err) {
         hasSubmittedRef.current = false;
         const message = err instanceof Error ? err.message : "Failed to submit";
         setError(message);
         setSubmitting(false);
      }
   }, [answers, quizId, router]);

   useEffect(() => {
      if (timeLeft === 0 && !hasSubmittedRef.current) {
         handleSubmit();
      }
   }, [timeLeft, handleSubmit]);

   // Warn before leaving
   useEffect(() => {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
         if (!hasSubmittedRef.current && questions.length > 0) {
            e.preventDefault();
         }
      };
      window.addEventListener("beforeunload", handleBeforeUnload);
      return () => window.removeEventListener("beforeunload", handleBeforeUnload);
   }, [questions.length]);

   function selectAnswer(index: number) {
      setAnswers((prev) => {
         const next = [...prev];
         next[currentIndex] = index;
         return next;
      });
   }

   function formatTime(seconds: number) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, "0")}`;
   }

   const answeredCount = answers.filter((a) => a !== null).length;
   const currentQuestion = questions[currentIndex];

   if (loading || loadingData) {
      return (
         <div className="mx-auto w-full max-w-4xl space-y-4 px-4 py-10">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-64 w-full" />
         </div>
      );
   }

   if (!student) return null;

   if (error) {
      return (
         <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-10">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" onClick={() => router.push(`/quiz/${quizId}`)}>
               Back to quiz
            </Button>
         </div>
      );
   }

   if (!quiz || !currentQuestion) return null;

   return (
      <div className="mx-auto w-full max-w-5xl px-4 py-6">
         {/* Top Bar */}
         <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
               <h1 className="text-lg font-semibold">{quiz.title}</h1>
               <p className="text-sm text-muted-foreground">
                  Question {currentIndex + 1} of {questions.length}
               </p>
            </div>
            <div className="flex items-center gap-4">
               {timeLeft !== null && (
                  <div
                     className={`rounded-lg border px-4 py-2 text-center font-mono text-lg font-bold ${timeLeft <= 60
                        ? "border-red-300 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400"
                        : timeLeft <= 300
                           ? "border-yellow-300 bg-yellow-50 text-yellow-600 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-400"
                           : "border-border"
                        }`}
                  >
                     ⏱ {formatTime(timeLeft)}
                  </div>
               )}
               <div className="text-sm text-muted-foreground">
                  {answeredCount}/{questions.length} answered
               </div>
            </div>
         </div>

         <div className="grid gap-6 lg:grid-cols-[1fr_240px]">
            {/* Main Question Area */}
            <div className="space-y-6">
               <Card>
                  <CardHeader>
                     <CardTitle className="text-base leading-relaxed">
                        <span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                           {currentIndex + 1}
                        </span>
                        {currentQuestion.questionText}
                     </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                     {currentQuestion.options.map((option, index) => {
                        const isSelected = answers[currentIndex] === index;
                        return (
                           <button
                              key={`option-${index}`}
                              type="button"
                              onClick={() => selectAnswer(index)}
                              className={`flex w-full items-start gap-3 rounded-lg border p-4 text-left text-sm transition-all ${isSelected
                                 ? "border-primary bg-primary/5 ring-1 ring-primary"
                                 : "border-border hover:border-primary/50 hover:bg-muted/50"
                                 }`}
                           >
                              <span
                                 className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-medium ${isSelected
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-muted-foreground/30"
                                    }`}
                              >
                                 {String.fromCharCode(65 + index)}
                              </span>
                              <span>{option}</span>
                           </button>
                        );
                     })}
                  </CardContent>
                  <CardFooter className="flex flex-wrap gap-2">
                     <Button
                        variant="outline"
                        onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                        disabled={currentIndex === 0}
                     >
                        ← Previous
                     </Button>
                     {currentIndex < questions.length - 1 ? (
                        <Button
                           onClick={() =>
                              setCurrentIndex((prev) =>
                                 Math.min(questions.length - 1, prev + 1)
                              )
                           }
                        >
                           Next →
                        </Button>
                     ) : (
                        <Button
                           onClick={() => setShowConfirm(true)}
                           disabled={submitting}
                        >
                           Submit Quiz
                        </Button>
                     )}
                  </CardFooter>
               </Card>
            </div>

            {/* Question Navigator Sidebar */}
            <div className="space-y-4">
               <Card>
                  <CardHeader className="pb-3">
                     <CardTitle className="text-sm">Questions</CardTitle>
                  </CardHeader>
                  <CardContent>
                     <div className="grid grid-cols-5 gap-2">
                        {questions.map((_, index) => {
                           const isAnswered = answers[index] !== null;
                           const isCurrent = currentIndex === index;
                           return (
                              <button
                                 key={`nav-${index}`}
                                 type="button"
                                 onClick={() => setCurrentIndex(index)}
                                 className={`flex h-9 w-9 items-center justify-center rounded-md text-xs font-medium transition-all ${isCurrent
                                    ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2"
                                    : isAnswered
                                       ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                       : "border border-border bg-background hover:bg-muted"
                                    }`}
                              >
                                 {index + 1}
                              </button>
                           );
                        })}
                     </div>
                     <div className="mt-4 space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                           <span className="inline-block h-3 w-3 rounded-sm bg-green-100 dark:bg-green-900" />
                           Answered ({answeredCount})
                        </div>
                        <div className="flex items-center gap-2">
                           <span className="inline-block h-3 w-3 rounded-sm border border-border" />
                           Unanswered ({questions.length - answeredCount})
                        </div>
                     </div>
                  </CardContent>
               </Card>

               <Button
                  className="w-full"
                  variant="default"
                  onClick={() => setShowConfirm(true)}
                  disabled={submitting}
               >
                  {submitting ? "Submitting..." : "Submit Quiz"}
               </Button>
            </div>
         </div>

         {/* Confirm Dialog */}
         {showConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
               <Card className="w-full max-w-md">
                  <CardHeader>
                     <CardTitle>Submit Quiz?</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                     <p className="text-sm">
                        You have answered{" "}
                        <strong>
                           {answeredCount} out of {questions.length}
                        </strong>{" "}
                        questions.
                     </p>
                     {answeredCount < questions.length && (
                        <p className="text-sm text-yellow-600 dark:text-yellow-400">
                           ⚠ You have {questions.length - answeredCount} unanswered
                           question{questions.length - answeredCount !== 1 ? "s" : ""}.
                           Unanswered questions will be marked as wrong.
                        </p>
                     )}
                     <p className="text-sm text-muted-foreground">
                        Are you sure you want to submit?
                     </p>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                     <Button
                        variant="outline"
                        onClick={() => setShowConfirm(false)}
                        disabled={submitting}
                     >
                        Cancel
                     </Button>
                     <Button onClick={handleSubmit} disabled={submitting}>
                        {submitting ? "Submitting..." : "Confirm Submit"}
                     </Button>
                  </CardFooter>
               </Card>
            </div>
         )}
      </div>
   );
}