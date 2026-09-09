import { useState } from "react";
import type { FornecedorDto } from "@/api/viagens";
import { Button, type ButtonVariant, DateInput, Field, Input, MoneyInput, MoneyValue, Select } from "@/components";
import { Alert, Badge, Chip, StatusBadge } from "@/components/display";
import { ConfirmModal, EmptyState, Modal, Skeleton, toast } from "@/components/feedback";
import { type ReservaForm, ReservationCard, reservaVazia } from "@/components/reserva";
import { PageHeader, Section, Tabs } from "@/components/shell";
import { TripSummary } from "@/components/viagem";
import type { EntidadeStatus, Tone } from "@/dominio/status";
import s from "./StyleguidePage.module.css";

const VARIANTES: ButtonVariant[] = ["business", "primary", "secondary", "tertiary", "danger"];
const TONS: Tone[] = ["info", "success", "warning", "danger", "neutral"];
const STATUS_POR_ENTIDADE: { entidade: EntidadeStatus; valor: string }[] = [
  { entidade: "fase_viagem", valor: "em_viagem" },
  { entidade: "comissao", valor: "atrasada" },
  { entidade: "reserva", valor: "emitida" },
  { entidade: "repasse", valor: "a_pagar" },
  { entidade: "despesa", valor: "vencida" },
  { entidade: "pendencia", valor: "urgente" },
  { entidade: "acesso", valor: "convite_pendente" },
];
const TABS_EXEMPLO = [
  { id: "resumo", label: "Resumo" },
  { id: "detalhes", label: "Detalhes" },
  { id: "historico", label: "Histórico" },
];
const FORNECEDORES_EXEMPLO: FornecedorDto[] = [
  { id: "f1", nome: "CVC", tipo: "operadora", percentualComissaoPadrao: 10, prazoComissaoDias: null, ativo: true },
  { id: "f2", nome: "Decolar", tipo: "operadora", percentualComissaoPadrao: null, prazoComissaoDias: 45, ativo: true },
];
const RESERVA_ABERTA: ReservaForm = {
  ...reservaVazia(0),
  fornecedorId: "f1",
  localizador: "K7X2PQ",
  tiposServico: ["aereo", "hospedagem"],
  valorTotal: 10000,
  valorComissao: 1000,
  valorCliente: 10500,
  aberta: true,
};
const RESERVA_FECHADA: ReservaForm = {
  ...RESERVA_ABERTA,
  fornecedorId: "f2",
  localizador: "DCL-88213",
  status: "emitida",
  tiposServico: ["hospedagem"],
  valorTotal: 3000,
  valorComissao: 0,
  valorCliente: 3200,
  aberta: false,
};

