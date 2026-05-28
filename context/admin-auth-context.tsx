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

import { loginAdminAction, logoutAction, getCurrentUserAction } from "@/actions/auth";
import { broadcastLogin, broadcastLogout, initAuthSync } from "@/lib/auth-sync";

type AuthUser = {
   id: string;
   name?: string;
   email: string;
   role: string;
};

type AdminAuthContextValue = {
   admin: AuthUser | null;
   loading: boolean;
   login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
   logout: () => Promise<void>;
   refresh: () => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
   const [admin, setAdmin] = useState<AuthUser | null>(null);
   const [loading, setLoading] = useState(true);
   const router = useRouter();

   const refresh = useCallback(async () => {
      try {
         const user = await getCurrentUserAction();
         if (user && user.role === "admin") {
            setAdmin(user);
         } else {
            setAdmin(null);
         }
      } catch {
         setAdmin(null);
      } finally {
         setLoading(false);
      }
   }, []);

   // Handle logout from other tabs
   const handleCrossTabLogout = useCallback(() => {
      setAdmin(null);
      router.push("/admin");
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
         const result = await loginAdminAction(email, password);

         if (result.success) {
            setAdmin(result.user);
            broadcastLogin(); // Notify other tabs
            return { ok: true };
         } else {
            setAdmin(null);
            return { ok: false, error: result.error };
         }
      } catch (error) {
         const message = error instanceof Error ? error.message : "Login failed";
         setAdmin(null);
         return { ok: false, error: message };
      } finally {
         setLoading(false);
      }
   }, []);

   const logoutUser = useCallback(async () => {
      await logoutAction();
      setAdmin(null);
      broadcastLogout(); // Notify other tabs
      router.push("/admin");
   }, [router]);

   const value = useMemo(
      () => ({ admin, loading, login, logout: logoutUser, refresh }),
      [admin, loading, login, logoutUser, refresh]
   );

   return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
   const ctx = useContext(AdminAuthContext);
   if (!ctx) {
      throw new Error("useAdminAuth must be used within AdminAuthProvider");
   }
   return ctx;
}
