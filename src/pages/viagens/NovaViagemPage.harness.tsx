import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { AuthContext, type AuthValue } from "@/auth/AuthProvider";
import { NovaViagemPage } from "./NovaViagemPage";
import { viagemDto } from "./useNovaViagem.harness";

export const viagemEdicao = () => viagemDto("7");

export const FORNECEDORES = [
  { id: "f1", nome: "CVC", tipo: "operadora", percentualComissaoPadrao: 10, prazoComissaoDias: 30, ativo: true },
];
export const VENDEDORES = [{ id: "u1", nome: "Ana", perfil: "dono", geraRepasse: false, percentualPadrao: 0 }];
export const AGENCIA = { nome: "Viva", taxaServicoPadrao: 50 };

export const urls: string[] = [];

export function resposta(status: number, body: unknown) {
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

export function montar(entrada = "/viagens/nova") {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(
    [
      { path: "/viagens", element: <p>Lista de viagens</p> },
      { path: "/viagens/nova", element: <NovaViagemPage /> },
      { path: "/viagens/:id/editar", element: <NovaViagemPage /> },
      { path: "/viagens/:id", element: <p>Detalhe da viagem</p> },
    ],
    { initialEntries: [entrada] },
  );
  render(
    <QueryClientProvider client={qc}>
      <AuthContext.Provider value={auth}>
        <RouterProvider router={router} />
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
}

/** Edição de `viagemDto` (válida) com fetch registrando as chamadas em `urls`. */
export function montarEdicao() {
  vi.stubGlobal("fetch", (url: string, init?: RequestInit) => {
    urls.push(`${init?.method ?? "GET"} ${url}`);
    if (url.includes("/fornecedores")) return Promise.resolve(resposta(200, FORNECEDORES));
    if (url.includes("/usuarios/vendedores")) return Promise.resolve(resposta(200, VENDEDORES));
    if (url.includes("/agencia")) return Promise.resolve(resposta(200, AGENCIA));
    if (/\/viagens\/[^/?]+$/.test(url)) return Promise.resolve(resposta(200, viagemEdicao()));
    return Promise.resolve(resposta(200, null));
  });
  montar("/viagens/v9/editar");
}
