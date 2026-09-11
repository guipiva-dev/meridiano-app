import { useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { type KeyboardEvent, type SubmitEvent, useId, useRef, useState } from "react";
import { clientesApi } from "@/api/clientes";
import { ConflictError, ValidationError } from "@/api/errors";
import { mensagemDeErro } from "@/api/http";
import { type PendenciaDto, type Prioridade, pendenciasApi } from "@/api/pendencias";
import { type ClienteBuscaDto, viagensApi } from "@/api/viagens";
import { Button, DateInput, Field, IconButton, Input, Select } from "@/components";
import { Alert, Chip } from "@/components/display";
import { Modal } from "@/components/feedback";
import { cx } from "@/lib/cx";
import { hojeIso } from "@/lib/datas";
import { type EscopoPendencias, fontePendencias } from "./escopo";
import s from "./Pendencias.module.css";

/** Só os campos usados no `<Select>` de responsável — cabe tanto `VendedorDto` quanto `ResponsavelDto` da Agenda. */
interface ResponsavelOpcao {
  id: string;
  nome: string;
}

interface NovaPendenciaModalProps {
  open: boolean;
  escopo: EscopoPendencias;
  vendedores: ResponsavelOpcao[];
  /** Quando presente, o modal edita essa pendência (sem "Para quem"). */
  pendencia?: PendenciaDto;
  onClose: () => void;
  onSalva: () => void;
}

const DEBOUNCE_MS = 250;

const PRIORIDADES = [
  { value: "normal", label: "Normal" },
  { value: "urgente", label: "Urgente" },
];

export function NovaPendenciaModal({ open, escopo, vendedores, pendencia, onClose, onSalva }: NovaPendenciaModalProps) {
  const qc = useQueryClient();
  const idForm = useId();
  const listboxId = useId();
  const pessoa = "clienteId" in escopo ? escopo : null;
  const daViagem = "viagemId" in escopo ? escopo : null;
  const agenda = "agenda" in escopo ? escopo : null;
  // O chamador monta o modal só quando abre, então o estado inicial já é o "reset".
  const [titulo, setTitulo] = useState(pendencia?.titulo ?? "");
  const [dataPrevista, setDataPrevista] = useState(() => pendencia?.dataPrevista ?? hojeIso());
  const [responsavelId, setResponsavelId] = useState(pendencia?.responsavelId ?? "");
  const [prioridade, setPrioridade] = useState<Prioridade>(pendencia?.prioridade ?? "normal");
  const [clienteIds, setClienteIds] = useState<string[]>([]);
  const [viagemId, setViagemId] = useState("");
  const [pessoaAgenda, setPessoaAgenda] = useState<ClienteBuscaDto | null>(null);
  const [pessoaQuery, setPessoaQuery] = useState("");
  const [pessoaOpcoes, setPessoaOpcoes] = useState<ClienteBuscaDto[]>([]);
  const [pessoaAberta, setPessoaAberta] = useState(false);
  const [pessoaAtiva, setPessoaAtiva] = useState(-1);
  const [erroTitulo, setErroTitulo] = useState<string>();
  const [erroBloco, setErroBloco] = useState<string>();
  const [salvando, setSalvando] = useState(false);
  const pessoaTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const passageiros = daViagem?.passageiros ?? [];
  const viagens = (pessoa?.viagens ?? []).filter((v) => v.faseOperacional !== "cancelada");

  function alternar(clienteId: string) {
    setClienteIds((atual) =>
      atual.includes(clienteId) ? atual.filter((c) => c !== clienteId) : [...atual, clienteId],
    );
  }

  function buscarPessoaAgenda(q: string) {
    setPessoaQuery(q);
    setPessoaAtiva(-1);
    clearTimeout(pessoaTimer.current);
    if (!q.trim()) {
      setPessoaOpcoes([]);
      setPessoaAberta(false);
      return;
    }
    pessoaTimer.current = setTimeout(() => {
      viagensApi
        .buscarClientes(q)
        .then((r) => {
          setPessoaOpcoes(r);
          setPessoaAberta(true);
          setPessoaAtiva(0);
        })
        .catch(() => {
          setPessoaOpcoes([]);
          setPessoaAberta(false);
        });
    }, DEBOUNCE_MS);
  }

  function tecladoPessoa(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (!pessoaOpcoes.length) return;
      e.preventDefault();
      const n = pessoaOpcoes.length;
      setPessoaAtiva((i) => (e.key === "ArrowDown" ? (i + 1) % n : i <= 0 ? n - 1 : i - 1));
    } else if (e.key === "Enter") {
      if (!pessoaAberta) return;
      e.preventDefault();
      const c = pessoaOpcoes[pessoaAtiva >= 0 ? pessoaAtiva : 0];
      if (c) selecionarPessoaAgenda(c);
    } else if (e.key === "Escape") {
      setPessoaAberta(false);
    }
  }

  function selecionarPessoaAgenda(c: ClienteBuscaDto) {
    clearTimeout(pessoaTimer.current);
    setPessoaAgenda(c);
    setPessoaQuery("");
    setPessoaOpcoes([]);
    setPessoaAberta(false);
  }

  async function enviar(e?: SubmitEvent<HTMLFormElement>) {
    e?.preventDefault();
    setErroBloco(undefined);
    if (!titulo.trim()) {
      setErroTitulo("Descreva o que precisa ser feito");
      return;
    }
    setErroTitulo(undefined);
    setSalvando(true);
    const base = {
      titulo: titulo.trim(),
      descricao: null,
      dataPrevista,
      responsavelId: responsavelId === "" ? null : responsavelId,
      prioridade,
    };
    try {
      if (pendencia) await pendenciasApi.atualizar(pendencia.id, { ...base, versao: pendencia.versao });
      else if (pessoa)
        await clientesApi.criarPendencia(pessoa.clienteId, { ...base, viagemId: viagemId === "" ? null : viagemId });
      else if (agenda) await pendenciasApi.criarSolta({ ...base, clienteIds: pessoaAgenda ? [pessoaAgenda.id] : [] });
      else if (daViagem) await pendenciasApi.criar(daViagem.viagemId, { ...base, clienteIds });
      onSalva();
      onClose();
    } catch (erro) {
      if (erro instanceof ValidationError && erro.codigo === "titulo_obrigatorio") setErroTitulo(erro.detalhe);
      else setErroBloco(mensagemDeErro(erro));
      // 409: a `versao` em mãos morreu. Recarrega a lista atrás do modal para o próximo clique
      // usar a versão nova, senão o usuário fica preso em 409 para sempre.
      if (erro instanceof ConflictError) void qc.invalidateQueries({ queryKey: fontePendencias(escopo).prefixo });
      setSalvando(false);
    }
  }

  const quantidade = clienteIds.length === 0 ? 1 : clienteIds.length;
  const rotulo = pendencia
    ? "Salvar"
    : pessoa || agenda
      ? "Criar pendência"
      : `Criar ${quantidade} ${quantidade === 1 ? "pendência" : "pendências"}`;

  return (
    <Modal
      open={open}
      title={pendencia ? "Editar pendência" : "Nova pendência"}
      onClose={onClose}
      footer={
        <>
          <Button variant="tertiary" onClick={onClose}>
            Voltar
          </Button>
          <Button variant="primary" type="submit" form={idForm} loading={salvando}>
            {rotulo}
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
        {erroBloco && <Alert tone="danger">{erroBloco}</Alert>}
        <Field label="O que precisa ser feito" required error={erroTitulo}>
          <Input
            value={titulo}
            placeholder="Ex.: enviar voucher do hotel"
            onChange={(e) => {
              setTitulo(e.target.value);
            }}
          />
        </Field>
        <Field label="Data" required>
          <DateInput
            value={dataPrevista}
            onChange={(e) => {
              setDataPrevista(e.target.value);
            }}
          />
        </Field>
        <Field label="Responsável">
          <Select
            value={responsavelId}
            placeholder="Sem responsável"
            options={vendedores.map((v) => ({ value: v.id, label: v.nome }))}
            onChange={(e) => {
              setResponsavelId(e.target.value);
            }}
          />
        </Field>
        <Field label="Prioridade">
          <Select
            value={prioridade}
            options={PRIORIDADES}
            onChange={(e) => {
              setPrioridade(e.target.value as Prioridade);
            }}
          />
        </Field>
        {!pendencia && pessoa && (
          <Field label="Viagem relacionada (opcional)">
            <Select
              value={viagemId}
              placeholder="Sem viagem"
              options={viagens.map((v) => ({ value: v.id, label: `${v.destino} · ${v.codigo}` }))}
              onChange={(e) => {
                setViagemId(e.target.value);
              }}
            />
          </Field>
        )}
        {!pendencia && !pessoa && !agenda && (
          <Field label="Para quem" helper="Uma pendência por passageiro selecionado; sem seleção, fica na viagem.">
            <div className={s.chips}>
              {passageiros.map((p) => (
                <Chip
                  key={p.clienteId}
                  selected={clienteIds.includes(p.clienteId)}
                  onClick={() => {
                    alternar(p.clienteId);
                  }}
                >
                  {p.nome}
                </Chip>
              ))}
              {passageiros.length > 1 && (
                <Button
                  variant="tertiary"
                  size="sm"
                  onClick={() => {
                    setClienteIds(clienteIds.length === passageiros.length ? [] : passageiros.map((p) => p.clienteId));
                  }}
                >
                  Todos
                </Button>
              )}
            </div>
          </Field>
        )}
        {!pendencia && agenda && (
          <Field label="Pessoa (opcional)">
            {pessoaAgenda ? (
              <div className={s.chips}>
                <span className={s.passChip}>
                  <Chip selected onClick={() => undefined}>
                    {pessoaAgenda.nome}
                  </Chip>
                  <IconButton
                    label={`Remover ${pessoaAgenda.nome}`}
                    icon={<X size={14} />}
                    onClick={() => {
                      setPessoaAgenda(null);
                    }}
                  />
                </span>
              </div>
            ) : (
              <div className={s.buscaWrap}>
                <Input
                  role="combobox"
                  aria-expanded={pessoaAberta}
                  aria-controls={pessoaAberta ? listboxId : undefined}
                  aria-activedescendant={pessoaAtiva >= 0 ? `${listboxId}-${pessoaAtiva}` : undefined}
                  autoComplete="off"
                  placeholder="Buscar pessoa…"
                  value={pessoaQuery}
                  onChange={(e) => {
                    buscarPessoaAgenda(e.target.value);
                  }}
                  onKeyDown={tecladoPessoa}
                  onBlur={() => {
                    setPessoaAberta(false);
                  }}
                />
                {pessoaAberta && pessoaOpcoes.length > 0 && (
                  <ul role="listbox" id={listboxId} className={s.listbox}>
                    {pessoaOpcoes.map((c, i) => (
                      <li
                        key={c.id}
                        id={`${listboxId}-${i}`}
                        role="option"
                        aria-selected={i === pessoaAtiva}
                        className={cx(s.option, i === pessoaAtiva && s.optionAtivo)}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          selecionarPessoaAgenda(c);
                        }}
                      >
                        {c.nome}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </Field>
        )}
      </form>
    </Modal>
  );
}
