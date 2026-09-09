import { type QueryClient, useQuery, useQueryClient } from "@tanstack/react-query";
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

/** Descarta toda consulta e mutação de outro usuário (nada de `queryKey[0] === "auth"`
 * sobrevive), mas preserva o objeto da consulta de `me`: removê-lo também derrubaria a
 * inscrição do observer já montado em `AuthProvider`, e nem `invalidateQueries` nem
 * `refetchQueries` encontrariam mais nada para atualizar. */
function limparCacheExcetoAuth(qc: QueryClient) {
  qc.removeQueries({ predicate: (q) => q.queryKey[0] !== "auth" });
  qc.getMutationCache().clear();
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
        // nulo primeiro: o observer da consulta de `me`, ainda montado, reage e RequireAuth
        // já redireciona sozinho. Só então descarta o resto (dados do usuário anterior) —
        // preservando o objeto da consulta de `me` em si (ver limparCacheExcetoAuth).
        qc.setQueryData(CHAVE_ME, null);
        limparCacheExcetoAuth(qc);
      }),
    [qc],
  );

  const recarregar = useCallback(async () => {
    // refetch de verdade (não invalidateQueries): precisa resolver só depois que `me` está
    // atualizado no cache, para quem aguarda `recarregar()`/`entrar()` (ex.: LoginPage navega
    // em seguida) já ver a sessão nova.
    await qc.refetchQueries({ queryKey: CHAVE_ME, exact: true });
  }, [qc]);
  const entrar = useCallback(
    async (email: string, senha: string) => {
      await api.post("/auth/login", { email, senha });
      // descarta cache de uma sessão anterior antes de buscar os dados do novo usuário, mas
      // preserva a consulta de `me` (ver limparCacheExcetoAuth) para o refetch abaixo encontrá-la.
      limparCacheExcetoAuth(qc);
      await recarregar();
    },
    [recarregar, qc],
  );
  const sair = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      // mesmo se o logout no servidor falhar (5xx/offline), a sessão local não pode sobreviver:
      // `me` nulo primeiro (RequireAuth redireciona sozinho), limpa o resto depois.
      qc.setQueryData(CHAVE_ME, null);
      limparCacheExcetoAuth(qc);
    }
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
