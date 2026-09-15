import { ChevronDown, CircleAlert, Trash2 } from "lucide-react";
import { useId } from "react";
import { type FornecedorDto, ROTULO_SERVICO } from "@/api/viagens";
import { Button, MoneyValue } from "@/components";
import { Alert, StatusBadge } from "@/components/display";
import { calcularReserva } from "@/dominio/calculoReserva";
import { cx } from "@/lib/cx";
import { BookingFields } from "./BookingFields";
import { FinancialFields } from "./FinancialFields";
import s from "./Reserva.module.css";
import { paraValoresReserva, type ReservaForm } from "./tipos";

interface ReservationCardProps {
  indice: number;
  value: ReservaForm;
  onChange: (patch: Partial<ReservaForm>) => void;
  onToggle: () => void;
  onRemover: () => void;
  fornecedores: FornecedorDto[];
  onNovoFornecedor: () => void;
  erros: Partial<Record<keyof ReservaForm, string>>;
  avisoDuplicada: string | null;
}

export function ReservationCard({
  indice,
  value,
  onChange,
  onToggle,
  onRemover,
  fornecedores,
  onNovoFornecedor,
  erros,
  avisoDuplicada,
}: ReservationCardProps) {
  const idTitulo = useId();
  const fornecedor = fornecedores.find((f) => f.id === value.fornecedorId);
  const resultado = calcularReserva(paraValoresReserva(value));
  const servicos = value.tiposServico.map((t) => ROTULO_SERVICO[t]).join(" · ");
  const percentualSugerido = fornecedor?.percentualComissaoPadrao ?? null;
  const cancelada = value.status === "cancelada";
  const comErro = !value.aberta && Object.values(erros).some(Boolean);

  // <section> com nome acessível (aria-labelledby) já tem role="region" implícito (WAI-ARIA);
  // explícito seria redundante para o jsx-a11y, mas getByRole("region", { name }) funciona igual.
  return (
    <section aria-labelledby={idTitulo} className={cx(s.reserva, value.aberta && s.aberta, cancelada && s.cancelada)}>
      <header className={s.linha}>
        <span id={idTitulo} className={s.num} aria-label={`Reserva ${indice}`}>
          {indice}
        </span>
        <span className={s.quem}>
          <span className={s.fornecedor}>{fornecedor?.nome ?? "Sem fornecedor"}</span>
          {servicos && <span className={s.servicos}>{servicos}</span>}
        </span>
        <span className={s.localizador}>{value.localizador}</span>
        <span className={s.status}>
          <StatusBadge entidade="reserva" valor={value.status} />
          {comErro && (
            <span className={s.marcaErro}>
              <CircleAlert size={16} aria-hidden /> com erro
            </span>
          )}
        </span>
        <span className={s.valores}>
          <span className={s.valor}>
            <MoneyValue value={value.valorCliente} />
          </span>
          <small className={s.receita}>
            receita <MoneyValue value={resultado.receitaPrevista} />
          </small>
        </span>
        <Button
          variant="tertiary"
          size="sm"
          aria-expanded={value.aberta}
          icon={<ChevronDown size={16} className={cx(s.chevron, value.aberta && s.chevronAberto)} />}
          onClick={onToggle}
        >
          {value.aberta ? "Recolher" : "Expandir"}
        </Button>
      </header>
      {value.aberta && (
        <div className={s.corpo}>
          {avisoDuplicada && <Alert tone="warning">{avisoDuplicada}</Alert>}
          <BookingFields
            value={value}
            onChange={onChange}
            fornecedores={fornecedores}
            onNovoFornecedor={onNovoFornecedor}
            erros={erros}
            readOnly={cancelada}
          />
          <FinancialFields
            value={value}
            onChange={onChange}
            percentualSugerido={percentualSugerido}
            erros={erros}
            readOnly={cancelada}
          />
          <div className={s.rodapeReserva}>
            <p className={s.resultado} aria-label="Resultado desta reserva">
              <span>
                RAV <MoneyValue value={resultado.ravCliente} />
              </span>
              <span aria-hidden>·</span>
              <span>
                Total da comissão <MoneyValue value={resultado.totalComissao} />
              </span>
              <span aria-hidden>·</span>
              <span className={s.resultadoReceita}>
                Receita da agência <MoneyValue value={resultado.receitaPrevista} emphasis="result" />
              </span>
            </p>
            {!cancelada && (
              <Button
                variant="tertiary"
                size="sm"
                className={s.remover}
                icon={<Trash2 size={16} />}
                onClick={onRemover}
              >
                Remover reserva
              </Button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
