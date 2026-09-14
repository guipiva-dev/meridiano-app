import { forwardRef, type TextareaHTMLAttributes, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { ClienteBuscaDto, VendedorDto } from "@/api/viagens";
import { DateInput, Field, Input, MoneyInput, Select, useField } from "@/components";
import { PassageirosField } from "@/components/viagem";
import { parsearPercentual } from "@/lib/comissao";
import { formatarDinheiro } from "@/lib/dinheiro";
import s from "./NovaViagem.module.css";
import type { ViagemForm } from "./useNovaViagem";

const TIPOS = [
  { value: "internacional", label: "Internacional" },
  { value: "nacional", label: "Nacional" },
];

/** Sem componente Textarea compartilhado: copia o padrão do Input (useField p/ id/aria) localmente. */
const Observacoes = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Observacoes(props, ref) {
    const f = useField();
    return (
      <textarea
        ref={ref}
        id={f?.id}
        aria-describedby={f?.describedBy}
        aria-invalid={f?.invalid ? true : undefined}
        rows={3}
        className={s.textarea}
        {...props}
      />
    );
  },
);

interface DadosViagemSectionProps {
  form: UseFormReturn<ViagemForm>;
  vendedores: VendedorDto[];
  /** Só perfis com `viagem.ver_resultado` e vendedor que gera repasse veem a comissão. */
  mostrarRepasse: boolean;
  repasseSugerido: number | null;
  repasseValorMostrado: number | null;
  onRepassePercentual: (p: number | null) => void;
  onRepasseValor: (v: number | null) => void;
  erros: Record<string, string>;
  buscarClientes: (q: string) => Promise<ClienteBuscaDto[]>;
  onNovaPessoa: () => void;
}

export function DadosViagemSection({
  form,
  vendedores,
  mostrarRepasse,
  repasseSugerido,
  repasseValorMostrado,
  onRepassePercentual,
  onRepasseValor,
  erros,
  buscarClientes,
  onNovaPessoa,
}: DadosViagemSectionProps) {
  const passageiros = form.watch("passageiros");
  const repassePercentual = form.watch("repassePercentual");
  // Texto cru do % enquanto se digita ("10," não vira "10"); valor externo reassume ao sair do controle local.
  const [pctRepasseTexto, setPctRepasseTexto] = useState<string | null>(null);
  function mudarPctRepasse(texto: string) {
    const p = parsearPercentual(texto);
    if (p === "invalido" || p === "negativo" || (p !== null && p > 100)) return;
    setPctRepasseTexto(texto);
    onRepassePercentual(p);
  }
  const observacoes = (form.watch("observacoes") as string | undefined) ?? "";
  return (
    <div className="grid-form">
      <div className="span-12">
        <PassageirosField
          value={passageiros}
          onChange={(v) => {
            form.setValue("passageiros", v, { shouldDirty: true });
          }}
          buscar={buscarClientes}
          onNovaPessoa={onNovaPessoa}
          erro={erros.passageiros}
          dataIda={form.watch("dataIda")}
        />
      </div>
      <Field label="Destino" required className="span-3" error={erros.destino}>
        <Input autoComplete="off" maxLength={120} {...form.register("destino")} />
      </Field>
      <Field label="Tipo" className="span-3">
        <Select options={TIPOS} {...form.register("tipo")} />
      </Field>
      <Field label="Ida" className="span-2" error={erros.dataIda}>
        <DateInput {...form.register("dataIda")} />
      </Field>
      <Field label="Volta" className="span-2" error={erros.dataVolta}>
        <DateInput {...form.register("dataVolta")} />
      </Field>
      <Field label="Vendedor" required className="span-3" error={erros.vendedorId}>
        <Select
          options={vendedores.map((v) => ({ value: v.id, label: v.nome }))}
          placeholder="Selecione"
          {...form.register("vendedorId")}
        />
      </Field>
      {mostrarRepasse && (
        <>
          <Field
            label="Comissão do vendedor (%)"
            className="span-2"
            tooltip="Percentual sobre a comissão total da viagem (comissão + RAV, sem taxa de serviço). O valor acompanha as reservas até o repasse ser pago."
            helper={repasseSugerido === null ? undefined : `Sugerido: ${formatarDinheiro(repasseSugerido)}`}
            error={erros.repassePercentual}
          >
            <Input
              inputMode="decimal"
              autoComplete="off"
              value={pctRepasseTexto ?? (repassePercentual === null ? "" : String(repassePercentual).replace(".", ","))}
              onChange={(e) => {
                mudarPctRepasse(e.target.value);
              }}
            />
          </Field>
          <Field label="Comissão do vendedor (R$)" className="span-2" error={erros.repasseValor}>
            <MoneyInput
              value={repasseValorMostrado}
              onChange={(v) => {
                setPctRepasseTexto(null);
                onRepasseValor(v);
              }}
            />
          </Field>
        </>
      )}
      <details className={s.mais}>
        <summary>+ mais campos (ocasião, observações)</summary>
        <div className="grid-form">
          <Field label="Ocasião" className="span-4">
            <Input autoComplete="off" placeholder="Lua de mel, aniversário…" {...form.register("ocasiao")} />
          </Field>
          <Field label="Observações" helper={`${observacoes.length}/2000`} className="span-8">
            <Observacoes maxLength={2000} {...form.register("observacoes")} />
          </Field>
        </div>
      </details>
    </div>
  );
}
