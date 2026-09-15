import { useQueryClient } from "@tanstack/react-query";
import { type CSSProperties, useEffect, useId, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { chaves, type FornecedorDto, viagensApi } from "@/api/viagens";
import { useAuth } from "@/auth/useAuth";
import { Button } from "@/components";
import { Alert, Badge, StatusBadge } from "@/components/display";
import { Skeleton } from "@/components/feedback";
import { ReservationCard, ResultSummary } from "@/components/reserva";
import { Page, PageHeader } from "@/components/shell";
import { AvisoViagemSemelhante, FornecedorInlineModal, PessoaInlineModal, TripSummary } from "@/components/viagem";
import { cx } from "@/lib/cx";
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
  // A04: o aviso "N campos precisam de atenção" só aparece depois de uma tentativa de salvar.
  const [tentouSalvar, setTentouSalvar] = useState(false);
  const idTituloReservas = useId();
  const idErroReservas = useId();

  const reservas = v.form.watch("reservas");
  const titular = v.form.watch("passageiros").find((p) => p.titular);
  const destino = v.form.watch("destino");
  const modalAberto = pessoaAberta || fornecedorPara !== null;
  const abertaIndice = reservas.reduce((acc, r, i) => (r.aberta ? i : acc), -1);
  const verResultado = pode("viagem.ver_resultado");
  const dirty = v.salvamento.estado === "dirty" || v.salvamento.estado === "error";
  const semelhante = v.semelhante;

  const vendedorNome = v.vendedorSelecionado?.nome ?? v.viagem?.vendedorNome;
  const editando = Boolean(id && v.viagem);
  const titulo = editando
    ? [titular?.nome, destino.trim()].filter(Boolean).join(" · ") || (v.viagem?.codigo ?? "Nova viagem")
    : "Nova viagem";
  const partes: string[] = [];
  if (titular && !editando) partes.push(`Titular: ${titular.nome}`);
  if (vendedorNome) partes.push(`Vendedor: ${vendedorNome}`);

  function salvar() {
    setTentouSalvar(true);
    void v.salvar();
  }

  useAtalho("ctrl+s", salvar);
  useAtalho("ctrl+enter", v.adicionarReserva);
  useAtalho(
    "escape",
    () => {
      v.alternarReserva(abertaIndice);
    },
    abertaIndice >= 0 && !modalAberto,
  );

  const abertaReserva = abertaIndice >= 0 ? reservas[abertaIndice] : undefined;
  const fornecedorAberta = v.fornecedores.find((f) => f.id === abertaReserva?.fornecedorId);

  // I1: publica a altura do cabeçalho sticky para o painel lateral grudar abaixo dele.
  const refTopo = useRef<HTMLDivElement>(null);
  const [topoH, setTopoH] = useState(0);
  useEffect(() => {
    const el = refTopo.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      setTopoH(el.offsetHeight);
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
    };
  }, [v.carregando]);

  function focarPrimeiroErro() {
    const invalido = () => document.querySelector<HTMLElement>('[aria-invalid="true"]');
    const alvo = invalido() ?? document.getElementById(idErroReservas);
    if (alvo) {
      alvo.focus();
      return;
    }
    // Erro só em reserva recolhida: abre a primeira e foca o campo depois do render.
    const i = reservas.findIndex((r, k) => !r.aberta && Object.keys(v.errosReservas[k] ?? {}).length > 0);
    if (i < 0) return;
    v.alternarReserva(i);
    setTimeout(() => invalido()?.focus(), 0);
  }

  if (v.carregando) {
    return (
      <Page>
        <div className={s.area}>
          <div className={s.principal}>
            <Skeleton lines={2} />
            <Skeleton lines={6} />
            <Skeleton lines={4} />
          </div>
          <Skeleton lines={8} />
        </div>
      </Page>
    );
  }

  return (
    <Page dirty={dirty} titulo={v.viagem?.codigo ?? "Nova viagem"} onSalvarESair={v.salvar}>
      <div ref={refTopo} className={s.topo}>
        <nav aria-label="Trilha" className={s.trilha}>
          <Link to="/viagens">Viagens</Link>
          {v.viagem && (
            <>
              <span aria-hidden>/</span>
              <Link to={`/viagens/${v.viagem.id}`}>{v.viagem.codigo}</Link>
            </>
          )}
        </nav>
        <PageHeader
          title={titulo}
          subtitle={partes.length > 0 ? partes.join(" · ") : undefined}
          meta={v.viagem ? <Badge tone="neutral">{v.viagem.codigo}</Badge> : undefined}
          status={<StatusBadge entidade="fase_viagem" valor={v.viagem?.faseOperacional ?? "sem_reserva"} />}
          dirty={dirty}
          salvoEm={v.salvamento.salvoEm}
          actions={
            <>
              {tentouSalvar && v.totalErros > 0 && (
                <Button variant="tertiary" size="sm" className={s.atencao} onClick={focarPrimeiroErro}>
                  {v.totalErros === 1 ? "1 campo precisa de atenção" : `${v.totalErros} campos precisam de atenção`}
                </Button>
              )}
              <Button variant="tertiary" onClick={v.fechar}>
                Fechar
              </Button>
              {/* title em vez de Tooltip: o Tooltip vira <button> e aninharia botões. */}
              <Button variant="business" title="Ctrl+S" loading={v.salvamento.estado === "saving"} onClick={salvar}>
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
                  setTentouSalvar(false);
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
      </div>

      {/* A05: banner de viagem semelhante só faz sentido ao criar; na edição a viagem já existe. */}
      {!id && semelhante && titular && (
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

      <div className={s.area} style={{ "--topo-h": `${topoH}px` } as CSSProperties}>
        <div className={s.principal}>
          <DadosViagemSection
            form={v.form}
            vendedores={v.vendedores}
            mostrarRepasse={verResultado && v.vendedorSelecionado?.geraRepasse === true}
            repasseSugerido={v.repasseSugerido}
            repasseValorMostrado={v.repasseValorMostrado}
            onRepassePercentual={v.definirRepassePercentual}
            onRepasseValor={v.definirRepasseValor}
            erros={v.erros}
            buscarClientes={viagensApi.buscarClientes}
            onNovaPessoa={() => {
              setPessoaAberta(true);
            }}
          />

          <section aria-labelledby={idTituloReservas} className={s.reservas}>
            <header className={s.reservasTopo}>
              <h2 id={idTituloReservas} className={s.blocoTitulo}>
                Reservas{reservas.length > 0 && ` · ${reservas.length}`}
              </h2>
            </header>
            {reservas.length === 0 ? (
              <p id={idErroReservas} tabIndex={-1} className={cx(s.vazio, v.erros.reservas && s.vazioErro)}>
                {v.erros.reservas ? <strong>{v.erros.reservas}</strong> : "Nenhuma reserva ainda."} Toda viagem precisa
                de ao menos uma reserva: fornecedor, localizador e valores.
              </p>
            ) : (
              <div>
                {reservas.map((r, i) => {
                  const duplicada = v.duplicadas[i];
                  return (
                    <ReservationCard
                      key={r.id ?? r.chaveLocal}
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
                      erros={v.errosReservas[i] ?? {}}
                      avisoDuplicada={duplicada ? `Este localizador já está na viagem ${duplicada}.` : null}
                    />
                  );
                })}
              </div>
            )}
            <div className={s.adicionar}>
              <Button variant="secondary" onClick={v.adicionarReserva}>
                + Adicionar reserva
              </Button>
              <span className={s.dica}>
                <kbd>Ctrl</kbd>+<kbd>Enter</kbd>
              </span>
            </div>
          </section>
        </div>

        <TripSummary
          reservas={reservas}
          repasseValor={v.repasseValorMostrado}
          despesas={v.viagem?.resumo?.despesasViagem ?? 0}
          mostrarResultado={verResultado}
          detalheReserva={
            abertaReserva && (
              <>
                <p className={s.blocoTitulo}>
                  Reserva {abertaIndice + 1}
                  {fornecedorAberta ? ` · ${fornecedorAberta.nome}` : ""}
                </p>
                <ResultSummary value={abertaReserva} />
              </>
            )
          }
          rodape={
            <ul className={s.atalhos}>
              <li>
                <kbd>Ctrl</kbd>+<kbd>S</kbd> salvar
              </li>
              <li>
                <kbd>Ctrl</kbd>+<kbd>Enter</kbd> adicionar reserva
              </li>
              <li>
                <kbd>Esc</kbd> recolher
              </li>
              <li>
                <kbd>Ctrl</kbd>+<kbd>K</kbd> buscar
              </li>
            </ul>
          }
        />
      </div>

      <PessoaInlineModal
        open={pessoaAberta}
        onClose={() => {
          setPessoaAberta(false);
        }}
        onCriada={(c) => {
          const atuais = v.form.getValues("passageiros");
          const novo = {
            clienteId: c.id,
            nome: c.nome,
            titular: atuais.length === 0,
            cpf: c.cpf,
            dataNascimento: c.dataNascimento,
          };
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
