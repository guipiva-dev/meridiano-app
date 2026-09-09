import type { Desfecho, NfseStatus, Tipo } from "./viagens";

export interface ListaViagemDto {
  id: string;
  codigo: string;
  titular: string;
  destino: string;
  tipo: Tipo;
  dataIda: string | null;
  dataVolta: string | null;
  vendedorNome: string;
  faseOperacional: string;
  faseFinanceira: string;
  vendaTotal?: number;
  receitaPrevista?: number;
}

export interface ContadoresDto {
  todas: number;
  emEmissao: number;
  embarcamSemana: number;
  comissaoAtrasada: number;
  concluidas: number;
}

export interface ListaViagensDto {
  itens: ListaViagemDto[];
  total: number;
  pagina: number;
  tamanho: number;
  contadores: ContadoresDto;
}

export type AbaViagens = "todas" | "em_emissao" | "embarcam_semana" | "comissao_atrasada" | "concluidas";

export interface FiltroViagens {
  aba?: AbaViagens;
  q?: string;
  vendedorId?: string;
  tipo?: Tipo;
  fornecedorId?: string[];
  nfse?: NfseStatus;
  idaDe?: string;
  idaAte?: string;
  compraDe?: string;
  compraAte?: string;
  ordem?: "ida" | "codigo" | "venda";
  direcao?: "asc" | "desc";
  pagina?: number;
  tamanho?: number;
}

export interface CreditoRequest {
  valor: number;
  validade: string | null;
  clienteId: string | null;
}

export interface CancelarReservaRequest {
  motivo: string;
  desfecho: Desfecho;
  valorReembolso: number | null;
  comissaoMantida: boolean;
  credito: CreditoRequest | null;
  versao: string;
}

export interface CancelarReservaItem {
  reservaId: string;
  desfecho: Desfecho;
  valorReembolso: number | null;
  comissaoMantida: boolean;
  credito: CreditoRequest | null;
}

export interface CancelarViagemRequest {
  motivo: string;
  reservas: CancelarReservaItem[];
  versao: string;
}

export interface RemarcarRequest {
  dataAlteracao: string;
  descricao: string;
  valorNovo: number | null;
  multaCliente: number;
  novaDataIda: string | null;
  novaDataVolta: string | null;
  versao: string;
}

export interface NfseRequest {
  status: NfseStatus;
  tomador: "cliente" | "operadora" | null;
  numero: string | null;
  dataEmissao: string | null;
  versao: string;
}

export interface CreditoDto {
  id: string;
  clienteId: string;
  clienteNome: string;
  fornecedorId: string;
  fornecedorNome: string;
  valor: number;
  validade: string | null;
  status: "disponivel" | "utilizado" | "expirado";
  reservaOrigemId: string | null;
  codigoViagemOrigem: string | null;
  reservaUsoId: string | null;
}

export interface ReservaAlteracaoDto {
  id: string;
  dataAlteracao: string;
  descricao: string;
  valorAnterior: number | null;
  valorNovo: number | null;
  multaCliente: number;
  usuarioNome: string | null;
  criadoEm: string;
}
