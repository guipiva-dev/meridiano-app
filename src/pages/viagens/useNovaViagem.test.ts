import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import type * as ReactRouter from "react-router";
import { MemoryRouter } from "react-router";
import { AuthContext, type AuthValue } from "@/auth/AuthProvider";
import { useNovaViagem } from "./useNovaViagem";

const navegou: string[] = [];
vi.mock("react-router", async (original) => {
  const mod = await original<typeof ReactRouter>();
  return {
    ...mod,
    useNavigate: () => (destino: string) => {
      navegou.push(destino);
      return Promise.resolve();
    },
  };
});

const FORNECEDORES = [
  { id: "f1", nome: "CVC", tipo: "operadora", percentualComissaoPadrao: 10, prazoComissaoDias: 30, ativo: true },
];
const VENDEDORES = [{ id: "u1", nome: "Ana", perfil: "vendedor_externo", geraRepasse: true, percentualPadrao: 20 }];
const AGENCIA = { nome: "Viva", taxaServicoPadrao: 0 };

function viagemDto(versao: string) {
  return {
    id: "v9",
    codigo: "VG-2026-0042",
    versao,
    destino: "Lisboa",
    tipo: "internacional",
    dataIda: "2026-04-18",
    dataVolta: null,
    vendedorId: "u1",
    vendedorNome: "Ana",
    agenteId: "u1",
    ocasiao: null,
    observacoes: null,
    cancelada: false,
    faseOperacional: "em_emissao",
    faseFinanceira: "a_receber",
    passageiros: [{ clienteId: "c1", nome: "Carlos", titular: true }],
    reservas: [
      {
        id: "r1",
        versao: "3",
        fornecedorId: "f1",
        fornecedorNome: "CVC",
        localizador: "K7X2PQ",
        dataCompra: "2026-03-14",
        status: "pendente",
        tiposServico: [],
        formasPagamento: [],
        ravClienteModo: "retido_agencia",
        fluxoPagamento: "cliente_paga_operadora",
        nfseStatus: "nao_precisa",
        observacoes: null,
        dataPrevistaComissao: null,
        valorTotal: 3000,
        valorCliente: 3200,
      },
    ],
  };
}

interface Chamada {
  url: string;
  metodo: string;
  corpo: unknown;
}
const chamadas: Chamada[] = [];
let respostaPost: { status: number; body: unknown } = { status: 201, body: null };

