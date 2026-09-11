import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { AtualizarUsuarioRequest, ColaboradorDto, NovoColaboradorRequest, PerfilDto } from "@/api/equipe";
import { chavesEquipe, equipeApi } from "@/api/equipe";
import { ConflictError, mensagemDeErro, ValidationError } from "@/api/errors";
import type { ErrosApi } from "@/components/Cadastros/mapaErrosCadastro";
import { useFormularioCadastro } from "@/components/cadastros";
import { toast } from "@/components/feedback";

export interface FormColaborador {
  nome: string;
  email: string;
  telefone: string;
  perfil: string;
  geraRepasse: boolean;
  percentualPadrao: number;
  ativo: boolean;
}

const VAZIO: FormColaborador = {
  nome: "",
  email: "",
  telefone: "",
  perfil: "agente",
  geraRepasse: false,
  percentualPadrao: 0,
  ativo: true,
};

function paraForm(c: ColaboradorDto): FormColaborador {
  return {
    nome: c.nome,
    email: c.email,
    telefone: c.telefone ?? "",
    perfil: c.perfil,
    geraRepasse: c.geraRepasse,
    percentualPadrao: c.percentualPadrao,
    ativo: c.ativo,
  };
}

/** Com `versao` monta o PUT (sem e-mail); sem, o POST (com e-mail, sem ativo). */
function paraRequest(f: FormColaborador, versao?: string): AtualizarUsuarioRequest | NovoColaboradorRequest {
  const comum = {
    nome: f.nome,
    telefone: f.telefone || null,
    perfil: f.perfil,
    geraRepasse: f.geraRepasse,
    percentualPadrao: f.percentualPadrao,
  };
  return versao ? { ...comum, ativo: f.ativo, versao } : { ...comum, email: f.email };
}

const CAMPO_POR_CODIGO: Record<string, string> = {
  nome_obrigatorio: "nome",
  email_ja_cadastrado: "email",
  email_invalido: "email",
  perfil_invalido: "perfil",
  percentual_invalido: "percentualPadrao",
};

function errosDeColaborador(erro: unknown): ErrosApi {
  if (erro === null || erro === undefined) return { campos: {}, bloco: null, conflito: false };
  if (erro instanceof ConflictError) return { campos: {}, bloco: null, conflito: true };
  if (erro instanceof ValidationError) {
    if (erro.codigo === "ultimo_dono") {
      return { campos: {}, bloco: "A agência precisa de ao menos um Dono ativo", conflito: false };
    }
    const campo = CAMPO_POR_CODIGO[erro.codigo];
    if (campo) return { campos: { [campo]: erro.detalhe }, bloco: null, conflito: false };
  }
  return { campos: {}, bloco: mensagemDeErro(erro), conflito: false };
}

/** Cadastro de colaborador: receita comum de cadastro + perfis + convite. */
export function useColaborador(id: string | undefined) {
  const qc = useQueryClient();
  const base = useFormularioCadastro<FormColaborador, ColaboradorDto>({
    id,
    carregar: equipeApi.obter,
    chave: chavesEquipe.item,
    paraForm,
    paraRequest,
    criar: (req) => equipeApi.criar(req as NovoColaboradorRequest),
    atualizar: (uid, req) => equipeApi.atualizar(uid, req as AtualizarUsuarioRequest),
    rotaDepoisDeCriar: (d) => `/equipe/${d.id}`,
    versaoDe: (d) => d.versao,
    errosDe: errosDeColaborador,
    defaultValues: VAZIO,
  });

  const perfisQ = useQuery({ queryKey: chavesEquipe.perfis(), queryFn: equipeApi.perfis });

  const convidar = useCallback(async () => {
    if (!id) return;
    try {
      const atualizado = await equipeApi.convidar(id);
      qc.setQueryData(chavesEquipe.item(id), atualizado);
      toast.success(`Convite enviado para ${atualizado.email}`);
    } catch (e) {
      toast.error(mensagemDeErro(e));
    }
  }, [id, qc]);

  return { ...base, perfis: perfisQ.data ?? ([] as PerfilDto[]), convidar };
}
