import { useEffect } from "react";
import { useBlocker } from "react-router";

export function useBloqueioSaida(ativo: boolean) {
  useEffect(() => {
    if (!ativo) return;
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", h);
    return () => {
      window.removeEventListener("beforeunload", h);
    };
  }, [ativo]);
  const blocker = useBlocker(ativo);
  return {
    bloqueado: blocker.state === "blocked",
    confirmar: () => blocker.proceed?.(),
    cancelar: () => blocker.reset?.(),
  };
}
