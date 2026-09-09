import { useQueryClient } from "@tanstack/react-query";
import { type SubmitEvent, useId, useState } from "react";
import { ConflictError, ValidationError } from "@/api/errors";
import { mensagemDeErro } from "@/api/http";
import { type PendenciaDto, pendenciasApi } from "@/api/pendencias";
import { Button, DateInput, Field } from "@/components";
import { Alert } from "@/components/display";
import { Modal } from "@/components/feedback";
import { formatarData } from "@/lib/datas";
import { chaveDasPendencias } from "./chave";

interface AdiarModalProps {
  open: boolean;
  pendencia: PendenciaDto;
  onClose: () => void;
  onAdiada: () => void;
}

export function AdiarModal({ open, pendencia, onClose, onAdiada }: AdiarModalProps) {
  const qc = useQueryClient();
  const idForm = useId();
  const [novaData, setNovaData] = useState("");
  const [erroData, setErroData] = useState<string>();
  const [erroBloco, setErroBloco] = useState<string>();
  const [salvando, setSalvando] = useState(false);

  async function enviar(e?: SubmitEvent<HTMLFormElement>) {
    e?.preventDefault();
    setErroBloco(undefined);
    if (novaData <= pendencia.dataPrevista) {
      setErroData(`A nova data precisa ser depois de ${formatarData(pendencia.dataPrevista)}`);
      return;
    }
    setErroData(undefined);
    setSalvando(true);
    try {
      await pendenciasApi.adiar(pendencia.id, novaData, pendencia.versao);
      onAdiada();
      onClose();
    } catch (erro) {
      if (erro instanceof ValidationError && erro.codigo === "data_invalida") setErroData(erro.detalhe);
      else setErroBloco(mensagemDeErro(erro));
      // 409: a `versao` em mãos morreu. Recarrega a lista atrás do modal para o próximo clique
      // usar a versão nova, senão o usuário fica preso em 409 para sempre.
      if (erro instanceof ConflictError && pendencia.viagemId) {
        void qc.invalidateQueries({ queryKey: chaveDasPendencias(pendencia.viagemId) });
      }
      setSalvando(false);
    }
  }

  return (
    <Modal
      open={open}
      title={`Adiar "${pendencia.titulo}"`}
      onClose={onClose}
      footer={
        <>
          <Button variant="tertiary" onClick={onClose}>
            Voltar
          </Button>
          <Button variant="primary" type="submit" form={idForm} loading={salvando}>
            Adiar
          </Button>
        </>
      }
    >
      <form
        id={idForm}
        noValidate
        onSubmit={(e) => {
          void enviar(e);
        }}
      >
        {erroBloco && <Alert tone="danger">{erroBloco}</Alert>}
        <Field
          label="Nova data"
          required
          error={erroData}
          helper={`Hoje prevista para ${formatarData(pendencia.dataPrevista)}.`}
        >
          <DateInput
            value={novaData}
            min={pendencia.dataPrevista}
            onChange={(e) => {
              setNovaData(e.target.value);
            }}
          />
        </Field>
      </form>
    </Modal>
  );
}
