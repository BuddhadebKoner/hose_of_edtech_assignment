"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
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
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
} from "@/components/ui/dialog";
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from "@/components/ui/table";
import { useAdminAuth } from "@/context/admin-auth-context";
import { createQuiz, deleteQuiz, getQuizzes, togglePublish, type Quiz } from "@/lib/api/quizzes";

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

   // Create quiz dialog state
   const [dialogOpen, setDialogOpen] = useState(false);
   const [newTitle, setNewTitle] = useState("");
   const [newDescription, setNewDescription] = useState("");
   const [newTimeLimit, setNewTimeLimit] = useState("");
   const [newTags, setNewTags] = useState("");
   const [creating, setCreating] = useState(false);
   const [createError, setCreateError] = useState<string | null>(null);

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

   const handleCreateQuiz = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setCreateError(null);
      setCreating(true);
      const tagsList = newTags.split(",").map((t) => t.trim()).filter(Boolean);
      try {
         const quiz = await createQuiz({
            title: newTitle,
            description: newDescription || undefined,
            timeLimit: newTimeLimit ? Number(newTimeLimit) : undefined,
            tags: tagsList.length > 0 ? tagsList : undefined,
         });
         setDialogOpen(false);
         setNewTitle("");
         setNewDescription("");
         setNewTimeLimit("");
         setNewTags("");
         router.push(`/admin/quiz/${quiz.id}`);
      } catch (err) {
         setCreateError(err instanceof Error ? err.message : "Failed to create quiz");
         setCreating(false);
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
         <div className="flex min-h-screen flex-col bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950/30">
            {/* Top Navigation */}
            <nav className="flex items-center justify-between px-6 py-4">
               <Link href="/" className="flex items-center gap-2.5 group" id="admin-login-nav-logo">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 transition-transform duration-200 group-hover:scale-105">
                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                     </svg>
                  </div>
                  <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                     QuizMaster
                  </span>
               </Link>
               <div className="flex items-center gap-3">
                  <Link href="/" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Home</Link>
                  <Link href="/login" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Student Login</Link>
                  <Link href="/signup" className="rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-md transition-all hover:shadow-lg hover:brightness-110">
                     Sign up
                  </Link>
               </div>
            </nav>

            {/* Login Card */}
            <div className="flex flex-1 flex-col items-center justify-center px-4 pb-16">
               <div className="mb-8 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/20">
                     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                  </div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Admin Sign In</h1>
                  <p className="mt-2 text-muted-foreground">Access the admin dashboard to manage quizzes</p>
               </div>

               <Card className="w-full max-w-md shadow-xl shadow-violet-100/50 dark:shadow-violet-900/10">
                  <CardHeader>
                     <CardTitle>Admin Credentials</CardTitle>
                     <CardDescription>Use the seeded admin credentials to sign in.</CardDescription>
                  </CardHeader>
                  <CardContent>
                     <form className="space-y-4" onSubmit={handleLogin}>
                        <div className="space-y-2">
                           <label className="text-sm font-medium" htmlFor="admin-email">Email</label>
                           <Input id="admin-email" type="email" autoComplete="email" placeholder="admin@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                           <label className="text-sm font-medium" htmlFor="admin-password">Password</label>
                           <Input id="admin-password" type="password" autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>
                        {error ? <p className="text-sm text-destructive">{error}</p> : null}
                        <Button className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md hover:shadow-lg hover:brightness-110" type="submit" disabled={loading}>
                           {loading ? "Signing in..." : "Sign in"}
                        </Button>
                     </form>
                  </CardContent>
                  <CardFooter className="flex flex-col items-center gap-2 text-sm">
                     <p className="text-xs text-muted-foreground">Admin account is created from environment variables.</p>
                     <Link href="/login" className="font-semibold text-violet-600 hover:text-violet-700 hover:underline">
                        ← Back to all login options
                     </Link>
                  </CardFooter>
               </Card>

               {/* Bottom links */}
               <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
                  <Link href="/" className="hover:text-foreground transition-colors">← Home</Link>
                  <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                  <Link href="/login" className="hover:text-foreground transition-colors">Student Login</Link>
                  <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                  <Link href="/signup" className="hover:text-foreground transition-colors">Create Account</Link>
               </div>
            </div>
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
               {/* Create Quiz Dialog */}
               <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger render={
                     <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md hover:shadow-lg hover:brightness-110" />
                  }>
                     + Create quiz
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                     <DialogHeader>
                        <DialogTitle>Create a new quiz</DialogTitle>
                        <DialogDescription>Fill in the quiz details. You can add questions after creation.</DialogDescription>
                     </DialogHeader>
                     <form className="space-y-4" onSubmit={handleCreateQuiz}>
                        <div className="space-y-2">
                           <label className="text-sm font-medium" htmlFor="new-quiz-title">Title *</label>
                           <Input id="new-quiz-title" placeholder="e.g. JavaScript Fundamentals" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                           <label className="text-sm font-medium" htmlFor="new-quiz-desc">Description</label>
                           <Input id="new-quiz-desc" placeholder="Brief description of the quiz" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                           <div className="space-y-2">
                              <label className="text-sm font-medium" htmlFor="new-quiz-time">Time limit (min)</label>
                              <Input id="new-quiz-time" type="number" min={0} placeholder="e.g. 15" value={newTimeLimit} onChange={(e) => setNewTimeLimit(e.target.value)} />
                           </div>
                           <div className="space-y-2">
                              <label className="text-sm font-medium" htmlFor="new-quiz-tags">Tags</label>
                              <Input id="new-quiz-tags" placeholder="js, react" value={newTags} onChange={(e) => setNewTags(e.target.value)} />
                           </div>
                        </div>
                        {createError ? <p className="text-sm text-destructive">{createError}</p> : null}
                        <DialogFooter>
                           <Button type="submit" disabled={creating || !newTitle.trim()} className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
                              {creating ? "Creating..." : "Create quiz"}
                           </Button>
                        </DialogFooter>
                     </form>
                  </DialogContent>
               </Dialog>

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
                  <div className="flex flex-col items-center gap-4 py-12 text-center">
                     <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                     </div>
                     <div>
                        <p className="font-semibold text-foreground">No quizzes yet</p>
                        <p className="mt-1 text-sm text-muted-foreground">Create your first quiz to get started.</p>
                     </div>
                     <Button onClick={() => setDialogOpen(true)} className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white">+ Create your first quiz</Button>
                  </div>
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
                                 <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${quiz.isPublished ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"}`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${quiz.isPublished ? "bg-emerald-500" : "bg-amber-500"}`} />
                                    {quiz.isPublished ? "Published" : "Draft"}
                                 </span>
                              </TableCell>
                              <TableCell>{quiz.timeLimit ? `${quiz.timeLimit} min` : "No limit"}</TableCell>
                              <TableCell>{quiz.tags && quiz.tags.length > 0 ? quiz.tags.join(", ") : "-"}</TableCell>
                              <TableCell>
                                 <div className="flex flex-wrap gap-2">
                                    <Button size="sm" variant="outline" onClick={() => router.push(`/admin/quiz/${quiz.id}`)}>Edit</Button>
                                    <Button size="sm" variant="outline" onClick={() => router.push(`/admin/quiz/${quiz.id}/attempts`)}>Attempts</Button>
                                    <Button size="sm" variant="secondary" disabled={actionId === quiz.id} onClick={() => handlePublishToggle(quiz)}>
                                       {quiz.isPublished ? "Unpublish" : "Publish"}
                                    </Button>
                                    <Button size="sm" variant="destructive" disabled={actionId === quiz.id} onClick={() => handleDelete(quiz)}>Delete</Button>
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