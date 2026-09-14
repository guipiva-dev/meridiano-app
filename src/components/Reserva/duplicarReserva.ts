import type { ReservaDto } from "@/api/viagens";
import { deDto, type ReservaForm } from "./tipos";

/**
 * Nova reserva a partir de outra (benchmark REQ-04): mantém fornecedor, serviços, valores, fluxo,
 * formas e data da compra; zera identidade, localizador, status, NFSe e cancelamento.
 * Serviços detalhados (bilhete etc.) e movimentos/anexos não vêm no DTO nem vão no POST.
 */
export function duplicarReserva(r: ReservaDto): ReservaForm {
  return {
    ...deDto(r),
    id: undefined,
    versao: undefined,
    chaveLocal: crypto.randomUUID(),
    localizador: "",
    status: "pendente",
    nfseStatus: "nao_precisa",
    observacoes: "",
    aberta: true,
    comissaoMantida: false,
    canceladaEm: null,
    motivoCancelamento: null,
    desfechoCancelamento: null,
  };
}
