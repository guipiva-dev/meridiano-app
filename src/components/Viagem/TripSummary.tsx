import { CircleHelp } from "lucide-react";
import { Button, MoneyValue } from "@/components";
import { Tooltip } from "@/components/display";
import { arredondar2, calcularReserva } from "@/dominio/calculoReserva";
import s from "./Viagem.module.css";

export interface ReservaValores {
  valorTotal: number | null;
  valorComissao: number | null;
  ravOperadora: number | null;
  valorCliente: number | null;
  taxaServico: number | null;
  ravClienteModo: "retido_agencia" | "via_operadora";
}

export function somarReservas(reservas: ReservaValores[]): {
  vendaTotal: number;
  custo: number;
  receitaPrevista: number;
} {
  let vendaTotal = 0;
  let custo = 0;
  let receitaPrevista = 0;
  for (const r of reservas) {
    const valorTotal = r.valorTotal ?? 0;
    const valorCliente = r.valorCliente ?? 0;
    vendaTotal += valorCliente;
    custo += valorTotal;
    receitaPrevista += calcularReserva({
      valorTotal,
      valorComissao: r.valorComissao ?? 0,
      ravOperadora: r.ravOperadora ?? 0,
      valorCliente,
      taxaServico: r.taxaServico ?? 0,
      viaOperadora: r.ravClienteModo === "via_operadora",
    }).receitaPrevista;
  }
  return {
    vendaTotal: arredondar2(vendaTotal),
    custo: arredondar2(custo),
    receitaPrevista: arredondar2(receitaPrevista),
  };
}

interface TripSummaryProps {
  reservas: ReservaValores[];
  repasseValor: number | null;
  despesas: number;
  onAdicionarReserva: () => void;
}

export function TripSummary({ reservas, repasseValor, despesas, onAdicionarReserva }: TripSummaryProps) {
  const { vendaTotal, custo, receitaPrevista } = somarReservas(reservas);
  const resultado = arredondar2(receitaPrevista - (repasseValor ?? 0) - despesas);
  return (
    <div className={s.summaryStrip}>
      <div className={s.item}>
        <small>Venda total</small>
        <MoneyValue value={vendaTotal} />
      </div>
      <span className={s.sep} aria-hidden />
      <div className={s.item}>
        <small>Custo dos fornecedores</small>
        <MoneyValue value={custo} />
      </div>
      <span className={s.sep} aria-hidden />
      <div className={s.item}>
        <small>Comissão da vendedora</small>
        <MoneyValue value={repasseValor} />
      </div>
      <span className={s.sep} aria-hidden />
      <div className={s.item}>
        <small>Despesas da viagem</small>
        <MoneyValue value={despesas} />
      </div>
      <span className={s.sep} aria-hidden />
      <div className={s.item}>
        <small>
          Resultado da viagem{" "}
          <Tooltip text="Receita das reservas − comissão da vendedora − despesas vinculadas">
            <CircleHelp size={16} aria-hidden />
          </Tooltip>
        </small>
        <MoneyValue value={resultado} emphasis="result" />
      </div>
      <Button variant="business" className={s.addReserva} onClick={onAdicionarReserva}>
        + Adicionar reserva
      </Button>
    </div>
  );
}
