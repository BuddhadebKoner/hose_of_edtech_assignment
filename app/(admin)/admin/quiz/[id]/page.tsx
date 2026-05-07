"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  createQuestion,
  deleteQuestion,
  deleteQuiz,
  generateQuestions,
  getQuestions,
  getQuiz,
  togglePublish,
  updateQuestion,
  updateQuiz,
  type GeneratedQuestion,
  type Question,
  type Quiz,
} from "@/lib/api/quizzes";

const EMPTY_QUESTION = {
  questionText: "",
  options: ["", "", "", ""],
  correctIndex: 0,
  explanation: "",
  order: 0,
};

export default function AdminQuizDetailPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = Array.isArray(params.id) ? params.id[0] : (params.id as string);
  const { admin, loading } = useAdminAuth();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuiz, setLoadingQuiz] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingQuiz, setSavingQuiz] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeLimit, setTimeLimit] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  const [questionForm, setQuestionForm] = useState({ ...EMPTY_QUESTION });
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [questionError, setQuestionError] = useState<string | null>(null);

  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(5);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTesting, setAiTesting] = useState(false);
  const [aiQuestions, setAiQuestions] = useState<GeneratedQuestion[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiTestStatus, setAiTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [aiTestMessage, setAiTestMessage] = useState<string | null>(null);
  const [bulkAdding, setBulkAdding] = useState(false);

  useEffect(() => {
    if (!loading && !admin) {
      router.push("/admin");
    }
  }, [admin, loading, router]);

  const loadQuiz = useCallback(async () => {
    if (!quizId) return;
    setLoadingQuiz(true);
    setError(null);
    try {
      const [quizData, questionData] = await Promise.all([getQuiz(quizId), getQuestions(quizId)]);
      setQuiz(quizData);
      setQuestions(questionData);
      setTitle(quizData.title);
      setDescription(quizData.description ?? "");
      setTimeLimit(quizData.timeLimit ? String(quizData.timeLimit) : "");
      setTagsInput(quizData.tags?.join(", ") ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load quiz");
    } finally {
      setLoadingQuiz(false);
    }
  }, [quizId]);

  useEffect(() => {
    if (admin) loadQuiz();
  }, [admin, loadQuiz]);

  const handleQuizSave = async () => {
    if (!quizId) return;
    setSavingQuiz(true);
    setError(null);
    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
    try {
      const updated = await updateQuiz(quizId, {
        title,
        description: description || "",
        timeLimit: timeLimit ? Number(timeLimit) : 0,
        tags: tags.length ? tags : [],
      });
      setQuiz(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update quiz");
    } finally {
      setSavingQuiz(false);
    }
  };

  const handlePublishToggle = async () => {
    if (!quiz) return;
    setActionId(quiz.id);
    try {
      const result = await togglePublish(quiz.id, !quiz.isPublished);
      setQuiz({ ...quiz, isPublished: result.isPublished });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update quiz");
    } finally {
      setActionId(null);
    }
  };

  const handleDeleteQuiz = async () => {
    if (!quiz) return;
    if (!confirm(`Delete quiz "${quiz.title}"? This removes all questions and attempts.`)) return;
    setActionId(quiz.id);
    try {
      await deleteQuiz(quiz.id);
      router.push("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete quiz");
    } finally {
      setActionId(null);
    }
  };

  const resetQuestionForm = useCallback(() => {
    setEditingQuestionId(null);
    setQuestionForm({ ...EMPTY_QUESTION });
  }, []);

  const handleQuestionSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setQuestionError(null);
    if (!quizId) return;
    const payload = {
      questionText: questionForm.questionText,
      options: questionForm.options,
      correctIndex: Number(questionForm.correctIndex),
      explanation: questionForm.explanation || undefined,
      order: Number(questionForm.order) || 0,
    };
    try {
      if (editingQuestionId) {
        await updateQuestion(quizId, editingQuestionId, payload);
      } else {
        await createQuestion(quizId, payload);
      }
      await loadQuiz();
      resetQuestionForm();
    } catch (err) {
      setQuestionError(err instanceof Error ? err.message : "Failed to save question");
    }
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestionId(question.id);
    setQuestionForm({
      questionText: question.questionText,
      options: question.options,
      correctIndex: question.correctIndex ?? 0,
      explanation: question.explanation ?? "",
      order: question.order ?? 0,
    });
  };

  const handleDeleteQuestion = async (question: Question) => {
    if (!quizId) return;
    if (!confirm("Delete this question?")) return;
    setActionId(question.id);
    try {
      await deleteQuestion(quizId, question.id);
      setQuestions((prev) => prev.filter((item) => item.id !== question.id));
    } catch (err) {
      setQuestionError(err instanceof Error ? err.message : "Failed to delete question");
    } finally {
      setActionId(null);
    }
  };

  const handleGenerate = async () => {
    if (!quizId) return;
    const trimmedTopic = topic.trim();
    if (trimmedTopic.length < 3) {
      setAiError("Topic must be at least 3 characters.");
      return;
    }
    const safeCount = Math.min(10, Math.max(1, Number.isFinite(count) ? count : 1));
    if (safeCount !== count) setCount(safeCount);
    setAiLoading(true);
    setAiError(null);
    try {
      const data = await generateQuestions(quizId, trimmedTopic, safeCount);
      setAiQuestions(data);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "AI generation failed");
    } finally {
      setAiLoading(false);
    }
  };

  const handleTestAi = async () => {
    if (!quizId) return;
    const fallbackTopic = quiz?.title ?? "general knowledge";
    const trimmedTopic = topic.trim() || fallbackTopic;
    setAiTesting(true);
    setAiTestStatus("testing");
    setAiTestMessage(null);
    setAiError(null);
    try {
      await generateQuestions(quizId, trimmedTopic, 1);
      setAiTestStatus("success");
      setAiTestMessage("AI connection OK.");
    } catch (err) {
      setAiTestStatus("error");
      setAiTestMessage(err instanceof Error ? err.message : "AI test failed");
    } finally {
      setAiTesting(false);
    }
  };

  const handleAddAiQuestion = async (aiQuestion: GeneratedQuestion) => {
    if (!quizId) return;
    setActionId(aiQuestion.questionText);
    try {
      const maxOrder = questions.length ? Math.max(...questions.map((q) => q.order ?? 0)) : -1;
      await createQuestion(quizId, {
        questionText: aiQuestion.questionText,
        options: aiQuestion.options,
        correctIndex: aiQuestion.correctIndex,
        explanation: aiQuestion.explanation,
        order: maxOrder + 1,
      });
      setAiQuestions((prev) => prev.filter((q) => q.questionText !== aiQuestion.questionText));
      await loadQuiz();
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Failed to add AI question");
    } finally {
      setActionId(null);
    }
  };

  const handleAddAllAiQuestions = async () => {
    if (!quizId || aiQuestions.length === 0) return;
    setBulkAdding(true);
    setAiError(null);
    try {
      let maxOrder = questions.length ? Math.max(...questions.map((q) => q.order ?? 0)) : -1;
      for (const aiQ of aiQuestions) {
        maxOrder += 1;
        await createQuestion(quizId, {
          questionText: aiQ.questionText,
          options: aiQ.options,
          correctIndex: aiQ.correctIndex,
          explanation: aiQ.explanation,
          order: maxOrder,
        });
      }
      setAiQuestions([]);
      await loadQuiz();
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Failed to add questions");
    } finally {
      setBulkAdding(false);
    }
  };

  const questionTitle = useMemo(
    () => (editingQuestionId ? "Edit question" : "Add new question"),
    [editingQuestionId]
  );

  if ((loading || loadingQuiz) && !quiz) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-4 px-4 py-10">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!admin || !quiz) return null;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-10">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Edit quiz</h1>
          <p className="text-sm text-muted-foreground">Update details, manage questions, and publish.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => router.push("/admin")}>Back to dashboard</Button>
          <Button variant="secondary" disabled={actionId === quiz.id} onClick={handlePublishToggle}>
            {quiz.isPublished ? "Unpublish" : "Publish"}
          </Button>
          <Button variant="destructive" disabled={actionId === quiz.id} onClick={handleDeleteQuiz}>Delete quiz</Button>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {/* ─── AI QUESTION GENERATOR (TOP, HIGHLIGHTED) ─── */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-violet-300 bg-gradient-to-br from-violet-50 via-indigo-50 to-purple-50 shadow-lg shadow-violet-100/50 dark:border-violet-700 dark:from-violet-950/40 dark:via-indigo-950/30 dark:to-purple-950/20 dark:shadow-violet-900/20">
        {/* Sparkle badge */}
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-violet-400/20 blur-2xl" />
        <div className="absolute -left-6 -bottom-6 h-20 w-20 rounded-full bg-indigo-400/20 blur-2xl" />

        <div className="relative p-6">
          {/* Section title */}
          <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-md">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a4 4 0 0 0-4 4v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4z"/><circle cx="12" cy="15" r="2"/></svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">AI Question Generator</h2>
                <p className="text-sm text-muted-foreground">Generate questions instantly with AI — add them one-by-one or all at once</p>
              </div>
            </div>
            <span className="mt-2 inline-flex items-center gap-1.5 self-start rounded-full border border-violet-300 bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700 dark:border-violet-700 dark:bg-violet-900/50 dark:text-violet-300 sm:mt-0">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-500" />
              AI Powered
            </span>
          </div>

          {/* AI Input Row */}
          <div className="grid gap-3 md:grid-cols-[2fr_1fr_auto_auto]">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="ai-topic">Topic</label>
              <Input id="ai-topic" placeholder="e.g. JavaScript closures" value={topic} onChange={(e) => setTopic(e.target.value)} className="border-violet-200 bg-white/80 dark:border-violet-800 dark:bg-white/5" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="ai-count">Count</label>
              <Input id="ai-count" type="number" min={1} max={10} value={count} onChange={(e) => { const n = Number(e.target.value || 1); setCount(Math.min(10, Math.max(1, Number.isFinite(n) ? n : 1))); }} className="border-violet-200 bg-white/80 dark:border-violet-800 dark:bg-white/5" />
            </div>
            <div className="flex items-end">
              <Button type="button" disabled={aiLoading || aiTesting || !topic.trim()} onClick={handleGenerate} className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md hover:shadow-lg hover:brightness-110">
                {aiLoading ? "Generating..." : "✨ Generate"}
              </Button>
            </div>
            <div className="flex items-end">
              <Button type="button" variant="outline" disabled={aiLoading || aiTesting} onClick={handleTestAi} className="border-violet-300 dark:border-violet-700">
                {aiTesting ? "Testing..." : "Test AI"}
              </Button>
            </div>
          </div>

          {/* Status messages */}
          {aiTestStatus !== "idle" && aiTestMessage ? (
            <p className={`mt-3 text-sm ${aiTestStatus === "error" ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}`}>{aiTestMessage}</p>
          ) : null}
          {aiError ? <p className="mt-3 text-sm text-destructive">{aiError}</p> : null}

          {/* AI Results */}
          {aiQuestions.length > 0 ? (
            <div className="mt-5 space-y-3">
              {/* Bulk add banner */}
              <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-950/30">
                <div className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-600 dark:text-emerald-400"><polyline points="20 6 9 17 4 12"/></svg>
                  <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">{aiQuestions.length} question{aiQuestions.length > 1 ? "s" : ""} generated</span>
                </div>
                <Button size="sm" disabled={bulkAdding} onClick={handleAddAllAiQuestions} className="bg-emerald-600 text-white hover:bg-emerald-700">
                  {bulkAdding ? "Adding..." : `⚡ Add All ${aiQuestions.length} to Quiz`}
                </Button>
              </div>

              {aiQuestions.map((question, index) => (
                <div key={`${question.questionText}-${index}`} className="rounded-xl border border-violet-200 bg-white/70 p-4 dark:border-violet-800 dark:bg-white/5">
                  <p className="text-sm font-medium">{question.questionText}</p>
                  <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm text-muted-foreground">
                    {question.options.map((opt, oi) => (
                      <li key={`${opt}-${oi}`} className={oi === question.correctIndex ? "font-semibold text-emerald-600 dark:text-emerald-400" : ""}>{opt}</li>
                    ))}
                  </ol>
                  {question.explanation && <p className="mt-2 text-xs text-muted-foreground italic">💡 {question.explanation}</p>}
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Correct: option {question.correctIndex + 1}</span>
                    <Button size="sm" variant="outline" disabled={actionId === question.questionText} onClick={() => handleAddAiQuestion(question)} className="border-violet-300 dark:border-violet-700">Add to quiz</Button>
                  </div>
                </div>
              ))}
            </div>
          ) : aiLoading ? (
            <div className="mt-5 flex items-center gap-3 text-sm text-muted-foreground">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-300 border-t-violet-600" />
              Generating questions with AI...
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">Enter a topic and click Generate to create AI-powered questions.</p>
          )}
        </div>
      </div>

      {/* ─── QUIZ DETAILS ─── */}
      <Card>
        <CardHeader>
          <CardTitle>Quiz details</CardTitle>
          <CardDescription>Update the quiz metadata.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="quiz-title">Title</label>
            <Input id="quiz-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="quiz-description">Description</label>
            <Input id="quiz-description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="quiz-time">Time limit (minutes)</label>
            <Input id="quiz-time" type="number" min={0} value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="quiz-tags">Tags</label>
            <Input id="quiz-tags" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleQuizSave} disabled={savingQuiz}>{savingQuiz ? "Saving..." : "Save quiz"}</Button>
        </CardFooter>
      </Card>

      {/* ─── QUESTIONS ─── */}
      <Card>
        <CardHeader>
          <CardTitle>Questions</CardTitle>
          <CardDescription>Manage quiz questions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {questions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No questions yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Question</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questions.map((question) => (
                  <TableRow key={question.id}>
                    <TableCell className="max-w-105 truncate">{question.questionText}</TableCell>
                    <TableCell>{question.order ?? 0}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEditQuestion(question)}>Edit</Button>
                        <Button size="sm" variant="destructive" disabled={actionId === question.id} onClick={() => handleDeleteQuestion(question)}>Delete</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="rounded-lg border border-border p-4">
            <h3 className="text-sm font-medium">{questionTitle}</h3>
            <form className="mt-4 space-y-4" onSubmit={handleQuestionSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="question-text">Question</label>
                <Input id="question-text" value={questionForm.questionText} onChange={(e) => setQuestionForm((p) => ({ ...p, questionText: e.target.value }))} required />
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {questionForm.options.map((option, index) => (
                  <div key={`option-${index}`} className="space-y-1">
                    <label className="text-xs text-muted-foreground">Option {index + 1}</label>
                    <Input value={option} onChange={(e) => setQuestionForm((p) => { const opts = [...p.options]; opts[index] = e.target.value; return { ...p, options: opts }; })} required />
                  </div>
                ))}
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="correct-index">Correct option</label>
                  <select id="correct-index" className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={questionForm.correctIndex} onChange={(e) => setQuestionForm((p) => ({ ...p, correctIndex: Number(e.target.value) }))}>
                    {[0, 1, 2, 3].map((v) => (<option key={v} value={v}>Option {v + 1}</option>))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="order">Order</label>
                  <Input id="order" type="number" value={questionForm.order} onChange={(e) => setQuestionForm((p) => ({ ...p, order: Number(e.target.value) }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="explanation">Explanation</label>
                  <Input id="explanation" value={questionForm.explanation} onChange={(e) => setQuestionForm((p) => ({ ...p, explanation: e.target.value }))} />
                </div>
              </div>
              {questionError ? <p className="text-sm text-destructive">{questionError}</p> : null}
              <div className="flex flex-wrap gap-2">
                <Button type="submit">{editingQuestionId ? "Update question" : "Add question"}</Button>
                {editingQuestionId ? (<Button type="button" variant="outline" onClick={resetQuestionForm}>Cancel edit</Button>) : null}
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}