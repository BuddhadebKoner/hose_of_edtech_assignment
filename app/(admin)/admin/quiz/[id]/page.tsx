"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
  const [questionLimit, setQuestionLimit] = useState("10");
  const [tagsInput, setTagsInput] = useState("");

  const [questionForm, setQuestionForm] = useState({ ...EMPTY_QUESTION });
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [questionError, setQuestionError] = useState<string | null>(null);

  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(5);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTesting, setAiTesting] = useState(false);
  const [aiQuestions, setAiQuestions] = useState<GeneratedQuestion[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);
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
      setQuestionLimit(quizData.questionLimit ? String(quizData.questionLimit) : "10");
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
        questionLimit: Number(questionLimit),
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
    setDialogOpen(false);
    setQuestionForm({ ...EMPTY_QUESTION });
    setQuestionError(null);
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
    setDialogOpen(true);
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
    setAiError(null);
    try {
      await generateQuestions(quizId, trimmedTopic, 1);
      setAiError("✓ AI connection OK");
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "AI test failed");
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

  if ((loading || loadingQuiz) && !quiz) {
    return (
      <div className="mx-auto w-full max-w-[1200px] space-y-4 px-6 py-10">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!admin || !quiz) return null;

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-sans font-semibold" style={{ fontSize: '1.375rem' }}>
            {quiz.title}
          </h1>
          <p className="font-sans text-foreground-muted" style={{ fontSize: '0.875rem', marginTop: '2px' }}>
            {questions.length} questions · {quiz.isPublished ? 'Published' : 'Draft'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => router.push("/admin")}>
            ← Dashboard
          </Button>
          <Button
            variant={quiz.isPublished ? "outline" : "default"}
            onClick={handlePublishToggle}
            disabled={actionId === quiz.id}
          >
            {quiz.isPublished ? "Unpublish" : "Publish"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-input" style={{ background: 'var(--destructive-surface)', border: '1px solid var(--destructive)' }}>
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-[65%_35%]">
        {/* Left column */}
        <div className="space-y-5">
          {/* AI Generator Section */}
          <div
            className="surface-raised accent-stripe"
            style={{
              padding: '24px',
              borderRadius: 'var(--radius-card)',
              boxShadow: 'var(--shadow-raised)',
            }}
          >
            {/* Section label */}
            <div className="flex items-center gap-2 mb-4">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <span
                className="font-sans font-semibold uppercase"
                style={{
                  fontSize: '0.7rem',
                  letterSpacing: '0.08em',
                  color: 'var(--purple-600)'
                }}
              >
                AI Generator
              </span>
            </div>

            {/* Input row */}
            <div className="flex gap-3 mb-3">
              <Input
                placeholder="Enter a topic, e.g. 'JavaScript closures'"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="flex-1"
              />
              <Input
                type="number"
                min={1}
                max={10}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-20"
              />
              <Button
                variant="default"
                onClick={handleGenerate}
                disabled={aiLoading || !topic.trim()}
              >
                {aiLoading ? "Generating..." : "Generate"}
              </Button>
            </div>

            {/* Test AI link */}
            <div className="text-right">
              <button
                onClick={handleTestAi}
                disabled={aiTesting}
                className="text-xs text-foreground-muted hover:text-purple-500 transition-colors disabled:opacity-50"
              >
                {aiTesting ? "Testing..." : "Test AI connection →"}
              </button>
            </div>

            {/* Error/Status */}
            {aiError && (
              <div
                className="mt-3 px-3 py-2 rounded-input"
                style={{
                  background: aiError.startsWith('✓') ? 'var(--success-surface)' : 'var(--destructive-surface)',
                  border: `1px solid ${aiError.startsWith('✓') ? 'var(--success)' : 'var(--destructive)'}`
                }}
              >
                <p className={`text-sm ${aiError.startsWith('✓') ? 'text-success' : 'text-destructive'}`}>{aiError}</p>
              </div>
            )}

            {/* Generated Questions Preview */}
            {aiQuestions.length > 0 && (
              <div className="mt-5 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="text-sm font-medium text-foreground">Generated Questions</span>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={handleAddAllAiQuestions}
                    disabled={bulkAdding}
                  >
                    {bulkAdding ? "Adding..." : `Add All (${aiQuestions.length})`}
                  </Button>
                </div>

                {aiQuestions.map((q, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-input"
                    style={{
                      background: 'oklch(0.94 0.030 292 / 0.4)',
                      border: '1px solid var(--purple-200)'
                    }}
                  >
                    {/* Question number */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <span className="tag text-xs">Q{index + 1}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddAiQuestion(q)}
                        disabled={actionId === q.questionText}
                      >
                        {actionId === q.questionText ? "Adding..." : "Add to quiz"}
                      </Button>
                    </div>

                    {/* Question text */}
                    <p className="font-sans font-medium text-foreground text-sm mb-2">
                      {q.questionText}
                    </p>

                    {/* Options */}
                    <div className="space-y-1">
                      {q.options.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{
                              background: oi === q.correctIndex ? 'var(--success)' : 'transparent',
                              border: oi === q.correctIndex ? 'none' : '1.5px solid var(--border-strong)'
                            }}
                          />
                          <span className="text-xs text-foreground-muted">{opt}</span>
                        </div>
                      ))}
                    </div>

                    {/* Explanation */}
                    {q.explanation && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <p className="text-xs italic text-foreground-faint">
                          <span className="font-sans uppercase text-[0.65rem] not-italic">Explanation:</span> {q.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Questions List Section */}
          <div className="space-y-4">
            {/* Section header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-sans font-semibold text-foreground" style={{ fontSize: '0.95rem' }}>
                  Questions
                </h2>
                <span className="tag">{questions.length} total</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  resetQuestionForm();
                  setDialogOpen(true);
                }}
              >
                Add Question
              </Button>
            </div>

            {/* Questions list */}
            {questions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-foreground-muted mb-1">No questions yet</p>
                <p className="text-xs text-foreground-faint">Use the AI generator above or add manually.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {questions.map((q, index) => (
                  <div
                    key={q.id}
                    className="surface p-4 rounded-input"
                  >
                    <div className="flex items-start gap-3">
                      {/* Drag handle */}
                      <div className="flex-shrink-0 text-foreground-faint">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="9" cy="5" r="2" /><circle cx="9" cy="12" r="2" /><circle cx="9" cy="19" r="2" />
                          <circle cx="15" cy="5" r="2" /><circle cx="15" cy="12" r="2" /><circle cx="15" cy="19" r="2" />
                        </svg>
                      </div>

                      {/* Order number */}
                      <span className="font-mono text-xs text-foreground-faint flex-shrink-0">
                        {q.order ?? index}
                      </span>

                      {/* Question content */}
                      <div className="flex-1 min-w-0">
                        <p className="font-sans font-medium text-sm text-foreground line-clamp-2 mb-1">
                          {q.questionText}
                        </p>
                        <p className="text-xs text-foreground-faint">
                          {q.options.slice(0, 2).join(", ")}...
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleEditQuestion(q)}
                          className="w-7 h-7 flex items-center justify-center rounded-input text-foreground-muted hover:bg-purple-100 hover:text-foreground transition-colors"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(q)}
                          disabled={actionId === q.id}
                          className="w-7 h-7 flex items-center justify-center rounded-input text-foreground-muted hover:bg-purple-100 hover:text-destructive transition-colors disabled:opacity-50"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column - Quiz Settings (sticky) */}
        <div>
          <div
            className="surface-raised p-6 rounded-card"
            style={{
              position: 'sticky',
              top: '24px',
              boxShadow: 'var(--shadow-raised)'
            }}
          >
            {/* Section label */}
            <h2
              className="font-sans font-semibold uppercase mb-5"
              style={{
                fontSize: '0.7rem',
                letterSpacing: '0.08em',
                color: 'var(--foreground-faint)'
              }}
            >
              Quiz Settings
            </h2>

            {/* Fields */}
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-foreground-muted mb-1">
                  Title
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
                <p className="text-xs text-foreground-faint mt-1 text-right">
                  {title.length}/100
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-foreground-muted mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-input border border-border bg-input text-sm resize-none"
                  rows={3}
                />
              </div>

              {/* Time Limit */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-foreground-muted mb-1">
                  Time Limit
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(e.target.value)}
                    className="flex-1"
                  />
                  <span className="text-sm text-foreground-muted">min</span>
                </div>
              </div>

              {/* Question Limit */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-foreground-muted mb-1">
                  Questions per attempt
                </label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={questionLimit}
                  onChange={(e) => setQuestionLimit(e.target.value)}
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-foreground-muted mb-1">
                  Tags
                </label>
                <Input
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="comma, separated, tags"
                />
                {/* Tag preview */}
                {tagsInput && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {tagsInput.split(",").map((tag, i) => {
                      const trimmed = tag.trim();
                      return trimmed ? (
                        <span key={i} className="tag text-xs">{trimmed}</span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Save button */}
            <Button
              onClick={handleQuizSave}
              disabled={savingQuiz}
              className="w-full mt-5"
              variant="default"
            >
              {savingQuiz ? "Saving..." : "Save Changes"}
            </Button>

            {/* Status info */}
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-foreground-muted">Status:</span>
                <span
                  className="tag text-xs"
                  style={{
                    background: quiz.isPublished ? 'var(--success-surface)' : 'var(--warning-surface)',
                    color: quiz.isPublished ? 'var(--success)' : 'var(--warning)',
                    borderColor: quiz.isPublished ? 'var(--success)' : 'var(--warning)'
                  }}
                >
                  {quiz.isPublished ? "Published" : "Draft"}
                </span>
              </div>
              <button
                onClick={handlePublishToggle}
                disabled={actionId === quiz.id}
                className="text-xs text-purple-500 hover:text-purple-600 underline disabled:opacity-50"
              >
                {quiz.isPublished ? "Unpublish this quiz" : "Publish this quiz"}
              </button>
            </div>

            {/* Danger zone */}
            <div className="mt-6 pt-6 border-t border-border">
              <h3
                className="text-xs uppercase tracking-wider mb-3"
                style={{ color: 'var(--destructive)' }}
              >
                Danger Zone
              </h3>
              <Button
                onClick={handleDeleteQuiz}
                disabled={actionId === quiz.id}
                variant="outline"
                className="w-full text-destructive border-destructive hover:bg-destructive-surface"
              >
                Delete Quiz
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Question Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingQuestionId ? "Edit Question" : "Add Question"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleQuestionSubmit} className="space-y-4">
            {/* Question Text */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-foreground-faint mb-1">
                Question
              </label>
              <textarea
                value={questionForm.questionText}
                onChange={(e) => setQuestionForm(p => ({ ...p, questionText: e.target.value }))}
                placeholder="Enter your question..."
                className="w-full px-3 py-2 rounded-input border border-border bg-input text-sm resize-none"
                rows={3}
                required
              />
            </div>

            {/* Options */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-foreground-faint mb-2">
                Options
              </label>
              <div className="space-y-2">
                {questionForm.options.map((opt, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {/* Radio-style selector */}
                    <button
                      type="button"
                      onClick={() => setQuestionForm(p => ({ ...p, correctIndex: index }))}
                      className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center transition-colors"
                      style={{
                        border: '1.5px solid var(--border-strong)',
                        background: questionForm.correctIndex === index ? 'var(--success)' : 'transparent'
                      }}
                    >
                      {questionForm.correctIndex === index && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </button>

                    {/* Option label */}
                    <span className="font-mono text-xs text-foreground-faint w-4">
                      {String.fromCharCode(65 + index)}
                    </span>

                    {/* Option input */}
                    <Input
                      value={opt}
                      onChange={(e) => {
                        const opts = [...questionForm.options];
                        opts[index] = e.target.value;
                        setQuestionForm(p => ({ ...p, options: opts }));
                      }}
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                      className="flex-1"
                      required
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Explanation & Order */}
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-xs uppercase tracking-wider text-foreground-faint mb-1">
                  Explanation (optional)
                </label>
                <textarea
                  value={questionForm.explanation}
                  onChange={(e) => setQuestionForm(p => ({ ...p, explanation: e.target.value }))}
                  className="w-full px-3 py-2 rounded-input border border-border bg-input text-sm resize-none"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-foreground-faint mb-1">
                  Order
                </label>
                <Input
                  type="number"
                  value={questionForm.order}
                  onChange={(e) => setQuestionForm(p => ({ ...p, order: Number(e.target.value) }))}
                  className="w-20"
                />
              </div>
            </div>

            {/* Error */}
            {questionError && (
              <p className="text-sm text-destructive">{questionError}</p>
            )}

            {/* Form footer */}
            <div className="flex items-center gap-2 pt-2">
              <Button type="submit" variant="default">
                {editingQuestionId ? "Update Question" : "Save Question"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={resetQuestionForm}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
