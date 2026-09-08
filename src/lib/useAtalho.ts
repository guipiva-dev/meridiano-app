import { useEffect } from "react";
import { type Combo, registrarAtalho } from "./atalhos";

export function useAtalho(combo: Combo, handler: () => void) {
  useEffect(() => registrarAtalho(combo, handler), [combo, handler]);
}
