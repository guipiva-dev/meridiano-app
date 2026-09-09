import type {
  FluxoPagamento,
  FormaPagamento,
  NfseStatus,
  RavClienteModo,
  ReservaDto,
  ReservaRequest,
  StatusReserva,
  TipoServico,
} from "@/api/viagens";
import type { ValoresReserva } from "@/dominio/calculoReserva";

/** Estado do formulário de UMA reserva (o que a página guarda no useFieldArray). */
export interface ReservaForm {
  id?: string;
  versao?: string;
  fornecedorId: string;
  localizador: string;
  dataCompra: string;
  status: StatusReserva | "cancelada";
  nfseStatus: NfseStatus;
  tiposServico: TipoServico[];
  valorTotal: number | null;
  valorTaxas: number | null;
  valorComissao: number | null;
  comissaoSugerida: boolean;
  ravOperadora: number | null;
  valorCliente: number | null;
  taxaServico: number | null;
  ravClienteModo: RavClienteModo;
  fluxoPagamento: FluxoPagamento;
  formasPagamento: FormaPagamento[];
  observacoes: string;
  aberta: boolean;
}

export function reservaVazia(taxaServicoPadrao: number): ReservaForm {
  return {
    fornecedorId: "",
    localizador: "",
    dataCompra: new Date().toLocaleDateString("en-CA"),
    status: "pendente",
    nfseStatus: "nao_precisa",
    tiposServico: [],
    valorTotal: null,
    valorTaxas: null,
    valorComissao: null,
    comissaoSugerida: true,
    ravOperadora: null,
    valorCliente: null,
    taxaServico: taxaServicoPadrao,
    ravClienteModo: "retido_agencia",
    fluxoPagamento: "cliente_paga_operadora",
    formasPagamento: [],
    observacoes: "",
    aberta: true,
  };
}

export function paraRequest(r: ReservaForm): ReservaRequest {
  const localizador = r.localizador.trim();
  const observacoes = r.observacoes.trim();
  return {
    id: r.id,
    fornecedorId: r.fornecedorId,
    localizador: localizador === "" ? null : localizador,
    dataCompra: r.dataCompra,
    // `ReservaRequest.status` ainda é só StatusReserva (T5); o backend valida e aceita
    // "cancelada" também — a tela nunca deve reescrever esse valor no save.
    status: r.status as ReservaRequest["status"],
    tiposServico: r.tiposServico,
    valorTotal: r.valorTotal ?? 0,
    valorTaxas: r.valorTaxas ?? 0,
    valorComissao: r.valorComissao ?? 0,
    ravOperadora: r.ravOperadora ?? 0,
    valorCliente: r.valorCliente ?? 0,
    taxaServico: r.taxaServico ?? 0,
    ravClienteModo: r.ravClienteModo,
    fluxoPagamento: r.fluxoPagamento,
    formasPagamento: r.formasPagamento,
    nfseStatus: r.nfseStatus,
    observacoes: observacoes === "" ? null : observacoes,
  };
}

export function deDto(r: ReservaDto): ReservaForm {
  return {
    id: r.id,
    versao: r.versao,
    fornecedorId: r.fornecedorId,
    localizador: r.localizador ?? "",
    dataCompra: r.dataCompra,
    status: r.status,
    nfseStatus: r.nfseStatus,
    tiposServico: r.tiposServico,
    valorTotal: r.valorTotal ?? null,
    valorTaxas: r.valorTaxas ?? null,
    valorComissao: r.valorComissao ?? null,
    comissaoSugerida: false,
    ravOperadora: r.ravOperadora ?? null,
    valorCliente: r.valorCliente ?? null,
    taxaServico: r.taxaServico ?? null,
    ravClienteModo: r.ravClienteModo,
    fluxoPagamento: r.fluxoPagamento,
    formasPagamento: r.formasPagamento,
    observacoes: r.observacoes ?? "",
    aberta: false,
  };
}

/** Mapeia o form para o input de `calcularReserva` (nenhum cálculo aqui, só o preview). */
export function paraValoresReserva(r: ReservaForm): ValoresReserva {
  return {
    valorTotal: r.valorTotal ?? 0,
    valorComissao: r.valorComissao ?? 0,
    ravOperadora: r.ravOperadora ?? 0,
    valorCliente: r.valorCliente ?? 0,
    taxaServico: r.taxaServico ?? 0,
    viaOperadora: r.ravClienteModo === "via_operadora",
    cancelada: r.status === "cancelada",
  };
}
