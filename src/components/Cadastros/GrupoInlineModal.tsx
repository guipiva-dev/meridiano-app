import { type SubmitEvent, useState } from "react";
import { ConflictError, mensagemDeErro, ValidationError } from "@/api/errors";
import type { GrupoDto, TipoGrupo } from "@/api/grupos";
import { gruposApi } from "@/api/grupos";
import { Button, Field, Input, Select } from "@/components";
import { Alert } from "@/components/display";
import { Modal } from "@/components/feedback";
import { apresentacaoStatus } from "@/dominio/status";
import s from "./Cadastros.module.css";

const TIPOS: TipoGrupo[] = ["familia", "empresa", "outro"];
const OPCOES_TIPO = TIPOS.map((t) => ({ value: t, label: apresentacaoStatus("grupo_tipo", t).texto }));

interface GrupoInlineModalProps {
  open: boolean;
  onClose: () => void;
  onCriado: (g: GrupoDto) => void;
}

export function GrupoInlineModal({ open, onClose, onCriado }: GrupoInlineModalProps) {
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<TipoGrupo>("familia");
  const [erroNome, setErroNome] = useState<string>();
  const [erroBloco, setErroBloco] = useState<string>();
  const [salvando, setSalvando] = useState(false);

  function limpar() {
    setNome("");
    setTipo("familia");
    setErroNome(undefined);
    setErroBloco(undefined);
    setSalvando(false);
  }
  function fechar() {
    limpar();
    onClose();
  }

  async function enviar(e?: SubmitEvent<HTMLFormElement>) {
    e?.preventDefault();
    setErroBloco(undefined);
    if (!nome.trim()) {
      setErroNome("Nome é obrigatório");
      return;
    }
    setErroNome(undefined);
    setSalvando(true);
    try {
      const criado = await gruposApi.criar({ nome: nome.trim(), tipo, cnpj: null, observacoes: null });
      onCriado(criado);
      fechar();
    } catch (erroCriar) {
      if (erroCriar instanceof ValidationError && erroCriar.codigo === "nome_obrigatorio") {
        setErroNome(erroCriar.detalhe);
      } else if (erroCriar instanceof ConflictError) {
        setErroBloco(erroCriar.detalhe);
      } else {
        setErroBloco(mensagemDeErro(erroCriar));
      }
      setSalvando(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Novo grupo"
      onClose={fechar}
      footer={
        <>
          <Button variant="tertiary" onClick={fechar}>
            Fechar
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              void enviar();
            }}
            loading={salvando}
          >
            Criar
          </Button>
        </>
      }
    >
      <form
        className={s.modalGrid}
        noValidate
        onSubmit={(e) => {
          void enviar(e);
        }}
      >
        {erroBloco && <Alert tone="danger">{erroBloco}</Alert>}
        <Field label="Nome" required error={erroNome}>
          <Input
            value={nome}
            onChange={(e) => {
              setNome(e.target.value);
            }}
          />
        </Field>
        <Field label="Tipo">
          <Select
            options={OPCOES_TIPO}
            value={tipo}
            onChange={(e) => {
              setTipo(e.target.value as TipoGrupo);
            }}
          />
        </Field>
      </form>
    </Modal>
  );
}
