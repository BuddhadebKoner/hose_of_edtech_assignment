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

import { getMe, loginAdmin, logout, type AuthUser } from "@/lib/api/auth";

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

   const refresh = useCallback(async () => {
      try {
         const me = await getMe();
         if (me.role === "admin") {
            setAdmin(me);
         } else {
            setAdmin(null);
         }
      } catch {
         setAdmin(null);
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
         const me = await loginAdmin({ email, password });
         setAdmin(me);
         return { ok: true };
      } catch (error) {
         const message = error instanceof Error ? error.message : "Login failed";
         setAdmin(null);
         return { ok: false, error: message };
      } finally {
         setLoading(false);
      }
   }, []);

   const logoutUser = useCallback(async () => {
      await logout();
      setAdmin(null);
   }, []);

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
