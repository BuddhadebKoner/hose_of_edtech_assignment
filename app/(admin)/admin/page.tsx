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
         <div className="min-h-screen w-full relative" style={{ background: 'var(--background)' }}>
            {/* Diagonal grid overlay */}
            <div
               className="absolute inset-0 z-0 pointer-events-none"
               style={{
                  backgroundImage: `
                     repeating-linear-gradient(
                        45deg,
                        oklch(0.54 0.175 292 / 0.07) 0,
                        oklch(0.54 0.175 292 / 0.07) 1px,
                        transparent 1px,
                        transparent 20px
                     ),
                     repeating-linear-gradient(
                        -45deg,
                        oklch(0.54 0.175 292 / 0.07) 0,
                        oklch(0.54 0.175 292 / 0.07) 1px,
                        transparent 1px,
                        transparent 20px
                     )
                  `,
                  backgroundSize: '40px 40px',
               }}
            />

            {/* Radial fade */}
            <div
               className="absolute inset-0 z-0 pointer-events-none"
               style={{
                  background: 'radial-gradient(ellipse 70% 60% at 50% 50%, var(--background) 40%, transparent 100%)',
               }}
            />

            {/* Content */}
            <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
               {/* Logo */}
               <div className="mb-8 text-center">
                  <Link href="/">
                     <span
                        className="font-display italic font-semibold text-purple-600"
                        style={{ fontSize: '1.75rem', letterSpacing: '-0.01em' }}
                     >
                        QuizMaster
                     </span>
                  </Link>
                  <div className="mt-3">
                     <span className="tag text-xs">Admin Panel</span>
                  </div>
               </div>

               {/* Auth Card */}
               <div
                  className="w-full max-w-[380px] surface-raised"
                  style={{
                     padding: '36px 40px',
                     borderRadius: 'var(--radius-card)',
                     boxShadow: 'var(--shadow-raised)',
                  }}
               >
                  {/* Card Header */}
                  <div className="mb-7">
                     <h1 className="font-sans font-semibold text-foreground" style={{ fontSize: '1.25rem', marginBottom: '4px' }}>
                        Admin sign in
                     </h1>
                     <p className="font-sans text-foreground-muted" style={{ fontSize: '0.875rem' }}>
                        Restricted access
                     </p>
                  </div>

                  {/* Login Form */}
                  <form className="space-y-5" onSubmit={handleLogin}>
                     <div className="space-y-2">
                        <label
                           className="block text-xs uppercase tracking-wider text-foreground-muted"
                           htmlFor="admin-email"
                        >
                           Email address
                        </label>
                        <Input
                           id="admin-email"
                           type="email"
                           autoComplete="email"
                           placeholder="admin@example.com"
                           value={email}
                           onChange={(e) => setEmail(e.target.value)}
                           required
                        />
                     </div>

                     <div className="space-y-2">
                        <label
                           className="block text-xs uppercase tracking-wider text-foreground-muted"
                           htmlFor="admin-password"
                        >
                           Password
                        </label>
                        <Input
                           id="admin-password"
                           type="password"
                           autoComplete="current-password"
                           placeholder="••••••••"
                           value={password}
                           onChange={(e) => setPassword(e.target.value)}
                           required
                        />
                     </div>

                     {error && (
                        <p className="text-sm text-destructive font-medium">{error}</p>
                     )}

                     <Button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-2"
                        variant="default"
                     >
                        {loading ? "Signing in..." : "Sign in"}
                     </Button>

                     <div className="text-center mt-5">
                        <p className="text-xs text-foreground-faint">
                           Admin accounts are provisioned by your system administrator.
                        </p>
                     </div>
                  </form>
               </div>

               {/* Bottom Links */}
               <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-foreground-muted">
                  <Link href="/" className="hover:text-foreground transition-colors">
                     ← Back to Home
                  </Link>
                  <span className="h-1 w-1 rounded-full bg-foreground-muted opacity-40" />
                  <Link href="/login" className="hover:text-foreground transition-colors">
                     Student Login
                  </Link>
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
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
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