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

export default function NewQuizPage() {
  const router = useRouter();
  const { admin, loading } = useAdminAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeLimit, setTimeLimit] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !admin) {
      router.push("/admin");
    }
  }, [admin, loading, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSaving(true);

    const tagsList = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    try {
      const quiz = await createQuiz({
        title,
        description: description || undefined,
        timeLimit: timeLimit ? Number(timeLimit) : undefined,
        tags: tagsList.length > 0 ? tagsList : undefined,
      });
      router.push(`/admin/quiz/${quiz.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create quiz";
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
                Title
              </label>
              <Input
                id="quiz-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
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
                Tags (comma separated)
              </label>
              <Input
                id="quiz-tags"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
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