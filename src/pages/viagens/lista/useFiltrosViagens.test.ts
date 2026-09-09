import { act, renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { hojeIso } from "@/lib/datas";
import { useFiltrosViagens } from "./useFiltrosViagens";

function wrapper({ children }: { children: ReactNode }) {
  return createElement(MemoryRouter, null, children);
}

test("default gera aba todas e idaDe/idaAte dos próximos 90 dias", () => {
  const { result } = renderHook(() => useFiltrosViagens(), { wrapper });
  const hoje = new Date(hojeIso());
  const ate = new Date(hoje);
  ate.setDate(ate.getDate() + 90);

  expect(result.current.filtro.aba).toBe("todas");
  expect(result.current.filtro.idaDe).toBe(hojeIso());
  expect(result.current.filtro.idaAte).toBe(ate.toLocaleDateString("en-CA"));
  expect(result.current.filtro.pagina).toBe(1);
  expect(result.current.filtro.tamanho).toBe(25);
  expect(result.current.idaPreset).toBe("90d");
});

test("definir({ aba }) escreve na URL e reseta a página", () => {
  const { result } = renderHook(() => useFiltrosViagens(), { wrapper });
  act(() => {
    result.current.definir({ pagina: 3 });
  });
  expect(result.current.filtro.pagina).toBe(3);

  act(() => {
    result.current.definir({ aba: "concluidas" });
  });
  expect(result.current.filtro.aba).toBe("concluidas");
  expect(result.current.filtro.pagina).toBe(1);
});

test("limpar() volta ao default", () => {
  const { result } = renderHook(() => useFiltrosViagens(), { wrapper });
  act(() => {
    result.current.definir({ aba: "concluidas", tipo: "nacional", pagina: 2 });
  });
  act(() => {
    result.current.limpar();
  });
  expect(result.current.filtro.aba).toBe("todas");
  expect(result.current.filtro.tipo).toBeUndefined();
  expect(result.current.filtro.pagina).toBe(1);
  expect(result.current.idaPreset).toBe("90d");
});

test("ativos conta 2 com tipo + nfse", () => {
  const { result } = renderHook(() => useFiltrosViagens(), { wrapper });
  expect(result.current.ativos).toBe(0);
  act(() => {
    result.current.definir({ tipo: "internacional", nfse: "falta_emitir" });
  });
  expect(result.current.ativos).toBe(2);
});

test("idaPreset qualquer não envia idaDe/idaAte", () => {
  const { result } = renderHook(() => useFiltrosViagens(), { wrapper });
  act(() => {
    result.current.definir({ idaPreset: "qualquer" });
  });
  expect(result.current.filtro.idaDe).toBeUndefined();
  expect(result.current.filtro.idaAte).toBeUndefined();
});
