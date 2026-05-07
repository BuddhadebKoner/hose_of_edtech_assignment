export type Quiz = {
   id: string;
   title: string;
   description?: string;
   createdBy: string;
   isPublished: boolean;
   timeLimit?: number;
   tags?: string[];
   createdAt?: string;
   updatedAt?: string;
};

export type Question = {
   id: string;
   quizId: string;
   questionText: string;
   options: string[];
   correctIndex?: number;
   explanation?: string;
   order: number;
};

export type GeneratedQuestion = {
   questionText: string;
   options: string[];
   correctIndex: number;
   explanation?: string;
};

type RequestOptions = Omit<RequestInit, "body"> & { body?: unknown };

async function requestJson<T>(url: string, options: RequestOptions = {}) {
   const res = await fetch(url, {
      ...options,
      credentials: "include",
      headers: {
         "Content-Type": "application/json",
         ...(options.headers ?? {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
   });

   const data = await res.json().catch(() => null);

   if (!res.ok) {
      const message = data?.error ?? "Request failed";
      throw new Error(message);
   }

   return data as T;
}

export async function getQuizzes() {
   return requestJson<Quiz[]>("/api/quizzes");
}

export async function getQuiz(id: string) {
   return requestJson<Quiz>(`/api/quizzes/${id}`);
}

export async function createQuiz(input: {
   title: string;
   description?: string;
   timeLimit?: number;
   tags?: string[];
}) {
   return requestJson<Quiz>("/api/quizzes", { method: "POST", body: input });
}

export async function updateQuiz(
   id: string,
   input: Partial<{
      title: string;
      description: string;
      timeLimit: number;
      tags: string[];
      isPublished: boolean;
   }>
) {
   return requestJson<Quiz>(`/api/quizzes/${id}`, { method: "PUT", body: input });
}

export async function deleteQuiz(id: string) {
   return requestJson<{ ok: true }>(`/api/quizzes/${id}`, { method: "DELETE" });
}

export async function togglePublish(id: string, isPublished?: boolean) {
   return requestJson<{ id: string; isPublished: boolean }>(
      `/api/quizzes/${id}/publish`,
      { method: "PATCH", body: isPublished === undefined ? {} : { isPublished } }
   );
}

export async function getQuestions(quizId: string) {
   return requestJson<Question[]>(`/api/quizzes/${quizId}/questions`);
}

export async function createQuestion(quizId: string, input: {
   questionText: string;
   options: string[];
   correctIndex: number;
   explanation?: string;
   order?: number;
}) {
   return requestJson<Question>(`/api/quizzes/${quizId}/questions`, {
      method: "POST",
      body: input,
   });
}

export async function updateQuestion(
   quizId: string,
   questionId: string,
   input: Partial<{
      questionText: string;
      options: string[];
      correctIndex: number;
      explanation?: string;
      order: number;
   }>
) {
   return requestJson<Question>(`/api/quizzes/${quizId}/questions/${questionId}`, {
      method: "PUT",
      body: input,
   });
}

export async function deleteQuestion(quizId: string, questionId: string) {
   return requestJson<{ ok: true }>(`/api/quizzes/${quizId}/questions/${questionId}`, {
      method: "DELETE",
   });
}

export async function generateQuestions(quizId: string, topic: string, count: number) {
   return requestJson<GeneratedQuestion[]>(
      `/api/quizzes/${quizId}/questions/ai-generate`,
      { method: "POST", body: { topic, count } }
   );
}
