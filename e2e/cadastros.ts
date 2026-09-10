/// <reference types="node" />
import { type APIRequestContext, expect, type Page } from "@playwright/test";
import type { ClienteDto, ClienteRequest } from "@/api/clientes";

/** O `request` do Playwright não passa pelo proxy do Vite: fala direto com a API. */
const API = process.env.E2E_API ?? "http://localhost:5000/api/v1";

/** Lista de clientes → busca (debounce de 300 ms) → abre a pessoa pela linha. */
export async function abrirPessoaPorNome(page: Page, nome: string) {
  await page.goto("/clientes");
  await page.getByPlaceholder(/Nome, CPF/).fill(nome);
  const linha = page.getByRole("row", { name: new RegExp(nome) });
  await expect(linha).toBeVisible();
  await linha.click();
  await expect(page.getByRole("heading", { name: new RegExp(nome) })).toBeVisible();
}

/**
 * Pessoa descartável para o teste de edição: os dois viewports rodam em paralelo e disputariam o
 * `xmin` da mesma linha do seed (409 de concorrência). Reaproveita a sessão do `loginUi`.
 */
export async function criarPessoaViaApi(request: APIRequestContext, nome: string): Promise<ClienteDto> {
  const corpo: ClienteRequest = {
    nome,
    cpf: null,
    email: null,
    telefone: null,
    whatsapp: null,
    dataNascimento: null,
    cidade: null,
    uf: null,
    origemLead: null,
    tags: [],
    observacoes: null,
    contatoEmergencia: null,
    grupoId: null,
  };
  const r = await request.post(`${API}/clientes`, { data: corpo });
  expect(r.ok(), `POST /clientes → ${r.status()}`).toBeTruthy();
  return (await r.json()) as ClienteDto;
}
