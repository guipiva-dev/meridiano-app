import type { UseFormReturn } from "react-hook-form";
import type { VendedorDto } from "@/api/viagens";
import type { ReservaForm } from "@/components/reserva";
import { somarReservas } from "@/components/viagem";
import { comissaoPorPercentual } from "@/lib/comissao";
import type { ViagemForm } from "./useNovaViagem";

/** Comissão do vendedor em % e R$. Base = comissão total (comissão + RAV) das reservas ativas; taxa de serviço fora (ruling 2026-09-14). */
export function useRepasseVendedor(
  form: UseFormReturn<ViagemForm>,
  reservas: ReservaForm[],
  vendedor: VendedorDto | undefined,
) {
  const repasseValor = form.watch("repasseValor");
  const repassePercentual = form.watch("repassePercentual");
  const { totalComissao, incompleta } = somarReservas(reservas);
  const baseRepasse = incompleta ? null : totalComissao;
  const repasseValorMostrado =
    repassePercentual !== null && baseRepasse !== null
      ? comissaoPorPercentual(repassePercentual, baseRepasse)
      : repasseValor;
  const repasseSugerido =
    baseRepasse !== null && vendedor?.geraRepasse && repasseValor === null && repassePercentual === null
      ? comissaoPorPercentual(vendedor.percentualPadrao, baseRepasse)
      : null;
  function definirRepassePercentual(p: number | null) {
    form.setValue("repassePercentual", p, { shouldDirty: true });
    form.setValue("repasseValor", p !== null && baseRepasse !== null ? comissaoPorPercentual(p, baseRepasse) : null, {
      shouldDirty: true,
    });
  }
  function definirRepasseValor(v: number | null) {
    form.setValue("repassePercentual", null, { shouldDirty: true });
    form.setValue("repasseValor", v, { shouldDirty: true });
  }
  return { baseRepasse, repasseValorMostrado, repasseSugerido, definirRepassePercentual, definirRepasseValor };
}
