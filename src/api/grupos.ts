import { api } from "./http";

export type TipoGrupo = "familia" | "empresa" | "outro";

export interface GrupoRequest {
  nome: string;
  tipo: TipoGrupo;
  cnpj: string | null;
  observacoes: string | null;
  versao?: string;
}

export interface PessoaDoGrupoDto {
  id: string;
  nome: string;
  idade: number | null;
}

export interface GrupoDto {
  id: string;
  versao: string;
  nome: string;
  tipo: TipoGrupo;
  cnpj: string | null;
  observacoes: string | null;
  pessoas: PessoaDoGrupoDto[];
  viagens: number;
}

export interface ListaGrupoDto {
  id: string;
  nome: string;
  tipo: TipoGrupo;
  cnpj: string | null;
  pessoas: number;
  pessoasResumo: string;
  viagens: number;
}

export interface ListaGruposDto {
  itens: ListaGrupoDto[];
  total: number;
  pagina: number;
  tamanho: number;
}

export const gruposApi = {
  listar: (q: string, pagina: number) => api.get<ListaGruposDto>(`/grupos?q=${encodeURIComponent(q)}&pagina=${pagina}`),
  obter: (id: string) => api.get<GrupoDto>(`/grupos/${id}`),
  criar: (g: GrupoRequest) => api.post<GrupoDto>("/grupos", g),
  atualizar: (id: string, g: GrupoRequest) => api.put<GrupoDto>(`/grupos/${id}`, g),
  excluir: (id: string) => api.delete(`/grupos/${id}`),
  vincular: (id: string, clienteId: string) => api.post<GrupoDto>(`/grupos/${id}/pessoas`, { clienteId }),
  desvincular: (id: string, clienteId: string) => api.delete(`/grupos/${id}/pessoas/${clienteId}`),
};

export const chavesGrupos = {
  lista: (q: string, pagina: number) => ["grupos", "lista", q, pagina] as const,
  grupo: (id: string) => ["grupos", id] as const,
};
