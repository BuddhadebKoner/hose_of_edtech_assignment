export type QuizAttempt = {
   id: string;
   quiz: {
      id: string;
      title: string;
   };
   user: {
      id: string;
      name: string;
      email: string;
   };
   score: number;
   totalQuestions: number;
   percentage: number;
   completedAt: string;
};

export type MyAttempt = {
   id: string;
   quiz: {
      id: string;
      title: string;
   };
   score: number;
   totalQuestions: number;
   percentage: number;
   completedAt: string;
};

export type AttemptQuestion = {
   id: string;
   questionText: string;
   options: string[];
   correctIndex: number;
   explanation: string;
   userAnswer: number | null;
};

export type AttemptDetail = {
   id: string;
   quiz: {
      id: string;
      title: string;
   };
   userId: string;
   score: number;
   totalQuestions: number;
   percentage: number;
   completedAt: string;
   questions: AttemptQuestion[];
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

export async function getQuizAttempts(quizId: string) {
   return requestJson<QuizAttempt[]>(`/api/attempts?quizId=${quizId}`);
}

export async function submitAttempt(quizId: string, answers: number[]) {
   return requestJson<{
      id: string;
      score: number;
      totalQuestions: number;
      percentage: number;
      completedAt: string;
   }>("/api/attempts", {
      method: "POST",
      body: { quizId, answers },
   });
}

export async function getMyAttempts() {
   return requestJson<MyAttempt[]>("/api/attempts/me");
}

export async function getAttemptDetail(attemptId: string) {
   return requestJson<AttemptDetail>(`/api/attempts/${attemptId}`);
}
