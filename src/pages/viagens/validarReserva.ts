import type { ReservaForm } from "@/components/reserva";
import { calcularReserva } from "@/dominio/calculoReserva";

function erroVenda(r: ReservaForm): string | undefined {
  // A03: total preenchido sem venda ao cliente (vazia ou 0) — erro de digitação comum no lançamento.
  if ((r.valorTotal ?? 0) > 0 && (r.valorCliente === null || r.valorCliente === 0)) {
    return "Informe quanto o cliente contratou (sugerido: total)";
  }
  // A12: com RAV via operadora, venda abaixo do custo faz o esperado da operadora ficar negativo.
  if (r.ravClienteModo !== "via_operadora") return undefined;
  const negativo =
    (calcularReserva({
      valorTotal: r.valorTotal ?? 0,
      valorComissao: r.valorComissao ?? 0,
      ravOperadora: r.ravOperadora ?? 0,
      valorCliente: r.valorCliente,
      taxaServico: r.taxaServico ?? 0,
      viaOperadora: true,
    }).valorEsperadoOperadora ?? 0) < 0;
  return negativo ? "Com RAV via operadora a venda não pode ficar abaixo do custo" : undefined;
}

/** Campo que uma reserva ativa cobra antes de gastar uma ida ao servidor (ALT-01, A02, A03, A12).
 * Cancelada é imutável: não valida. */
export function validarReserva(r: ReservaForm): Record<string, string> {
  const e: Record<string, string> = {};
  if (!r.fornecedorId) e.fornecedorId = "Escolha o fornecedor";
  if ((r.valorTaxas ?? 0) > (r.valorTotal ?? 0)) e.valorTaxas = "Taxas não podem passar do total"; // A02
  const venda = erroVenda(r);
  if (venda) e.valorCliente = venda;
  return e;
}
