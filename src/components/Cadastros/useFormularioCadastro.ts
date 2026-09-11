import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo } from "react";
import { type DefaultValues, type FieldValues, useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { useSalvamento } from "@/lib/useSalvamento";
import { type ErrosApi, errosDeCadastro } from "./mapaErrosCadastro";

export interface OpcoesFormularioCadastro<TForm extends FieldValues, TDto> {
  id: string | undefined;
  carregar: (id: string) => Promise<TDto>;
  chave: (id: string) => readonly unknown[];
  paraForm: (dto: TDto) => TForm;
  paraRequest: (f: TForm, versao?: string) => unknown;
  criar: (req: unknown) => Promise<TDto>;
  atualizar: (id: string, req: unknown) => Promise<TDto>;
  rotaDepoisDeCriar: (dto: TDto) => string;
  versaoDe: (dto: TDto) => string;
  /** Mapeia o erro de salvar em campos/bloco/conflito; default `errosDeCadastro`. */
  errosDe?: (erro: unknown) => ErrosApi;
  /** Valores iniciais do form (e do reset quando não há `id`). */
  defaultValues?: DefaultValues<TForm>;
}

const CHAVE_NOVO = ["cadastro", "novo"] as const;

/** Receita comum das telas de cadastro (cliente/grupo/fornecedor): carrega por id, salva, trata 409/422. */
export function useFormularioCadastro<TForm extends FieldValues, TDto>(opts: OpcoesFormularioCadastro<TForm, TDto>) {
  const { id, carregar, chave, paraForm, paraRequest, criar, atualizar, rotaDepoisDeCriar, versaoDe } = opts;
  const { errosDe = errosDeCadastro, defaultValues } = opts;
  const qc = useQueryClient();
  const nav = useNavigate();
  const form = useForm<TForm>({ defaultValues });
  const { isDirty } = form.formState;

  const dtoQ = useQuery({
    queryKey: id ? chave(id) : CHAVE_NOVO,
    queryFn: () => carregar(id ?? ""),
    enabled: Boolean(id),
  });
  const dto = dtoQ.data;

  // Toda resposta oficial (carga inicial ou recarregar após 409) substitui o form.
  useEffect(() => {
    if (dto) form.reset(paraForm(dto));
    else if (!id && defaultValues) form.reset(defaultValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só reage a uma nova referência de dto (nova carga/recarga)
  }, [dto, id]);

  const enviar = useCallback(
    async (dados: TForm) => {
      if (id) {
        const req = paraRequest(dados, dto ? versaoDe(dto) : undefined);
        const salvo = await atualizar(id, req);
        qc.setQueryData(chave(id), salvo);
      } else {
        const req = paraRequest(dados, undefined);
        const salvo = await criar(req);
        const novoId = (salvo as { id: string }).id;
        qc.setQueryData(chave(novoId), salvo);
        await nav(rotaDepoisDeCriar(salvo), { replace: true });
      }
    },
    [id, dto, paraRequest, atualizar, criar, chave, qc, nav, rotaDepoisDeCriar, versaoDe],
  );

  const salvamento = useSalvamento<TForm>(enviar);
  const { marcarSujo, executar, limpar } = salvamento;

  useEffect(() => {
    if (isDirty) marcarSujo();
  }, [isDirty, marcarSujo]);

  const salvar = useCallback(() => executar(form.getValues()), [executar, form]);

  const recarregar = useCallback(async () => {
    if (id) await qc.refetchQueries({ queryKey: chave(id) });
    limpar();
  }, [id, qc, chave, limpar]);

  const daApi = useMemo(
    () => errosDe(salvamento.estado === "error" ? salvamento.erro : null),
    [errosDe, salvamento.estado, salvamento.erro],
  );

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
  };
}
