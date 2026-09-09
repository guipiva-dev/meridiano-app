import { forwardRef, type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { type BuscaDto, buscaApi } from "@/api/busca";
import { mensagemDeErro } from "@/api/http";
import { Input } from "@/components";
import { StatusBadge } from "@/components/display";
import { toast } from "@/components/feedback";
import { useAtalho } from "@/lib/useAtalho";
import s from "./BuscaGlobal.module.css";

const DEBOUNCE_MS = 250;
const MIN_CHARS = 2;

type Item =
  | { tipo: "cliente"; id: string; nome: string; telefone: string | null }
  | { tipo: "viagem"; id: string; codigo: string; destino: string; titular: string; faseOperacional: string }
  | {
      tipo: "reserva";
      reservaId: string;
      viagemId: string;
      codigo: string;
      localizador: string;
      fornecedorNome: string;
    };

function itens(r: BuscaDto | undefined): Item[] {
  if (!r) return [];
  return [
    ...r.clientes.map((c): Item => ({ tipo: "cliente", ...c })),
    ...r.viagens.map((v): Item => ({ tipo: "viagem", ...v })),
    ...r.reservas.map((rv): Item => ({ tipo: "reserva", ...rv })),
  ];
}

export const BuscaGlobal = forwardRef<HTMLInputElement>(function BuscaGlobal(_, ref) {
  const nav = useNavigate();
  const [query, setQuery] = useState("");
  const [resultado, setResultado] = useState<BuscaDto>();
  const [aberto, setAberto] = useState(false);
  const [ativo, setAtivo] = useState(-1);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const queryRef = useRef("");
  const listboxId = useId();

  useEffect(() => {
    return () => {
      clearTimeout(timer.current);
    };
  }, []);

  const lista = itens(resultado);

  function mudarQuery(q: string) {
    setQuery(q);
    queryRef.current = q;
    setAtivo(-1);
    clearTimeout(timer.current);
    if (q.trim().length < MIN_CHARS) {
      setResultado(undefined);
      setAberto(false);
      return;
    }
    timer.current = setTimeout(() => {
      void buscaApi
        .buscar(q)
        .then((r) => {
          if (queryRef.current !== q) return;
          setResultado(r);
          setAberto(true);
          setAtivo(itens(r).length > 0 ? 0 : -1);
        })
        .catch((e: unknown) => {
          if (queryRef.current !== q) return;
          toast.error(mensagemDeErro(e));
          setResultado(undefined);
          setAberto(false);
        });
    }, DEBOUNCE_MS);
  }

  function fechar() {
    setAberto(false);
  }
  useAtalho("escape", fechar, aberto);

  function escolher(item: Item) {
    clearTimeout(timer.current);
    if (item.tipo === "cliente") void nav(`/clientes/${item.id}`);
    else if (item.tipo === "viagem") void nav(`/viagens/${item.id}`);
    else void nav(`/viagens/${item.viagemId}?reserva=${item.reservaId}`);
    setQuery("");
    queryRef.current = "";
    setResultado(undefined);
    setAberto(false);
    setAtivo(-1);
  }

  function teclado(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      if (!lista.length) return;
      e.preventDefault();
      setAtivo((i) => (i + 1) % lista.length);
    } else if (e.key === "ArrowUp") {
      if (!lista.length) return;
      e.preventDefault();
      setAtivo((i) => (i <= 0 ? lista.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      if (!aberto) return;
      const item = lista[ativo >= 0 ? ativo : 0];
      if (item) {
        e.preventDefault();
        escolher(item);
      }
    }
  }

  const grupos: { titulo: string; offset: number; itens: Item[] }[] = resultado
    ? [
        { titulo: "Clientes", offset: 0, itens: lista.filter((i) => i.tipo === "cliente") },
        {
          titulo: "Viagens",
          offset: resultado.clientes.length,
          itens: lista.filter((i) => i.tipo === "viagem"),
        },
        {
          titulo: "Reservas",
          offset: resultado.clientes.length + resultado.viagens.length,
          itens: lista.filter((i) => i.tipo === "reserva"),
        },
      ].filter((g) => g.itens.length > 0)
    : [];

  return (
    <>
      <Input
        ref={ref}
        aria-label="Buscar"
        placeholder="Buscar cliente, viagem, localizador…"
        role="combobox"
        aria-expanded={aberto}
        aria-controls={aberto ? listboxId : undefined}
        aria-activedescendant={aberto && ativo >= 0 ? `${listboxId}-${ativo}` : undefined}
        autoComplete="off"
        value={query}
        onChange={(e) => {
          mudarQuery(e.target.value);
        }}
        onKeyDown={teclado}
        onBlur={fechar}
      />
      {aberto && (
        <div id={listboxId} role="listbox" aria-label="Resultados da busca" className={s.popover}>
          {grupos.length === 0 && <p className={s.vazio}>Nada encontrado para “{query}”</p>}
          {grupos.map((g) => (
            <div key={g.titulo} role="group" aria-label={g.titulo} className={s.grupo}>
              <p className={s.grupoTitulo}>{g.titulo}</p>
              {g.itens.map((item, i) => {
                const indice = g.offset + i;
                return (
                  <div
                    key={item.tipo === "cliente" ? item.id : item.tipo === "viagem" ? item.id : item.reservaId}
                    id={`${listboxId}-${indice}`}
                    role="option"
                    tabIndex={-1}
                    aria-selected={indice === ativo}
                    className={indice === ativo ? `${s.option} ${s.optionAtivo}` : s.option}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      escolher(item);
                    }}
                  >
                    {item.tipo === "cliente" && (
                      <>
                        {item.nome}
                        {item.telefone && <span className={s.optionMeta}> · {item.telefone}</span>}
                      </>
                    )}
                    {item.tipo === "viagem" && (
                      <>
                        {item.titular} · {item.destino} · <code>{item.codigo}</code>{" "}
                        <StatusBadge entidade="fase_viagem" valor={item.faseOperacional} />
                      </>
                    )}
                    {item.tipo === "reserva" && (
                      <>
                        <code>{item.localizador}</code> · {item.fornecedorNome} · {item.codigo}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </>
  );
});
