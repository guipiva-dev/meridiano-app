import { api } from "./http";

function qs(params: Record<string, string | null | undefined>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== null && v !== undefined) p.set(k, v);
  return p.toString();
}

export type Tipo = "nacional" | "internacional";
export type StatusReserva = "pendente" | "emitida";
export type RavClienteModo = "retido_agencia" | "via_operadora";
export type FluxoPagamento = "cliente_paga_operadora" | "cliente_paga_agencia";
export type NfseStatus = "falta_emitir" | "emitido" | "nao_precisa";

export const TIPOS_SERVICO = [
  "aereo",
  "hospedagem",
  "seguro",
  "traslado",
  "passeio",
  "ingresso",
  "aluguel_carro",
  "documentacao",
  "outro",
] as const;
export type TipoServico = (typeof TIPOS_SERVICO)[number];
export const ROTULO_SERVICO: Record<TipoServico, string> = {
  aereo: "Aéreo",
  hospedagem: "Hospedagem",
  seguro: "Seguro",
  traslado: "Traslado",
  passeio: "Passeio",
  ingresso: "Ingresso",
  aluguel_carro: "Aluguel de carro",
  documentacao: "Documentação",
  outro: "Outro",
};

export const FORMAS_PAGAMENTO = ["pix", "boleto", "cartao"] as const;
export type FormaPagamento = (typeof FORMAS_PAGAMENTO)[number];
export const ROTULO_FORMA: Record<FormaPagamento, string> = {
  pix: "PIX",
  boleto: "Boleto",
  cartao: "Cartão",
};

export interface PassageiroRequest {
  clienteId: string;
  titular: boolean;
}

export interface ReservaRequest {
  id?: string;
  fornecedorId: string;
  localizador: string | null;
  dataCompra: string;
  status: StatusReserva;
  tiposServico: TipoServico[];
  valorTotal: number;
  valorTaxas: number;
  valorComissao: number;
  ravOperadora: number;
  valorCliente: number;
  taxaServico: number;
  ravClienteModo: RavClienteModo;
  fluxoPagamento: FluxoPagamento;
  formasPagamento: FormaPagamento[];
  nfseStatus: NfseStatus;
  observacoes: string | null;
}

export interface ViagemRequest {
  destino: string;
  tipo: Tipo;
  dataIda: string | null;
  dataVolta: string | null;
  vendedorId: string;
  agenteId: string | null;
  ocasiao: string | null;
  observacoes: string | null;
  passageiros: PassageiroRequest[];
  repasseValor: number | null;
  reservas: ReservaRequest[];
  versao?: string;
}

export interface PassageiroDto {
  clienteId: string;
  nome: string;
  titular: boolean;
}

export interface ReservaDto {
  id: string;
  versao: string;
  fornecedorId: string;
  fornecedorNome: string;
  localizador: string | null;
  dataCompra: string;
  status: StatusReserva | "cancelada";
  tiposServico: TipoServico[];
  formasPagamento: FormaPagamento[];
  ravClienteModo: RavClienteModo;
  fluxoPagamento: FluxoPagamento;
  nfseStatus: NfseStatus;
  observacoes: string | null;
  dataPrevistaComissao: string | null;
  valorTotal?: number;
  valorTaxas?: number;
  valorComissao?: number;
  ravOperadora?: number;
  valorCliente?: number;
  taxaServico?: number;
  ravCliente?: number;
  valorEsperadoOperadora?: number;
  receitaPrevista?: number;
  percentualComissao?: number | null;
}

export interface RepasseDto {
  id: string;
  valor: number | null;
  status: "bloqueado" | "a_pagar" | "pago";
}

export interface ResumoViagemDto {
  vendaTotal: number;
  custoFornecedores: number;
  receitaPrevista: number;
  repasseValor: number | null;
  despesasViagem: number;
  resultado: number;
}

export interface ViagemDto {
  id: string;
  codigo: string;
  versao: string;
  destino: string;
  tipo: Tipo;
  dataIda: string | null;
  dataVolta: string | null;
  vendedorId: string;
  vendedorNome: string;
  agenteId: string | null;
  ocasiao: string | null;
  observacoes: string | null;
  cancelada: boolean;
  faseOperacional: string;
  faseFinanceira: string;
  passageiros: PassageiroDto[];
  reservas: ReservaDto[];
  repasse?: RepasseDto | null;
  resumo?: ResumoViagemDto | null;
}

export interface ViagemSemelhanteDto {
  id: string;
  codigo: string;
  destino: string;
  dataIda: string | null;
  dataVolta: string | null;
  faseOperacional: string;
  sobrepoe: boolean;
}

export interface ClienteBuscaDto {
  id: string;
  nome: string;
  telefone: string | null;
  cpf?: string | null;
}

export interface FornecedorDto {
  id: string;
  nome: string;
  tipo: string;
  percentualComissaoPadrao: number | null;
  prazoComissaoDias: number | null;
  ativo: boolean;
}

export interface VendedorDto {
  id: string;
  nome: string;
  perfil: string;
  geraRepasse: boolean;
  percentualPadrao: number;
}

export interface AgenciaDto {
  nome: string;
  taxaServicoPadrao: number;
}

export const viagensApi = {
  criar: (v: ViagemRequest) => api.post<ViagemDto>("/viagens", v),
  obter: (id: string) => api.get<ViagemDto>(`/viagens/${id}`),
  atualizar: (id: string, v: ViagemRequest) => api.put<ViagemDto>(`/viagens/${id}`, v),
  adicionarReserva: (id: string, reserva: ReservaRequest, versao: string) =>
    api.post<ViagemDto>(`/viagens/${id}/reservas`, { reserva, versao }),
  semelhantes: (clienteId: string, dataIda: string | null, dataVolta: string | null) =>
    api.get<ViagemSemelhanteDto[]>(`/viagens/semelhantes?${qs({ clienteId, dataIda, dataVolta })}`),
  reservaDuplicada: (fornecedorId: string, localizador: string) =>
    api.get<{ viagemId: string; codigo: string } | undefined>(
      `/reservas/duplicada?${qs({ fornecedorId, localizador })}`,
    ),
  buscarClientes: (q: string) => api.get<ClienteBuscaDto[]>(`/clientes/busca?q=${encodeURIComponent(q)}`),
  criarCliente: (c: { nome: string; telefone?: string; email?: string; cpf?: string }) =>
    api.post<ClienteBuscaDto>("/clientes", c),
  fornecedores: () => api.get<FornecedorDto[]>("/fornecedores?ativo=true"),
  criarFornecedor: (f: { nome: string; tipo: string }) => api.post<FornecedorDto>("/fornecedores", f),
  vendedores: () => api.get<VendedorDto[]>("/usuarios/vendedores"),
  agencia: () => api.get<AgenciaDto>("/agencia"),
};

export const chaves = {
  viagem: (id: string) => ["viagens", id] as const,
  fornecedores: ["fornecedores"] as const,
  vendedores: ["vendedores"] as const,
  agencia: ["agencia"] as const,
};
