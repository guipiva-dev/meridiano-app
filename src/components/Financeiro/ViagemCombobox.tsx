import { X } from "lucide-react";
import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import type { BuscaDto } from "@/api/busca";
import { buscaApi } from "@/api/busca";
import { mensagemDeErro } from "@/api/errors";
import { Field, IconButton, Input } from "@/components";
import { cx } from "@/lib/cx";
import s from "./Financeiro.module.css";

export interface ViagemOpcao {
  id: string;
  rotulo: string;
}

interface ViagemComboboxProps {
  value: ViagemOpcao | null;
  onChange: (v: ViagemOpcao | null) => void;
  label?: string;
  helper?: string;
  erro?: string;
}

type ViagemBusca = BuscaDto["viagens"][number];

const DEBOUNCE_MS = 250;

function rotuloDe(v: ViagemBusca): string {
  return `${v.titular} · ${v.destino} · ${v.codigo}`;
}

/** Vincula uma despesa a uma viagem. Mesma receita de teclado do `PassageirosField` (3.2). */
export function ViagemCombobox({ value, onChange, label = "Viagem", helper, erro }: ViagemComboboxProps) {
  const [query, setQuery] = useState("");
  const [opcoes, setOpcoes] = useState<ViagemBusca[]>([]);
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
      void buscaApi
        .buscar(q)
        .then((r) => {
          setOpcoes(r.viagens);
          setAberto(true);
          setAtivo(0);
        })
        .catch((e: unknown) => {
          setOpcoes([]);
          setAberto(false);
          setErroBusca(mensagemDeErro(e));
        });
    }, DEBOUNCE_MS);
  }

  function escolher(v: ViagemBusca) {
    clearTimeout(timer.current);
    onChange({ id: v.id, rotulo: rotuloDe(v) });
    setQuery("");
    setOpcoes([]);
    setAberto(false);
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
      const v = opcoes[ativo >= 0 ? ativo : 0];
      if (v) escolher(v);
    } else if (e.key === "Escape") {
      setAberto(false);
    }
  }

  return (
    <Field label={label} helper={helper} error={erro ?? erroBusca}>
      {value ? (
        <div className={s.combo}>
          <span className={s.selecionada}>{value.rotulo}</span>
          <IconButton
            label="Remover viagem"
            icon={<X size={14} />}
            onClick={() => {
              onChange(null);
            }}
          />
        </div>
      ) : (
        <div className={s.buscaWrap}>
          <Input
            role="combobox"
            aria-expanded={aberto}
            aria-controls={aberto ? listboxId : undefined}
            aria-activedescendant={ativo >= 0 ? `${listboxId}-${ativo}` : undefined}
            autoComplete="off"
            placeholder="Buscar viagem…"
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
              {opcoes.map((v, i) => (
                <li
                  key={v.id}
                  id={`${listboxId}-${i}`}
                  role="option"
                  aria-selected={i === ativo}
                  className={cx(s.option, i === ativo && s.optionAtivo)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    escolher(v);
                  }}
                >
                  {v.titular} · {v.destino} · <code className={s.mono}>{v.codigo}</code>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Field>
  );
}
