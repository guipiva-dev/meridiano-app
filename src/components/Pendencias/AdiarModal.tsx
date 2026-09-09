import { useState } from "react";
import { ValidationError } from "@/api/errors";
import { mensagemDeErro } from "@/api/http";
import { type PendenciaDto, pendenciasApi } from "@/api/pendencias";
import { Button, DateInput, Field } from "@/components";
import { Alert } from "@/components/display";
import { Modal } from "@/components/feedback";
import { formatarData } from "@/lib/datas";

interface AdiarModalProps {
  open: boolean;
  pendencia: PendenciaDto;
  onClose: () => void;
  onAdiada: () => void;
}

export function AdiarModal({ open, pendencia, onClose, onAdiada }: AdiarModalProps) {
  const [novaData, setNovaData] = useState("");
  const [erroData, setErroData] = useState<string>();
  const [erroBloco, setErroBloco] = useState<string>();
  const [salvando, setSalvando] = useState(false);

  async function enviar() {
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
          <Button
            variant="primary"
            loading={salvando}
            onClick={() => {
              void enviar();
            }}
          >
            Adiar
          </Button>
        </>
      }
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
    </Modal>
  );
}
