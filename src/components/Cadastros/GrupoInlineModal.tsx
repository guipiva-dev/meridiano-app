import { type SubmitEvent, useState } from "react";
import type { GrupoDto, TipoGrupo } from "@/api/grupos";
import { gruposApi } from "@/api/grupos";
import { Button, Field, Input, Select } from "@/components";
import { Alert } from "@/components/display";
import { Modal } from "@/components/feedback";
import { apresentacaoStatus } from "@/dominio/status";
import s from "./Cadastros.module.css";
import { errosDeCadastro } from "./mapaErrosCadastro";

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
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroBloco, setErroBloco] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  function limpar() {
    setNome("");
    setTipo("familia");
    setErros({});
    setErroBloco(null);
    setSalvando(false);
  }
  function fechar() {
    limpar();
    onClose();
  }

  async function enviar(e?: SubmitEvent<HTMLFormElement>) {
    e?.preventDefault();
    setErroBloco(null);
    if (!nome.trim()) {
      setErros({ nome: "Nome é obrigatório" });
      return;
    }
    setErros({});
    setSalvando(true);
    try {
      const criado = await gruposApi.criar({ nome: nome.trim(), tipo, cnpj: null, observacoes: null });
      onCriado(criado);
      fechar();
    } catch (erroCriar) {
      const resultado = errosDeCadastro(erroCriar);
      setErros(resultado.campos);
      setErroBloco(
        resultado.conflito ? "Alguém alterou este registro enquanto você criava. Tente de novo." : resultado.bloco,
      );
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
        <Field label="Nome" required error={erros.nome}>
          <Input
            value={nome}
            onChange={(e) => {
              setNome(e.target.value);
            }}
          />
        </Field>
        <Field label="Tipo" error={erros.tipo}>
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
