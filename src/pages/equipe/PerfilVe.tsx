import { Check, X } from "lucide-react";
import type { PerfilDto } from "@/api/equipe";
import s from "./Equipe.module.css";

interface ItemPerfil {
  ok: boolean;
  texto: string;
}

interface PerfilVeProps {
  perfis: PerfilDto[];
  perfil: string;
}

/** "O que este perfil vê" — quatro linhas derivadas das chaves de permissão do perfil selecionado. */
export function PerfilVe({ perfis, perfil }: PerfilVeProps) {
  const chaves = new Set(perfis.find((p) => p.perfil === perfil)?.permissoes ?? []);
  const tem = (c: string) => chaves.has(c);

  const grupos: [string, ItemPerfil[]][] = [
    [
      "Viagens",
      [
        tem("viagem.ver") ? { ok: true, texto: "todas" } : { ok: tem("viagem.ver_proprias"), texto: "só as próprias" },
        { ok: tem("reserva.ver_valores"), texto: "custo e comissão" },
        { ok: tem("viagem.ver_resultado"), texto: "resultado" },
      ],
    ],
    [
      "Clientes",
      [
        tem("cliente.ver")
          ? { ok: true, texto: "todas" }
          : { ok: tem("cliente.ver_proprios"), texto: "só das próprias viagens" },
        { ok: tem("cliente.ver_documento"), texto: "documentos" },
      ],
    ],
    [
      "Financeiro",
      [
        tem("repasse.ver_todos") ? { ok: true, texto: "repasses" } : { ok: true, texto: "o próprio repasse" },
        { ok: tem("financeiro.conciliar"), texto: "conciliação" },
      ],
    ],
    [
      "Admin",
      [
        { ok: tem("usuario.gerenciar"), texto: "usuários" },
        { ok: tem("auditoria.ver"), texto: "auditoria" },
      ],
    ],
  ];

  return (
    <div className={s.perfilVe}>
      <span className={s.eyebrow}>O que este perfil vê</span>
      {grupos.map(([titulo, itens]) => (
        <div key={titulo} className={s.perfilLinha}>
          <b>{titulo}</b>
          {itens.map((it) => (
            <span key={it.texto} className={it.ok ? s.ok : s.no}>
              {it.ok ? <Check size={14} aria-hidden /> : <X size={14} aria-hidden />}
              {it.texto}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
