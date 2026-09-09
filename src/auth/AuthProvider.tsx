import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, type ReactNode, useCallback, useEffect, useMemo } from "react";
import { UnauthenticatedError } from "@/api/errors";
import { api } from "@/api/http";
import { registrarNaoAutenticado } from "@/api/queryClient";
import type { Me } from "./tipos";

export interface AuthValue {
  me: Me | null;
  carregando: boolean;
  pode: (permissao: string) => boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  sair: () => Promise<void>;
  recarregar: () => Promise<void>;
}

export const AuthContext = createContext<AuthValue | null>(null);
export const CHAVE_ME = ["auth", "me"] as const;

async function buscarMe(): Promise<Me | null> {
  try {
    return await api.get<Me>("/auth/me");
  } catch (e) {
    if (e instanceof UnauthenticatedError) return null;
    throw e;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const { data, isPending } = useQuery({
    queryKey: CHAVE_ME,
    queryFn: buscarMe,
    staleTime: Infinity,
    retry: false,
    throwOnError: false,
  });
  const me = data ?? null;

  useEffect(
    () =>
      registrarNaoAutenticado(() => {
        // nulo primeiro (o observer ainda montado reage e RequireAuth já redireciona),
        // clear() depois: descarta qualquer outra consulta em cache (dados do usuário anterior).
        qc.setQueryData(CHAVE_ME, null);
        qc.clear();
      }),
    [qc],
  );

  const recarregar = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: CHAVE_ME });
  }, [qc]);
  const entrar = useCallback(
    async (email: string, senha: string) => {
      await api.post("/auth/login", { email, senha });
      qc.clear(); // descarta cache de uma sessão anterior antes de buscar os dados do novo usuário
      await recarregar();
    },
    [recarregar, qc],
  );
  const sair = useCallback(async () => {
    await api.post("/auth/logout");
    // mesma ordem do handler de 401: `me` nulo primeiro (observer ainda montado reage e
    // RequireAuth redireciona sozinho — AuthProvider fica acima do RouterProvider em App.tsx
    // e não tem useNavigate próprio), clear() depois.
    qc.setQueryData(CHAVE_ME, null);
    qc.clear();
  }, [qc]);

  const value = useMemo<AuthValue>(
    () => ({
      me,
      carregando: isPending,
      recarregar,
      entrar,
      sair,
      pode: (p) => me?.permissoes.includes(p) ?? false,
    }),
    [me, isPending, recarregar, entrar, sair],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
