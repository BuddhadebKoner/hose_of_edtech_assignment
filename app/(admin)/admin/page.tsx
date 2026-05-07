"use client";

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
import { Input } from "@/components/ui/input";
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
import { deleteQuiz, getQuizzes, togglePublish, type Quiz } from "@/lib/api/quizzes";

export default function AdminDashboardPage() {
   const router = useRouter();
   const { admin, loading, login, logout } = useAdminAuth();
   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");
   const [error, setError] = useState<string | null>(null);
   const [quizzes, setQuizzes] = useState<Quiz[]>([]);
   const [loadingQuizzes, setLoadingQuizzes] = useState(false);
   const [quizzesError, setQuizzesError] = useState<string | null>(null);
   const [actionId, setActionId] = useState<string | null>(null);

   const loadQuizzes = useCallback(async () => {
      setLoadingQuizzes(true);
      setQuizzesError(null);
      try {
         const data = await getQuizzes();
         setQuizzes(data);
      } catch (err) {
         const message = err instanceof Error ? err.message : "Failed to load quizzes";
         setQuizzesError(message);
      } finally {
         setLoadingQuizzes(false);
      }
   }, []);

   const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(null);
      const result = await login(email, password);
      if (!result.ok) {
         setError(result.error ?? "Login failed");
      }
   };

   useEffect(() => {
      if (admin) {
         loadQuizzes();
      }
   }, [admin, loadQuizzes]);

   const handlePublishToggle = async (quiz: Quiz) => {
      setActionId(quiz.id);
      try {
         const result = await togglePublish(quiz.id, !quiz.isPublished);
         setQuizzes((prev) =>
            prev.map((item) =>
               item.id === quiz.id ? { ...item, isPublished: result.isPublished } : item
            )
         );
      } catch (err) {
         const message = err instanceof Error ? err.message : "Failed to update quiz";
         setQuizzesError(message);
      } finally {
         setActionId(null);
      }
   };

   const handleDelete = async (quiz: Quiz) => {
      if (!confirm(`Delete quiz "${quiz.title}"? This removes all questions and attempts.`)) {
         return;
      }

      setActionId(quiz.id);
      try {
         await deleteQuiz(quiz.id);
         setQuizzes((prev) => prev.filter((item) => item.id !== quiz.id));
      } catch (err) {
         const message = err instanceof Error ? err.message : "Failed to delete quiz";
         setQuizzesError(message);
      } finally {
         setActionId(null);
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
            <div className="flex flex-wrap gap-2">
               <Button variant="outline" onClick={() => router.push("/admin/quiz/new")}>
                  Create quiz
               </Button>
               <Button variant="outline" onClick={() => loadQuizzes()} disabled={loadingQuizzes}>
                  {loadingQuizzes ? "Refreshing..." : "Refresh"}
               </Button>
               <Button variant="outline" onClick={() => logout()}>
                  Sign out
               </Button>
            </div>
         </div>

         <Card>
            <CardHeader>
               <CardTitle>Quizzes</CardTitle>
               <CardDescription>Review, publish, or edit your quizzes.</CardDescription>
            </CardHeader>
            <CardContent>
               {loadingQuizzes ? (
                  <div className="space-y-3">
                     <Skeleton className="h-6 w-full" />
                     <Skeleton className="h-6 w-full" />
                     <Skeleton className="h-6 w-full" />
                  </div>
               ) : quizzesError ? (
                  <p className="text-sm text-destructive">{quizzesError}</p>
               ) : quizzes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No quizzes yet.</p>
               ) : (
                  <Table>
                     <TableHeader>
                        <TableRow>
                           <TableHead>Title</TableHead>
                           <TableHead>Status</TableHead>
                           <TableHead>Time limit</TableHead>
                           <TableHead>Tags</TableHead>
                           <TableHead>Actions</TableHead>
                        </TableRow>
                     </TableHeader>
                     <TableBody>
                        {quizzes.map((quiz) => (
                           <TableRow key={quiz.id}>
                              <TableCell className="font-medium">{quiz.title}</TableCell>
                              <TableCell>
                                 {quiz.isPublished ? "Published" : "Draft"}
                              </TableCell>
                              <TableCell>
                                 {quiz.timeLimit ? `${quiz.timeLimit} min` : "No limit"}
                              </TableCell>
                              <TableCell>
                                 {quiz.tags && quiz.tags.length > 0
                                    ? quiz.tags.join(", ")
                                    : "-"}
                              </TableCell>
                              <TableCell>
                                 <div className="flex flex-wrap gap-2">
                                    <Button
                                       size="sm"
                                       variant="outline"
                                       onClick={() => router.push(`/admin/quiz/${quiz.id}`)}
                                    >
                                       Edit
                                    </Button>
                                    <Button
                                       size="sm"
                                       variant="outline"
                                       onClick={() =>
                                          router.push(`/admin/quiz/${quiz.id}/attempts`)
                                       }
                                    >
                                       Attempts
                                    </Button>
                                    <Button
                                       size="sm"
                                       variant="secondary"
                                       disabled={actionId === quiz.id}
                                       onClick={() => handlePublishToggle(quiz)}
                                    >
                                       {quiz.isPublished ? "Unpublish" : "Publish"}
                                    </Button>
                                    <Button
                                       size="sm"
                                       variant="destructive"
                                       disabled={actionId === quiz.id}
                                       onClick={() => handleDelete(quiz)}
                                    >
                                       Delete
                                    </Button>
                                 </div>
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