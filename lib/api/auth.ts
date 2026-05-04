export type AuthRole = "admin" | "student";

export type AuthUser = {
   id: string;
   name?: string;
   email: string;
   role: AuthRole;
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

export async function registerStudent(input: {
   name: string;
   email: string;
   password: string;
}) {
   return requestJson<AuthUser>("/api/auth/register", {
      method: "POST",
      body: input,
   });
}

export async function loginStudent(input: { email: string; password: string }) {
   return requestJson<AuthUser>("/api/auth/login", {
      method: "POST",
      body: { ...input, role: "student" },
   });
}

export async function loginAdmin(input: { email: string; password: string }) {
   return requestJson<AuthUser>("/api/auth/login", {
      method: "POST",
      body: { ...input, role: "admin" },
   });
}

export async function getMe() {
   return requestJson<AuthUser>("/api/auth/me", { method: "GET" });
}

export async function logout() {
   return requestJson<{ ok: true }>("/api/auth/logout", { method: "POST" });
}
