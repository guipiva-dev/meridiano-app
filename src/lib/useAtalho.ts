import { useEffect } from "react";
import { registrarAtalho, type Combo } from "./atalhos";

export function useAtalho(combo: Combo, handler: () => void) {
  useEffect(() => registrarAtalho(combo, handler), [combo, handler]);
}
