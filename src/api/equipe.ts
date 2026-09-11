import { api } from "./http";

export type Acesso = "acesso_ativo" | "sem_acesso" | "convite_pendente" | "inativo";

export interface ColaboradorDto {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  perfil: string;
  geraRepasse: boolean;
  percentualPadrao: number;
  ativo: boolean;
  acesso: Acesso;
  ultimoLoginEm: string | null;
  conviteExpiraEm: string | null;
  versao: string;
}

export interface EquipeDto {
  itens: ColaboradorDto[];
  total: number;
  comAcesso: number;
  convitesPendentes: number;
}

export interface NovoColaboradorRequest {
  nome: string;
  email: string;
  telefone: string | null;
  perfil: string;
  geraRepasse: boolean;
  percentualPadrao: number;
}

export interface AtualizarUsuarioRequest {
  nome: string;
  telefone: string | null;
  perfil: string;
  geraRepasse: boolean;
  percentualPadrao: number;
  ativo: boolean;
  versao: string;
}

export interface PerfilDto {
  perfil: string;
  permissoes: string[];
}

export interface ConviteNovoRequest {
  nome: string;
  email: string;
  perfil: string;
}

export const equipeApi = {
  listar: () => api.get<EquipeDto>("/usuarios"),
  obter: (id: string) => api.get<ColaboradorDto>(`/usuarios/${id}`),
  criar: (r: NovoColaboradorRequest) => api.post<ColaboradorDto>("/usuarios", r),
  atualizar: (id: string, r: AtualizarUsuarioRequest) => api.put<ColaboradorDto>(`/usuarios/${id}`, r),
  convidar: (id: string) => api.post<ColaboradorDto>(`/usuarios/${id}/convite`),
  convidarNovo: (r: ConviteNovoRequest) => api.post<{ usuarioId: string }>("/auth/convites", r),
  perfis: () => api.get<PerfilDto[]>("/usuarios/perfis"),
};

export const chavesEquipe = {
  lista: () => ["equipe"] as const,
  item: (id: string) => ["equipe", id] as const,
  perfis: () => ["equipe", "perfis"] as const,
};
