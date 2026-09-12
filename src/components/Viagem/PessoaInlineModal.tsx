import { type SubmitEvent, useState } from "react";
import { ApiError, ConflictError, mensagemDeErro, ValidationError } from "@/api/errors";
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

const CAMPO_POR_CODIGO: Record<string, keyof NovaPessoa | undefined> = {
  nome_obrigatorio: "nome",
  cpf_invalido: "cpf",
  cpf_duplicado: "cpf",
  email_invalido: "email",
  telefone_invalido: "telefone",
};

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
  const [erros, setErros] = useState<Partial<Record<keyof NovaPessoa, string>>>({});
  const [erroBloco, setErroBloco] = useState<string>();
  const [salvando, setSalvando] = useState(false);

  function limpar() {
    setNome("");
    setTelefone("");
    setEmail("");
    setCpf("");
    setErros({});
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
      setErros({ nome: "Nome é obrigatório" });
      return;
    }
    setErros({});
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
      // 409 no criar só acontece por CPF já cadastrado (unique).
      const campo =
        erroCriar instanceof ConflictError
          ? "cpf"
          : erroCriar instanceof ValidationError
            ? CAMPO_POR_CODIGO[erroCriar.codigo]
            : undefined;
      if (campo && erroCriar instanceof ApiError) setErros({ [campo]: erroCriar.detalhe });
      else setErroBloco(mensagemDeErro(erroCriar));
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
        <Field label="Nome" required error={erros.nome}>
          <Input
            // eslint-disable-next-line jsx-a11y/no-autofocus -- modal de cadastro rápido: o Modal focaria o botão Fechar, o campo Nome é o destino útil
            autoFocus
            value={nome}
            onChange={(e) => {
              setNome(e.target.value);
            }}
          />
        </Field>
        <Field label="Telefone" error={erros.telefone}>
          <Input
            value={telefone}
            onChange={(e) => {
              setTelefone(e.target.value);
            }}
          />
        </Field>
        <Field label="E-mail" error={erros.email}>
          <Input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
          />
        </Field>
        <Field label="CPF" error={erros.cpf}>
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
