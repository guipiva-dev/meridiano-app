import type { UseFormReturn } from "react-hook-form";
import type { ListaGrupoDto } from "@/api/grupos";
import { DateInput, Field, Input, Select, Textarea } from "@/components";
import { TagsInput } from "@/components/cadastros";
import { Section } from "@/components/shell";
import { cpfValido, formatarCpf, telefoneValido, UFS } from "@/lib/documentos";
import s from "./Clientes.module.css";
import type { FormPessoa } from "./usePessoa";

const NOVO_GRUPO = "__novo";
const OPCOES_UF = UFS.map((uf) => ({ value: uf, label: uf }));

interface DadosPessoaFormProps {
  form: UseFormReturn<FormPessoa>;
  grupos: ListaGrupoDto[];
  erros: Record<string, string>;
  /** Vem só da permissão `cliente.ver_documento` (`/auth/me`) — independe de o DTO trazer `cpf`. */
  verDocumento: boolean;
  onNovoGrupo: () => void;
}

export function DadosPessoaForm({ form, grupos, erros, verDocumento, onNovoGrupo }: DadosPessoaFormProps) {
  const grupoId = form.watch("grupoId");
  // Antes do primeiro `reset` (carga do DTO ou "nova pessoa") o react-hook-form ainda não tem valores,
  // apesar do tipo prometer que tem.
  const tags = (form.watch("tags") as string[] | undefined) ?? [];
  const cpf = form.watch("cpf");
  const erroCpf = erros.cpf ?? (cpf && !cpfValido(cpf) ? "CPF inválido" : undefined);
  const whatsapp = form.watch("whatsapp");
  const telefone = form.watch("telefone");
  const observacoes = (form.watch("observacoes") as string | undefined) ?? "";
  const erroWhatsapp = erros.whatsapp ?? (whatsapp && !telefoneValido(whatsapp) ? "Telefone inválido" : undefined);
  const erroTelefone = erros.telefone ?? (telefone && !telefoneValido(telefone) ? "Telefone inválido" : undefined);

  const opcoesGrupo = [
    ...grupos.map((g) => ({ value: g.id, label: g.nome })),
    { value: NOVO_GRUPO, label: "+ Criar grupo…" },
  ];

  return (
    <>
      <Section title="Dados pessoais">
        <div className="grid-form">
          <Field label="Nome completo" required className="span-6" error={erros.nome}>
            <Input autoComplete="off" maxLength={150} {...form.register("nome")} />
          </Field>
          {verDocumento && (
            <Field label="CPF" required className="span-3" error={erroCpf}>
              <Input
                className={s.mono}
                autoComplete="off"
                {...form.register("cpf", {
                  onBlur: (e: { target: { value: string } }) => {
                    form.setValue("cpf", formatarCpf(e.target.value));
                  },
                })}
              />
            </Field>
          )}
          <Field label="Nascimento" required className="span-3" error={erros.dataNascimento}>
            <DateInput {...form.register("dataNascimento")} />
          </Field>
          <Field label="Grupo / empresa" className="span-3" error={erros.grupoId}>
            <Select
              placeholder="— nenhum —"
              options={opcoesGrupo}
              value={grupoId}
              onChange={(e) => {
                if (e.target.value === NOVO_GRUPO) {
                  onNovoGrupo();
                  return;
                }
                form.setValue("grupoId", e.target.value, { shouldDirty: true });
              }}
            />
          </Field>
          <Field label="Cidade" className="span-3">
            <Input autoComplete="off" maxLength={80} {...form.register("cidade")} />
          </Field>
          <Field label="UF" className="span-3" error={erros.uf}>
            <Select placeholder="—" options={OPCOES_UF} {...form.register("uf")} />
          </Field>
          <Field label="Origem" className="span-3">
            <Input autoComplete="off" placeholder="Indicação, Instagram…" {...form.register("origemLead")} />
          </Field>
        </div>
      </Section>

      <Section title="Contato">
        <div className="grid-form">
          <Field label="WhatsApp" className="span-3" error={erroWhatsapp}>
            <Input autoComplete="off" {...form.register("whatsapp")} />
          </Field>
          <Field label="Telefone" className="span-3" error={erroTelefone}>
            <Input autoComplete="off" {...form.register("telefone")} />
          </Field>
          <Field label="E-mail" className="span-6" error={erros.email}>
            <Input type="email" autoComplete="off" {...form.register("email")} />
          </Field>
          <Field label="Contato de emergência" className="span-6">
            <Input autoComplete="off" placeholder="Nome e telefone" {...form.register("contatoEmergencia")} />
          </Field>
          <Field label="Tags" className="span-12">
            <TagsInput
              value={tags}
              onChange={(novas) => {
                form.setValue("tags", novas, { shouldDirty: true });
              }}
            />
          </Field>
        </div>
      </Section>

      <Section title="Observações e preferências">
        <Textarea rows={4} aria-label="Observações" maxLength={2000} {...form.register("observacoes")} />
        <span className={s.secondary}>{observacoes.length}/2000</span>
      </Section>
    </>
  );
}
