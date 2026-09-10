import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider, useParams } from "react-router";
import { AuthContext, type AuthValue } from "@/auth/AuthProvider";
import { FornecedoresPage } from "./FornecedoresPage";

const CVC = {
  id: "f1",
  nome: "CVC",
  tipo: "operadora",
  telefoneEmergencia: "11999998888",
  percentualComissaoPadrao: 10,
  prazoComissaoDias: null,
  janelasVigentes: [
    { diaInicial: 1, diaFinal: 14, diaPagamento: 20, mesesAFrente: 0 },
    { diaInicial: 15, diaFinal: 31, diaPagamento: 5, mesesAFrente: 1 },
  ],
  ativo: true,
  reservas: 12,
};
const DECOLAR = {
  id: "f2",
  nome: "Decolar",
  tipo: "consolidadora",
  telefoneEmergencia: null,
  percentualComissaoPadrao: null,
  prazoComissaoDias: 45,
  janelasVigentes: [],
  ativo: true,
  reservas: 3,
};

const LISTA = { itens: [CVC, DECOLAR], total: 2, pagina: 1, tamanho: 25, ano: 2026 };

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

function montar() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(
    [
      { path: "/fornecedores", element: <FornecedoresPage /> },
      { path: "/fornecedores/:id", element: <DetalheStub /> },
    ],
    { initialEntries: ["/fornecedores"] },
  );
  render(
    <QueryClientProvider client={qc}>
      <AuthContext.Provider value={auth}>
        <RouterProvider router={router} />
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
}

let corpo: unknown = LISTA;

beforeEach(() => {
  corpo = LISTA;
  vi.stubGlobal("fetch", () => Promise.resolve(resposta(200, corpo)));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("cabeçalho conta os cadastrados e explica a regra de pagamento", async () => {
  montar();
  expect(
    await screen.findByText("2 cadastrados · a regra de pagamento define quando a comissão é esperada"),
  ).toBeInTheDocument();
});

test("janelas vigentes viram uma célula legível e o prazo fixo aparece quando não há janela", async () => {
  montar();
  expect(await screen.findByText("1–14 → dia 20 · 15–31 → dia 5 (mês seguinte)")).toBeInTheDocument();
  expect(screen.getByText("45 dias após a compra")).toBeInTheDocument();
  expect(screen.getByText("plantão (11) 99999-8888")).toBeInTheDocument();
});

test("sem receitaAno no payload não mostra a coluna de receita", async () => {
  montar();
  await screen.findByText("CVC");
  expect(screen.queryByRole("columnheader", { name: /Receita/ })).toBeNull();
});

test("com receitaAno mostra a coluna do ano devolvido pela API", async () => {
  corpo = { ...LISTA, itens: [{ ...CVC, receitaAno: 12500 }, DECOLAR] };
  montar();
  expect(await screen.findByRole("columnheader", { name: "Receita 2026" })).toBeInTheDocument();
});

test("clicar na linha abre /fornecedores/<id>", async () => {
  montar();
  fireEvent.click(await screen.findByText("CVC"));
  expect(await screen.findByText("Detalhe f1")).toBeInTheDocument();
});
