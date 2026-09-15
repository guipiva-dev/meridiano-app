import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { AuthContext, type AuthValue } from "@/auth/AuthProvider";
import { useNovaViagem } from "./useNovaViagem";

export const navegou: string[] = [];

export function reiniciar() {
  chamadas.length = 0;
  navegou.length = 0;
  stubs.respostaPost = { status: 201, body: null };
  stubs.respostaGetViagem = () => viagemDto("7");
  instalarFetch();
}

const FORNECEDORES = [
  {
    id: "f1",
    nome: "CVC",
    tipo: "operadora",
    percentualComissaoPadrao: 10,
    prazoComissaoDias: 30,
    ativo: true,
  },
];
const VENDEDORES = [
  {
    id: "u1",
    nome: "Ana",
    perfil: "vendedor_externo",
    geraRepasse: true,
    percentualPadrao: 20,
  },
  { id: "u2", nome: "Bia", perfil: "agente", geraRepasse: false, percentualPadrao: 0 },
];
const AGENCIA = { nome: "Viva", taxaServicoPadrao: 0 };

export function viagemDto(versao: string) {
  return {
    id: "v9",
    codigo: "VG-2026-0042",
    versao,
    destino: "Lisboa",
    tipo: "internacional",
    dataIda: "2026-04-18",
    dataVolta: "2026-04-28",
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
export const chamadas: Chamada[] = [];
/** Respostas mutáveis por teste; `reiniciar()` no beforeEach devolve o padrão. */
export const stubs = {
  respostaPost: { status: 201, body: null as unknown },
  respostaGetViagem: (): unknown => viagemDto("7"),
};

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
      return Promise.resolve(resposta(stubs.respostaPost.status, stubs.respostaPost.body));
    }
    if (metodo === "PUT") return Promise.resolve(resposta(200, viagemDto("8")));
    if (metodo === "GET" && /\/viagens\/[^/?]+$/.test(url))
      return Promise.resolve(resposta(200, stubs.respostaGetViagem()));
    return Promise.resolve(resposta(404, { codigo: "nao_encontrado", detail: "?" }));
  });
}

const auth: AuthValue = {
  me: {
    usuarioId: "u1",
    agenciaId: "a1",
    perfil: "dono",
    nome: "Ana",
    permissoes: ["viagem.ver_resultado"],
  },
  carregando: false,
  pode: () => true,
  entrar: () => Promise.resolve(),
  sair: () => Promise.resolve(),
  recarregar: () => Promise.resolve(),
};

export function montar(id?: string, caminho = "/") {
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
  return renderHook(() => useNovaViagem(id), { wrapper });
}

type Resultado = ReturnType<typeof montar>["result"];

/** Espera as consultas de carga (fornecedores/vendedores/agência, ou a viagem) resolverem. */
export const esperar = {
  fornecedores: (result: Resultado) =>
    waitFor(() => {
      expect(result.current.fornecedores).toHaveLength(1);
    }),
  agencia: (result: Resultado) =>
    waitFor(() => {
      expect(result.current.agencia).not.toBeNull();
    }),
  viagem: (result: Resultado) =>
    waitFor(() => {
      expect(result.current.viagem).not.toBeNull();
    }),
};

/** Segura as respostas de `padrao` até o teste resolvê-las, na ordem que quiser. */
export function adiarRespostas(padrao: string) {
  const base = globalThis.fetch;
  const pendentes: ((body: unknown) => void)[] = [];
  vi.stubGlobal("fetch", (url: string, init?: RequestInit) => {
    if (!url.includes(padrao)) return base(url, init);
    chamadas.push({ url, metodo: init?.method ?? "GET", corpo: undefined });
    return new Promise<Response>((res) => {
      pendentes.push((body) => {
        res(resposta(200, body));
      });
    });
  });
  return pendentes;
}
