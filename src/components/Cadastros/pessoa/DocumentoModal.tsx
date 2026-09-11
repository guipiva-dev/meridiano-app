import { type SubmitEvent, useId, useState } from "react";
import { clientesApi, type DocumentoDto, type TipoDocumento } from "@/api/clientes";
import { Button, DateInput, Field, Input, Select } from "@/components";
import { Alert } from "@/components/display";
import { Modal } from "@/components/feedback";
import { apresentacaoStatus } from "@/dominio/status";
import { errosDeCadastro } from "../mapaErrosCadastro";
import s from "./Pessoa.module.css";

const TIPOS: TipoDocumento[] = ["rg", "cpf", "passaporte", "visto", "certidao", "outro"];
const OPCOES_TIPO = TIPOS.map((t) => ({ value: t, label: apresentacaoStatus("documento_tipo", t).texto }));

interface DocumentoModalProps {
  open: boolean;
  clienteId: string;
  documento?: DocumentoDto;
  onClose: () => void;
  onSalvo: () => void;
}

export function DocumentoModal({ open, clienteId, documento, onClose, onSalvo }: DocumentoModalProps) {
  const idForm = useId();
  const [tipo, setTipo] = useState<TipoDocumento>(documento?.tipo ?? "rg");
  const [numero, setNumero] = useState(documento?.numero ?? "");
  const [emissao, setEmissao] = useState(documento?.emissao ?? "");
  const [validade, setValidade] = useState(documento?.validade ?? "");
  const [paisEmissor, setPaisEmissor] = useState(documento?.paisEmissor ?? "");
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroBloco, setErroBloco] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function enviar(e?: SubmitEvent<HTMLFormElement>) {
    e?.preventDefault();
    setErros({});
    setErroBloco(null);
    setSalvando(true);
    const req = {
      tipo,
      numero: numero.trim() === "" ? null : numero.trim(),
      emissao: emissao === "" ? null : emissao,
      validade: validade === "" ? null : validade,
      paisEmissor: paisEmissor.trim() === "" ? null : paisEmissor.trim(),
    };
    try {
      if (documento) await clientesApi.atualizarDocumento(documento.id, { ...req, versao: documento.versao });
      else await clientesApi.criarDocumento(clienteId, req);
      onSalvo();
      onClose();
    } catch (erro) {
      const resultado = errosDeCadastro(erro);
      setErros(resultado.campos);
      setErroBloco(
        resultado.conflito
          ? "Alguém alterou este documento enquanto você editava. Recarregue e tente de novo."
          : resultado.bloco,
      );
      setSalvando(false);
    }
  }

  return (
    <Modal
      open={open}
      title={documento ? "Editar documento" : "Novo documento"}
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
        <Field label="Tipo" error={erros.tipo}>
          <Select
            value={tipo}
            options={OPCOES_TIPO}
            onChange={(e) => {
              setTipo(e.target.value as TipoDocumento);
            }}
          />
        </Field>
        <Field label="Número" error={erros.numero}>
          <Input
            className={s.mono}
            value={numero}
            onChange={(e) => {
              setNumero(e.target.value);
            }}
          />
        </Field>
        <Field label="Emissão" error={erros.emissao}>
          <DateInput
            value={emissao}
            onChange={(e) => {
              setEmissao(e.target.value);
            }}
          />
        </Field>
        <Field label="Validade" error={erros.validade} helper="Alerta automático 180 dias antes de vencer.">
          <DateInput
            value={validade}
            onChange={(e) => {
              setValidade(e.target.value);
            }}
          />
        </Field>
        <Field label="País emissor" error={erros.paisEmissor}>
          <Input
            value={paisEmissor}
            placeholder="Brasil"
            onChange={(e) => {
              setPaisEmissor(e.target.value);
            }}
          />
        </Field>
      </form>
    </Modal>
  );
}
