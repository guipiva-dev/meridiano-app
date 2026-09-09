import { forwardRef, type TextareaHTMLAttributes } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { ClienteBuscaDto, VendedorDto } from "@/api/viagens";
import { DateInput, Field, Input, MoneyInput, Select, useField } from "@/components";
import { PassageirosField } from "@/components/viagem";
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
  erros: Record<string, string>;
  buscarClientes: (q: string) => Promise<ClienteBuscaDto[]>;
  onNovaPessoa: () => void;
}

export function DadosViagemSection({
  form,
  vendedores,
  mostrarRepasse,
  repasseSugerido,
  erros,
  buscarClientes,
  onNovaPessoa,
}: DadosViagemSectionProps) {
  const passageiros = form.watch("passageiros");
  const repasseValor = form.watch("repasseValor");
  return (
    <div className="grid-form">
      <div className="span-6">
        <PassageirosField
          value={passageiros}
          onChange={(v) => {
            form.setValue("passageiros", v, { shouldDirty: true });
          }}
          buscar={buscarClientes}
          onNovaPessoa={onNovaPessoa}
          erro={erros.passageiros}
        />
      </div>
      <Field label="Destino" required className="span-3" error={erros.destino}>
        <Input autoComplete="off" {...form.register("destino")} />
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
        <Field
          label="Comissão da vendedora"
          className="span-2"
          tooltip="Valor definido pelo dono. Só aparece para vendedor que gera repasse."
          helper={repasseSugerido === null ? undefined : `Sugerido: ${formatarDinheiro(repasseSugerido)}`}
          error={erros.repasseValor}
        >
          <MoneyInput
            value={repasseValor}
            onChange={(v) => {
              form.setValue("repasseValor", v, { shouldDirty: true });
            }}
          />
        </Field>
      )}
      <details className={s.mais}>
        <summary>+ mais campos (ocasião, observações)</summary>
        <div className="grid-form">
          <Field label="Ocasião" className="span-4">
            <Input autoComplete="off" placeholder="Lua de mel, aniversário…" {...form.register("ocasiao")} />
          </Field>
          <Field label="Observações" className="span-8">
            <Observacoes {...form.register("observacoes")} />
          </Field>
        </div>
      </details>
    </div>
  );
}
