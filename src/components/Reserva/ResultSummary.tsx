import { MoneyValue } from "@/components";
import { calcularReserva } from "@/dominio/calculoReserva";
import { cx } from "@/lib/cx";
import s from "./Reserva.module.css";
import { paraValoresReserva, type ReservaForm } from "./tipos";

function Linha({
  sinal,
  rotulo,
  valor,
  total,
}: {
  sinal: string;
  rotulo: string;
  valor: number | null;
  total?: boolean;
}) {
  return (
    <div className={cx(s.contaLinha, total && s.contaTotal)}>
      <span className={s.contaSinal} aria-hidden>
        {sinal}
      </span>
      <span>{rotulo}</span>
      <MoneyValue value={valor} emphasis={rotulo === "Receita da agência" ? "result" : undefined} />
    </div>
  );
}

/** Conta da reserva (ruling 2026-09-14): cobrado − reserva = RAV; comissão + RAV = total da comissão; + taxa = receita. */
export function ResultSummary({ value }: { value: ReservaForm }) {
  const r = calcularReserva(paraValoresReserva(value));
  const pct = r.percentualComissao === null ? "" : ` (${String(r.percentualComissao).replace(".", ",")} %)`;
  return (
    <div className={s.conta}>
      <Linha sinal="" rotulo="Total cobrado do cliente" valor={value.valorCliente} />
      <Linha sinal="−" rotulo="Total da reserva" valor={value.valorTotal} />
      <Linha sinal="=" rotulo="RAV" valor={r.ravCliente} total />
      <Linha sinal="+" rotulo={`Comissão${pct}`} valor={value.valorComissao} />
      {(value.ravOperadora ?? 0) > 0 && <Linha sinal="+" rotulo="RAV da operadora" valor={value.ravOperadora} />}
      <Linha sinal="=" rotulo="Total da comissão" valor={r.totalComissao} total />
      <Linha sinal="+" rotulo="Taxa de serviço" valor={value.taxaServico ?? 0} />
      <Linha sinal="=" rotulo="Receita da agência" valor={r.receitaPrevista} total />
    </div>
  );
}
