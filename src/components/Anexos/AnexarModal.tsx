import { useState } from "react";
import { anexosApi, enviarArquivo, type NovoAnexoRequest, type TipoAnexo } from "@/api/anexos";
import { mensagemDeErro } from "@/api/http";
import type { ReservaDto } from "@/api/viagens";
import { Button, Checkbox, DateInput, Field, Input, Select } from "@/components";
import { Alert } from "@/components/display";
import { Modal } from "@/components/feedback";
import s from "./Anexos.module.css";

interface AnexarModalProps {
  open: boolean;
  viagemId: string;
  reservas: ReservaDto[];
  onClose: () => void;
  onEnviado: () => void;
}

const MAX_BYTES = 25 * 1024 * 1024;
const TIPOS: { value: TipoAnexo; label: string }[] = [
  { value: "voucher", label: "Voucher" },
  { value: "comprovante", label: "Comprovante" },
  { value: "documento", label: "Documento" },
  { value: "contrato", label: "Contrato" },
  { value: "extrato", label: "Extrato" },
  { value: "outro", label: "Outro" },
];

/** Padrão de descarte para documento sensível: hoje + 180 dias (LGPD, spec §12). */
function descartePadrao(): string {
  return new Date(Date.now() + 180 * 86_400_000).toLocaleDateString("en-CA");
}

export function AnexarModal({ open, viagemId, reservas, onClose, onEnviado }: AnexarModalProps) {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [tipo, setTipo] = useState<TipoAnexo>("voucher");
  const [reservaId, setReservaId] = useState("");
  const [sensivel, setSensivel] = useState(false);
  const [dataDescarte, setDataDescarte] = useState(descartePadrao);
  const [erroArquivo, setErroArquivo] = useState<string>();
  const [erroBloco, setErroBloco] = useState<string>();
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    setErroBloco(undefined);
    if (!arquivo) {
      setErroArquivo("Escolha um arquivo");
      return;
    }
    if (arquivo.size > MAX_BYTES) {
      setErroArquivo("Arquivo maior que 25 MB. Envie uma versão menor.");
      return;
    }
    setErroArquivo(undefined);
    setEnviando(true);
    const req: NovoAnexoRequest = {
      ...(reservaId === "" ? { viagemId } : { reservaId }),
      tipo,
      nomeArquivo: arquivo.name,
      mimeType: arquivo.type === "" ? null : arquivo.type,
      tamanhoBytes: arquivo.size,
      sensivel,
      dataDescarte: sensivel ? dataDescarte : null,
    };
    let criado: { anexo: { id: string }; urlUpload: string };
    try {
      criado = await anexosApi.iniciar(req);
    } catch (erro) {
      setErroBloco(mensagemDeErro(erro));
      setEnviando(false);
      return;
    }
    try {
      // O anexo pendente fica invisível na lista (R7: só confirmados aparecem); sem limpeza no cliente.
      await enviarArquivo(criado.urlUpload, arquivo);
      await anexosApi.confirmar(criado.anexo.id);
    } catch {
      setErroBloco("Falha ao enviar o arquivo. Tente de novo.");
      setEnviando(false);
      return;
    }
    onEnviado();
    onClose();
  }

  return (
    <Modal
      open={open}
      title="Anexar arquivo"
      onClose={onClose}
      footer={
        <>
          <Button variant="tertiary" onClick={onClose}>
            Voltar
          </Button>
          <Button
            variant="primary"
            loading={enviando}
            onClick={() => {
              void enviar();
            }}
          >
            Anexar
          </Button>
        </>
      }
    >
      <div className={s.modalGrid}>
        {erroBloco && <Alert tone="danger">{erroBloco}</Alert>}
        <Field label="Arquivo" required error={erroArquivo} helper="Até 25 MB.">
          <Input
            type="file"
            onChange={(e) => {
              setArquivo(e.target.files?.[0] ?? null);
            }}
          />
        </Field>
        <Field label="Tipo">
          <Select
            value={tipo}
            options={TIPOS}
            onChange={(e) => {
              setTipo(e.target.value as TipoAnexo);
            }}
          />
        </Field>
        <Field label="Vínculo">
          <Select
            value={reservaId}
            options={[
              { value: "", label: "Viagem" },
              ...reservas.map((r, i) => ({ value: r.id, label: `Reserva ${i + 1} · ${r.fornecedorNome}` })),
            ]}
            onChange={(e) => {
              setReservaId(e.target.value);
            }}
          />
        </Field>
        <Checkbox
          label="Documento pessoal (sensível)"
          checked={sensivel}
          onChange={(e) => {
            setSensivel(e.target.checked);
          }}
        />
        {sensivel && (
          <Field label="Descartar em" helper="Documento pessoal é apagado nesta data.">
            <DateInput
              value={dataDescarte}
              onChange={(e) => {
                setDataDescarte(e.target.value);
              }}
            />
          </Field>
        )}
      </div>
    </Modal>
  );
}
