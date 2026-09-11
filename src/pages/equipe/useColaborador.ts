import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import type { AtualizarUsuarioRequest, ColaboradorDto, NovoColaboradorRequest, PerfilDto } from "@/api/equipe";
import { chavesEquipe, equipeApi } from "@/api/equipe";
import { ConflictError, mensagemDeErro, ValidationError } from "@/api/errors";
import { toast } from "@/components/feedback";
import { useSalvamento } from "@/lib/useSalvamento";

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

const CAMPO_POR_CODIGO: Record<string, string> = {
  nome_obrigatorio: "nome",
  email_ja_cadastrado: "email",
  email_invalido: "email",
  perfil_invalido: "perfil",
  percentual_invalido: "percentualPadrao",
};

interface ErrosColaborador {
  campos: Record<string, string>;
  bloco: string | null;
  conflito: boolean;
}

function errosDeColaborador(erro: unknown): ErrosColaborador {
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

/** Cadastro de colaborador: carrega/salva, distingue POST (nova) de PUT (edição, com versão), trata 409/422. */
export function useColaborador(id: string | undefined) {
  const qc = useQueryClient();
  const nav = useNavigate();
  const form = useForm<FormColaborador>({ defaultValues: VAZIO });
  const { isDirty } = form.formState;

  const dtoQ = useQuery({
    queryKey: id ? chavesEquipe.item(id) : ["equipe", "novo"],
    queryFn: () => equipeApi.obter(id ?? ""),
    enabled: Boolean(id),
  });
  const dto = dtoQ.data;

  useEffect(() => {
    if (dto) form.reset(paraForm(dto));
    else if (!id) form.reset(VAZIO);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só reage a uma nova referência de dto (nova carga/recarga)
  }, [dto, id]);

  const enviar = useCallback(
    async (dados: FormColaborador) => {
      if (id && dto) {
        const req: AtualizarUsuarioRequest = {
          nome: dados.nome,
          telefone: dados.telefone || null,
          perfil: dados.perfil,
          geraRepasse: dados.geraRepasse,
          percentualPadrao: dados.percentualPadrao,
          ativo: dados.ativo,
          versao: dto.versao,
        };
        const salvo = await equipeApi.atualizar(id, req);
        qc.setQueryData(chavesEquipe.item(id), salvo);
      } else {
        const req: NovoColaboradorRequest = {
          nome: dados.nome,
          email: dados.email,
          telefone: dados.telefone || null,
          perfil: dados.perfil,
          geraRepasse: dados.geraRepasse,
          percentualPadrao: dados.percentualPadrao,
        };
        const criado = await equipeApi.criar(req);
        qc.setQueryData(chavesEquipe.item(criado.id), criado);
        toast.success("Colaborador criado.");
        await nav(`/equipe/${criado.id}`, { replace: true });
      }
    },
    [id, dto, qc, nav],
  );

  const salvamento = useSalvamento<FormColaborador>(enviar);
  const { marcarSujo, executar, limpar } = salvamento;

  useEffect(() => {
    if (isDirty) marcarSujo();
  }, [isDirty, marcarSujo]);

  const salvar = useCallback(() => executar(form.getValues()), [executar, form]);

  const recarregar = useCallback(async () => {
    if (id) await qc.refetchQueries({ queryKey: chavesEquipe.item(id) });
    limpar();
  }, [id, qc, limpar]);

  const perfisQ = useQuery({ queryKey: chavesEquipe.perfis(), queryFn: equipeApi.perfis });

  const daApi = useMemo(
    () => errosDeColaborador(salvamento.estado === "error" ? salvamento.erro : null),
    [salvamento.estado, salvamento.erro],
  );

  const convidar = useCallback(async () => {
    if (!id) return;
    const atualizado = await equipeApi.convidar(id);
    qc.setQueryData(chavesEquipe.item(id), atualizado);
    toast.success(`Convite enviado para ${atualizado.email}`);
  }, [id, qc]);

  return {
    form,
    dto,
    carregando: Boolean(id) && dtoQ.isPending,
    salvamento,
    erros: daApi.campos,
    erroBloco: daApi.bloco,
    conflito: daApi.conflito,
    salvar,
    recarregar,
    perfis: perfisQ.data ?? ([] as PerfilDto[]),
    convidar,
  };
}
