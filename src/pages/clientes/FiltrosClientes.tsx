import { useEffect, useId, useRef, useState } from "react";
import type { FiltroClientes } from "@/api/clientes";
import type { ListaGrupoDto } from "@/api/grupos";
import { Button, Input, Select } from "@/components";
import { Badge } from "@/components/display";
import s from "./Clientes.module.css";

const PENDENCIA_OPCOES = [
  { value: "com", label: "Com pendência" },
  { value: "urgente", label: "Com pendência urgente" },
  { value: "sem", label: "Sem pendência" },
];
const ULTIMA_VIAGEM_OPCOES = [{ value: "recompra", label: "Há mais de 11 meses (recompra)" }];
const DEBOUNCE_BUSCA_MS = 300;

interface FiltrosClientesProps {
  filtro: FiltroClientes;
  definir: (patch: Partial<FiltroClientes>) => void;
  limpar: () => void;
  ativos: number;
  grupos: ListaGrupoDto[];
}

export function FiltrosClientes({ filtro, definir, limpar, ativos, grupos }: FiltrosClientesProps) {
  const painelId = useId();
  const [aberto, setAberto] = useState(ativos > 0);
  const [busca, setBusca] = useState(filtro.q ?? "");
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Resincroniza a busca visível quando `q` muda por fora da digitação (Limpar, voltar do navegador).
  // Mesmo padrão de FiltrosViagens: ajuste de estado durante a renderização, não efeito.
  const [qAnterior, setQAnterior] = useState(filtro.q);
  if (qAnterior !== filtro.q) {
    setQAnterior(filtro.q);
    setBusca(filtro.q ?? "");
  }

  useEffect(
    () => () => {
      clearTimeout(timerRef.current);
    },
    [],
  );

  function aoDigitar(valor: string) {
    setBusca(valor);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      definir({ q: valor || undefined });
    }, DEBOUNCE_BUSCA_MS);
  }

  return (
    <div className={s.filtros}>
      <div className={s.linha1}>
        <Input
          aria-label="Buscar pessoas"
          placeholder="Nome, CPF, telefone, e-mail…"
          value={busca}
          onChange={(e) => {
            aoDigitar(e.target.value);
          }}
        />
        <Select
          aria-label="Grupo"
          placeholder="Grupo: todos"
          options={grupos.map((g) => ({ value: g.id, label: g.nome }))}
          value={filtro.grupoId ?? ""}
          onChange={(e) => {
            definir({ grupoId: e.target.value || undefined });
          }}
        />
        <Select
          aria-label="Pendências"
          placeholder="Pendências: todas"
          options={PENDENCIA_OPCOES}
          value={filtro.pendencia ?? ""}
          onChange={(e) => {
            definir({ pendencia: (e.target.value || undefined) as FiltroClientes["pendencia"] });
          }}
        />
        <Button
          variant="secondary"
          aria-expanded={aberto}
          aria-controls={painelId}
          onClick={() => {
            setAberto((v) => !v);
          }}
        >
          Filtros {ativos > 0 && <Badge tone="info">● {ativos}</Badge>}
        </Button>
        {(ativos > 0 || filtro.q !== undefined || filtro.grupoId !== undefined || filtro.pendencia !== undefined) && (
          <Button variant="tertiary" onClick={limpar}>
            Limpar
          </Button>
        )}
      </div>

      {aberto && (
        <div id={painelId} className={s.avancados}>
          <Select
            aria-label="Última viagem"
            placeholder="Última viagem: qualquer"
            options={ULTIMA_VIAGEM_OPCOES}
            value={filtro.ultimaViagem ?? ""}
            onChange={(e) => {
              definir({ ultimaViagem: (e.target.value || undefined) as FiltroClientes["ultimaViagem"] });
            }}
          />
        </div>
      )}
    </div>
  );
}
