import type { UseFormReturn } from "react-hook-form";
import type { VendedorDto } from "@/api/viagens";
import type { ReservaForm } from "@/components/reserva";
import { arredondar2, calcularReserva } from "@/dominio/calculoReserva";
import { comissaoPorPercentual } from "@/lib/comissao";
import type { ViagemForm } from "./useNovaViagem";

/** Base do vendedor como em `Rotinas.ReavaliarRepasseAsync`: comissão + RAV das reservas não canceladas ou canceladas
 * com comissão mantida, nunca abaixo de 0 (`greatest(0, …)`); venda nula conta como o total (RAV 0), igual ao que o backend grava. Taxa de serviço fora. */
function baseDoVendedor(reservas: ReservaForm[]): number {
  let base = 0;
  for (const r of reservas) {
    base +=
      calcularReserva({
        valorTotal: r.valorTotal ?? 0,
        valorComissao: r.valorComissao ?? 0,
        ravOperadora: r.ravOperadora ?? 0,
        valorCliente: r.valorCliente ?? r.valorTotal ?? 0,
        taxaServico: r.taxaServico ?? 0,
        viaOperadora: r.ravClienteModo === "via_operadora",
        cancelada: r.status === "cancelada",
        comissaoMantida: r.comissaoMantida,
      }).totalComissao ?? 0;
  }
  return Math.max(0, arredondar2(base));
}

/** Comissão do vendedor em % e R$ (ruling 2026-09-14). Repasse pago/cancelado: o backend congela o valor. */
export function useRepasseVendedor(
  form: UseFormReturn<ViagemForm>,
  reservas: ReservaForm[],
  vendedor: VendedorDto | undefined,
  statusRepasse: string | undefined,
) {
  const repasseValor = form.watch("repasseValor");
  const repassePercentual = form.watch("repassePercentual");
  const baseRepasse = baseDoVendedor(reservas);
  const congelado = statusRepasse === "pago" || statusRepasse === "cancelado";
  const repasseValorMostrado =
    repassePercentual !== null && !congelado ? comissaoPorPercentual(repassePercentual, baseRepasse) : repasseValor;
  const repasseSugerido =
    vendedor?.geraRepasse && repasseValor === null && repassePercentual === null
      ? comissaoPorPercentual(vendedor.percentualPadrao, baseRepasse)
      : null;
  function definirRepassePercentual(p: number | null) {
    form.setValue("repassePercentual", p, { shouldDirty: true });
    // Limpar o % mantém o R$ que estava na tela.
    form.setValue("repasseValor", p !== null ? comissaoPorPercentual(p, baseRepasse) : repasseValorMostrado, {
      shouldDirty: true,
    });
  }
  function definirRepasseValor(v: number | null) {
    form.setValue("repassePercentual", null, { shouldDirty: true });
    form.setValue("repasseValor", v, { shouldDirty: true });
  }
  return { baseRepasse, repasseValorMostrado, repasseSugerido, definirRepassePercentual, definirRepasseValor };
}
