import { useEffect, useRef } from "react";
import { type Combo, registrarAtalho } from "./atalhos";

export function useAtalho(combo: Combo, handler: () => void, ativo = true) {
  const ref = useRef(handler);
  useEffect(() => {
    ref.current = handler;
  });
  useEffect(() => {
    if (!ativo) return;
    return registrarAtalho(combo, () => {
      ref.current();
    });
  }, [combo, ativo]);
}
