import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { MemoryRouter, useLocation } from "react-router";
import { chavesAuditoria } from "@/api/auditoria";
import { chaves } from "@/api/viagens";
import { AuthContext, type AuthValue } from "@/auth/AuthProvider";
import { chaveDasPendencias } from "@/components/Pendencias/chave";
import { VIAGEM } from "./fixtures";
import { aplicarViagem, useViagem } from "./useViagem";

function resposta(status: number, body: unknown) {
  return {
    ok: status < 300,
    status,
    headers: { get: () => "application/json" },
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

const auth: AuthValue = {
  me: { usuarioId: "u1", agenciaId: "a1", perfil: "dono", nome: "Ana", permissoes: [] },
  carregando: false,
  pode: () => true,
  entrar: () => Promise.resolve(),
  sair: () => Promise.resolve(),
  recarregar: () => Promise.resolve(),
};

function embrulho(caminho: string, qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })) {
  return ({ children }: { children: ReactNode }) =>
    createElement(
      QueryClientProvider,
      { client: qc },
      createElement(
        AuthContext.Provider,
        { value: auth },
        createElement(MemoryRouter, { initialEntries: [caminho] }, children),
      ),
    );
}

function montar(caminho = "/viagens/v1") {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return { qc, ...renderHook(() => useViagem("v1"), { wrapper: embrulho(caminho, qc) }) };
}

beforeEach(() => {
  vi.stubGlobal("fetch", (url: string) => {
    if (url.includes("/creditos")) return Promise.resolve(resposta(200, []));
    if (url.includes("/usuarios/vendedores")) return Promise.resolve(resposta(200, []));
    if (url.endsWith("/viagens/v1")) return Promise.resolve(resposta(200, VIAGEM));
    return Promise.resolve(resposta(200, []));
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("?tab=pendencias seleciona a tab", async () => {
  const { result } = montar("/viagens/v1?tab=pendencias");
  await waitFor(() => {
    expect(result.current.viagem).toBeDefined();
  });
  expect(result.current.tab).toBe("pendencias");
  expect(result.current.reservaAberta).toBeUndefined();
});

test("sem ?tab a tab inicial é reservas; ?tab=resumo (link antigo) também cai em reservas", async () => {
  const { result } = montar("/viagens/v1?tab=resumo");
  await waitFor(() => {
    expect(result.current.viagem).toBeDefined();
  });
  expect(result.current.tab).toBe("reservas");
  const semTab = montar("/viagens/v1");
  expect(semTab.result.current.tab).toBe("reservas");
});

test("?reserva=<id> força a tab reservas e marca o card a abrir", async () => {
  const { result } = montar("/viagens/v1?tab=financeiro&reserva=r2");
  await waitFor(() => {
    expect(result.current.viagem).toBeDefined();
  });
  expect(result.current.tab).toBe("reservas");
  expect(result.current.reservaAberta).toBe("r2");
});

test("setTab troca a tab e limpa ?reserva", async () => {
  const { result } = montar("/viagens/v1?reserva=r2");
  await waitFor(() => {
    expect(result.current.viagem).toBeDefined();
  });
  act(() => {
    result.current.setTab("financeiro");
  });
  expect(result.current.tab).toBe("financeiro");
  expect(result.current.reservaAberta).toBeUndefined();
});

test("setTab grava tab=financeiro na URL e setTab(reservas) remove tab", () => {
  const { result } = renderHook(() => ({ v: useViagem("v1"), search: useLocation().search }), {
    wrapper: embrulho("/viagens/v1"),
  });
  act(() => {
    result.current.v.setTab("financeiro");
  });
  expect(result.current.search).toBe("?tab=financeiro");
  act(() => {
    result.current.v.setTab("reservas");
  });
  expect(result.current.search).toBe("");
  expect(result.current.v.tab).toBe("reservas");
});

test("aplicar(dto) atualiza o cache e a próxima leitura", async () => {
  const { result, qc } = montar();
  await waitFor(() => {
    expect(result.current.viagem?.destino).toBe("Lisboa");
  });

  act(() => {
    result.current.aplicar({ ...VIAGEM, destino: "Porto", versao: "43" });
  });

  expect(qc.getQueryData(chaves.viagem("v1"))).toMatchObject({ destino: "Porto", versao: "43" });
  await waitFor(() => {
    expect(result.current.viagem?.destino).toBe("Porto");
  });
});

test("aplicar invalida as queries de reserva (histórico e serviços)", async () => {
  const { result, qc } = montar();
  await waitFor(() => {
    expect(result.current.viagem).toBeDefined();
  });
  const espiao = vi.spyOn(qc, "invalidateQueries");

  act(() => {
    result.current.aplicar({ ...VIAGEM, versao: "43" });
  });

  expect(espiao).toHaveBeenCalledWith({ queryKey: ["reservas"] });
  espiao.mockRestore();
});

test("verValores segue os valores do DTO", async () => {
  const { result } = montar();
  await waitFor(() => {
    expect(result.current.viagem).toBeDefined();
  });
  expect(result.current.verValores).toBe(true);
});

test("aplicarViagem grava o cache e invalida o conjunto dependente da viagem", () => {
  const qc = new QueryClient();
  const espiao = vi.spyOn(qc, "invalidateQueries");

  aplicarViagem(qc, "v1", { ...VIAGEM, versao: "43" });

  expect(qc.getQueryData(chaves.viagem("v1"))).toMatchObject({ versao: "43" });
  expect(espiao.mock.calls.map((c) => c[0]?.queryKey)).toEqual([
    ["viagens", "lista"],
    chaveDasPendencias("v1"),
    chavesAuditoria.daViagem("v1"),
    chaves.creditos("v1"),
    ["reservas"],
  ]);
});
