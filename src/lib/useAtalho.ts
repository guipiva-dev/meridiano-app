import { useEffect, useRef } from "react";
import { type Combo, registrarAtalho } from "./atalhos";

export function useAtalho(combo: Combo, handler: () => void) {
  const ref = useRef(handler);
  useEffect(() => {
    ref.current = handler;
  });
  useEffect(
    () =>
      registrarAtalho(combo, () => {
        ref.current();
      }),
    [combo],
  );
}
