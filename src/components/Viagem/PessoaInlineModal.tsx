import { type SubmitEvent, useState } from "react";
import { ApiError, ConflictError, mensagemDeErro, ValidationError } from "@/api/errors";
import type { ClienteBuscaDto } from "@/api/viagens";
import { Button, DateInput, Field, Input } from "@/components";
import { Alert } from "@/components/display";
import { Modal } from "@/components/feedback";
import s from "./Viagem.module.css";

interface NovaPessoa {
  nome: string;
  telefone?: string;
  email?: string;
  cpf: string;
  dataNascimento: string;
}

const CAMPO_POR_CODIGO: Record<string, keyof NovaPessoa | undefined> = {
  nome_obrigatorio: "nome",
  cpf_invalido: "cpf",
  cpf_duplicado: "cpf",
  cpf_obrigatorio: "cpf",
  data_nascimento_obrigatoria: "dataNascimento",
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
  const [dataNascimento, setDataNascimento] = useState("");
  const [erros, setErros] = useState<Partial<Record<keyof NovaPessoa, string>>>({});
  const [erroBloco, setErroBloco] = useState<string>();
  const [salvando, setSalvando] = useState(false);

  function limpar() {
    setNome("");
    setTelefone("");
    setEmail("");
    setCpf("");
    setDataNascimento("");
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
    const obrigatorios: Partial<Record<keyof NovaPessoa, string>> = {};
    if (!nome.trim()) obrigatorios.nome = "Nome é obrigatório";
    if (!cpf.trim()) obrigatorios.cpf = "Informe o CPF";
    if (!dataNascimento) obrigatorios.dataNascimento = "Informe a data de nascimento";
    if (Object.keys(obrigatorios).length > 0) {
      setErros(obrigatorios);
      return;
    }
    setErros({});
    setSalvando(true);
    try {
      const criada = await criar({
        nome: nome.trim(),
        telefone: telefone.trim() || undefined,
        email: email.trim() || undefined,
        cpf: cpf.trim(),
        dataNascimento,
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
        <Field label="CPF" required error={erros.cpf}>
          <Input
            value={cpf}
            onChange={(e) => {
              setCpf(e.target.value);
            }}
          />
        </Field>
        <Field label="Nascimento" required error={erros.dataNascimento}>
          <DateInput
            value={dataNascimento}
            onChange={(e) => {
              setDataNascimento(e.target.value);
            }}
          />
        </Field>
      </form>
    </Modal>
  );
}
