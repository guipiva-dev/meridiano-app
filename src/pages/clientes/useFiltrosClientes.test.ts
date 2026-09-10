import { act, renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { useFiltrosClientes } from "./useFiltrosClientes";

function wrapper({ children }: { children: ReactNode }) {
  return createElement(MemoryRouter, null, children);
}

test("default: ordem nome asc, página 1, tamanho 25 e nenhum filtro do painel ativo", () => {
  const { result } = renderHook(() => useFiltrosClientes(), { wrapper });

  expect(result.current.filtro.ordem).toBe("nome");
  expect(result.current.filtro.direcao).toBe("asc");
  expect(result.current.filtro.pagina).toBe(1);
  expect(result.current.filtro.tamanho).toBe(25);
  expect(result.current.filtro.q).toBeUndefined();
  expect(result.current.ativos).toBe(0);
});

test("definir({ pendencia }) escreve na URL e reseta a página", () => {
  const { result } = renderHook(() => useFiltrosClientes(), { wrapper });

  act(() => {
    result.current.definir({ pagina: 3 });
  });
  expect(result.current.filtro.pagina).toBe(3);

  act(() => {
    result.current.definir({ pendencia: "urgente" });
  });
  expect(result.current.filtro.pendencia).toBe("urgente");
  expect(result.current.filtro.pagina).toBe(1);
});

test("ativos conta só o filtro do painel (última viagem)", () => {
  const { result } = renderHook(() => useFiltrosClientes(), { wrapper });

  act(() => {
    result.current.definir({ q: "mendes", pendencia: "com" });
  });
  expect(result.current.ativos).toBe(0);

  act(() => {
    result.current.definir({ ultimaViagem: "recompra" });
  });
  expect(result.current.ativos).toBe(1);
});

test("limpar() volta ao default", () => {
  const { result } = renderHook(() => useFiltrosClientes(), { wrapper });

  act(() => {
    result.current.definir({ ultimaViagem: "recompra", pendencia: "sem", pagina: 2 });
  });
  act(() => {
    result.current.limpar();
  });

  expect(result.current.filtro.ultimaViagem).toBeUndefined();
  expect(result.current.filtro.pendencia).toBeUndefined();
  expect(result.current.filtro.pagina).toBe(1);
  expect(result.current.ativos).toBe(0);
});
