import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { ApiError, NetworkError, UnauthenticatedError } from "./errors";

let naoAutenticadoHandler: (() => void) | undefined;

export function registrarNaoAutenticado(handler: () => void): () => void {
  naoAutenticadoHandler = handler;
  return () => {
    if (naoAutenticadoHandler === handler) naoAutenticadoHandler = undefined;
  };
}

function avisarSeNaoAutenticado(e: unknown): void {
  if (e instanceof UnauthenticatedError) naoAutenticadoHandler?.();
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: avisarSeNaoAutenticado }),
  mutationCache: new MutationCache({ onError: avisarSeNaoAutenticado }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (count, e) => e instanceof NetworkError && count < 1,
      throwOnError: (e) => e instanceof ApiError && e.status === 401,
    },
    mutations: { retry: 0 },
  },
});
