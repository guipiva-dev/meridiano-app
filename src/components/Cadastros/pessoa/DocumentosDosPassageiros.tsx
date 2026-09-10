import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { chavesClientes, clientesApi } from "@/api/clientes";
import type { PassageiroDto } from "@/api/viagens";
import { Badge } from "@/components/display";
import { Skeleton } from "@/components/feedback";
import { apresentacaoStatus } from "@/dominio/status";
import { formatarData } from "@/lib/datas";
import { situacaoValidade } from "@/lib/documentos";
import s from "./Pessoa.module.css";

/** R11: os documentos dos passageiros aparecem na aba Documentos da viagem, em modo leitura. */
function LinhasDoPassageiro({ passageiro }: { passageiro: PassageiroDto }) {
  const { clienteId, nome } = passageiro;
  const q = useQuery({
    queryKey: chavesClientes.documentos(clienteId),
    queryFn: () => clientesApi.documentos(clienteId),
  });
  const link = (
    <Link className={s.link} to={`/clientes/${clienteId}?tab=documentos`}>
      Abrir cadastro
    </Link>
  );

  if (q.isPending) {
    return (
      <div className={s.item}>
        <Skeleton lines={1} />
      </div>
    );
  }
  const documentos = q.data ?? [];
  if (documentos.length === 0) {
    return (
      <div className={s.item}>
        <span className={s.texto}>{nome} · Sem documentos cadastrados</span>
        {link}
      </div>
    );
  }
  return (
    <>
      {documentos.map((d) => {
        const situacao = situacaoValidade(d.diasParaVencer);
        return (
          <div key={d.id} className={s.item}>
            <span className={s.texto}>
              {nome} · {apresentacaoStatus("documento_tipo", d.tipo).texto} ·{" "}
              <code className={s.mono}>{d.numero ?? "•••••"}</code> · validade {formatarData(d.validade)}
            </span>
            {d.diasParaVencer !== null && <Badge tone={situacao.tone}>{situacao.texto}</Badge>}
            {link}
          </div>
        );
      })}
    </>
  );
}

export function DocumentosDosPassageiros({ passageiros }: { passageiros: PassageiroDto[] }) {
  return (
    <div className={s.bloco}>
      <div className={s.cabecalho}>
        <h3 className={s.titulo}>Documentos dos passageiros</h3>
        <span className={s.meta}>Cadastro de cada pessoa · acesso registrado (LGPD)</span>
      </div>
      {passageiros.map((p) => (
        <LinhasDoPassageiro key={p.clienteId} passageiro={p} />
      ))}
    </div>
  );
}
