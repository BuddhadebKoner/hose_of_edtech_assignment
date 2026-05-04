"use client";

import {
   createContext,
   useCallback,
   useContext,
   useEffect,
   useMemo,
   useState,
   type ReactNode,
} from "react";

import {
   getMe,
   loginStudent,
   logout,
   registerStudent,
   type AuthUser,
} from "@/lib/api/auth";

type StudentAuthContextValue = {
   student: AuthUser | null;
   loading: boolean;
   login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
   register: (
      name: string,
      email: string,
      password: string
   ) => Promise<{ ok: boolean; error?: string }>;
   logout: () => Promise<void>;
   refresh: () => Promise<void>;
};

const StudentAuthContext = createContext<StudentAuthContextValue | undefined>(undefined);

export function StudentAuthProvider({ children }: { children: ReactNode }) {
   const [student, setStudent] = useState<AuthUser | null>(null);
   const [loading, setLoading] = useState(true);

   const refresh = useCallback(async () => {
      try {
         const me = await getMe();
         if (me.role === "student") {
            setStudent(me);
         } else {
            setStudent(null);
         }
      } catch {
         setStudent(null);
      } finally {
         setLoading(false);
      }
   }, []);

   useEffect(() => {
      refresh();
   }, [refresh]);

   const login = useCallback(async (email: string, password: string) => {
      setLoading(true);
      try {
         const me = await loginStudent({ email, password });
         setStudent(me);
         return { ok: true };
      } catch (error) {
         const message = error instanceof Error ? error.message : "Login failed";
         setStudent(null);
         return { ok: false, error: message };
      } finally {
         setLoading(false);
      }
   }, []);

   const register = useCallback(async (name: string, email: string, password: string) => {
      setLoading(true);
      try {
         await registerStudent({ name, email, password });
         const me = await loginStudent({ email, password });
         setStudent(me);
         return { ok: true };
      } catch (error) {
         const message = error instanceof Error ? error.message : "Registration failed";
         setStudent(null);
         return { ok: false, error: message };
      } finally {
         setLoading(false);
      }
   }, []);

   const logoutUser = useCallback(async () => {
      await logout();
      setStudent(null);
   }, []);

   const value = useMemo(
      () => ({ student, loading, login, register, logout: logoutUser, refresh }),
      [student, loading, login, register, logoutUser, refresh]
   );

   return (
      <StudentAuthContext.Provider value={value}>{children}</StudentAuthContext.Provider>
   );
}

export function useStudentAuth() {
   const ctx = useContext(StudentAuthContext);
   if (!ctx) {
      throw new Error("useStudentAuth must be used within StudentAuthProvider");
   }
   return ctx;
}
