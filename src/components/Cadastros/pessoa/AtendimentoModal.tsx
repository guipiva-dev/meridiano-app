import { type SubmitEvent, useId, useState } from "react";
import { type AtendimentoDto, type Canal, clientesApi } from "@/api/clientes";
import { Button, Field, Input, Select, Textarea } from "@/components";
import { Alert } from "@/components/display";
import { Modal } from "@/components/feedback";
import { errosDeCadastro } from "../mapaErrosCadastro";
import { OPCOES_CANAL } from "./canais";
import s from "./Pessoa.module.css";

/** Date → "yyyy-MM-ddTHH:mm" (o formato que `input[type=datetime-local]` aceita), no fuso do navegador. */
function paraLocal(d: Date): string {
  return `${d.toLocaleDateString("en-CA")}T${d.toTimeString().slice(0, 5)}`;
}

interface AtendimentoModalProps {
  open: boolean;
  clienteId: string;
  atendimento?: AtendimentoDto;
  onClose: () => void;
  onSalvo: () => void;
}

export function AtendimentoModal({ open, clienteId, atendimento, onClose, onSalvo }: AtendimentoModalProps) {
  const idForm = useId();
  const [canal, setCanal] = useState<Canal>(atendimento?.canal ?? "whatsapp");
  const [resumo, setResumo] = useState(atendimento?.resumo ?? "");
  const [quando, setQuando] = useState(() => paraLocal(atendimento ? new Date(atendimento.ocorridoEm) : new Date()));
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroBloco, setErroBloco] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function enviar(e?: SubmitEvent<HTMLFormElement>) {
    e?.preventDefault();
    setErroBloco(null);
    if (!resumo.trim()) {
      setErros({ resumo: "Descreva o atendimento" });
      return;
    }
    setErros({});
    setSalvando(true);
    const req = {
      canal,
      resumo: resumo.trim(),
      ocorridoEm: quando === "" ? null : new Date(quando).toISOString(),
    };
    try {
      if (atendimento) await clientesApi.atualizarAtendimento(atendimento.id, { ...req, versao: atendimento.versao });
      else await clientesApi.criarAtendimento(clienteId, req);
      onSalvo();
      onClose();
    } catch (erro) {
      const resultado = errosDeCadastro(erro);
      setErros(resultado.campos);
      setErroBloco(
        resultado.conflito
          ? "Alguém alterou este atendimento enquanto você editava. Recarregue e tente de novo."
          : resultado.bloco,
      );
      setSalvando(false);
    }
  }

  return (
    <Modal
      open={open}
      title={atendimento ? "Editar atendimento" : "Registrar atendimento"}
      onClose={onClose}
      footer={
        <>
          <Button variant="tertiary" onClick={onClose}>
            Fechar
          </Button>
          <Button variant="primary" type="submit" form={idForm} loading={salvando}>
            Salvar
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
        <Field label="Canal" error={erros.canal}>
          <Select
            value={canal}
            options={OPCOES_CANAL}
            onChange={(e) => {
              setCanal(e.target.value as Canal);
            }}
          />
        </Field>
        <Field label="Resumo" required error={erros.resumo}>
          <Textarea
            value={resumo}
            placeholder="Ex.: enviou fotos do hotel e pediu orçamento de seguro"
            onChange={(e) => {
              setResumo(e.target.value);
            }}
          />
        </Field>
        <Field label="Quando" error={erros.ocorridoEm}>
          <Input
            type="datetime-local"
            value={quando}
            onChange={(e) => {
              setQuando(e.target.value);
            }}
          />
        </Field>
      </form>
    </Modal>
  );
}
