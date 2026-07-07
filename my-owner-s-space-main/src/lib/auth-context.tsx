import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getSession, logout as apiLogout, type Owner } from "./api";

type AuthCtx = {
  owner: Owner | null;
  setOwner: (o: Owner | null) => void;
  signOut: () => void;
  loading: boolean;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [owner, setOwner] = useState<Owner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setOwner(getSession());
    setLoading(false);
  }, []);

  return (
    <Ctx.Provider
      value={{
        owner,
        setOwner,
        loading,
        signOut: () => {
          apiLogout();
          setOwner(null);
        },
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
