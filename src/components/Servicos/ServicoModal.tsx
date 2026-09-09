import { useQueryClient } from "@tanstack/react-query";
import { type SubmitEvent, useId, useState } from "react";
import { ConflictError, ValidationError } from "@/api/errors";
import { mensagemDeErro } from "@/api/http";
import { chavesServicos, type ServicoDto, servicosApi } from "@/api/servicos";
import { ROTULO_SERVICO, TIPOS_SERVICO, type TipoServico } from "@/api/viagens";
import { Button, Field, Input, Select, useField } from "@/components";
import { Alert } from "@/components/display";
import { Modal } from "@/components/feedback";
import s from "./Servicos.module.css";

interface ServicoModalProps {
  open: boolean;
  reservaId: string;
  servico?: ServicoDto;
  onClose: () => void;
  onSalvo: () => void;
}

const TIPOS = TIPOS_SERVICO.map((t) => ({ value: t, label: ROTULO_SERVICO[t] }));

/** `textarea` não é `Input`; pega o id/aria do `Field` pelo contexto (mesmo padrão de `FinancialFields`). */
function Observacoes({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const f = useField();
  return (
    <textarea
      id={f?.id}
      aria-describedby={f?.describedBy}
      rows={3}
      className={s.textarea}
      value={value}
      onChange={(e) => {
        onChange(e.target.value);
      }}
    />
  );
}

/** `datetime-local` fala yyyy-MM-ddTHH:mm; a API devolve o timestamp sem fuso com segundos. */
const paraInput = (iso: string | null | undefined) => (iso ? iso.slice(0, 16) : "");
const paraApi = (valor: string) => (valor === "" ? null : valor);

export function ServicoModal({ open, reservaId, servico, onClose, onSalvo }: ServicoModalProps) {
  const qc = useQueryClient();
  const idForm = useId();
  // O chamador monta o modal só quando abre, então o estado inicial já é o "reset".
  const [tipo, setTipo] = useState<TipoServico>(servico?.tipo ?? "aereo");
  const [titulo, setTitulo] = useState(servico?.titulo ?? "");
  const [dataInicio, setDataInicio] = useState(() => paraInput(servico?.dataInicio));
  const [dataFim, setDataFim] = useState(() => paraInput(servico?.dataFim));
  const [localidade, setLocalidade] = useState(servico?.localidade ?? "");
  const [localizadorCia, setLocalizadorCia] = useState(servico?.localizadorCia ?? "");
  const [numeroBilhete, setNumeroBilhete] = useState(servico?.numeroBilhete ?? "");
  const [observacoes, setObservacoes] = useState(servico?.observacoes ?? "");
  const [erros, setErros] = useState<{ tipo?: string; titulo?: string; dataFim?: string }>({});
  const [erroBloco, setErroBloco] = useState<string>();
  const [salvando, setSalvando] = useState(false);

  async function enviar(e?: SubmitEvent<HTMLFormElement>) {
    e?.preventDefault();
    setErroBloco(undefined);
    if (!titulo.trim()) {
      setErros({ titulo: "Informe o título do serviço" });
      return;
    }
    setErros({});
    setSalvando(true);
    const req = {
      tipo,
      titulo: titulo.trim(),
      dataInicio: paraApi(dataInicio),
      dataFim: paraApi(dataFim),
      localidade: localidade.trim() || null,
      localizadorCia: localizadorCia.trim() || null,
      numeroBilhete: numeroBilhete.trim() || null,
      observacoes: observacoes.trim() || null,
      ordem: servico?.ordem ?? 0,
    };
    try {
      if (servico) await servicosApi.atualizar(servico.id, { ...req, versao: servico.versao });
      else await servicosApi.criar(reservaId, req);
      onSalvo();
      onClose();
    } catch (erro) {
      const campo =
        erro instanceof ValidationError
          ? { servico_tipo_invalido: "tipo", titulo_obrigatorio: "titulo", datas_incoerentes: "dataFim" }[erro.codigo]
          : undefined;
      if (campo && erro instanceof ValidationError) setErros({ [campo]: erro.detalhe });
      else setErroBloco(mensagemDeErro(erro));
      // 409: a `versao` em mãos morreu. Recarrega a lista atrás do modal para o próximo clique
      // usar a versão nova, senão o usuário fica preso em 409 para sempre.
      if (erro instanceof ConflictError) {
        void qc.invalidateQueries({ queryKey: chavesServicos.daReserva(reservaId) });
      }
      setSalvando(false);
    }
  }

  return (
    <Modal
      open={open}
      title={servico ? "Editar serviço" : "Novo serviço"}
      onClose={onClose}
      footer={
        <>
          <Button variant="tertiary" onClick={onClose}>
            Voltar
          </Button>
          <Button variant="primary" type="submit" form={idForm} loading={salvando}>
            {servico ? "Salvar" : "Adicionar"}
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
        <Field label="Tipo" error={erros.tipo}>
          <Select
            value={tipo}
            options={TIPOS}
            onChange={(e) => {
              setTipo(e.target.value as TipoServico);
            }}
          />
        </Field>
        <Field label="Título" required error={erros.titulo}>
          <Input
            value={titulo}
            placeholder="Ex.: GRU → LIS · TAP 1234"
            onChange={(e) => {
              setTitulo(e.target.value);
            }}
          />
        </Field>
        <div className={s.dupla}>
          <Field label="Início">
            <Input
              type="datetime-local"
              value={dataInicio}
              onChange={(e) => {
                setDataInicio(e.target.value);
              }}
            />
          </Field>
          <Field label="Fim" error={erros.dataFim}>
            <Input
              type="datetime-local"
              value={dataFim}
              onChange={(e) => {
                setDataFim(e.target.value);
              }}
            />
          </Field>
        </div>
        <Field label="Localidade">
          <Input
            value={localidade}
            onChange={(e) => {
              setLocalidade(e.target.value);
            }}
          />
        </Field>
        <div className={s.dupla}>
          <Field label="Localizador da cia">
            <Input
              className={s.mono}
              value={localizadorCia}
              onChange={(e) => {
                setLocalizadorCia(e.target.value);
              }}
            />
          </Field>
          <Field label="Nº do bilhete">
            <Input
              className={s.mono}
              value={numeroBilhete}
              onChange={(e) => {
                setNumeroBilhete(e.target.value);
              }}
            />
          </Field>
        </div>
        <Field label="Observações">
          <Observacoes value={observacoes} onChange={setObservacoes} />
        </Field>
      </form>
    </Modal>
  );
}
