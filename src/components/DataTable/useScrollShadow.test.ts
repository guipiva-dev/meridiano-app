import { fireEvent } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import { createRef } from "react";
import { useScrollShadow } from "./useScrollShadow";

function elementoFalso(scrollWidth: number, clientWidth: number, scrollLeft: number) {
  const el = document.createElement("div");
  Object.defineProperty(el, "scrollWidth", { value: scrollWidth, configurable: true });
  Object.defineProperty(el, "clientWidth", { value: clientWidth, configurable: true });
  Object.defineProperty(el, "scrollLeft", { value: scrollLeft, writable: true, configurable: true });
  document.body.appendChild(el);
  return el;
}

test("direita true quando há conteúdo para rolar à direita", () => {
  const el = elementoFalso(1000, 500, 0);
  const ref = createRef<HTMLElement>();
  ref.current = el;
  const { result } = renderHook(() => useScrollShadow(ref));
  expect(result.current.direita).toBe(true);
});

test("direita false após rolar até o fim", () => {
  const el = elementoFalso(1000, 500, 0);
  const ref = createRef<HTMLElement>();
  ref.current = el;
  const { result } = renderHook(() => useScrollShadow(ref));
  expect(result.current.direita).toBe(true);
  Object.defineProperty(el, "scrollLeft", { value: 500, writable: true, configurable: true });
  fireEvent.scroll(el);
  expect(result.current.direita).toBe(false);
});
