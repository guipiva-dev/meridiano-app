import { useEffect, useId, useRef, useState } from "react";
import type { FiltroViagens, FornecedorDto, Tipo, VendedorDto } from "@/api/viagens";
import { Button, DateInput, Input, Select } from "@/components";
import { Badge, Chip } from "@/components/display";
import { apresentacaoStatus } from "@/dominio/status";
import type { FiltrosViagensPatch, IdaPreset } from "./useFiltrosViagens";
import s from "./ViagensPage.module.css";

const IDA_OPCOES = [
  { value: "90d", label: "Ida: próximos 90 dias" },
  { value: "mes", label: "Este mês" },
  { value: "qualquer", label: "Qualquer" },
];
const TIPO_OPCOES: { value: Tipo; label: string }[] = [
  { value: "nacional", label: "Nacional" },
  { value: "internacional", label: "Internacional" },
];
const NFSE_VALORES = ["falta_emitir", "emitido", "nao_precisa"] as const;
const DEBOUNCE_BUSCA_MS = 300;

interface FiltrosViagensProps {
  filtro: FiltroViagens;
  idaPreset: IdaPreset;
  definir: (patch: FiltrosViagensPatch) => void;
  limpar: () => void;
  ativos: number;
  vendedores: VendedorDto[];
  fornecedores: FornecedorDto[];
}

export function FiltrosViagens({
  filtro,
  idaPreset,
  definir,
  limpar,
  ativos,
  vendedores,
  fornecedores,
}: FiltrosViagensProps) {
  const painelId = useId();
  const [aberto, setAberto] = useState(ativos > 0);
  const [busca, setBusca] = useState(filtro.q ?? "");
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Resincroniza a busca visível quando `q` muda por fora da digitação (Limpar, voltar/avançar do
  // navegador): sem isso o campo continua mostrando texto que não bate mais com o filtro aplicado.
  // Ajuste de estado durante a renderização com duas setState (não refs, não efeito) — padrão
  // "Storing information from previous renders" do React; evita reagendar o debounce por uma
  // mudança externa (ver react.dev/reference/react/useState#storing-information-from-previous-renders).
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

  function toggleFornecedor(id: string) {
    const atual = filtro.fornecedorId ?? [];
    definir({ fornecedorId: atual.includes(id) ? atual.filter((f) => f !== id) : [...atual, id] });
  }

  return (
    <div className={s.filtros}>
      <div className={s.linha1}>
        <Input
          aria-label="Buscar viagens"
          placeholder="Cliente, destino, localizador…"
          value={busca}
          onChange={(e) => {
            aoDigitar(e.target.value);
          }}
        />
        <Select
          aria-label="Vendedor"
          placeholder="Vendedor: todos"
          options={vendedores.map((v) => ({ value: v.id, label: v.nome }))}
          value={filtro.vendedorId ?? ""}
          onChange={(e) => {
            definir({ vendedorId: e.target.value || undefined });
          }}
        />
        <Select
          aria-label="Ida"
          options={IDA_OPCOES}
          value={idaPreset}
          onChange={(e) => {
            definir({ idaPreset: e.target.value as IdaPreset });
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
        {(ativos > 0 || filtro.q) && (
          <Button variant="tertiary" onClick={limpar}>
            Limpar
          </Button>
        )}
      </div>

      {aberto && (
        <div id={painelId} className={s.avancados}>
          <Select
            aria-label="Tipo"
            placeholder="Tipo: todos"
            options={TIPO_OPCOES}
            value={filtro.tipo ?? ""}
            onChange={(e) => {
              definir({ tipo: (e.target.value || undefined) as Tipo | undefined });
            }}
          />
          <div className={s.chips} role="group" aria-label="Fornecedor">
            {fornecedores.map((f) => (
              <Chip
                key={f.id}
                selected={(filtro.fornecedorId ?? []).includes(f.id)}
                onClick={() => {
                  toggleFornecedor(f.id);
                }}
              >
                {f.nome}
              </Chip>
            ))}
          </div>
          <Select
            aria-label="NFSe"
            placeholder="NFSe: todas"
            options={NFSE_VALORES.map((v) => ({ value: v, label: apresentacaoStatus("nfse", v).texto }))}
            value={filtro.nfse ?? ""}
            onChange={(e) => {
              definir({ nfse: (e.target.value || undefined) as FiltroViagens["nfse"] });
            }}
          />
          <DateInput
            aria-label="Emissão de"
            value={filtro.compraDe ?? ""}
            onChange={(e) => {
              definir({ compraDe: e.target.value || undefined });
            }}
          />
          <DateInput
            aria-label="Emissão até"
            value={filtro.compraAte ?? ""}
            onChange={(e) => {
              definir({ compraAte: e.target.value || undefined });
            }}
          />
        </div>
      )}
    </div>
  );
}
