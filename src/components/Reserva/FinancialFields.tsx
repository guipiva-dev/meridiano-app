import type { ChangeEvent } from "react";
import {
  type FluxoPagamento,
  FORMAS_PAGAMENTO,
  type FormaPagamento,
  type RavClienteModo,
  ROTULO_FORMA,
} from "@/api/viagens";
import { Field, MoneyInput, Select, useField } from "@/components";
import { Chip } from "@/components/display";
import s from "./Reserva.module.css";
import type { ReservaForm } from "./tipos";

const OPCOES_RAV_CLIENTE: { value: RavClienteModo; label: string }[] = [
  { value: "via_operadora", label: "Via operadora" },
  { value: "retido_agencia", label: "Retido pela agência" },
];
const OPCOES_FLUXO: { value: FluxoPagamento; label: string }[] = [
  { value: "cliente_paga_operadora", label: "Cliente paga a operadora" },
  { value: "cliente_paga_agencia", label: "Cliente paga a agência" },
];

interface FinancialFieldsProps {
  value: ReservaForm;
  onChange: (patch: Partial<ReservaForm>) => void;
  percentualSugerido: number | null;
  erros: Partial<Record<keyof ReservaForm, string>>;
  /** Reserva cancelada: todos os campos viram leitura/seleção travada. */
  readOnly?: boolean;
}

/** Sem componente Textarea compartilhado: copia o padrão do Input (useField p/ id/aria) localmente. */
function Observacoes({
  value,
  onChange,
  readOnly,
}: {
  value: string;
  onChange: (v: string) => void;
  readOnly: boolean;
}) {
  const f = useField();
  return (
    <textarea
      id={f?.id}
      aria-describedby={f?.describedBy}
      aria-invalid={f?.invalid ? true : undefined}
      rows={4}
      className={s.control}
      value={value}
      readOnly={readOnly}
      onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
        onChange(e.target.value);
      }}
    />
  );
}

export function FinancialFields({
  value,
  onChange,
  percentualSugerido,
  erros,
  readOnly = false,
}: FinancialFieldsProps) {
  function alternarForma(forma: FormaPagamento) {
    const atual = value.formasPagamento;
    onChange({ formasPagamento: atual.includes(forma) ? atual.filter((f) => f !== forma) : [...atual, forma] });
  }
  const helperComissao =
    value.comissaoSugerida && percentualSugerido !== null ? `Sugerido: ${percentualSugerido} %` : undefined;

  return (
    <div className="grid-form">
      <Field
        label="Total da reserva"
        className="span-2"
        tooltip="O que o fornecedor cobrou, taxas incluídas"
        error={erros.valorTotal}
      >
        <MoneyInput
          value={value.valorTotal}
          readOnly={readOnly}
          onChange={(v) => {
            onChange({ valorTotal: v });
          }}
        />
      </Field>
      <Field label="Do total, quanto é taxa" className="span-2" error={erros.valorTaxas}>
        <MoneyInput
          value={value.valorTaxas}
          readOnly={readOnly}
          onChange={(v) => {
            onChange({ valorTaxas: v });
          }}
        />
      </Field>
      <Field label="Comissão" className="span-2" helper={helperComissao} error={erros.valorComissao}>
        <MoneyInput
          value={value.valorComissao}
          readOnly={readOnly}
          onChange={(v) => {
            onChange({ valorComissao: v, comissaoSugerida: false });
          }}
        />
      </Field>
      <Field label="RAV da operadora" className="span-2" error={erros.ravOperadora}>
        <MoneyInput
          value={value.ravOperadora}
          readOnly={readOnly}
          onChange={(v) => {
            onChange({ ravOperadora: v });
          }}
        />
      </Field>
      <Field
        label="Venda ao cliente"
        className="span-2"
        tooltip="Quanto o cliente contratou pagar. O que entrou no caixa fica em Movimentos."
        error={erros.valorCliente}
      >
        <MoneyInput
          value={value.valorCliente}
          readOnly={readOnly}
          onChange={(v) => {
            onChange({ valorCliente: v });
          }}
        />
      </Field>
      <Field
        label="RAV do cliente vem"
        className="span-2"
        tooltip="Via operadora: ela devolve junto com a comissão. Retido: o cliente pagou a diferença à agência."
      >
        <Select
          options={OPCOES_RAV_CLIENTE}
          value={value.ravClienteModo}
          disabled={readOnly}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => {
            onChange({ ravClienteModo: e.target.value as RavClienteModo });
          }}
        />
      </Field>
      <Field label="Formas de pagamento" className="span-2">
        <div role="group" aria-label="Formas de pagamento" className={s.chips}>
          {FORMAS_PAGAMENTO.map((forma) => (
            <Chip
              key={forma}
              selected={value.formasPagamento.includes(forma)}
              disabled={readOnly}
              onClick={() => {
                alternarForma(forma);
              }}
            >
              {ROTULO_FORMA[forma]}
            </Chip>
          ))}
        </div>
      </Field>
      <Field label="Fluxo" className="span-2">
        <Select
          options={OPCOES_FLUXO}
          value={value.fluxoPagamento}
          disabled={readOnly}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => {
            onChange({ fluxoPagamento: e.target.value as FluxoPagamento });
          }}
        />
      </Field>
      <details className={s.mais}>
        <summary>+ mais campos</summary>
        <div className="grid-form">
          <Field label="Taxa de serviço" className="span-2" error={erros.taxaServico}>
            <MoneyInput
              value={value.taxaServico}
              readOnly={readOnly}
              onChange={(v) => {
                onChange({ taxaServico: v });
              }}
            />
          </Field>
          <Field label="Observações" className="span-12">
            <Observacoes
              value={value.observacoes}
              readOnly={readOnly}
              onChange={(v) => {
                onChange({ observacoes: v });
              }}
            />
          </Field>
        </div>
      </details>
    </div>
  );
}
