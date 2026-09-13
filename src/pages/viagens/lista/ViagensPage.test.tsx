import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider, useParams } from "react-router";
import { AuthContext, type AuthValue } from "@/auth/AuthProvider";
import { ViagensPage } from "./ViagensPage";

const LISTA = {
  itens: [
    {
      id: "v1",
      codigo: "VG-2026-0001",
      titular: "Carlos Mendes",
      destino: "Lisboa",
      tipo: "internacional",
      dataIda: "2026-04-18",
      dataVolta: null,
      vendedorNome: "Ana",
      faseOperacional: "em_emissao",
      faseFinanceira: "a_receber",
    },
    {
      id: "v2",
      codigo: "VG-2026-0002",
      titular: "Ana Souza",
      destino: "Cancún",
      tipo: "internacional",
      dataIda: "2026-04-04",
      dataVolta: null,
      vendedorNome: "Guilherme",
      faseOperacional: "confirmada",
      faseFinanceira: "a_receber",
    },
  ],
  total: 2,
  pagina: 1,
  tamanho: 25,
  contadores: { todas: 2, emEmissao: 1, embarcamSemana: 0, comissaoAtrasada: 0, concluidas: 0 },
};

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

function DetalheStub() {
  const { id } = useParams();
  return <div>Detalhe {id}</div>;
}

function montar(entrada = "/viagens", authValue: AuthValue = auth) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(
    [
      { path: "/viagens", element: <ViagensPage /> },
      { path: "/viagens/:id", element: <DetalheStub /> },
    ],
    { initialEntries: [entrada] },
  );
  render(
    <QueryClientProvider client={qc}>
      <AuthContext.Provider value={authValue}>
        <RouterProvider router={router} />
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.stubGlobal("fetch", (url: string) => {
    if (url.includes("/viagens?")) return Promise.resolve(resposta(200, LISTA));
    if (url.includes("/usuarios/vendedores")) return Promise.resolve(resposta(200, []));
    if (url.includes("/fornecedores")) return Promise.resolve(resposta(200, []));
    return Promise.resolve(resposta(200, null));
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("header mostra os contadores e as abas mostram as contagens", async () => {
  montar();
  expect(await screen.findByText("2 viagens · 1 em emissão · 0 com comissão atrasada")).toBeInTheDocument();
  expect(screen.getByRole("tab", { name: /Todas/ })).toHaveTextContent("2");
  expect(screen.getByRole("tab", { name: /Em emissão/ })).toHaveTextContent("1");
});

test("enquanto carrega, subtítulo e contadores das abas mostram — em vez de 0 (MED-07)", () => {
  montar();
  expect(screen.getByText("— viagens · — em emissão · — com comissão atrasada")).toBeInTheDocument();
  expect(screen.getByRole("tab", { name: /Todas/ })).toHaveTextContent("—");
});

test("tabela mostra as duas viagens", async () => {
  montar();
  expect(await screen.findByText("Carlos Mendes")).toBeInTheDocument();
  expect(screen.getByText("Ana Souza")).toBeInTheDocument();
});

test("clicar na linha navega para /viagens/<id>", async () => {
  montar();
  fireEvent.click(await screen.findByText("Carlos Mendes"));
  expect(await screen.findByText("Detalhe v1")).toBeInTheDocument();
});

test("perfil financeiro (sem viagem.criar) não mostra 'Nova viagem' na sub-nav nem no header", async () => {
  montar("/viagens", { ...auth, pode: (p) => p !== "viagem.criar" });
  await screen.findByText("Carlos Mendes");
  expect(screen.queryByRole("link", { name: "Nova viagem" })).toBeNull();
  expect(screen.queryByRole("button", { name: /Nova viagem/ })).toBeNull();
});

test("sem vendaTotal no payload não mostra a coluna Venda", async () => {
  montar();
  await screen.findByText("Carlos Mendes");
  expect(screen.queryByRole("columnheader", { name: "Venda" })).toBeNull();
});

test("1ª coluna trunca (A01): classe + title com o texto completo, código nunca cortado", async () => {
  montar();
  const titular = await screen.findByText("Carlos Mendes");
  expect(titular).toHaveClass("primary");
  expect(titular).toHaveAttribute("title", "Carlos Mendes");

  // Ordem congelada do protótipo: destino · tipo · código. Quem trunca (ellipsis + title) é só o
  // span do destino/tipo; o <code> fica com flex:none, sempre por último, nunca cortado.
  const destino = screen.getByText("Lisboa · Internacional");
  expect(destino).toHaveClass("secondaryDestino");
  expect(destino).toHaveAttribute("title", "Lisboa · Internacional");

  const linhaSecundaria = destino.parentElement;
  expect(linhaSecundaria).toHaveClass("secondary");
  expect(linhaSecundaria?.lastElementChild?.tagName).toBe("CODE");
  expect(linhaSecundaria?.lastElementChild).toHaveTextContent("VG-2026-0001");
});

test("contador no singular (U11): '1 viagem', não '1 viagens'", async () => {
  vi.stubGlobal("fetch", (url: string) => {
    if (url.includes("/viagens?"))
      return Promise.resolve(
        resposta(200, { ...LISTA, itens: [LISTA.itens[0]], total: 1, contadores: { ...LISTA.contadores, todas: 1 } }),
      );
    if (url.includes("/usuarios/vendedores")) return Promise.resolve(resposta(200, []));
    if (url.includes("/fornecedores")) return Promise.resolve(resposta(200, []));
    return Promise.resolve(resposta(200, null));
  });
  montar();
  expect(await screen.findByText("1 viagem · 1 em emissão · 0 com comissão atrasada")).toBeInTheDocument();
});
