import { useMutation } from "@tanstack/react-query";
import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { mensagemDeErro } from "@/api/errors";
import { type GrupoDto, gruposApi, type PessoaDoGrupoDto } from "@/api/grupos";
import { type ClienteBuscaDto, viagensApi } from "@/api/viagens";
import { Button, Input } from "@/components";
import { Alert } from "@/components/display";
import { ConfirmModal } from "@/components/feedback";
import { cx } from "@/lib/cx";
import s from "./Grupos.module.css";

const DEBOUNCE_MS = 250;

interface PessoasDoGrupoProps {
  grupo: GrupoDto;
  podeEditar: boolean;
  onMudou: () => void;
}

/** Lista de pessoas do grupo + busca inline para vincular (mesmo padrão de combobox do PassageirosField). */
export function PessoasDoGrupo({ grupo, podeEditar, onMudou }: PessoasDoGrupoProps) {
  const nav = useNavigate();
  const [removendo, setRemovendo] = useState<PessoaDoGrupoDto>();
  const [query, setQuery] = useState("");
  const [opcoes, setOpcoes] = useState<ClienteBuscaDto[]>([]);
  const [aberto, setAberto] = useState(false);
  const [ativo, setAtivo] = useState(-1);
  const [erroBusca, setErroBusca] = useState<string>();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const listboxId = useId();

  useEffect(() => {
    return () => {
      clearTimeout(timer.current);
    };
  }, []);

  const remover = useMutation({
    mutationFn: (p: PessoaDoGrupoDto) => gruposApi.desvincular(grupo.id, p.id),
    onSuccess: () => {
      setRemovendo(undefined);
      onMudou();
    },
    onError: () => {
      setRemovendo(undefined);
    },
  });

  const vincular = useMutation({
    mutationFn: (c: ClienteBuscaDto) => gruposApi.vincular(grupo.id, c.id),
    onSuccess: () => {
      setQuery("");
      setOpcoes([]);
      setAberto(false);
      onMudou();
    },
  });

  function mudarQuery(q: string) {
    setQuery(q);
    setAtivo(-1);
    setErroBusca(undefined);
    clearTimeout(timer.current);
    if (!q.trim()) {
      setOpcoes([]);
      setAberto(false);
      return;
    }
    timer.current = setTimeout(() => {
      void viagensApi
        .buscarClientes(q)
        .then((r) => {
          setOpcoes(r.filter((c) => !grupo.pessoas.some((p) => p.id === c.id)));
          setAberto(true);
          setAtivo(0);
        })
        .catch((erro: unknown) => {
          setOpcoes([]);
          setAberto(false);
          setErroBusca(mensagemDeErro(erro));
        });
    }, DEBOUNCE_MS);
  }

  function teclado(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      if (!opcoes.length) return;
      e.preventDefault();
      setAtivo((i) => (i + 1) % opcoes.length);
    } else if (e.key === "ArrowUp") {
      if (!opcoes.length) return;
      e.preventDefault();
      setAtivo((i) => (i <= 0 ? opcoes.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      if (!aberto) return;
      e.preventDefault();
      const c = opcoes[ativo >= 0 ? ativo : 0];
      if (c) vincular.mutate(c);
    } else if (e.key === "Escape") {
      setAberto(false);
    }
  }

  return (
    <div className={s.painel}>
      <p className={s.eyebrow}>Pessoas · {grupo.pessoas.length}</p>

      {grupo.pessoas.map((p) => (
        <div key={p.id} className={s.item}>
          <span className={s.nome}>
            {p.nome}
            {p.idade !== null && p.idade < 18 && <span className={s.menor}> · menor · {p.idade} anos</span>}
          </span>
          <div className={s.acoes}>
            <Button
              variant="tertiary"
              size="sm"
              onClick={() => {
                void nav(`/clientes/${p.id}`);
              }}
            >
              Abrir
            </Button>
            {podeEditar && (
              <Button
                variant="tertiary"
                size="sm"
                onClick={() => {
                  setRemovendo(p);
                }}
              >
                Remover
              </Button>
            )}
          </div>
        </div>
      ))}

      {podeEditar && (
        <div className={s.vincular}>
          <span>+ Vincular pessoa</span>
          <div className={s.buscaWrap}>
            <Input
              role="combobox"
              aria-expanded={aberto}
              aria-controls={aberto ? listboxId : undefined}
              aria-activedescendant={ativo >= 0 ? `${listboxId}-${ativo}` : undefined}
              aria-label="Buscar pessoa para vincular"
              autoComplete="off"
              placeholder="Buscar pessoa…"
              value={query}
              onChange={(e) => {
                mudarQuery(e.target.value);
              }}
              onKeyDown={teclado}
              onBlur={() => {
                setAberto(false);
              }}
            />
            {aberto && opcoes.length > 0 && (
              <ul role="listbox" id={listboxId} className={s.listbox}>
                {opcoes.map((c, i) => (
                  <li
                    key={c.id}
                    id={`${listboxId}-${i}`}
                    role="option"
                    aria-selected={i === ativo}
                    className={cx(s.option, i === ativo && s.optionAtivo)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      vincular.mutate(c);
                    }}
                  >
                    {c.nome}
                    {c.telefone && <span className={s.optionMeta}> · {c.telefone}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
      {remover.isError && <Alert tone="danger">{mensagemDeErro(remover.error)}</Alert>}
      {(erroBusca !== undefined || vincular.isError) && (
        <Alert tone="danger">{erroBusca ?? mensagemDeErro(vincular.error)}</Alert>
      )}

      {removendo && (
        <ConfirmModal
          open
          title={`Remover ${removendo.nome} do grupo?`}
          impact="A pessoa sai do grupo. O cadastro dela não é afetado."
          confirmLabel="Remover"
          tone="danger"
          loading={remover.isPending}
          onConfirm={() => {
            remover.mutate(removendo);
          }}
          onCancel={() => {
            setRemovendo(undefined);
          }}
        />
      )}
    </div>
  );
}
