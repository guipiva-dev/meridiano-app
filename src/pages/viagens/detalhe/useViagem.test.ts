import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { chaves } from "@/api/viagens";
import { AuthContext, type AuthValue } from "@/auth/AuthProvider";
import { VIAGEM } from "./fixtures";
import { useViagem } from "./useViagem";

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

function montar(caminho = "/viagens/v1") {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(
      QueryClientProvider,
      { client: qc },
      createElement(
        AuthContext.Provider,
        { value: auth },
        createElement(MemoryRouter, { initialEntries: [caminho] }, children),
      ),
    );
  return { qc, ...renderHook(() => useViagem("v1"), { wrapper }) };
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

test("?reserva=<id> força a tab reservas e marca o card a abrir", async () => {
  const { result } = montar("/viagens/v1?tab=resumo&reserva=r2");
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

test("verValores segue os valores do DTO", async () => {
  const { result } = montar();
  await waitFor(() => {
    expect(result.current.viagem).toBeDefined();
  });
  expect(result.current.verValores).toBe(true);
});
