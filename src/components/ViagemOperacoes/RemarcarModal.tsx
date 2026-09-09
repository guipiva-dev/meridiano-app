import { type ChangeEvent, type SubmitEvent, useState } from "react";
import type { RemarcarRequest, ReservaDto, ViagemDto } from "@/api/viagens";
import { viagensApi } from "@/api/viagens";
import { Button, DateInput, Field, MoneyInput, useField } from "@/components";
import { Alert } from "@/components/display";
import { Modal } from "@/components/feedback";
import { hojeIso } from "@/lib/datas";
import { formatarDinheiro } from "@/lib/dinheiro";
import s from "./Operacoes.module.css";
import { useOperacao } from "./useOperacao";

interface RemarcarModalProps {
  open: boolean;
  reserva: ReservaDto;
  viagem: ViagemDto;
  onClose: () => void;
  onRemarcada: (v: ViagemDto) => void;
}

const MAPA: Record<string, string> = {
  descricao_obrigatoria: "descricao",
  valor_negativo: "valorNovo",
  datas_incoerentes: "novaDataVolta",
};

function Descricao({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const f = useField();
  return (
    <textarea
      id={f?.id}
      aria-describedby={f?.describedBy}
      aria-invalid={f?.invalid ? true : undefined}
      rows={3}
      className={s.textarea}
      value={value}
      onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
        onChange(e.target.value);
      }}
    />
  );
}

export function RemarcarModal({ open, reserva, viagem, onClose, onRemarcada }: RemarcarModalProps) {
  const [dataAlteracao, setDataAlteracao] = useState(hojeIso());
  const [descricao, setDescricao] = useState("");
  const [valorNovo, setValorNovo] = useState<number | null>(null);
  const [multaCliente, setMultaCliente] = useState<number | null>(0);
  const [novaDataIda, setNovaDataIda] = useState(viagem.dataIda ?? "");
  const [novaDataVolta, setNovaDataVolta] = useState(viagem.dataVolta ?? "");
  const [datasEditadas, setDatasEditadas] = useState(false);
  const [erroDescricaoLocal, setErroDescricaoLocal] = useState<string>();
  const { salvando, erros, erroBloco, conflito, enviar, limpar } = useOperacao<RemarcarRequest>(
    (req) => viagensApi.remarcar(reserva.id, req),
    MAPA,
  );

  function fechar() {
    setDataAlteracao(hojeIso());
    setDescricao("");
    setValorNovo(null);
    setMultaCliente(0);
    setNovaDataIda(viagem.dataIda ?? "");
    setNovaDataVolta(viagem.dataVolta ?? "");
    setDatasEditadas(false);
    setErroDescricaoLocal(undefined);
    limpar();
    onClose();
  }

  async function enviarForm(e?: SubmitEvent<HTMLFormElement>) {
    e?.preventDefault();
    if (!descricao.trim()) {
      setErroDescricaoLocal("Descrição é obrigatória");
      return;
    }
    setErroDescricaoLocal(undefined);
    const req: RemarcarRequest = {
      dataAlteracao,
      descricao: descricao.trim(),
      valorNovo,
      multaCliente: multaCliente ?? 0,
      novaDataIda: datasEditadas ? novaDataIda || null : null,
      novaDataVolta: datasEditadas ? novaDataVolta || null : null,
      versao: viagem.versao,
    };
    const dto = await enviar(req);
    if (dto) {
      onRemarcada(dto);
      fechar();
    }
  }

  const indice = viagem.reservas.findIndex((r) => r.id === reserva.id) + 1;
  const helperValor = reserva.valorTotal !== undefined ? `Atual: ${formatarDinheiro(reserva.valorTotal)}` : undefined;

  return (
    <Modal
      open={open}
      title={`Remarcar reserva ${indice} · ${reserva.fornecedorNome}`}
      onClose={fechar}
      footer={
        <>
          <Button variant="tertiary" onClick={fechar}>
            Voltar
          </Button>
          <Button
            variant="primary"
            loading={salvando}
            onClick={() => {
              void enviarForm();
            }}
          >
            Remarcar
          </Button>
        </>
      }
    >
      <form
        className={s.grid}
        noValidate
        onSubmit={(e) => {
          void enviarForm(e);
        }}
      >
        {conflito && (
          <Alert tone="danger">Alguém alterou esta viagem enquanto você decidia. Recarregue e tente de novo.</Alert>
        )}
        {erroBloco && <Alert tone="danger">{erroBloco}</Alert>}
        <Field label="Data da alteração" required>
          <DateInput
            value={dataAlteracao}
            onChange={(e) => {
              setDataAlteracao(e.target.value);
            }}
          />
        </Field>
        <Field label="Descrição" required error={erroDescricaoLocal ?? erros.descricao}>
          <Descricao value={descricao} onChange={setDescricao} />
        </Field>
        <Field label="Novo valor da reserva" helper={helperValor} error={erros.valorNovo}>
          <MoneyInput value={valorNovo} onChange={setValorNovo} />
        </Field>
        <Field label="Multa paga pelo cliente" helper="Informativa: não altera receita nem repasse">
          <MoneyInput value={multaCliente} onChange={setMultaCliente} />
        </Field>
        <details className={s.details}>
          <summary>Alterar datas da viagem</summary>
          <div className={s.grid}>
            <Field label="Ida">
              <DateInput
                value={novaDataIda}
                onChange={(e) => {
                  setDatasEditadas(true);
                  setNovaDataIda(e.target.value);
                }}
              />
            </Field>
            <Field label="Volta" error={erros.novaDataVolta}>
              <DateInput
                value={novaDataVolta}
                onChange={(e) => {
                  setDatasEditadas(true);
                  setNovaDataVolta(e.target.value);
                }}
              />
            </Field>
          </div>
        </details>
      </form>
    </Modal>
  );
}
