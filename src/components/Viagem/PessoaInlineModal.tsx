import { type SubmitEvent, useState } from "react";
import { ConflictError, mensagemDeErro, ValidationError } from "@/api/errors";
import type { ClienteBuscaDto } from "@/api/viagens";
import { Button, Field, Input } from "@/components";
import { Alert } from "@/components/display";
import { Modal } from "@/components/feedback";
import s from "./Viagem.module.css";

interface NovaPessoa {
  nome: string;
  telefone?: string;
  email?: string;
  cpf?: string;
}

interface PessoaInlineModalProps {
  open: boolean;
  onClose: () => void;
  onCriada: (c: ClienteBuscaDto) => void;
  criar: (c: NovaPessoa) => Promise<ClienteBuscaDto>;
}

export function PessoaInlineModal({ open, onClose, onCriada, criar }: PessoaInlineModalProps) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [erroNome, setErroNome] = useState<string>();
  const [erroCpf, setErroCpf] = useState<string>();
  const [erroBloco, setErroBloco] = useState<string>();
  const [salvando, setSalvando] = useState(false);

  function limpar() {
    setNome("");
    setTelefone("");
    setEmail("");
    setCpf("");
    setErroNome(undefined);
    setErroCpf(undefined);
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
    setErroCpf(undefined);
    setSalvando(true);
    try {
      const criada = await criar({
        nome: nome.trim(),
        telefone: telefone.trim() || undefined,
        email: email.trim() || undefined,
        cpf: cpf.trim() || undefined,
      });
      onCriada(criada);
      fechar();
    } catch (erroCriar) {
      if (erroCriar instanceof ValidationError && erroCriar.codigo === "cpf_invalido") {
        setErroCpf(erroCriar.detalhe);
      } else if (erroCriar instanceof ValidationError && erroCriar.codigo === "nome_obrigatorio") {
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
      title="Nova pessoa"
      onClose={fechar}
      footer={
        <>
          <Button variant="tertiary" onClick={fechar}>
            Cancelar
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
        <Field label="Telefone">
          <Input
            value={telefone}
            onChange={(e) => {
              setTelefone(e.target.value);
            }}
          />
        </Field>
        <Field label="E-mail">
          <Input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
          />
        </Field>
        <Field label="CPF" error={erroCpf}>
          <Input
            value={cpf}
            onChange={(e) => {
              setCpf(e.target.value);
            }}
          />
        </Field>
      </form>
    </Modal>
  );
}
