import { type SubmitEvent, useState } from "react";
import { ConflictError, mensagemDeErro, ValidationError } from "@/api/errors";
import type { FornecedorDto } from "@/api/viagens";
import { Button, Field, Input, Select } from "@/components";
import { Alert } from "@/components/display";
import { Modal } from "@/components/feedback";
import s from "./Viagem.module.css";

const TIPOS = [
  { value: "operadora", label: "Operadora" },
  { value: "consolidadora", label: "Consolidadora" },
  { value: "cia_aerea", label: "Cia. aérea" },
  { value: "hotel", label: "Hotel" },
  { value: "seguradora", label: "Seguradora" },
  { value: "receptivo", label: "Receptivo" },
  { value: "despachante", label: "Despachante" },
  { value: "outro", label: "Outro" },
];

interface NovoFornecedor {
  nome: string;
  tipo: string;
}

interface FornecedorInlineModalProps {
  open: boolean;
  onClose: () => void;
  onCriado: (f: FornecedorDto) => void;
  criar: (f: NovoFornecedor) => Promise<FornecedorDto>;
}

export function FornecedorInlineModal({ open, onClose, onCriado, criar }: FornecedorInlineModalProps) {
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<string>(TIPOS[0]?.value ?? "operadora");
  const [erroNome, setErroNome] = useState<string>();
  const [erroTipo, setErroTipo] = useState<string>();
  const [erroBloco, setErroBloco] = useState<string>();
  const [salvando, setSalvando] = useState(false);

  function limpar() {
    setNome("");
    setTipo(TIPOS[0]?.value ?? "operadora");
    setErroNome(undefined);
    setErroTipo(undefined);
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
    setErroTipo(undefined);
    setSalvando(true);
    try {
      const criado = await criar({ nome: nome.trim(), tipo });
      onCriado(criado);
      fechar();
    } catch (erroCriar) {
      if (erroCriar instanceof ValidationError && erroCriar.codigo === "nome_obrigatorio") {
        setErroNome(erroCriar.detalhe);
      } else if (erroCriar instanceof ValidationError && erroCriar.codigo === "tipo_invalido") {
        setErroTipo(erroCriar.detalhe);
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
      title="Novo fornecedor"
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
        <Field label="Tipo" error={erroTipo}>
          <Select
            options={TIPOS}
            value={tipo}
            onChange={(e) => {
              setTipo(e.target.value);
            }}
          />
        </Field>
      </form>
    </Modal>
  );
}
