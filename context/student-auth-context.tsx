"use client";

import { useRouter } from "next/navigation";
import {
   createContext,
   useCallback,
   useContext,
   useEffect,
   useMemo,
   useState,
   type ReactNode,
} from "react";

import { loginStudentAction, logoutAction, registerStudentAction, getCurrentUserAction } from "@/actions/auth";
import { broadcastLogin, broadcastLogout, initAuthSync } from "@/lib/auth-sync";

type AuthUser = {
   id: string;
   name?: string;
   email: string;
   role: string;
};

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
   const router = useRouter();

   const refresh = useCallback(async () => {
      try {
         const user = await getCurrentUserAction();
         if (user && user.role === "student") {
            setStudent(user);
         } else {
            setStudent(null);
         }
      } catch {
         setStudent(null);
      } finally {
         setLoading(false);
      }
   }, []);

   // Handle logout from other tabs
   const handleCrossTabLogout = useCallback(() => {
      setStudent(null);
      router.push("/login");
   }, [router]);

   // Handle login from other tabs
   const handleCrossTabLogin = useCallback(() => {
      refresh();
   }, [refresh]);

   // Initialize cross-tab sync
   useEffect(() => {
      const cleanup = initAuthSync(handleCrossTabLogout, handleCrossTabLogin);
      return cleanup;
   }, [handleCrossTabLogout, handleCrossTabLogin]);

   // Initial auth check
   useEffect(() => {
      refresh();
   }, [refresh]);

   const login = useCallback(async (email: string, password: string) => {
      setLoading(true);
      try {
         const result = await loginStudentAction(email, password);

         if (result.success) {
            setStudent(result.user);
            broadcastLogin(); // Notify other tabs
            return { ok: true };
         } else {
            setStudent(null);
            return { ok: false, error: result.error };
         }
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
         const result = await registerStudentAction(name, email, password);

         if (result.success) {
            setStudent(result.user);
            broadcastLogin(); // Notify other tabs
            return { ok: true };
         } else {
            setStudent(null);
            return { ok: false, error: result.error };
         }
      } catch (error) {
         const message = error instanceof Error ? error.message : "Registration failed";
         setStudent(null);
         return { ok: false, error: message };
      } finally {
         setLoading(false);
      }
   }, []);

   const logoutUser = useCallback(async () => {
      await logoutAction();
      setStudent(null);
      broadcastLogout(); // Notify other tabs
      router.push("/login");
   }, [router]);

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
