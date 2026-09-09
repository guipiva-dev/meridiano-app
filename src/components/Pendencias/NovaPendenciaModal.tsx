import { useQueryClient } from "@tanstack/react-query";
import { type SubmitEvent, useId, useState } from "react";
import { ConflictError, ValidationError } from "@/api/errors";
import { mensagemDeErro } from "@/api/http";
import { type PendenciaDto, type Prioridade, pendenciasApi } from "@/api/pendencias";
import type { PassageiroDto, VendedorDto } from "@/api/viagens";
import { Button, DateInput, Field, Input, Select } from "@/components";
import { Alert, Chip } from "@/components/display";
import { Modal } from "@/components/feedback";
import { hojeIso } from "@/lib/datas";
import { chaveDasPendencias } from "./chave";
import s from "./Pendencias.module.css";

interface NovaPendenciaModalProps {
  open: boolean;
  viagemId: string;
  passageiros: PassageiroDto[];
  vendedores: VendedorDto[];
  /** Quando presente, o modal edita essa pendência (sem "Para quem"). */
  pendencia?: PendenciaDto;
  onClose: () => void;
  onSalva: () => void;
}

const PRIORIDADES = [
  { value: "normal", label: "Normal" },
  { value: "urgente", label: "Urgente" },
];

export function NovaPendenciaModal({
  open,
  viagemId,
  passageiros,
  vendedores,
  pendencia,
  onClose,
  onSalva,
}: NovaPendenciaModalProps) {
  const qc = useQueryClient();
  const idForm = useId();
  // O chamador monta o modal só quando abre, então o estado inicial já é o "reset".
  const [titulo, setTitulo] = useState(pendencia?.titulo ?? "");
  const [dataPrevista, setDataPrevista] = useState(() => pendencia?.dataPrevista ?? hojeIso());
  const [responsavelId, setResponsavelId] = useState(pendencia?.responsavelId ?? "");
  const [prioridade, setPrioridade] = useState<Prioridade>(pendencia?.prioridade ?? "normal");
  const [clienteIds, setClienteIds] = useState<string[]>([]);
  const [erroTitulo, setErroTitulo] = useState<string>();
  const [erroBloco, setErroBloco] = useState<string>();
  const [salvando, setSalvando] = useState(false);

  function alternar(clienteId: string) {
    setClienteIds((atual) =>
      atual.includes(clienteId) ? atual.filter((c) => c !== clienteId) : [...atual, clienteId],
    );
  }

  async function enviar(e?: SubmitEvent<HTMLFormElement>) {
    e?.preventDefault();
    setErroBloco(undefined);
    if (!titulo.trim()) {
      setErroTitulo("Descreva o que precisa ser feito");
      return;
    }
    setErroTitulo(undefined);
    setSalvando(true);
    const base = {
      titulo: titulo.trim(),
      descricao: null,
      dataPrevista,
      responsavelId: responsavelId === "" ? null : responsavelId,
      prioridade,
    };
    try {
      if (pendencia) await pendenciasApi.atualizar(pendencia.id, { ...base, versao: pendencia.versao });
      else await pendenciasApi.criar(viagemId, { ...base, clienteIds });
      onSalva();
      onClose();
    } catch (erro) {
      if (erro instanceof ValidationError && erro.codigo === "titulo_obrigatorio") setErroTitulo(erro.detalhe);
      else setErroBloco(mensagemDeErro(erro));
      // 409: a `versao` em mãos morreu. Recarrega a lista atrás do modal para o próximo clique
      // usar a versão nova, senão o usuário fica preso em 409 para sempre.
      if (erro instanceof ConflictError) void qc.invalidateQueries({ queryKey: chaveDasPendencias(viagemId) });
      setSalvando(false);
    }
  }

  const quantidade = clienteIds.length === 0 ? 1 : clienteIds.length;
  const rotulo = pendencia ? "Salvar" : `Criar ${quantidade} ${quantidade === 1 ? "pendência" : "pendências"}`;

  return (
    <Modal
      open={open}
      title={pendencia ? "Editar pendência" : "Nova pendência"}
      onClose={onClose}
      footer={
        <>
          <Button variant="tertiary" onClick={onClose}>
            Voltar
          </Button>
          <Button variant="primary" type="submit" form={idForm} loading={salvando}>
            {rotulo}
          </Button>
        </>
      }
    >
      <form
        id={idForm}
        className={s.modalGrid}
        noValidate
        onSubmit={(e) => {
          void enviar(e);
        }}
      >
        {erroBloco && <Alert tone="danger">{erroBloco}</Alert>}
        <Field label="O que precisa ser feito" required error={erroTitulo}>
          <Input
            value={titulo}
            placeholder="Ex.: enviar voucher do hotel"
            onChange={(e) => {
              setTitulo(e.target.value);
            }}
          />
        </Field>
        <Field label="Data" required>
          <DateInput
            value={dataPrevista}
            onChange={(e) => {
              setDataPrevista(e.target.value);
            }}
          />
        </Field>
        <Field label="Responsável">
          <Select
            value={responsavelId}
            placeholder="Sem responsável"
            options={vendedores.map((v) => ({ value: v.id, label: v.nome }))}
            onChange={(e) => {
              setResponsavelId(e.target.value);
            }}
          />
        </Field>
        <Field label="Prioridade">
          <Select
            value={prioridade}
            options={PRIORIDADES}
            onChange={(e) => {
              setPrioridade(e.target.value as Prioridade);
            }}
          />
        </Field>
        {!pendencia && (
          <Field label="Para quem" helper="Uma pendência por passageiro selecionado; sem seleção, fica na viagem.">
            <div className={s.chips}>
              {passageiros.map((p) => (
                <Chip
                  key={p.clienteId}
                  selected={clienteIds.includes(p.clienteId)}
                  onClick={() => {
                    alternar(p.clienteId);
                  }}
                >
                  {p.nome}
                </Chip>
              ))}
              {passageiros.length > 1 && (
                <Button
                  variant="tertiary"
                  size="sm"
                  onClick={() => {
                    setClienteIds(clienteIds.length === passageiros.length ? [] : passageiros.map((p) => p.clienteId));
                  }}
                >
                  Todos
                </Button>
              )}
            </div>
          </Field>
        )}
      </form>
    </Modal>
  );
}
