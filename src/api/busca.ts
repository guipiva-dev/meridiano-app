import { api } from "./http";

export interface BuscaDto {
  clientes: { id: string; nome: string; telefone: string | null }[];
  viagens: {
    id: string;
    codigo: string;
    destino: string;
    titular: string;
    dataIda: string | null;
    faseOperacional: string;
  }[];
  reservas: { reservaId: string; viagemId: string; codigo: string; localizador: string; fornecedorNome: string }[];
}

export const buscaApi = {
  buscar: (q: string) => api.get<BuscaDto>(`/busca?q=${encodeURIComponent(q)}`),
};
