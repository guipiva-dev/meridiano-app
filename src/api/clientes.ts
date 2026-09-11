import type { AnexoDto } from "./anexos";
import { api } from "./http";
import type { PendenciaDto, Prioridade } from "./pendencias";

export interface ClienteRequest {
  nome: string;
  cpf: string | null;
  email: string | null;
  telefone: string | null;
  whatsapp: string | null;
  dataNascimento: string | null;
  cidade: string | null;
  uf: string | null;
  origemLead: string | null;
  tags: string[];
  observacoes: string | null;
  contatoEmergencia: string | null;
  grupoId: string | null;
  versao?: string;
}

export interface UltimaViagemDto {
  id: string;
  codigo: string;
  destino: string;
  dataIda: string | null;
  dataVolta: string | null;
  cancelada: boolean;
}

export interface ResumoClienteDto {
  viagens: number;
  ultimaViagem: UltimaViagemDto | null;
  pendenciasAbertas: number;
  pendenciasUrgentes: number;
  clienteDesde: number;
}

export interface ClienteDto {
  id: string;
  versao: string;
  nome: string;
  cpf?: string | null;
  email: string | null;
  telefone: string | null;
  whatsapp: string | null;
  dataNascimento: string | null;
  cidade: string | null;
  uf: string | null;
  origemLead: string | null;
  tags: string[];
  observacoes: string | null;
  contatoEmergencia: string | null;
  grupoId: string | null;
  grupoNome: string | null;
  criadoEm: string;
  resumo: ResumoClienteDto;
}

export interface ListaClienteDto {
  id: string;
  nome: string;
  cpfMascarado: string | null;
  idade: number | null;
  grupoNome: string | null;
  contato: string | null;
  pendenciasAbertas: number;
  pendenciasUrgentes: number;
  ultimaViagemDestino: string | null;
  ultimaViagemData: string | null;
  ultimaViagemCancelada: boolean;
  viagens: number;
}

export interface ContadoresClientesDto {
  pessoas: number;
  grupos: number;
  passaportesVencendo: number;
}

export interface ListaClientesDto {
  itens: ListaClienteDto[];
  total: number;
  pagina: number;
  tamanho: number;
  contadores: ContadoresClientesDto;
}

export interface FiltroClientes {
  q?: string;
  grupoId?: string;
  pendencia?: "com" | "urgente" | "sem";
  ultimaViagem?: "recompra";
  ordem?: "nome" | "ultima_viagem";
  direcao?: "asc" | "desc";
  pagina?: number;
  tamanho?: number;
}

export interface ViagemDaPessoaDto {
  id: string;
  codigo: string;
  destino: string;
  tipo: "nacional" | "internacional";
  dataIda: string | null;
  dataVolta: string | null;
  titular: boolean;
  faseOperacional: string;
  faseFinanceira: string;
  vendaTotal?: number;
}

export type TipoDocumento = "rg" | "cpf" | "passaporte" | "visto" | "certidao" | "outro";

export interface DocumentoDto {
  id: string;
  versao: string;
  clienteId: string;
  tipo: TipoDocumento;
  numero?: string | null;
  emissao: string | null;
  validade: string | null;
  paisEmissor: string | null;
  diasParaVencer: number | null;
}

export interface DocumentoRequest {
  tipo: TipoDocumento;
  numero: string | null;
  emissao: string | null;
  validade: string | null;
  paisEmissor: string | null;
  versao?: string;
}

export type Canal = "whatsapp" | "ligacao" | "presencial" | "email" | "outro";

export interface AtendimentoDto {
  id: string;
  versao: string;
  canal: Canal;
  resumo: string;
  ocorridoEm: string;
  usuarioId: string | null;
  usuarioNome: string | null;
}

export interface AtendimentoRequest {
  canal: Canal;
  resumo: string;
  ocorridoEm: string | null;
  versao?: string;
}

export interface NovaPendenciaPessoaRequest {
  titulo: string;
  descricao: string | null;
  dataPrevista: string;
  responsavelId: string | null;
  prioridade: Prioridade;
  viagemId: string | null;
}

/** Query string de `GET /clientes`: repete a chave para array, omite undefined/""/[] (mesma receita de qsLista). */
export function qsClientes(f: FiltroClientes): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) {
    if (v === undefined || v === null || v === "") continue;
    if (Array.isArray(v)) {
      for (const item of v) p.append(k, String(item));
    } else {
      p.append(k, String(v));
    }
  }
  return p.toString();
}

export const clientesApi = {
  listar: (f: FiltroClientes) => api.get<ListaClientesDto>(`/clientes?${qsClientes(f)}`),
  obter: (id: string) => api.get<ClienteDto>(`/clientes/${id}`),
  criar: (c: ClienteRequest) => api.post<ClienteDto>("/clientes", c),
  atualizar: (id: string, c: ClienteRequest) => api.put<ClienteDto>(`/clientes/${id}`, c),
  viagens: (id: string) => api.get<ViagemDaPessoaDto[]>(`/clientes/${id}/viagens`),
  documentos: (id: string) => api.get<DocumentoDto[]>(`/clientes/${id}/documentos`),
  criarDocumento: (id: string, d: DocumentoRequest) => api.post<DocumentoDto>(`/clientes/${id}/documentos`, d),
  atualizarDocumento: (docId: string, d: DocumentoRequest) => api.put<DocumentoDto>(`/documentos/${docId}`, d),
  excluirDocumento: (docId: string) => api.delete(`/documentos/${docId}`),
  atendimentos: (id: string, canal?: Canal) =>
    api.get<AtendimentoDto[]>(`/clientes/${id}/atendimentos${canal ? `?canal=${canal}` : ""}`),
  criarAtendimento: (id: string, a: AtendimentoRequest) => api.post<AtendimentoDto>(`/clientes/${id}/atendimentos`, a),
  atualizarAtendimento: (atId: string, a: AtendimentoRequest) => api.put<AtendimentoDto>(`/atendimentos/${atId}`, a),
  excluirAtendimento: (atId: string) => api.delete(`/atendimentos/${atId}`),
  pendencias: (id: string, incluirConcluidas: boolean) =>
    api.get<PendenciaDto[]>(`/clientes/${id}/pendencias?incluirConcluidas=${incluirConcluidas}`),
  criarPendencia: (id: string, r: NovaPendenciaPessoaRequest) =>
    api.post<PendenciaDto>(`/clientes/${id}/pendencias`, r),
  anexos: (id: string) => api.get<AnexoDto[]>(`/clientes/${id}/anexos`),
};

export const chavesClientes = {
  lista: (f: FiltroClientes) => ["clientes", "lista", f] as const,
  cliente: (id: string) => ["clientes", id] as const,
  viagens: (id: string) => ["clientes", id, "viagens"] as const,
  documentos: (id: string) => ["clientes", id, "documentos"] as const,
  atendimentos: (id: string, canal?: Canal) => ["clientes", id, "atendimentos", canal ?? "todos"] as const,
  pendencias: (id: string, c: boolean) => ["clientes", id, "pendencias", c] as const,
  anexos: (id: string) => ["clientes", id, "anexos"] as const,
};
