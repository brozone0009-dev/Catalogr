import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getSession, logout as apiLogout, type Salesman } from "./api";

type AuthCtx = {
  salesman: Salesman | null;
  setSalesman: (s: Salesman | null) => void;
  signOut: () => void;
  loading: boolean;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [salesman, setSalesman] = useState<Salesman | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSalesman(getSession());
    setLoading(false);
  }, []);

  return (
    <Ctx.Provider
      value={{
        salesman,
        setSalesman,
        loading,
        signOut: () => { apiLogout(); setSalesman(null); },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
