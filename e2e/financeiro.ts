/// <reference types="node" />
import { type APIRequestContext, type APIResponse, expect } from "@playwright/test";
import type { ClienteBuscaDto, FornecedorDto, ViagemDto, ViagemRequest } from "@/api/viagens";
import { DEV_USER } from "./fixtures";

/** O `request` do Playwright não passa pelo proxy do Vite: fala direto com a API. */
const API = process.env.E2E_API ?? "http://localhost:5000/api/v1";

/**
 * Decolar não tem `percentual_comissao_padrao` no seed, então nenhuma outra suíte deixa reserva
 * dela aguardando operadora: filtrando a conciliação por Decolar sobra só o que este spec criou.
 */
export const OPERADORA_FIN = "Decolar";

async function corpo<T>(pedido: Promise<APIResponse>): Promise<T> {
  const r = await pedido;
  expect(r.ok(), `${r.url()} → ${r.status()}`).toBeTruthy();
  return (await r.json()) as T;
}

function iso(diasAFrente: number): string {
  const d = new Date();
  d.setDate(d.getDate() + diasAFrente);
  return d.toLocaleDateString("en-CA");
}

/**
 * Como `criarViagemViaApi` (congelada), mas com a reserva já emitida e com comissão: é o que faz a
 * reserva aparecer na conciliação (esperado = valorComissao + ravOperadora = 1.100).
 * Reaproveita a sessão de quem chama; `POST /auth/login` tem limite de 10/min por IP.
 */
export async function criarViagemComComissao(
  request: APIRequestContext,
  opts: { destino: string },
): Promise<{ id: string; codigo: string; localizador: string }> {
  if (!(await request.get(`${API}/auth/me`)).ok()) {
    const login = await request.post(`${API}/auth/login`, { data: { email: DEV_USER.email, senha: DEV_USER.senha } });
    expect(login.ok(), `login → ${login.status()}`).toBeTruthy();
  }

  const me = await corpo<{ usuarioId: string }>(request.get(`${API}/auth/me`));
  const clientes = await corpo<ClienteBuscaDto[]>(request.get(`${API}/clientes/busca?q=Carlos`));
  const cliente = clientes.find((c) => c.nome === "Carlos Mendes");
  expect(cliente, 'cliente "Carlos Mendes" não está no seed').toBeDefined();
  const fornecedores = await corpo<FornecedorDto[]>(request.get(`${API}/fornecedores?ativo=true`));
  const fornecedor = fornecedores.find((f) => f.nome === OPERADORA_FIN);
  expect(fornecedor, `fornecedor "${OPERADORA_FIN}" não está no seed`).toBeDefined();

  const localizador = `FIN${Date.now().toString(36).toUpperCase()}`;
  const viagem: ViagemRequest = {
    destino: opts.destino,
    tipo: "internacional",
    dataIda: iso(120),
    dataVolta: iso(130),
    vendedorId: me.usuarioId,
    agenteId: null,
    ocasiao: null,
    observacoes: null,
    passageiros: [{ clienteId: cliente?.id ?? "", titular: true }],
    repasseValor: null,
    reservas: [
      {
        fornecedorId: fornecedor?.id ?? "",
        localizador,
        dataCompra: iso(0),
        status: "emitida",
        tiposServico: ["aereo"],
        valorTotal: 10000,
        valorTaxas: 0,
        valorComissao: 1000,
        ravOperadora: 100,
        valorCliente: 10000,
        taxaServico: 0,
        ravClienteModo: "retido_agencia",
        fluxoPagamento: "cliente_paga_operadora",
        formasPagamento: [],
        nfseStatus: "nao_precisa",
        observacoes: null,
      },
    ],
  };
  const dto = await corpo<ViagemDto>(request.post(`${API}/viagens`, { data: viagem }));
  return { id: dto.id, codigo: dto.codigo, localizador };
}
