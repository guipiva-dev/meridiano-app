/// <reference types="node" />
import { type APIRequestContext, type APIResponse, expect, type Page } from "@playwright/test";
import type { ClienteBuscaDto, FornecedorDto, ReservaRequest, ViagemDto, ViagemRequest } from "@/api/viagens";
import { DEV_USER, SEED } from "./fixtures";

/** O `request` do Playwright não passa pelo proxy do Vite: fala direto com a API. */
const API = process.env.E2E_API ?? "http://localhost:5000/api/v1";

/** Login pela tela (mesmo fluxo de nova-viagem.spec.ts). */
export async function loginUi(page: Page) {
  await page.goto("/login");
  await page.getByLabel(/E-mail/).fill(DEV_USER.email);
  await page.getByLabel(/Senha/).fill(DEV_USER.senha);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/viagens/);
}

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

/** Reservas semeadas: fornecedor do seed + valores do subplano 3.3. */
const MODELO = [
  { fornecedor: "CVC", valorTotal: 10000, valorCliente: 10500 },
  { fornecedor: "Decolar", valorTotal: 3000, valorCliente: 3200 },
];

export interface OpcoesViagem {
  destino: string;
  /** Quantas reservas (1 ou 2), sempre `pendente` — a viagem cai na aba "Em emissão". */
  reservas: number;
  /** Localizador da primeira reserva; sem ele, um único por execução. */
  localizador?: string;
}

/**
 * Cria uma viagem direto pela API, para o E2E não gastar tempo repetindo o formulário de
 * nova viagem. Reaproveita a sessão de quem chama (`page.request` já tem o cookie do
 * `loginUi`) e só faz login quando não há — `POST /auth/login` tem limite de 10/min por IP
 * e a suíte inteira estoura esse teto se cada teste logar duas vezes.
 */
export async function criarViagemViaApi(
  request: APIRequestContext,
  opts: OpcoesViagem,
): Promise<{ id: string; codigo: string; localizador: string }> {
  if (!(await request.get(`${API}/auth/me`)).ok()) {
    const login = await request.post(`${API}/auth/login`, { data: { email: DEV_USER.email, senha: DEV_USER.senha } });
    expect(login.ok(), `login → ${login.status()}`).toBeTruthy();
  }

  const me = await corpo<{ usuarioId: string }>(request.get(`${API}/auth/me`));
  const clientes = await corpo<ClienteBuscaDto[]>(request.get(`${API}/clientes/busca?q=Carlos`));
  const cliente = clientes.find((c) => c.nome === SEED.cliente);
  expect(cliente, `cliente "${SEED.cliente}" não está no seed`).toBeDefined();
  const fornecedores = await corpo<FornecedorDto[]>(request.get(`${API}/fornecedores?ativo=true`));

  const localizador = opts.localizador ?? `E2E${Date.now().toString(36).toUpperCase()}`;
  const reservas: ReservaRequest[] = MODELO.slice(0, opts.reservas).map((m, i) => {
    const fornecedor = fornecedores.find((f) => f.nome === m.fornecedor);
    expect(fornecedor, `fornecedor "${m.fornecedor}" não está no seed`).toBeDefined();
    return {
      fornecedorId: fornecedor?.id ?? "",
      localizador: i === 0 ? localizador : `${localizador}-${i}`,
      dataCompra: iso(0),
      status: "pendente",
      tiposServico: ["aereo"],
      valorTotal: m.valorTotal,
      valorTaxas: 0,
      valorComissao: 0,
      ravOperadora: 0,
      valorCliente: m.valorCliente,
      taxaServico: 0,
      ravClienteModo: "retido_agencia",
      fluxoPagamento: "cliente_paga_operadora",
      formasPagamento: [],
      nfseStatus: "nao_precisa",
      observacoes: null,
    };
  });

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
    reservas,
  };
  const dto = await corpo<ViagemDto>(request.post(`${API}/viagens`, { data: viagem }));
  return { id: dto.id, codigo: dto.codigo, localizador };
}