export function StyleguidePage() {
  const [dinheiro, setDinheiro] = useState<number | null>(1600);
  const [modalAberto, setModalAberto] = useState(false);
  const [confirmAberto, setConfirmAberto] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState("resumo");

  return (
    <main className={s.page}>
      <h1 className={s.titulo}>Styleguide</h1>

      <div data-testid="sg-botoes">
        <Section title="Botões" description="Cinco variantes × normal, carregando e desabilitado">
          <div className={s.grid}>
            {VARIANTES.map((v) => (
              <div key={v} className={s.row}>
                <Button variant={v}>{v}</Button>
                <Button variant={v} loading>
                  {v}
                </Button>
                <Button variant={v} disabled>
                  {v}
                </Button>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <div data-testid="sg-campos">
        <Section title="Campos" description="Cinco estados: editável, erro, calculado, somente leitura, desabilitado">
          <div className={s.grid}>
            <Field label="Editável" required helper="Texto de ajuda">
              <Input defaultValue="CVC Operadora" />
            </Field>
            <Field label="Com erro" error="Localizador já usado nesta viagem">
              <Input defaultValue="ABC123" />
            </Field>
            <Field label="Calculado" tooltip="Venda − custo">
              <MoneyInput value={1600} onChange={() => undefined} calculated />
            </Field>
            <Field label="Somente leitura">
              <Input readOnly defaultValue="VG-2026-0042" />
            </Field>
            <Field label="Desabilitado">
              <Input disabled defaultValue="—" />
            </Field>
            <Field label="Data">
              <DateInput defaultValue="2026-09-08" />
            </Field>
            <Field label="Select">
              <Select
                placeholder="Escolha"
                options={[
                  { value: "pix", label: "Pix" },
                  { value: "boleto", label: "Boleto" },
                ]}
              />
            </Field>
          </div>
        </Section>
      </div>

      <div data-testid="sg-dinheiro">
        <Section title="Dinheiro" description="MoneyInput editável e MoneyValue com ênfase e tom">
          <div className={s.grid}>
            <Field label="Valor">
              <MoneyInput value={dinheiro} onChange={setDinheiro} />
            </Field>
            <Field label="Negativo permitido">
              <MoneyInput value={-150} onChange={() => undefined} allowNegative />
            </Field>
          </div>
          <div className={s.row}>
            <MoneyValue value={1600} />
            <MoneyValue value={1600} emphasis="result" />
            <MoneyValue value={-150} />
            <MoneyValue value={1600} tone="above" />
            <MoneyValue value={null} />
          </div>
        </Section>
      </div>

      <div data-testid="sg-chips-badges">
        <Section title="Chips e badges" description="Seleção on/off, tom e status por entidade">
          <div className={s.row}>
            <Chip selected={false}>Aéreo</Chip>
            <Chip selected>Hotel</Chip>
          </div>
          <div className={s.row}>
            {TONS.map((t) => (
              <Badge key={t} tone={t}>
                {t}
              </Badge>
            ))}
          </div>
          <div className={s.row}>
            {STATUS_POR_ENTIDADE.map((e) => (
              <StatusBadge key={e.entidade} entidade={e.entidade} valor={e.valor} />
            ))}
          </div>
        </Section>
      </div>

      <div data-testid="sg-alertas">
        <Section title="Alertas" description="Uma cor por tom, ícone nunca só decorativo">
          {TONS.map((t) => (
            <Alert key={t} tone={t} title={t}>
              Mensagem de exemplo para o tom {t}.
            </Alert>
          ))}
        </Section>
      </div>

      <div data-testid="sg-modais">
        <Section title="Modais" description="Modal padrão e ConfirmModal de decisão">
          <div className={s.row}>
            <Button
              variant="secondary"
              onClick={() => {
                setModalAberto(true);
              }}
            >
              Abrir modal
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setConfirmAberto(true);
              }}
            >
              Abrir modal de decisão
            </Button>
          </div>
          <Modal
            open={modalAberto}
            title="Detalhes da reserva"
            onClose={() => {
              setModalAberto(false);
            }}
          >
            Conteúdo de exemplo do modal padrão.
          </Modal>
          <ConfirmModal
            open={confirmAberto}
            title="Cancelar reserva?"
            impact="Esta ação libera o valor bloqueado e não pode ser desfeita."
            confirmLabel="Cancelar reserva"
            tone="danger"
            onConfirm={() => {
              setConfirmAberto(false);
            }}
            onCancel={() => {
              setConfirmAberto(false);
            }}
          />
        </Section>
      </div>

      <div data-testid="sg-toast">
        <Section title="Toast" description="Confirmação de ação, erro e desfazer">
          <div className={s.row}>
            <Button
              variant="secondary"
              onClick={() => {
                toast.success("Reserva salva.");
              }}
            >
              Disparar sucesso
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                toast.error("Não foi possível salvar.");
              }}
            >
              Disparar erro
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                toast.undo("Reserva removida.", () => undefined);
              }}
            >
              Disparar desfazer
            </Button>
          </div>
        </Section>
      </div>

      <div data-testid="sg-tabs">
        <Section title="Tabs" description="Navegação por teclado com setas">
          <Tabs tabs={TABS_EXEMPLO} active={abaAtiva} onChange={setAbaAtiva}>
            {TABS_EXEMPLO.map((t) => (
              <Tabs.Panel key={t.id} id={t.id} active={abaAtiva}>
                Conteúdo de {t.label}.
              </Tabs.Panel>
            ))}
          </Tabs>
        </Section>
      </div>

      <div data-testid="sg-page-header">
        <Section title="Page header" description="Título, status e indicador de alterações não salvas">
          <PageHeader
            title="Viagem VG-2026-0042"
            subtitle="Carlos Mendes"
            status={<StatusBadge entidade="fase_viagem" valor="em_viagem" />}
            dirty
            actions={<Button variant="primary">Salvar</Button>}
          />
        </Section>
      </div>

      <div data-testid="sg-reserva">
        <Section title="Reserva" description="Card de reserva aberto e fechado, resumo da viagem">
          <ReservationCard
            indice={1}
            value={RESERVA_ABERTA}
            onChange={() => undefined}
            onToggle={() => undefined}
            onRemover={() => undefined}
            fornecedores={FORNECEDORES_EXEMPLO}
            onNovoFornecedor={() => undefined}
            erros={{}}
            avisoDuplicada={null}
          />
          <ReservationCard
            indice={2}
            value={RESERVA_FECHADA}
            onChange={() => undefined}
            onToggle={() => undefined}
            onRemover={() => undefined}
            fornecedores={FORNECEDORES_EXEMPLO}
            onNovoFornecedor={() => undefined}
            erros={{}}
            avisoDuplicada={null}
          />
          <TripSummary
            reservas={[RESERVA_ABERTA, RESERVA_FECHADA]}
            repasseValor={500}
            despesas={200}
            onAdicionarReserva={() => undefined}
            mostrarResultado
          />
        </Section>
      </div>

      <div data-testid="sg-skeleton-empty">
        <Section title="Skeleton e empty state" description="Carregamento e ausência de dados">
          <Skeleton lines={3} />
          <Skeleton.Block height="card" />
          <EmptyState title="Nenhuma viagem" description="Crie a primeira viagem para começar." />
        </Section>
      </div>
    </main>
  );
}
