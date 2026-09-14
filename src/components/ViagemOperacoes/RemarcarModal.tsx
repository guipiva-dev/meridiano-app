import { type ChangeEvent, useState } from "react";
import type { RemarcarRequest, ReservaDto, ViagemDto } from "@/api/viagens";
import { viagensApi } from "@/api/viagens";
import { Button, DateInput, Field, MoneyInput, useField } from "@/components";
import { Alert } from "@/components/display";
import { Modal } from "@/components/feedback";
import { calcularReserva } from "@/dominio/calculoReserva";
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
  onRecarregar?: () => void;
}

const MAPA: Record<string, string> = {
  descricao_obrigatoria: "descricao",
  valor_negativo: "valorNovo",
  datas_incoerentes: "novaDataVolta",
  // A12: back confirma o mesmo cálculo checado localmente antes de enviar.
  esperado_negativo: "novoValorCliente",
};
const MSG_ESPERADO_NEGATIVO = "Desconto maior que a comissão: o total da comissão ficaria negativo";

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

export function RemarcarModal({ open, reserva, viagem, onClose, onRemarcada, onRecarregar }: RemarcarModalProps) {
  const [dataAlteracao, setDataAlteracao] = useState(hojeIso());
  const [descricao, setDescricao] = useState("");
  const [valorNovo, setValorNovo] = useState<number | null>(null);
  const [novaVenda, setNovaVenda] = useState<number | null>(reserva.valorCliente ?? null);
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
    setNovaVenda(reserva.valorCliente ?? null);
    setMultaCliente(0);
    setNovaDataIda(viagem.dataIda ?? "");
    setNovaDataVolta(viagem.dataVolta ?? "");
    setDatasEditadas(false);
    setErroDescricaoLocal(undefined);
    limpar();
    onClose();
  }

  async function enviarForm() {
    if (!descricao.trim()) {
      setErroDescricaoLocal("Descrição é obrigatória");
      return;
    }
    setErroDescricaoLocal(undefined);
    if (esperadoNegativo) return;
    const req: RemarcarRequest = {
      dataAlteracao,
      descricao: descricao.trim(),
      valorNovo,
      ...(novaVenda !== null && novaVenda !== reserva.valorCliente && { novoValorCliente: novaVenda }),
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
  // Remarcar muda o custo sem tocar a venda: avisa antes de o RAV do cliente ficar negativo.
  const vendaAbaixoDoCusto = valorNovo !== null && novaVenda !== null && valorNovo > novaVenda;
  // A12: mesma checagem de "esperado da operadora < 0" da tela de reserva, com o novo valor/nova venda.
  const esperadoNegativo =
    reserva.valorCliente !== undefined &&
    reserva.ravClienteModo === "via_operadora" &&
    (calcularReserva({
      valorTotal: valorNovo ?? reserva.valorTotal ?? 0,
      valorComissao: reserva.valorComissao ?? 0,
      ravOperadora: reserva.ravOperadora ?? 0,
      valorCliente: novaVenda ?? reserva.valorCliente,
      taxaServico: 0,
      viaOperadora: true,
    }).valorEsperadoOperadora ?? 0) < 0;

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
      <div className={s.grid}>
        {conflito && (
          <Alert
            tone="danger"
            action={
              onRecarregar ? (
                <Button variant="secondary" onClick={onRecarregar}>
                  Recarregar
                </Button>
              ) : undefined
            }
          >
            Alguém alterou esta viagem enquanto você decidia. Recarregue e tente de novo.
          </Alert>
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
        {reserva.valorCliente !== undefined && (
          <Field
            label="Novo total cobrado do cliente"
            helper="Deixe como está para manter o total atual"
            error={erros.novoValorCliente ?? (esperadoNegativo ? MSG_ESPERADO_NEGATIVO : undefined)}
          >
            <MoneyInput value={novaVenda} onChange={setNovaVenda} />
          </Field>
        )}
        {vendaAbaixoDoCusto && (
          <Alert tone="warning">Total cobrado do cliente abaixo do custo: RAV ficará negativo</Alert>
        )}
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
      </div>
    </Modal>
  );
}
