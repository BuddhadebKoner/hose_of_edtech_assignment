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
  const [aiTestStatus, setAiTestStatus] = useState<"idle" | "testing" | "success" | "error">(
    "idle"
  );
  const [aiTestMessage, setAiTestMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !admin) {
      router.push("/admin");
    }
  }, [admin, loading, router]);

  const loadQuiz = useCallback(async () => {
    if (!quizId) {
      return;
    }

    setLoadingQuiz(true);
    setError(null);
    try {
      const [quizData, questionData] = await Promise.all([
        getQuiz(quizId),
        getQuestions(quizId),
      ]);
      setQuiz(quizData);
      setQuestions(questionData);
      setTitle(quizData.title);
      setDescription(quizData.description ?? "");
      setTimeLimit(quizData.timeLimit ? String(quizData.timeLimit) : "");
      setTagsInput(quizData.tags?.join(", ") ?? "");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load quiz";
      setError(message);
    } finally {
      setLoadingQuiz(false);
    }
  }, [quizId]);

  useEffect(() => {
    if (admin) {
      loadQuiz();
    }
  }, [admin, loadQuiz]);

  const handleQuizSave = async () => {
    if (!quizId) {
      return;
    }

    setSavingQuiz(true);
    setError(null);

    const tags = tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    try {
      const updated = await updateQuiz(quizId, {
        title,
        description: description || "",
        timeLimit: timeLimit ? Number(timeLimit) : 0,
        tags: tags.length ? tags : [],
      });
      setQuiz(updated);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update quiz";
      setError(message);
    } finally {
      setSavingQuiz(false);
    }
  };

  const handlePublishToggle = async () => {
    if (!quiz) {
      return;
    }

    setActionId(quiz.id);
    try {
      const result = await togglePublish(quiz.id, !quiz.isPublished);
      setQuiz({ ...quiz, isPublished: result.isPublished });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update quiz";
      setError(message);
    } finally {
      setActionId(null);
    }
  };

  const handleDeleteQuiz = async () => {
    if (!quiz) {
      return;
    }

    if (!confirm(`Delete quiz "${quiz.title}"? This removes all questions and attempts.`)) {
      return;
    }

    setActionId(quiz.id);
    try {
      await deleteQuiz(quiz.id);
      router.push("/admin");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete quiz";
      setError(message);
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

    if (!quizId) {
      return;
    }

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
      const message = err instanceof Error ? err.message : "Failed to save question";
      setQuestionError(message);
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
    if (!quizId) {
      return;
    }

    if (!confirm("Delete this question?")) {
      return;
    }

    setActionId(question.id);
    try {
      await deleteQuestion(quizId, question.id);
      setQuestions((prev) => prev.filter((item) => item.id !== question.id));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete question";
      setQuestionError(message);
    } finally {
      setActionId(null);
    }
  };

  const handleGenerate = async () => {
    if (!quizId) {
      return;
    }

    const trimmedTopic = topic.trim();
    if (trimmedTopic.length < 3) {
      setAiError("Topic must be at least 3 characters.");
      return;
    }

    const safeCount = Math.min(10, Math.max(1, Number.isFinite(count) ? count : 1));
    if (safeCount !== count) {
      setCount(safeCount);
    }

    setAiLoading(true);
    setAiError(null);
    try {
      const data = await generateQuestions(quizId, trimmedTopic, safeCount);
      setAiQuestions(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "AI generation failed";
      setAiError(message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleTestAi = async () => {
    if (!quizId) {
      return;
    }

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
      const message = err instanceof Error ? err.message : "AI test failed";
      setAiTestStatus("error");
      setAiTestMessage(message);
    } finally {
      setAiTesting(false);
    }
  };

  const handleAddAiQuestion = async (aiQuestion: GeneratedQuestion) => {
    if (!quizId) {
      return;
    }

    setActionId(aiQuestion.questionText);
    try {
      const maxOrder = questions.length
        ? Math.max(...questions.map((question) => question.order ?? 0))
        : -1;
      await createQuestion(quizId, {
        questionText: aiQuestion.questionText,
        options: aiQuestion.options,
        correctIndex: aiQuestion.correctIndex,
        explanation: aiQuestion.explanation,
        order: maxOrder + 1,
      });
      await loadQuiz();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add AI question";
      setAiError(message);
    } finally {
      setActionId(null);
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

  if (!admin || !quiz) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-10">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Edit quiz</h1>
          <p className="text-sm text-muted-foreground">
            Update details, manage questions, and publish.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => router.push("/admin")}
          >
            Back to dashboard
          </Button>
          <Button
            variant="secondary"
            disabled={actionId === quiz.id}
            onClick={handlePublishToggle}
          >
            {quiz.isPublished ? "Unpublish" : "Publish"}
          </Button>
          <Button
            variant="destructive"
            disabled={actionId === quiz.id}
            onClick={handleDeleteQuiz}
          >
            Delete quiz
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>Quiz details</CardTitle>
          <CardDescription>Update the quiz metadata.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="quiz-title">
              Title
            </label>
            <Input
              id="quiz-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="quiz-description">
              Description
            </label>
            <Input
              id="quiz-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="quiz-time">
              Time limit (minutes)
            </label>
            <Input
              id="quiz-time"
              type="number"
              min={0}
              value={timeLimit}
              onChange={(event) => setTimeLimit(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="quiz-tags">
              Tags
            </label>
            <Input
              id="quiz-tags"
              value={tagsInput}
              onChange={(event) => setTagsInput(event.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleQuizSave} disabled={savingQuiz}>
            {savingQuiz ? "Saving..." : "Save quiz"}
          </Button>
        </CardFooter>
      </Card>

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
                    <TableCell className="max-w-105 truncate">
                      {question.questionText}
                    </TableCell>
                    <TableCell>{question.order ?? 0}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditQuestion(question)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={actionId === question.id}
                          onClick={() => handleDeleteQuestion(question)}
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

          <div className="rounded-lg border border-border p-4">
            <h3 className="text-sm font-medium">{questionTitle}</h3>
            <form className="mt-4 space-y-4" onSubmit={handleQuestionSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="question-text">
                  Question
                </label>
                <Input
                  id="question-text"
                  value={questionForm.questionText}
                  onChange={(event) =>
                    setQuestionForm((prev) => ({
                      ...prev,
                      questionText: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {questionForm.options.map((option, index) => (
                  <div key={`option-${index}`} className="space-y-1">
                    <label className="text-xs text-muted-foreground">Option {index + 1}</label>
                    <Input
                      value={option}
                      onChange={(event) =>
                        setQuestionForm((prev) => {
                          const options = [...prev.options];
                          options[index] = event.target.value;
                          return { ...prev, options };
                        })
                      }
                      required
                    />
                  </div>
                ))}
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="correct-index">
                    Correct option
                  </label>
                  <select
                    id="correct-index"
                    className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                    value={questionForm.correctIndex}
                    onChange={(event) =>
                      setQuestionForm((prev) => ({
                        ...prev,
                        correctIndex: Number(event.target.value),
                      }))
                    }
                  >
                    {[0, 1, 2, 3].map((value) => (
                      <option key={value} value={value}>
                        Option {value + 1}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="order">
                    Order
                  </label>
                  <Input
                    id="order"
                    type="number"
                    value={questionForm.order}
                    onChange={(event) =>
                      setQuestionForm((prev) => ({
                        ...prev,
                        order: Number(event.target.value),
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="explanation">
                    Explanation
                  </label>
                  <Input
                    id="explanation"
                    value={questionForm.explanation}
                    onChange={(event) =>
                      setQuestionForm((prev) => ({
                        ...prev,
                        explanation: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              {questionError ? (
                <p className="text-sm text-destructive">{questionError}</p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button type="submit">
                  {editingQuestionId ? "Update question" : "Add question"}
                </Button>
                {editingQuestionId ? (
                  <Button type="button" variant="outline" onClick={resetQuestionForm}>
                    Cancel edit
                  </Button>
                ) : null}
              </div>
            </form>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI question generator</CardTitle>
          <CardDescription>
            Generate questions and add them to this quiz.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[2fr_1fr_auto_auto]">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="ai-topic">
                Topic
              </label>
              <Input
                id="ai-topic"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="ai-count">
                Count
              </label>
              <Input
                id="ai-count"
                type="number"
                min={1}
                max={10}
                value={count}
                onChange={(event) => {
                  const next = Number(event.target.value || 1);
                  const safe = Math.min(10, Math.max(1, Number.isFinite(next) ? next : 1));
                  setCount(safe);
                }}
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="secondary"
                disabled={aiLoading || aiTesting || !topic.trim()}
                onClick={handleGenerate}
              >
                {aiLoading ? "Generating..." : "Generate"}
              </Button>
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                disabled={aiLoading || aiTesting}
                onClick={handleTestAi}
              >
                {aiTesting ? "Testing..." : "Test AI"}
              </Button>
            </div>
          </div>
          {aiTestStatus !== "idle" && aiTestMessage ? (
            <p
              className={`text-sm ${aiTestStatus === "error" ? "text-destructive" : "text-muted-foreground"
                }`}
            >
              {aiTestMessage}
            </p>
          ) : null}
          {aiError ? <p className="text-sm text-destructive">{aiError}</p> : null}
          {aiQuestions.length > 0 ? (
            <div className="space-y-3">
              {aiQuestions.map((question, index) => (
                <div
                  key={`${question.questionText}-${index}`}
                  className="rounded-md border border-border p-3"
                >
                  <p className="text-sm font-medium">{question.questionText}</p>
                  <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm text-muted-foreground">
                    {question.options.map((option, optionIndex) => (
                      <li key={`${option}-${optionIndex}`}>{option}</li>
                    ))}
                  </ol>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>Correct: option {question.correctIndex + 1}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actionId === question.questionText}
                      onClick={() => handleAddAiQuestion(question)}
                    >
                      Add to quiz
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : aiLoading ? (
            <p className="text-sm text-muted-foreground">Generating questions...</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              No AI questions yet. Generate a topic to see results.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}