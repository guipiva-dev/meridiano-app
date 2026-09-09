import type { ViagemSemelhanteDto } from "@/api/viagens";
import { Button } from "@/components";
import { Alert } from "@/components/display";
import { apresentacaoStatus } from "@/dominio/status";
import s from "./Viagem.module.css";

interface AvisoViagemSemelhanteProps {
  item: ViagemSemelhanteDto;
  titularNome: string;
  onAdicionarNaExistente: () => void;
  onAbrir: () => void;
  onContinuar: () => void;
}

function ddmm(iso: string | null): string | null {
  if (!iso) return null;
  const [, m, d] = iso.split("-");
  return m && d ? `${d}/${m}` : null;
}

function periodo(dataIda: string | null, dataVolta: string | null): string | null {
  const ida = ddmm(dataIda);
  const volta = ddmm(dataVolta);
  if (ida && volta) return `${ida}–${volta}`;
  return ida ?? volta;
}

export function AvisoViagemSemelhante({
  item,
  titularNome,
  onAdicionarNaExistente,
  onAbrir,
  onContinuar,
}: AvisoViagemSemelhanteProps) {
  const fase = apresentacaoStatus("fase_viagem", item.faseOperacional);
  const per = periodo(item.dataIda, item.dataVolta);
  return (
    <Alert
      tone={item.sobrepoe ? "warning" : "info"}
      title={`Encontramos uma viagem semelhante para ${titularNome}`}
      action={
        <div className={s.avisoAcoes}>
          <Button variant="primary" size="sm" onClick={onAdicionarNaExistente}>
            Adicionar reserva à viagem existente
          </Button>
          <Button variant="secondary" size="sm" onClick={onAbrir}>
            Abrir viagem
          </Button>
          <Button variant="tertiary" size="sm" onClick={onContinuar}>
            Continuar criando nova
          </Button>
        </div>
      }
    >
      <span className={s.mono}>{item.codigo}</span> · {item.destino}
      {per && ` · ${per}`} · {fase.texto}
    </Alert>
  );
}
