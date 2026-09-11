import { type SubmitEvent, useState } from "react";
import { equipeApi } from "@/api/equipe";
import { mensagemDeErro, ValidationError } from "@/api/errors";
import { Button, Field, Input, Select } from "@/components";
import { Alert } from "@/components/display";
import { Modal } from "@/components/feedback";
import { OPCOES_PERFIL } from "./perfis";

interface ConvidarModalProps {
  open: boolean;
  onClose: () => void;
  onConvidado: () => void;
}

export function ConvidarModal({ open, onClose, onConvidado }: ConvidarModalProps) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [perfil, setPerfil] = useState("agente");
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroBloco, setErroBloco] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function limpar() {
    setNome("");
    setEmail("");
    setPerfil("agente");
    setErros({});
    setErroBloco(null);
    setEnviando(false);
  }
  function fechar() {
    limpar();
    onClose();
  }

  async function enviar(e?: SubmitEvent<HTMLFormElement>) {
    e?.preventDefault();
    setErroBloco(null);
    if (!nome.trim() || !email.trim()) {
      setErros({
        ...(nome.trim() ? {} : { nome: "Nome é obrigatório" }),
        ...(email.trim() ? {} : { email: "E-mail é obrigatório" }),
      });
      return;
    }
    setErros({});
    setEnviando(true);
    try {
      await equipeApi.convidarNovo({ nome: nome.trim(), email: email.trim(), perfil });
      onConvidado();
      fechar();
    } catch (erroConvite) {
      if (
        erroConvite instanceof ValidationError &&
        (erroConvite.codigo === "email_ja_cadastrado" || erroConvite.codigo === "email_invalido")
      ) {
        setErros({ email: erroConvite.detalhe });
      } else {
        setErroBloco(mensagemDeErro(erroConvite));
      }
      setEnviando(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Convidar para acessar"
      onClose={fechar}
      footer={
        <>
          <Button variant="tertiary" onClick={fechar}>
            Fechar
          </Button>
          <Button
            variant="primary"
            loading={enviando}
            onClick={() => {
              void enviar();
            }}
          >
            Convidar
          </Button>
        </>
      }
    >
      <form
        noValidate
        onSubmit={(e) => {
          void enviar(e);
        }}
      >
        {erroBloco && <Alert tone="danger">{erroBloco}</Alert>}
        <Field label="Nome" required error={erros.nome}>
          <Input
            value={nome}
            onChange={(e) => {
              setNome(e.target.value);
            }}
          />
        </Field>
        <Field label="E-mail" required error={erros.email}>
          <Input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
          />
        </Field>
        <Field label="Perfil">
          <Select
            options={OPCOES_PERFIL}
            value={perfil}
            onChange={(e) => {
              setPerfil(e.target.value);
            }}
          />
        </Field>
      </form>
    </Modal>
  );
}
