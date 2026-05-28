"use client";

import { useEffect, useState } from "react";
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
import { useAdminAuth } from "@/context/admin-auth-context";
import { createQuiz } from "@/lib/api/quizzes";

interface ValidationErrors {
  title?: string;
  description?: string;
  timeLimit?: string;
  tags?: string;
  questionLimit?: string;
}

export default function NewQuizPage() {
  const router = useRouter();
  const { admin, loading } = useAdminAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeLimit, setTimeLimit] = useState("");
  const [questionLimit, setQuestionLimit] = useState("10");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (!loading && !admin) {
      router.push("/admin");
    }
  }, [admin, loading, router]);

  const validateTitle = (title: string): string | undefined => {
    if (!title.trim()) {
      return "Title is required";
    }
    if (title.trim().length < 3) {
      return "Title must be at least 3 characters";
    }
    if (title.trim().length > 100) {
      return "Title must not exceed 100 characters";
    }
    return undefined;
  };

  const validateDescription = (description: string): string | undefined => {
    if (description && description.length > 500) {
      return "Description must not exceed 500 characters";
    }
    return undefined;
  };

  const validateTimeLimit = (timeLimit: string): string | undefined => {
    if (timeLimit) {
      const num = Number(timeLimit);
      if (isNaN(num)) {
        return "Time limit must be a valid number";
      }
      if (num < 0) {
        return "Time limit cannot be negative";
      }
      if (num > 1440) {
        return "Time limit cannot exceed 1440 minutes (24 hours)";
      }
      if (!Number.isInteger(num)) {
        return "Time limit must be a whole number";
      }
    }
    return undefined;
  };

  const validateTags = (tags: string): string | undefined => {
    if (tags) {
      const tagsList = tags.split(",").map(tag => tag.trim()).filter(Boolean);
      if (tagsList.length > 10) {
        return "Maximum 10 tags allowed";
      }
      for (const tag of tagsList) {
        if (tag.length > 30) {
          return "Each tag must not exceed 30 characters";
        }
        if (!/^[a-zA-Z0-9\s-]+$/.test(tag)) {
          return "Tags can only contain letters, numbers, spaces, and hyphens";
        }
      }
    }
    return undefined;
  };

  const validateQuestionLimit = (questionLimit: string): string | undefined => {
    if (!questionLimit) {
      return "Question limit is required";
    }
    const num = Number(questionLimit);
    if (isNaN(num)) {
      return "Question limit must be a valid number";
    }
    if (num < 1) {
      return "Question limit must be at least 1";
    }
    if (num > 30) {
      return "Question limit cannot exceed 30";
    }
    if (!Number.isInteger(num)) {
      return "Question limit must be a whole number";
    }
    return undefined;
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (touched.title) {
      const error = validateTitle(value);
      setValidationErrors(prev => ({ ...prev, title: error }));
    }
    setError(null);
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    if (touched.description) {
      const error = validateDescription(value);
      setValidationErrors(prev => ({ ...prev, description: error }));
    }
    setError(null);
  };

  const handleTimeLimitChange = (value: string) => {
    setTimeLimit(value);
    if (touched.timeLimit) {
      const error = validateTimeLimit(value);
      setValidationErrors(prev => ({ ...prev, timeLimit: error }));
    }
    setError(null);
  };

  const handleTagsChange = (value: string) => {
    setTags(value);
    if (touched.tags) {
      const error = validateTags(value);
      setValidationErrors(prev => ({ ...prev, tags: error }));
    }
    setError(null);
  };

  const handleQuestionLimitChange = (value: string) => {
    setQuestionLimit(value);
    if (touched.questionLimit) {
      const error = validateQuestionLimit(value);
      setValidationErrors(prev => ({ ...prev, questionLimit: error }));
    }
    setError(null);
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));

    if (field === 'title') {
      const error = validateTitle(title);
      setValidationErrors(prev => ({ ...prev, title: error }));
    } else if (field === 'description') {
      const error = validateDescription(description);
      setValidationErrors(prev => ({ ...prev, description: error }));
    } else if (field === 'timeLimit') {
      const error = validateTimeLimit(timeLimit);
      setValidationErrors(prev => ({ ...prev, timeLimit: error }));
    } else if (field === 'tags') {
      const error = validateTags(tags);
      setValidationErrors(prev => ({ ...prev, tags: error }));
    } else if (field === 'questionLimit') {
      const error = validateQuestionLimit(questionLimit);
      setValidationErrors(prev => ({ ...prev, questionLimit: error }));
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    // Mark all fields as touched
    setTouched({ title: true, description: true, timeLimit: true, tags: true, questionLimit: true });

    // Validate all fields
    const errors: ValidationErrors = {};
    const titleError = validateTitle(title);
    const descriptionError = validateDescription(description);
    const timeLimitError = validateTimeLimit(timeLimit);
    const tagsError = validateTags(tags);
    const questionLimitError = validateQuestionLimit(questionLimit);

    if (titleError) errors.title = titleError;
    if (descriptionError) errors.description = descriptionError;
    if (timeLimitError) errors.timeLimit = timeLimitError;
    if (tagsError) errors.tags = tagsError;
    if (questionLimitError) errors.questionLimit = questionLimitError;

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    setSaving(true);

    const tagsList = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    try {
      const quiz = await createQuiz({
        title: title.trim(),
        description: description.trim() || undefined,
        timeLimit: timeLimit ? Number(timeLimit) : undefined,
        questionLimit: Number(questionLimit),
        tags: tagsList.length > 0 ? tagsList : undefined,
      });
      router.push(`/admin/quiz/${quiz.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create quiz. Please try again.";
      setError(message);
      setSaving(false);
    }
  };

  if (loading && !admin) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-10">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!admin) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold">Create quiz</h1>
        <p className="text-sm text-muted-foreground">
          Add the quiz details before adding questions.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quiz details</CardTitle>
          <CardDescription>Fill out the quiz metadata.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="quiz-title">
                Title <span className="text-destructive">*</span>
              </label>
              <Input
                id="quiz-title"
                value={title}
                onChange={(event) => handleTitleChange(event.target.value)}
                onBlur={() => handleBlur('title')}
                placeholder="e.g., JavaScript Fundamentals Quiz"
                className={validationErrors.title ? "border-destructive" : ""}
              />
              {validationErrors.title && (
                <p className="text-xs text-destructive">{validationErrors.title}</p>
              )}
              <p className="text-xs text-muted-foreground">{title.length}/100 characters</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="quiz-description">
                Description
              </label>
              <Input
                id="quiz-description"
                value={description}
                onChange={(event) => handleDescriptionChange(event.target.value)}
                onBlur={() => handleBlur('description')}
                placeholder="Brief description of the quiz (optional)"
                className={validationErrors.description ? "border-destructive" : ""}
              />
              {validationErrors.description && (
                <p className="text-xs text-destructive">{validationErrors.description}</p>
              )}
              {description && (
                <p className="text-xs text-muted-foreground">{description.length}/500 characters</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="quiz-time">
                Time limit (minutes)
              </label>
              <Input
                id="quiz-time"
                type="number"
                min={0}
                max={1440}
                value={timeLimit}
                onChange={(event) => handleTimeLimitChange(event.target.value)}
                onBlur={() => handleBlur('timeLimit')}
                placeholder="e.g., 30 (optional)"
                className={validationErrors.timeLimit ? "border-destructive" : ""}
              />
              {validationErrors.timeLimit && (
                <p className="text-xs text-destructive">{validationErrors.timeLimit}</p>
              )}
              <p className="text-xs text-muted-foreground">Leave empty for no time limit</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="quiz-question-limit">
                Question limit <span className="text-destructive">*</span>
              </label>
              <Input
                id="quiz-question-limit"
                type="number"
                min={1}
                max={30}
                value={questionLimit}
                onChange={(event) => handleQuestionLimitChange(event.target.value)}
                onBlur={() => handleBlur('questionLimit')}
                placeholder="10"
                className={validationErrors.questionLimit ? "border-destructive" : ""}
              />
              {validationErrors.questionLimit && (
                <p className="text-xs text-destructive">{validationErrors.questionLimit}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Number of questions to show per attempt (1-30). Questions will be randomized.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="quiz-tags">
                Tags (comma separated)
              </label>
              <Input
                id="quiz-tags"
                value={tags}
                onChange={(event) => handleTagsChange(event.target.value)}
                onBlur={() => handleBlur('tags')}
                placeholder="e.g., JavaScript, Programming, Beginner"
                className={validationErrors.tags ? "border-destructive" : ""}
              />
              {validationErrors.tags && (
                <p className="text-xs text-destructive">{validationErrors.tags}</p>
              )}
              {tags && (
                <p className="text-xs text-muted-foreground">
                  {tags.split(",").map(t => t.trim()).filter(Boolean).length} tag(s) (max 10)
                </p>
              )}
            </div>
            {error ? <p className="text-sm text-destructive font-medium">{error}</p> : null}
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Creating..." : "Create quiz"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          You can add questions once the quiz is created.
        </CardFooter>
      </Card>
    </div>
  );
}