import { clientesApi } from "@/api/clientes";
import { mensagemDeErro } from "@/api/http";
import type { PendenciaDto } from "@/api/pendencias";
import { Button } from "@/components";
import { StatusBadge } from "@/components/display";
import { toast } from "@/components/feedback";
import { type ItemMenu, MenuAcoes } from "@/components/Menu/MenuAcoes";
import { cx } from "@/lib/cx";
import { formatarData } from "@/lib/datas";
import { mensagemDaPendencia, montarLinkWhatsapp } from "@/lib/mensagemWhatsapp";
import s from "./Pendencias.module.css";

interface LinhaPendenciaProps {
  p: PendenciaDto;
  onConcluir: () => void;
  onAdiar: () => void;
  onEditar: () => void;
  onExcluir: () => void;
  podeEditar: boolean;
  /** Escopo pessoa: a viagem deixa de ser óbvia pelo contexto, então entra na meta. */
  mostrarViagem?: boolean;
}

export function LinhaPendencia({
  p,
  onConcluir,
  onAdiar,
  onEditar,
  onExcluir,
  podeEditar,
  mostrarViagem = false,
}: LinhaPendenciaProps) {
  const aberta = p.status === "aberta";
  const titulo = p.clienteNome ? `${p.titulo} — ${p.clienteNome}` : p.titulo;
  // R10: automática só aceita concluir/adiar; editar/excluir dariam 422 pendencia_automatica.
  const itens: ItemMenu[] = [{ label: "Adiar", onClick: onAdiar }];
  if (p.origem === "manual") {
    itens.push({ label: "Editar", onClick: onEditar }, { label: "Excluir", onClick: onExcluir, tone: "danger" });
  }
  const mensagem = mensagemDaPendencia(p);

  function enviarMensagem() {
    if (!mensagem || !p.titularId || !p.titularWhatsapp) return;
    window.open(montarLinkWhatsapp({ whatsapp: p.titularWhatsapp, texto: mensagem.texto }), "_blank", "noopener");
    // Registra o contato; a pendência continua aberta (quem conclui é a pessoa).
    clientesApi
      .criarAtendimento(p.titularId, { canal: "whatsapp", resumo: mensagem.resumo, ocorridoEm: null })
      .catch((e: unknown) => {
        toast.error(mensagemDeErro(e));
      });
  }

  return (
    <div className={s.linha}>
      <input
        type="checkbox"
        className={s.check}
        aria-label={`Concluir ${p.titulo}`}
        checked={!aberta}
        disabled={!podeEditar || !aberta}
        onChange={onConcluir}
      />
      <div className={s.texto}>
        <b className={cx(s.titulo, !aberta && s.concluido)}>{titulo}</b>
        <span className={s.meta}>
          {formatarData(p.dataPrevista)} · {p.origem === "automatica" ? "automática" : "manual"}
          {mostrarViagem && p.codigoViagem && ` · viagem ${p.codigoViagem}`}
          {p.responsavelNome && (
            <span className={s.resp}>
              <span className={s.sep}> · </span>
              {p.responsavelNome}
            </span>
          )}
        </span>
      </div>
      {p.prioridade === "urgente" && aberta && <StatusBadge entidade="prioridade" valor="urgente" />}
      {p.atrasada && aberta && <StatusBadge entidade="pendencia" valor="atrasada" />}
      {/* AC03: "Mostrar concluídas" só riscava o título — sem texto, não dá para confirmar o estado. */}
      {p.status === "concluida" && <StatusBadge entidade="pendencia" valor="concluida" />}
      {podeEditar && aberta && (
        <div className={s.acoes}>
          {mensagem && (
            <Button variant="secondary" size="sm" disabled={!p.titularWhatsapp} onClick={enviarMensagem}>
              {p.titularWhatsapp ? "Enviar mensagem" : "Titular sem WhatsApp"}
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={onConcluir}>
            ✓ Concluir
          </Button>
          <MenuAcoes label={`Mais ações de ${p.titulo}`} itens={itens} />
        </div>
      )}
    </div>
  );
}
