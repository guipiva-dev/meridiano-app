import { renderHook } from "@testing-library/react";
import { tratarTecla } from "./atalhos";
import { useAtalho } from "./useAtalho";

test("registro por combo não se repete a cada render; o mais novo continua vencendo mesmo se o mais antigo rerenderizar", () => {
  const a = vi.fn();
  const b = vi.fn();
  const antigo = renderHook(
    ({ handler }: { handler: () => void }) => {
      useAtalho("ctrl+s", handler);
    },
    { initialProps: { handler: a as () => void } },
  );
  renderHook(
    ({ handler }: { handler: () => void }) => {
      useAtalho("ctrl+s", handler);
    },
    { initialProps: { handler: b as () => void } },
  );

  // consumidor antigo rerenderiza com um handler inline novo (referência diferente)
  antigo.rerender({
    handler: () => {
      a();
    },
  });

  tratarTecla(new KeyboardEvent("keydown", { key: "s", ctrlKey: true, cancelable: true }));
  expect(b).toHaveBeenCalled();
  expect(a).not.toHaveBeenCalled();
});
