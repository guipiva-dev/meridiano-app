import { useRef, useState } from "react";
import { mensagemDeErro } from "@/api/errors";
import type { RepasseItemDto, VendedorRepassesDto } from "@/api/repasses";
import { repassesApi } from "@/api/repasses";
import { Button, MoneyInput, MoneyValue } from "@/components";
import { Badge, StatusBadge } from "@/components/display";
import { toast } from "@/components/feedback";
import { formatarData } from "@/lib/datas";
import { formatarDinheiro } from "@/lib/dinheiro";
import s from "./Repasses.module.css";

interface VendedorCardProps {
  vendedor: VendedorRepassesDto;
  /** Ano de referência das "N viagens em {ano}" do cabeçalho (`RepassesDto.ano`). */
  ano: number;
  historico: boolean;
  podePagar: boolean;
  onPagar: (itens: RepasseItemDto[]) => void;
  onValorSalvo: () => void;
}

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? "";
  const ultima = partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? "") : "";
  return `${primeira}${ultima}`.toUpperCase();
}

/** dd/mm/yyyy → dd/mm: o protótipo mostra a data do repasse sem ano. */
function diaMes(iso: string | null): string {
  return formatarData(iso).slice(0, 5);
}

function textoItem(item: RepasseItemDto): string {
  if (item.status === "pago") {
    const data = `pago em ${diaMes(item.pagoEm)}`;
    return item.observacao ? `${data} · ${item.observacao}` : data;
  }
  if (item.status === "bloqueado") {
    return `aguardando ${item.aguardando} comiss${item.aguardando === 1 ? "ão" : "ões"}`;
  }
  if (item.valor === null) return "sem valor definido";
  return `comissão recebida ${diaMes(item.ultimoRecebimentoEm)}`;
}

/** Valor do item: `MoneyValue` fixo, ou `MoneyInput` quando ainda não definido e o perfil pode pagar. */
function ValorItem({
  item,
  editavel,
  onValorSalvo,
}: {
  item: RepasseItemDto;
  editavel: boolean;
  onValorSalvo: () => void;
}) {
  const [valor, setValor] = useState<number | null>(item.valor);
  const [salvando, setSalvando] = useState(false);
  // Enter dispara salvar() diretamente e o blur que se segue dispara de novo: guarda síncrona (ref, não state) evita o duplo envio.
  const emVoo = useRef(false);

  async function salvar() {
    if (valor === null || valor === item.valor || emVoo.current) return;
    emVoo.current = true;
    setSalvando(true);
    try {
      await repassesApi.definirValor(item.id, valor, item.versao);
      toast.success("Valor informado");
    } catch (erro) {
      toast.error(mensagemDeErro(erro));
    } finally {
      setSalvando(false);
      emVoo.current = false;
    }
    onValorSalvo();
  }

  if (item.valor !== null || !editavel) return <MoneyValue value={item.valor} />;

  return (
    <MoneyInput
      aria-label={`Valor do repasse de ${item.codigo}`}
      value={valor}
      onChange={setValor}
      disabled={salvando}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          void salvar();
        }
      }}
      onBlur={() => {
        void salvar();
      }}
    />
  );
}

export function VendedorCard({ vendedor, ano, historico, podePagar, onPagar, onValorSalvo }: VendedorCardProps) {
  const aPagar = vendedor.itens.filter((i) => i.status === "a_pagar" && i.valor !== null);
  const liberado = aPagar.reduce((soma, i) => soma + (i.valor ?? 0), 0);
  const editavel = podePagar && !historico;

  return (
    <div className={s.card} id={`vendedor-${vendedor.usuarioId}`}>
      <div className={s.cabecalho}>
        <div className={s.avatar} aria-hidden>
          {iniciais(vendedor.nome)}
        </div>
        <div className={s.identidade}>
          <span className={s.nome}>{vendedor.nome}</span>
          <span className={s.secundario}>
            vendedor(a) externo(a) · {vendedor.viagensAno} viagens em {ano}
          </span>
        </div>
        <div className={s.total}>
          <MoneyValue value={vendedor.aPagarValor} />
          <span className={s.secundario}>a pagar · {vendedor.aPagarViagens} viagens</span>
        </div>
      </div>

      <ul className={s.itens}>
        {vendedor.itens.map((item) => (
          <li key={item.id} className={s.item}>
            <div className={s.info}>
              <span className={s.titulo}>
                {item.titular} · {item.destino}
              </span>
              <span className={s.secundario}>
                <code>{item.codigo}</code> · {textoItem(item)}
              </span>
            </div>
            {item.valor === null ? (
              <Badge tone="warning">informar valor</Badge>
            ) : (
              <StatusBadge entidade="repasse" valor={item.status} />
            )}
            <ValorItem item={item} editavel={editavel} onValorSalvo={onValorSalvo} />
          </li>
        ))}
      </ul>

      {!historico && liberado > 0 && (
        <div className={s.rodape}>
          <span>
            Liberado: <MoneyValue value={liberado} /> em {aPagar.length} viagens
          </span>
          {podePagar && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onPagar(aPagar);
              }}
            >
              Pagar {formatarDinheiro(liberado)}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
