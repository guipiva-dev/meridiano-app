import { X } from "lucide-react";
import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { mensagemDeErro } from "@/api/errors";
import type { ClienteBuscaDto } from "@/api/viagens";
import { Button, Field, IconButton, Input } from "@/components";
import { cx } from "@/lib/cx";
import { formatarData } from "@/lib/datas";
import { formatarCpf, formatarTelefone } from "@/lib/documentos";
import s from "./Viagem.module.css";

export interface PassageiroForm {
  clienteId: string;
  nome: string;
  titular: boolean;
  cpf?: string | null;
  dataNascimento?: string | null;
}

interface PassageirosFieldProps {
  value: PassageiroForm[];
  onChange: (v: PassageiroForm[]) => void;
  buscar: (q: string) => Promise<ClienteBuscaDto[]>;
  onNovaPessoa: () => void;
  erro?: string;
}

const DEBOUNCE_MS = 250;

function iniciais(nome: string): string {
  const partes = nome
    .trim()
    .split(/\s+/)
    .filter((t) => /\p{L}/u.test(t));
  const primeira = partes[0]?.[0] ?? "";
  const ultima = partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? "") : "";
  return (primeira + ultima).toUpperCase();
}

export function PassageirosField({ value, onChange, buscar, onNovaPessoa, erro }: PassageirosFieldProps) {
  const [query, setQuery] = useState("");
  const [opcoes, setOpcoes] = useState<ClienteBuscaDto[]>([]);
  const [aberto, setAberto] = useState(false);
  const [ativo, setAtivo] = useState(-1);
  const [erroBusca, setErroBusca] = useState<string>();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const seq = useRef(0); // descarta resposta de busca anterior que chegue depois da atual
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
    seq.current++;
    if (!q.trim()) {
      setOpcoes([]);
      setAberto(false);
      return;
    }
    timer.current = setTimeout(() => {
      const minha = seq.current;
      void buscar(q)
        .then((r) => {
          if (minha !== seq.current) return;
          setOpcoes(r);
          setAberto(true);
          setAtivo(0);
        })
        .catch((erroBuscar: unknown) => {
          if (minha !== seq.current) return;
          setOpcoes([]);
          setAberto(false);
          setErroBusca(mensagemDeErro(erroBuscar));
        });
    }, DEBOUNCE_MS);
  }

  function adicionar(c: ClienteBuscaDto) {
    clearTimeout(timer.current);
    seq.current++;
    setQuery("");
    setOpcoes([]);
    setAberto(false);
    if (value.some((p) => p.clienteId === c.id)) return; // já está na lista: só limpa a busca
    onChange([
      ...value,
      { clienteId: c.id, nome: c.nome, titular: value.length === 0, cpf: c.cpf, dataNascimento: c.dataNascimento },
    ]);
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
    <Field label="Passageiros" error={erro ?? erroBusca}>
      <div className={s.passageiros}>
        <div className={s.buscaLinha}>
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
                    {/* X09: sem isso, dois clientes com o mesmo nome ficam indistinguíveis na lista. */}
                    {(c.telefone ?? c.cpf) && (
                      <span className={s.optionMeta}>
                        {" "}
                        ·{" "}
                        {[c.telefone && formatarTelefone(c.telefone), c.cpf && formatarCpf(c.cpf)]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Button variant="tertiary" size="sm" onClick={onNovaPessoa}>
            + pessoa
          </Button>
        </div>
        {value.length > 0 && (
          <ul className={s.cards} aria-label="Passageiros adicionados">
            {value.map((p) => {
              const meta = [p.cpf && formatarCpf(p.cpf), p.dataNascimento && `nasc. ${formatarData(p.dataNascimento)}`]
                .filter(Boolean)
                .join(" · ");
              return (
                <li key={p.clienteId} className={s.passChip}>
                  <span className={s.avatar} aria-hidden="true">
                    {iniciais(p.nome)}
                  </span>
                  <span className={s.passTexto}>
                    <span className={s.passNome}>{p.nome}</span>
                    {meta && <span className={s.chipMeta}>{meta}</span>}
                  </span>
                  <IconButton
                    label={`Remover ${p.nome}`}
                    icon={<X size={14} />}
                    onClick={() => {
                      remover(p.clienteId);
                    }}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Field>
  );
}
