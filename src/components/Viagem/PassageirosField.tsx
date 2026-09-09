import { X } from "lucide-react";
import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { mensagemDeErro } from "@/api/errors";
import type { ClienteBuscaDto } from "@/api/viagens";
import { Button, Field, IconButton, Input } from "@/components";
import { Chip } from "@/components/display";
import { cx } from "@/lib/cx";
import s from "./Viagem.module.css";

export interface PassageiroForm {
  clienteId: string;
  nome: string;
  titular: boolean;
}

interface PassageirosFieldProps {
  value: PassageiroForm[];
  onChange: (v: PassageiroForm[]) => void;
  buscar: (q: string) => Promise<ClienteBuscaDto[]>;
  onNovaPessoa: () => void;
  erro?: string;
}

const DEBOUNCE_MS = 250;

export function PassageirosField({ value, onChange, buscar, onNovaPessoa, erro }: PassageirosFieldProps) {
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
      void buscar(q)
        .then((r) => {
          setOpcoes(r);
          setAberto(true);
          setAtivo(0);
        })
        .catch((erroBuscar: unknown) => {
          setOpcoes([]);
          setAberto(false);
          setErroBusca(mensagemDeErro(erroBuscar));
        });
    }, DEBOUNCE_MS);
  }

  function adicionar(c: ClienteBuscaDto) {
    clearTimeout(timer.current);
    if (value.some((p) => p.clienteId === c.id)) return;
    onChange([...value, { clienteId: c.id, nome: c.nome, titular: value.length === 0 }]);
    setQuery("");
    setOpcoes([]);
    setAberto(false);
  }

  function tornarTitular(id: string) {
    onChange(value.map((p) => ({ ...p, titular: p.clienteId === id })));
  }

  function remover(id: string) {
    const restante = value.filter((p) => p.clienteId !== id);
    const primeiro = restante[0];
    if (primeiro && !restante.some((p) => p.titular)) {
      onChange(restante.map((p) => (p.clienteId === primeiro.clienteId ? { ...p, titular: true } : p)));
      return;
    }
    onChange(restante);
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
      if (c) adicionar(c);
    } else if (e.key === "Escape") {
      setAberto(false);
    }
  }

  return (
    <Field label="Passageiros" tooltip="O titular (contorno laranja) é o contato da viagem" error={erro ?? erroBusca}>
      <div className={s.passageiros}>
        <div className={s.chips}>
          {value.map((p) => (
            <span key={p.clienteId} className={s.passChip}>
              <Chip
                selected
                className={p.titular ? s.titular : undefined}
                onClick={() => {
                  tornarTitular(p.clienteId);
                }}
              >
                {p.nome}
                {p.titular && <span className={s.srOnly}> titular</span>}
              </Chip>
              <IconButton
                label={`Remover ${p.nome}`}
                icon={<X size={14} />}
                onClick={() => {
                  remover(p.clienteId);
                }}
              />
            </span>
          ))}
        </div>
        <div className={s.buscaWrap}>
          <Input
            role="combobox"
            aria-expanded={aberto}
            aria-controls={aberto ? listboxId : undefined}
            aria-activedescendant={ativo >= 0 ? `${listboxId}-${ativo}` : undefined}
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
                    adicionar(c);
                  }}
                >
                  {c.nome}
                  {c.telefone && <span className={s.optionMeta}> · {c.telefone}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
        <Button variant="tertiary" size="sm" onClick={onNovaPessoa}>
          + pessoa
        </Button>
      </div>
    </Field>
  );
}
