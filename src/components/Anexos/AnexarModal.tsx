import { type SubmitEvent, useId, useState } from "react";
import { anexosApi, enviarArquivo, type NovoAnexoRequest, type TipoAnexo } from "@/api/anexos";
import { mensagemDeErro, ValidationError } from "@/api/errors";
import { Button, Checkbox, DateInput, Field, Input, Select } from "@/components";
import { Alert } from "@/components/display";
import { Modal } from "@/components/feedback";
import s from "./Anexos.module.css";
import type { EscopoAnexos } from "./ListaAnexos";

interface AnexarModalProps {
  open: boolean;
  escopo: EscopoAnexos;
  onClose: () => void;
  onEnviado: () => void;
}

const MAX_BYTES = 25 * 1024 * 1024;
// Mesma allowlist do backend (`AnexosService.IniciarAsync`); a checagem final é lá.
const EXTENSOES = ["pdf", "jpg", "jpeg", "png", "webp", "heic", "doc", "docx", "xls", "xlsx", "txt"];
const ACCEPT = EXTENSOES.map((e) => `.${e}`).join(",");
const ERRO_TIPO = "Tipo de arquivo não permitido (PDF, imagens, Office)";
// A partir da 2ª falha, o texto sugere contato com o suporte (upload falhando de novo raramente se resolve sozinho).
const FALHAS_PARA_SUPORTE = 2;

function mensagemErroEnvio(motivo: string, falhas: number): string {
  const base = `Não foi possível enviar o arquivo ao armazenamento (${motivo}). Tente de novo.`;
  return falhas >= FALHAS_PARA_SUPORTE ? `${base} Se persistir, fale com o suporte.` : base;
}
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

export function AnexarModal({ open, escopo, onClose, onEnviado }: AnexarModalProps) {
  const idForm = useId();
  const pessoa = "clienteId" in escopo;
  // Vínculo padrão do escopo; no escopo viagem o Select pode trocá-lo por uma reserva.
  const alvo: Pick<NovoAnexoRequest, "clienteId" | "viagemId"> =
    "clienteId" in escopo ? { clienteId: escopo.clienteId } : { viagemId: escopo.viagemId };
  const reservas = "reservas" in escopo ? escopo.reservas : [];
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [tipo, setTipo] = useState<TipoAnexo>(pessoa ? "documento" : "voucher");
  const [reservaId, setReservaId] = useState("");
  const [sensivel, setSensivel] = useState(pessoa);
  const [dataDescarte, setDataDescarte] = useState(descartePadrao);
  const [erroArquivo, setErroArquivo] = useState<string>();
  const [erroBloco, setErroBloco] = useState<string>();
  const [enviando, setEnviando] = useState(false);
  // Anexo já iniciado cujo PUT falhou: "Tentar de novo" repete só o PUT e o confirmar.
  const [pendente, setPendente] = useState<{ id: string; urlUpload: string }>();
  const [falhasEnvio, setFalhasEnvio] = useState(0);

  async function subirEConfirmar(anexo: { id: string; urlUpload: string }, arq: File) {
    setErroBloco(undefined);
    setEnviando(true);
    try {
      // O anexo pendente fica invisível na lista (R7: só confirmados aparecem); o job expurga em 1 dia.
      await enviarArquivo(anexo.urlUpload, arq);
      await anexosApi.confirmar(anexo.id);
    } catch (erro) {
      const motivo = erro instanceof Error ? erro.message : "erro desconhecido";
      const falhas = falhasEnvio + 1;
      setFalhasEnvio(falhas);
      setPendente(anexo);
      setErroBloco(mensagemErroEnvio(motivo, falhas));
      setEnviando(false);
      return;
    }
    onEnviado();
    onClose();
  }

  async function enviar(e?: SubmitEvent<HTMLFormElement>) {
    e?.preventDefault();
    setErroBloco(undefined);
    setPendente(undefined);
    if (!arquivo) {
      setErroArquivo("Escolha um arquivo");
      return;
    }
    if (arquivo.size > MAX_BYTES) {
      setErroArquivo("Arquivo maior que 25 MB. Envie uma versão menor.");
      return;
    }
    const extensao = arquivo.name.split(".").pop()?.toLowerCase() ?? "";
    if (!EXTENSOES.includes(extensao)) {
      setErroArquivo(ERRO_TIPO);
      return;
    }
    setErroArquivo(undefined);
    setEnviando(true);
    const req: NovoAnexoRequest = {
      ...(reservaId === "" ? alvo : { reservaId }),
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
      if (erro instanceof ValidationError && erro.codigo === "tipo_arquivo_nao_permitido") setErroArquivo(erro.detalhe);
      else setErroBloco(mensagemDeErro(erro));
      setEnviando(false);
      return;
    }
    await subirEConfirmar({ id: criado.anexo.id, urlUpload: criado.urlUpload }, arquivo);
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
          <Button variant="primary" type="submit" form={idForm} loading={enviando}>
            Anexar
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
        {erroBloco && (
          <Alert
            tone="danger"
            action={
              pendente &&
              arquivo && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    void subirEConfirmar(pendente, arquivo);
                  }}
                >
                  Tentar de novo
                </Button>
              )
            }
          >
            {erroBloco}
          </Alert>
        )}
        <Field label="Arquivo" required error={erroArquivo} helper="Até 25 MB. PDF, imagens ou Office.">
          <Input
            type="file"
            accept={ACCEPT}
            onChange={(e) => {
              setArquivo(e.target.files?.[0] ?? null);
              setPendente(undefined);
              setErroArquivo(undefined);
              setFalhasEnvio(0);
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
        {!pessoa && (
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
        )}
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
      </form>
    </Modal>
  );
}
