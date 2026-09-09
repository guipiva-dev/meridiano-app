import { Button } from "@/components/Button/Button";
import s from "./DataTable.module.css";

export function Paginacao({
  pagina,
  tamanho,
  total,
  onPagina,
}: {
  pagina: number;
  tamanho: number;
  total: number;
  onPagina: (p: number) => void;
}) {
  const inicio = total === 0 ? 0 : (pagina - 1) * tamanho + 1;
  const fim = Math.min(pagina * tamanho, total);
  return (
    <div className={s.paginacao}>
      <span>{`${inicio}–${fim} de ${total}`}</span>
      <Button
        variant="secondary"
        size="sm"
        disabled={pagina <= 1}
        onClick={() => {
          onPagina(pagina - 1);
        }}
      >
        Anterior
      </Button>
      <Button
        variant="secondary"
        size="sm"
        disabled={fim >= total}
        onClick={() => {
          onPagina(pagina + 1);
        }}
      >
        Próxima →
      </Button>
    </div>
  );
}
