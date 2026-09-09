import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { chaves, type FornecedorDto, viagensApi } from "@/api/viagens";
import { useAuth } from "@/auth/useAuth";
import { Button } from "@/components";
import { Alert, Badge, StatusBadge } from "@/components/display";
import { Skeleton } from "@/components/feedback";
import { ReservationCard } from "@/components/reserva";
import { Page, PageHeader, Section } from "@/components/shell";
import { AvisoViagemSemelhante, FornecedorInlineModal, PessoaInlineModal, TripSummary } from "@/components/viagem";
import { useAtalho } from "@/lib/useAtalho";
import { DadosViagemSection } from "./DadosViagemSection";
import s from "./NovaViagem.module.css";
import { useNovaViagem } from "./useNovaViagem";

export function NovaViagemPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { pode } = useAuth();
  const v = useNovaViagem(id);
  const [pessoaAberta, setPessoaAberta] = useState(false);
  const [fornecedorPara, setFornecedorPara] = useState<number | null>(null);

  const reservas = v.form.watch("reservas");
  const repasseValor = v.form.watch("repasseValor");
  const titular = v.form.watch("passageiros").find((p) => p.titular);
  const modalAberto = pessoaAberta || fornecedorPara !== null;
  const abertaIndice = reservas.reduce((acc, r, i) => (r.aberta ? i : acc), -1);
  const verResultado = pode("viagem.ver_resultado");
  const dirty = v.salvamento.estado === "dirty" || v.salvamento.estado === "error";
  const semelhante = v.semelhante;

  const vendedorNome = v.vendedorSelecionado?.nome ?? v.viagem?.vendedorNome;
  const partes: string[] = [];
  if (titular) partes.push(`Titular: ${titular.nome}`);
  if (vendedorNome) partes.push(`Vendedor(a): ${vendedorNome}`);

  useAtalho("ctrl+s", () => {
    void v.salvar();
  });
  useAtalho("ctrl+enter", v.adicionarReserva);
  useAtalho(
    "escape",
    () => {
      v.alternarReserva(abertaIndice);
    },
    abertaIndice >= 0 && !modalAberto,
  );

  if (v.carregando) {
    return (
      <Page>
        <Skeleton lines={6} />
      </Page>
    );
  }

  return (
    <Page dirty={dirty} titulo={v.viagem?.codigo ?? "Nova viagem"} onSalvarESair={v.salvar}>
      <PageHeader
        title="Nova viagem"
        subtitle={partes.length > 0 ? partes.join(" · ") : undefined}
        meta={v.viagem ? <Badge tone="neutral">{v.viagem.codigo}</Badge> : undefined}
        status={<StatusBadge entidade="fase_viagem" valor={v.viagem?.faseOperacional ?? "sem_reserva"} />}
        dirty={dirty}
        salvoEm={v.salvamento.salvoEm}
        actions={
          <>
            <Button
              variant="tertiary"
              onClick={() => {
                void nav(-1);
              }}
            >
              Fechar
            </Button>
            <Button
              variant="primary"
              loading={v.salvamento.estado === "saving"}
              onClick={() => {
                void v.salvar();
              }}
            >
              Salvar viagem
            </Button>
          </>
        }
      />

      {v.conflito && (
        <Alert
          tone="warning"
          title="Alguém alterou esta viagem enquanto você editava"
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                void v.recarregar();
              }}
            >
              Recarregar
            </Button>
          }
        >
          Recarregue para ver os valores atuais e refaça a sua alteração.
        </Alert>
      )}
      {v.erroBloco !== null && <Alert tone="danger">{v.erroBloco}</Alert>}

      {semelhante && titular && (
        <AvisoViagemSemelhante
          item={semelhante}
          titularNome={titular.nome}
          onAdicionarNaExistente={() => {
            void nav(`/viagens/${semelhante.id}/editar`, { state: { novaReserva: true } });
          }}
          onAbrir={() => {
            void nav(`/viagens/${semelhante.id}`);
          }}
          onContinuar={v.dispensarSemelhante}
        />
      )}

      <Section title="Dados da viagem" description="Quem viaja, para onde, quando, quem vendeu">
        <DadosViagemSection
          form={v.form}
          vendedores={v.vendedores}
          mostrarRepasse={verResultado && v.vendedorSelecionado?.geraRepasse === true}
          repasseSugerido={v.repasseSugerido}
          erros={v.erros}
          buscarClientes={viagensApi.buscarClientes}
          onNovaPessoa={() => {
            setPessoaAberta(true);
          }}
        />
      </Section>

      {reservas.map((r, i) => {
        const duplicada = v.duplicadas[i];
        return (
          <ReservationCard
            key={r.id ?? `nova-${i}`}
            indice={i + 1}
            value={r}
            onChange={(patch) => {
              v.atualizarReserva(i, patch);
            }}
            onToggle={() => {
              v.alternarReserva(i);
            }}
            onRemover={() => {
              v.removerReserva(i);
            }}
            fornecedores={v.fornecedores}
            onNovoFornecedor={() => {
              setFornecedorPara(i);
            }}
            erros={{}}
            avisoDuplicada={duplicada ? `Este localizador já está na viagem ${duplicada}.` : null}
          />
        );
      })}

      <TripSummary
        reservas={reservas}
        repasseValor={repasseValor}
        despesas={v.viagem?.resumo?.despesasViagem ?? 0}
        onAdicionarReserva={v.adicionarReserva}
        mostrarResultado={verResultado}
      />

      <div className={s.rodape}>
        <span>
          <kbd>Ctrl</kbd>+<kbd>Enter</kbd> adicionar reserva · <kbd>Ctrl</kbd>+<kbd>S</kbd> salvar viagem ·{" "}
          <kbd>Esc</kbd> recolher · <kbd>Ctrl</kbd>+<kbd>K</kbd> buscar
        </span>
      </div>

      <PessoaInlineModal
        open={pessoaAberta}
        onClose={() => {
          setPessoaAberta(false);
        }}
        onCriada={(c) => {
          const atuais = v.form.getValues("passageiros");
          const novo = { clienteId: c.id, nome: c.nome, titular: atuais.length === 0 };
          v.form.setValue("passageiros", [...atuais, novo], { shouldDirty: true });
        }}
        criar={viagensApi.criarCliente}
      />
      <FornecedorInlineModal
        open={fornecedorPara !== null}
        onClose={() => {
          setFornecedorPara(null);
        }}
        onCriado={(f) => {
          qc.setQueryData<FornecedorDto[]>(chaves.fornecedores, (atuais) => [...(atuais ?? []), f]);
          if (fornecedorPara !== null) v.atualizarReserva(fornecedorPara, { fornecedorId: f.id });
        }}
        criar={viagensApi.criarFornecedor}
      />
    </Page>
  );
}