function resposta(status: number, body: unknown) {
  return {
    ok: status < 300,
    status,
    headers: { get: () => "application/json" },
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

function instalarFetch() {
  vi.stubGlobal("fetch", (url: string, init?: RequestInit) => {
    const metodo = init?.method ?? "GET";
    const corpo: unknown = typeof init?.body === "string" ? JSON.parse(init.body) : undefined;
    chamadas.push({ url, metodo, corpo });
    if (url.includes("/fornecedores")) return Promise.resolve(resposta(200, FORNECEDORES));
    if (url.includes("/usuarios/vendedores")) return Promise.resolve(resposta(200, VENDEDORES));
    if (url.includes("/agencia")) return Promise.resolve(resposta(200, AGENCIA));
    if (url.includes("/reservas/duplicada")) return Promise.resolve(resposta(200, null));
    if (url.includes("/viagens/semelhantes")) return Promise.resolve(resposta(200, []));
    if (metodo === "POST" && url.endsWith("/viagens")) {
      return Promise.resolve(resposta(respostaPost.status, respostaPost.body));
    }
    if (metodo === "PUT") return Promise.resolve(resposta(200, viagemDto("8")));
    if (metodo === "GET" && /\/viagens\/[^/?]+$/.test(url)) return Promise.resolve(resposta(200, viagemDto("7")));
    return Promise.resolve(resposta(404, { codigo: "nao_encontrado", detail: "?" }));
  });
}

const auth: AuthValue = {
  me: { usuarioId: "u1", agenciaId: "a1", perfil: "dono", nome: "Ana", permissoes: ["viagem.ver_resultado"] },
  carregando: false,
  pode: () => true,
  entrar: () => Promise.resolve(),
  sair: () => Promise.resolve(),
  recarregar: () => Promise.resolve(),
};

function montar(id?: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(
      QueryClientProvider,
      { client: qc },
      createElement(AuthContext.Provider, { value: auth }, createElement(MemoryRouter, null, children)),
    );
  return renderHook(() => useNovaViagem(id), { wrapper });
}

beforeEach(() => {
  chamadas.length = 0;
  navegou.length = 0;
  respostaPost = { status: 201, body: null };
  instalarFetch();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("escolher fornecedor com 10% e total 3000 pré-preenche a comissão em 300", async () => {
  const { result } = montar();
  await waitFor(() => {
    expect(result.current.fornecedores).toHaveLength(1);
  });

  act(() => {
    result.current.adicionarReserva();
  });
  act(() => {
    result.current.atualizarReserva(0, { fornecedorId: "f1" });
  });
  act(() => {
    result.current.atualizarReserva(0, { valorTotal: 3000 });
  });

  const r = result.current.form.getValues("reservas")[0];
  expect(r?.valorComissao).toBe(300);
  expect(r?.comissaoSugerida).toBe(true);
});

test("editar a comissão desliga a sugestão e mudar o total não a sobrescreve", async () => {
  const { result } = montar();
  await waitFor(() => {
    expect(result.current.fornecedores).toHaveLength(1);
  });

  act(() => {
    result.current.adicionarReserva();
  });
  act(() => {
    result.current.atualizarReserva(0, { fornecedorId: "f1" });
  });
  act(() => {
    result.current.atualizarReserva(0, { valorComissao: 250, comissaoSugerida: false });
  });
  act(() => {
    result.current.atualizarReserva(0, { valorTotal: 4000 });
  });

  const r = result.current.form.getValues("reservas")[0];
  expect(r?.valorComissao).toBe(250);
  expect(r?.comissaoSugerida).toBe(false);
});

test("salvar cria a viagem com o request certo e navega para a edição", async () => {
  respostaPost = {
    status: 201,
    body: {
      id: "v9",
      codigo: "VG-2026-0042",
      versao: "7",
      destino: "Lisboa",
      tipo: "internacional",
      dataIda: "2026-04-18",
      dataVolta: null,
      vendedorId: "u1",
      vendedorNome: "Ana",
      agenteId: "u1",
      ocasiao: null,
      observacoes: null,
      cancelada: false,
      faseOperacional: "sem_reserva",
      faseFinanceira: "nao_prevista",
      passageiros: [{ clienteId: "c1", nome: "Carlos", titular: true }],
      reservas: [],
    },
  };
  const { result } = montar();
  await waitFor(() => {
    expect(result.current.agencia).not.toBeNull();
  });

  act(() => {
    result.current.form.setValue("destino", " Lisboa ");
    result.current.form.setValue("dataIda", "2026-04-18");
    result.current.form.setValue("passageiros", [{ clienteId: "c1", nome: "Carlos", titular: true }]);
  });
  act(() => {
    result.current.adicionarReserva();
  });
  act(() => {
    result.current.atualizarReserva(0, { fornecedorId: "f1", valorCliente: 3200 });
  });

  let ok = false;
  await act(async () => {
    ok = await result.current.salvar();
  });

  expect(ok).toBe(true);
  const post = chamadas.find((c) => c.metodo === "POST");
  expect(post?.corpo).toMatchObject({
    destino: "Lisboa",
    dataIda: "2026-04-18",
    dataVolta: null,
    vendedorId: "u1",
    agenteId: "u1",
    ocasiao: null,
    passageiros: [{ clienteId: "c1", titular: true }],
    reservas: [{ fornecedorId: "f1", localizador: null, valorCliente: 3200, valorTotal: 0, valorComissao: 0 }],
  });
  expect(navegou).toContain("/viagens/v9/editar");
});

test("422 titular_obrigatorio vira erro do campo passageiros", async () => {
  respostaPost = { status: 422, body: { codigo: "titular_obrigatorio", detail: "Marque o passageiro titular" } };
  const { result } = montar();
  await waitFor(() => {
    expect(result.current.agencia).not.toBeNull();
  });

  act(() => {
    result.current.form.setValue("destino", "Lisboa");
    result.current.form.setValue("passageiros", [{ clienteId: "c1", nome: "Carlos", titular: false }]);
  });

  let ok = true;
  await act(async () => {
    ok = await result.current.salvar();
  });

  expect(ok).toBe(false);
  expect(result.current.erros.passageiros).toBe("Marque o passageiro titular");
});

test("salvar sem passageiros nem destino falha localmente, sem chamar a API", async () => {
  const { result } = montar();
  await waitFor(() => {
    expect(result.current.agencia).not.toBeNull();
  });

  let ok = true;
  await act(async () => {
    ok = await result.current.salvar();
  });

  expect(ok).toBe(false);
  expect(chamadas.some((c) => c.metodo === "POST")).toBe(false);
  expect(result.current.erros.passageiros).toBeTruthy();
  expect(result.current.erros.destino).toBeTruthy();
});

test("salvar não recolhe os cards que estavam abertos", async () => {
  const { result } = montar("v9");
  await waitFor(() => {
    expect(result.current.viagem).not.toBeNull();
  });
  expect(result.current.form.getValues("reservas")[0]?.aberta).toBe(false);

  act(() => {
    result.current.alternarReserva(0);
  });
  expect(result.current.form.getValues("reservas")[0]?.aberta).toBe(true);

  await act(async () => {
    await result.current.salvar();
  });

  expect(chamadas.some((c) => c.metodo === "PUT")).toBe(true);
  expect(result.current.viagem?.versao).toBe("8");
  expect(result.current.form.getValues("reservas")[0]?.aberta).toBe(true);
});
