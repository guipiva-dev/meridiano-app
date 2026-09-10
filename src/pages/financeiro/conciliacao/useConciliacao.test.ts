import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { competenciaAtual } from "@/lib/datas";
import { useConciliacao } from "./useConciliacao";

function montar(entrada = "/financeiro") {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function wrapper({ children }: { children: ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client: qc },
      createElement(MemoryRouter, { initialEntries: [entrada] }, children),
    );
  }
  return renderHook(() => useConciliacao(), { wrapper });
}

test("sem query string usa os defaults (pendentes, mês corrente, página 1)", () => {
  const { result } = montar();
  expect(result.current.filtro.aba).toBe("pendentes");
  expect(result.current.filtro.mes).toBe(competenciaAtual());
  expect(result.current.filtro.pagina).toBe(1);
});

test("lê o filtro da URL", () => {
  const { result } = montar("/financeiro?aba=recebidas&mes=2026-02&fornecedorId=f1&pagina=3");
  expect(result.current.filtro).toMatchObject({
    aba: "recebidas",
    mes: "2026-02",
    fornecedorId: "f1",
    pagina: 3,
  });
});

test("definir volta para a página 1 quando o patch não traz página", () => {
  const { result } = montar("/financeiro?pagina=4");
  act(() => {
    result.current.definir({ fornecedorId: "f1" });
  });
  expect(result.current.filtro.pagina).toBe(1);
  expect(result.current.filtro.fornecedorId).toBe("f1");
});

test("trocar de aba limpa a seleção e o filtro de previsto", () => {
  const { result } = montar("/financeiro?previsto=semana");
  act(() => {
    result.current.alternar("r1");
  });
  expect(result.current.selecionados.size).toBe(1);

  act(() => {
    result.current.definir({ aba: "atrasadas" });
  });
  expect(result.current.filtro.aba).toBe("atrasadas");
  expect(result.current.filtro.previsto).toBeUndefined();
  expect(result.current.selecionados.size).toBe(0);
});

test("o KPI de vencem esta semana troca a aba e liga o previsto no mesmo patch", () => {
  const { result } = montar("/financeiro?aba=atrasadas");
  act(() => {
    result.current.definir({ aba: "pendentes", previsto: "semana" });
  });
  expect(result.current.filtro).toMatchObject({ aba: "pendentes", previsto: "semana" });
});

test("alternar liga e desliga a mesma reserva", () => {
  const { result } = montar();
  act(() => {
    result.current.alternar("r1");
  });
  act(() => {
    result.current.alternar("r1");
  });
  expect(result.current.selecionados.size).toBe(0);
});

test("abrir e fechar controlam o modal", () => {
  const { result } = montar();
  act(() => {
    result.current.abrir({ tipo: "lote" });
  });
  expect(result.current.modal).toEqual({ tipo: "lote" });
  act(() => {
    result.current.fechar();
  });
  expect(result.current.modal).toBeNull();
});
