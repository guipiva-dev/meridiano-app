import { api } from "./http";
import type { FornecedorDto } from "./viagens";

export type TipoFornecedor =
  | "operadora"
  | "consolidadora"
  | "cia_aerea"
  | "hotel"
  | "seguradora"
  | "receptivo"
  | "despachante"
  | "outro";

export interface JanelaDto {
  diaInicial: number;
  diaFinal: number;
  diaPagamento: number;
  mesesAFrente: number;
}

export interface VersaoRegraDto {
  vigenteDesde: string;
  janelas: JanelaDto[];
}

export interface FornecedorRequest {
  nome: string;
  tipo: TipoFornecedor;
  cnpj: string | null;
  site: string | null;
  contato: string | null;
  telefone: string | null;
  telefoneEmergencia: string | null;
  percentualComissaoPadrao: number | null;
  prazoComissaoDias: number | null;
  ativo: boolean;
  observacoes: string | null;
  versao?: string;
}

export interface FornecedorDetalheDto {
  id: string;
  versao: string;
  nome: string;
  tipo: TipoFornecedor;
  cnpj: string | null;
  site: string | null;
  contato: string | null;
  telefone: string | null;
  telefoneEmergencia: string | null;
  percentualComissaoPadrao: number | null;
  prazoComissaoDias: number | null;
  ativo: boolean;
  observacoes: string | null;
  resumo: { reservas: number; receitaAno?: number };
  regras: VersaoRegraDto[];
  regraVigente: VersaoRegraDto | null;
}

export interface ListaFornecedorDto {
  id: string;
  nome: string;
  tipo: TipoFornecedor;
  telefoneEmergencia: string | null;
  percentualComissaoPadrao: number | null;
  prazoComissaoDias: number | null;
  janelasVigentes: JanelaDto[];
  ativo: boolean;
  reservas: number;
  receitaAno?: number;
}

export interface ListaFornecedoresDto {
  itens: ListaFornecedorDto[];
  total: number;
  pagina: number;
  tamanho: number;
  ano: number;
}

export interface ReservaDoFornecedorDto {
  reservaId: string;
  viagemId: string;
  codigo: string;
  titular: string | null;
  destino: string;
  localizador: string | null;
  dataCompra: string;
  status: string;
  situacaoComissao: string;
  venda?: number;
  esperado?: number;
  recebido?: number;
}

export interface ListaReservasFornecedorDto {
  itens: ReservaDoFornecedorDto[];
  total: number;
  pagina: number;
  tamanho: number;
}

function sufixoMeses(mesesAFrente: number): string {
  if (mesesAFrente === 1) return " (mês seguinte)";
  if (mesesAFrente >= 2) return ` (+${mesesAFrente} meses)`;
  return "";
}

/** Texto compacto da regra de repasse: janelas (se houver) ou o prazo fixo em dias. */
export function resumoRegra(janelas: JanelaDto[], prazoDias: number | null): string {
  if (janelas.length > 0) {
    return janelas
      .map((j) => `${j.diaInicial}–${j.diaFinal} → dia ${j.diaPagamento}${sufixoMeses(j.mesesAFrente)}`)
      .join(" · ");
  }
  if (prazoDias !== null) return `${prazoDias} dias após a compra`;
  return "—";
}

export function descreverJanela(j: JanelaDto): { titulo: string; sub: string } {
  const quando =
    j.mesesAFrente === 0 ? "do mesmo mês" : j.mesesAFrente === 1 ? "do mês seguinte" : `${j.mesesAFrente} meses depois`;
  return { titulo: `Vendas de ${j.diaInicial} a ${j.diaFinal}`, sub: `pagam dia ${j.diaPagamento} ${quando}` };
}

function qs(params: Record<string, string | number | boolean | undefined>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") p.set(k, String(v));
  return p.toString();
}

export const fornecedoresApi = {
  resumo: (q: string, ativo: boolean | undefined, pagina: number) =>
    api.get<ListaFornecedoresDto>(`/fornecedores/resumo?${qs({ q, ativo, pagina })}`),
  obter: (id: string) => api.get<FornecedorDetalheDto>(`/fornecedores/${id}`),
  criar: (f: FornecedorRequest) => api.post<FornecedorDto>("/fornecedores", f),
  atualizar: (id: string, f: FornecedorRequest) => api.put<FornecedorDetalheDto>(`/fornecedores/${id}`, f),
  novaVersaoRegra: (id: string, r: { vigenteDesde: string; janelas: JanelaDto[] }) =>
    api.post<FornecedorDetalheDto>(`/fornecedores/${id}/regras`, r),
  reservas: (id: string, pagina: number) =>
    api.get<ListaReservasFornecedorDto>(`/fornecedores/${id}/reservas?${qs({ pagina })}`),
};

export const chavesFornecedores = {
  resumo: (q: string, ativo: boolean | undefined, pagina: number) =>
    ["fornecedores", "resumo", q, ativo ?? "todos", pagina] as const,
  fornecedor: (id: string) => ["fornecedores", id] as const,
  reservas: (id: string, pagina: number) => ["fornecedores", id, "reservas", pagina] as const,
};
