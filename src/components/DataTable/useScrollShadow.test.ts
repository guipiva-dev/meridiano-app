import { act, fireEvent, renderHook } from "@testing-library/react";
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

test("remede quando a tabela (conteúdo) cresce, mesmo sem o wrap mudar de tamanho", () => {
  const el = elementoFalso(500, 500, 0); // sem overflow no começo
  const tabela = document.createElement("table");
  el.appendChild(tabela);

  const observados: Element[] = [];
  let callback: ResizeObserverCallback | undefined;
  class ResizeObserverFalso {
    constructor(cb: ResizeObserverCallback) {
      callback = cb;
    }
    observe(alvo: Element) {
      observados.push(alvo);
    }
    unobserve() {
      return;
    }
    disconnect() {
      return;
    }
  }
  const original = globalThis.ResizeObserver;
  globalThis.ResizeObserver = ResizeObserverFalso;

  const ref = createRef<HTMLElement>();
  ref.current = el;
  const { result } = renderHook(() => useScrollShadow(ref));
  expect(result.current.direita).toBe(false);
  expect(observados).toContain(el);
  expect(observados).toContain(tabela); // observa o conteúdo, não só o wrap

  // a tabela cresceu (scrollWidth do wrap aumenta) sem o wrap mudar de tamanho
  Object.defineProperty(el, "scrollWidth", { value: 1000, configurable: true });
  act(() => callback?.([], {} as ResizeObserver));
  expect(result.current.direita).toBe(true);

  globalThis.ResizeObserver = original;
});
