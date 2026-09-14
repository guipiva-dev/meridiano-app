import { type ChangeEvent, useState } from "react";
import {
  type FluxoPagamento,
  FORMAS_PAGAMENTO,
  type FormaPagamento,
  type RavClienteModo,
  ROTULO_FORMA,
} from "@/api/viagens";
import { Field, Input, MoneyInput, Select, useField } from "@/components";
import { Chip } from "@/components/display";
import { comissaoPorPercentual, parsearPercentual, percentualDaComissao } from "@/lib/comissao";
import { formatarDinheiro } from "@/lib/dinheiro";
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
      maxLength={2000}
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
  // L1: modo da comissão é só da tela (não persiste; reserva existente abre em R$).
  const [comissaoEmPct, setComissaoEmPct] = useState(false);
  const [pctTexto, setPctTexto] = useState("");
  const [erroPct, setErroPct] = useState<string | null>(null);

  function mudarPct(texto: string) {
    const p = parsearPercentual(texto);
    // Como o MoneyInput: entrada inválida não é aceita, então nunca chega ao formulário.
    if (p === "invalido") {
      setErroPct("Percentual inválido");
      return;
    }
    if (p === "negativo" || (p !== null && p > 100)) {
      setErroPct("Percentual deve ficar entre 0 e 100");
      return;
    }
    setErroPct(null);
    setPctTexto(texto);
    onChange({
      valorComissao: p === null ? null : comissaoPorPercentual(p, value.valorTotal),
      comissaoSugerida: false,
    });
  }
  function alternarModoComissao(emPct: boolean) {
    if (emPct === comissaoEmPct) return;
    setErroPct(null);
    if (emPct) {
      const p = percentualDaComissao(value.valorComissao, value.valorTotal);
      setPctTexto(p === null ? "" : String(p).replace(".", ","));
    }
    setComissaoEmPct(emPct);
  }
  function mudarTotal(v: number | null) {
    const p = comissaoEmPct ? parsearPercentual(pctTexto) : null;
    onChange(
      typeof p === "number"
        ? { valorTotal: v, valorComissao: comissaoPorPercentual(p, v), comissaoSugerida: false }
        : { valorTotal: v },
    );
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
          onChange={mudarTotal}
          onBlur={() => {
            // A03: venda ainda vazia, ou ainda sugerida (usuário não digitou à mão) — sugere/ressincroniza
            // venda = total. Nunca sobrescreve o que o usuário já digitou (vendaSugerida vira false ao digitar).
            if (!readOnly && value.valorTotal && (value.valorCliente === null || value.vendaSugerida)) {
              onChange({ valorCliente: value.valorTotal, vendaSugerida: true });
            }
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
      <Field
        label="Comissão"
        className="span-2"
        tooltip="O que o fornecedor paga à agência por esta reserva (ex.: 10% de R$ 10.000 = R$ 1.000)."
        helper={helperComissao}
        error={erroPct ?? erros.valorComissao}
      >
        {comissaoEmPct ? (
          <Input
            inputMode="decimal"
            value={pctTexto}
            readOnly={readOnly}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              mudarPct(e.target.value);
            }}
          />
        ) : (
          <MoneyInput
            value={value.valorComissao}
            readOnly={readOnly}
            onChange={(v) => {
              onChange({ valorComissao: v, comissaoSugerida: false });
            }}
          />
        )}
        <div className={s.chips}>
          <div role="group" aria-label="Unidade da comissão" className={s.chips}>
            <Chip
              selected={!comissaoEmPct}
              disabled={readOnly}
              aria-label="Comissão em R$"
              onClick={() => {
                alternarModoComissao(false);
              }}
            >
              R$
            </Chip>
            <Chip
              selected={comissaoEmPct}
              disabled={readOnly}
              aria-label="Comissão em %"
              onClick={() => {
                alternarModoComissao(true);
              }}
            >
              %
            </Chip>
          </div>
          {comissaoEmPct && value.valorComissao !== null && (
            <span aria-live="polite">= {formatarDinheiro(value.valorComissao)}</span>
          )}
        </div>
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
          calculated={value.vendaSugerida}
          onChange={(v) => {
            onChange({ valorCliente: v, vendaSugerida: false });
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
      <Field
        label="Fluxo"
        className="span-2"
        tooltip="Quem recebe o pagamento do cliente: a agência ou a operadora (ex.: pix à agência, que repassa)."
      >
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
          <Field
            label="Taxa de serviço"
            className="span-2"
            tooltip="Valor fixo cobrado do cliente sem custo por trás, como assessoria ou emissão de visto (ex.: R$ 150)."
            error={erros.taxaServico}
          >
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
