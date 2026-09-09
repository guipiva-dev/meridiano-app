import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type UseFormReturn, useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router";
import { mensagemDeErro } from "@/api/errors";
import {
  type AgenciaDto,
  chaves,
  type FornecedorDto,
  type Tipo,
  type VendedorDto,
  type ViagemDto,
  type ViagemRequest,
  type ViagemSemelhanteDto,
  viagensApi,
} from "@/api/viagens";
import { useAuth } from "@/auth/useAuth";
import { deDto, paraRequest, type ReservaForm, reservaVazia } from "@/components/reserva";
import { type PassageiroForm, somarReservas } from "@/components/viagem";
import { arredondar2 } from "@/dominio/calculoReserva";
import { useSalvamento } from "@/lib/useSalvamento";
import { errosDeApi } from "./mapaErros";

export interface ViagemForm {
  destino: string;
  tipo: Tipo;
  dataIda: string;
  dataVolta: string;
  vendedorId: string;
  agenteId: string;
  ocasiao: string;
  observacoes: string;
  passageiros: PassageiroForm[];
  repasseValor: number | null;
  reservas: ReservaForm[];
}

const VAZIO: ViagemForm = {
  destino: "",
  tipo: "internacional",
  dataIda: "",
  dataVolta: "",
  vendedorId: "",
  agenteId: "",
  ocasiao: "",
  observacoes: "",
  passageiros: [],
  repasseValor: null,
  reservas: [],
};
const SEM_FORNECEDORES: FornecedorDto[] = [];
const SEM_VENDEDORES: VendedorDto[] = [];
const DEBOUNCE_MS = 400;

/** `anteriores` só serve para não recolher os cards que o usuário deixou abertos ao salvar. */
function paraForm(dto: ViagemDto, anteriores: ReservaForm[]): ViagemForm {
  return {
    destino: dto.destino,
    tipo: dto.tipo,
    dataIda: dto.dataIda ?? "",
    dataVolta: dto.dataVolta ?? "",
    vendedorId: dto.vendedorId,
    agenteId: dto.agenteId ?? "",
    ocasiao: dto.ocasiao ?? "",
    observacoes: dto.observacoes ?? "",
    passageiros: dto.passageiros.map((p) => ({ clienteId: p.clienteId, nome: p.nome, titular: p.titular })),
    repasseValor: dto.repasse?.valor ?? null,
    reservas: dto.reservas.map((r, i) => {
      const anterior = anteriores.find((a) => a.id === r.id) ?? anteriores[i];
      return { ...deDto(r), aberta: anterior?.aberta ?? false };
    }),
  };
}

function paraViagemRequest(v: ViagemForm, versao: string | undefined): ViagemRequest {
  return {
    destino: v.destino.trim(),
    tipo: v.tipo,
    dataIda: v.dataIda || null,
    dataVolta: v.dataVolta || null,
    vendedorId: v.vendedorId,
    agenteId: v.agenteId || null,
    ocasiao: v.ocasiao.trim() || null,
    observacoes: v.observacoes.trim() || null,
    passageiros: v.passageiros.map((p) => ({ clienteId: p.clienteId, titular: p.titular })),
    repasseValor: v.repasseValor,
    reservas: v.reservas.map(paraRequest),
    versao,
  };
}

/** Campos que a tela cobra antes de gastar uma ida ao servidor (spec §4.1). */
function validar(v: ViagemForm): Record<string, string> {
  const e: Record<string, string> = {};
  if (!v.destino.trim()) e.destino = "Informe o destino";
  if (v.passageiros.length === 0) e.passageiros = "Adicione ao menos um passageiro";
  if (!v.vendedorId) e.vendedorId = "Escolha quem vendeu";
  return e;
}

/** Comissão sugerida pelo percentual do fornecedor enquanto ninguém a editou à mão. */
function comSugestao(r: ReservaForm, patch: Partial<ReservaForm>, fornecedores: FornecedorDto[]): ReservaForm {
  const mudouBase = "fornecedorId" in patch || "valorTotal" in patch;
  if (!mudouBase || "valorComissao" in patch) return r;
  if (r.valorComissao !== null && !r.comissaoSugerida) return r;
  const pct = fornecedores.find((f) => f.id === r.fornecedorId)?.percentualComissaoPadrao;
  if (pct === null || pct === undefined) return r;
  return { ...r, valorComissao: arredondar2(((r.valorTotal ?? 0) * pct) / 100), comissaoSugerida: true };
}

export function useNovaViagem(id: string | undefined) {
  const { me } = useAuth();
  const qc = useQueryClient();
  const nav = useNavigate();
  const estadoRota: unknown = useLocation().state;
  const form: UseFormReturn<ViagemForm> = useForm<ViagemForm>({ defaultValues: VAZIO });
  const { isDirty } = form.formState;

  const fornecedoresQ = useQuery({ queryKey: chaves.fornecedores, queryFn: viagensApi.fornecedores });
  const vendedoresQ = useQuery({ queryKey: chaves.vendedores, queryFn: viagensApi.vendedores });
  const agenciaQ = useQuery({ queryKey: chaves.agencia, queryFn: viagensApi.agencia });
  const viagemQ = useQuery({
    queryKey: chaves.viagem(id ?? ""),
    queryFn: () => viagensApi.obter(id ?? ""),
    enabled: Boolean(id),
  });

  const fornecedores = fornecedoresQ.data ?? SEM_FORNECEDORES;
  const vendedores = vendedoresQ.data ?? SEM_VENDEDORES;
  const agencia: AgenciaDto | null = agenciaQ.data ?? null;
  const dto = viagemQ.data;

  const [viagem, setViagem] = useState<ViagemDto | null>(null);
  const [locais, setLocais] = useState<Record<string, string>>({});

  // Toda resposta oficial (carga inicial, PUT, recarregar) reentra pelo cache e substitui o form.
  const aplicado = useRef<ViagemDto | null>(null);
  useEffect(() => {
    if (!dto || aplicado.current === dto) return;
    aplicado.current = dto;
    form.reset(paraForm(dto, form.getValues("reservas")));
    setViagem(dto);
  }, [dto, form]);

  // Padrões de viagem nova: vendedor = você (se vende), agente = você.
  const padroes = useRef(false);
  useEffect(() => {
    if (id || padroes.current || !me || vendedores.length === 0) return;
    padroes.current = true;
    if (form.getValues("vendedorId") !== "") return;
    // setValue e não reset: a lista de vendedores chega depois do primeiro render e
    // um reset aqui apagaria o que já tivesse sido digitado.
    form.setValue(
      "vendedorId",
      vendedores.some((v) => v.id === me.usuarioId) ? me.usuarioId : (vendedores[0]?.id ?? ""),
    );
    form.setValue("agenteId", me.usuarioId);
  }, [id, me, vendedores, form]);

  const reservas = form.watch("reservas");
  const passageiros = form.watch("passageiros");
  const dataIda = form.watch("dataIda");
  const dataVolta = form.watch("dataVolta");
  const vendedorId = form.watch("vendedorId");
  const repasseValor = form.watch("repasseValor");
  const vendedorSelecionado = vendedores.find((v) => v.id === vendedorId);

  const setReservas = useCallback(
    (proximas: ReservaForm[]) => {
      form.setValue("reservas", proximas, { shouldDirty: true });
    },
    [form],
  );

  const adicionarReserva = useCallback(() => {
    setReservas([...form.getValues("reservas"), reservaVazia(agencia?.taxaServicoPadrao ?? 0)]);
  }, [form, setReservas, agencia]);

  const removerReserva = useCallback(
    (i: number) => {
      setReservas(form.getValues("reservas").filter((_, j) => j !== i));
    },
    [form, setReservas],
  );

  const atualizarReserva = useCallback(
    (i: number, patch: Partial<ReservaForm>) => {
      setReservas(
        form.getValues("reservas").map((r, j) => (j === i ? comSugestao({ ...r, ...patch }, patch, fornecedores) : r)),
      );
    },
    [form, setReservas, fornecedores],
  );

  const alternarReserva = useCallback(
    (i: number) => {
      setReservas(form.getValues("reservas").map((r, j) => (j === i ? { ...r, aberta: !r.aberta } : r)));
    },
    [form, setReservas],
  );

  // Chegou de "Adicionar reserva à viagem existente": abre já com uma reserva em branco.
  const pendenteNovaReserva = useRef(
    typeof estadoRota === "object" && estadoRota !== null && "novaReserva" in estadoRota,
  );
  useEffect(() => {
    if (!pendenteNovaReserva.current || !agencia || !viagem) return;
    pendenteNovaReserva.current = false;
    adicionarReserva();
  }, [agencia, viagem, adicionarReserva]);

  // Viagem semelhante: só na criação, ao ter titular; datas afinam a busca.
  const titular = passageiros.find((p) => p.titular);
  const titularId = titular?.clienteId ?? "";
  const [semelhante, setSemelhante] = useState<ViagemSemelhanteDto | null>(null);
  // Guarda o titular dispensado, não um booleano: mudar as datas não ressuscita
  // um aviso que o usuário já respondeu com "Continuar criando nova".
  const [dispensadoPara, setDispensadoPara] = useState<string | null>(null);
  useEffect(() => {
    if (id || !titularId) {
      setSemelhante(null);
      return;
    }
    const t = setTimeout(() => {
      void viagensApi
        .semelhantes(titularId, dataIda || null, dataVolta || null)
        .then((lista) => {
          setSemelhante(lista[0] ?? null);
        })
        .catch(() => {
          setSemelhante(null);
        });
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(t);
    };
  }, [id, titularId, dataIda, dataVolta]);

  // Localizador já usado em outra viagem, por índice de reserva.
  const [duplicadas, setDuplicadas] = useState<Record<number, string | null>>({});
  const chaveDuplicadas = reservas.map((r) => `${r.fornecedorId}|${r.localizador.trim()}`).join("\n");
  useEffect(() => {
    const pares = chaveDuplicadas === "" ? [] : chaveDuplicadas.split("\n");
    const t = setTimeout(() => {
      void Promise.all(
        pares.map(async (par) => {
          const [fornecedorId = "", localizador = ""] = par.split("|");
          if (!fornecedorId || !localizador) return null;
          try {
            const achada = await viagensApi.reservaDuplicada(fornecedorId, localizador);
            return achada && achada.viagemId !== id ? achada.codigo : null;
          } catch {
            return null;
          }
        }),
      ).then((codigos) => {
        setDuplicadas(Object.fromEntries(codigos.map((c, i) => [i, c])));
      });
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(t);
    };
  }, [chaveDuplicadas, id]);

  const enviar = useCallback(
    async (dados: ViagemForm) => {
      const req = paraViagemRequest(dados, viagem?.versao);
      const salva = id ? await viagensApi.atualizar(id, req) : await viagensApi.criar(req);
      qc.setQueryData(chaves.viagem(salva.id), salva);
      if (!id) await nav(`/viagens/${salva.id}/editar`, { replace: true });
    },
    [id, viagem, qc, nav],
  );

  const salvamento = useSalvamento<ViagemForm>(enviar);
  const { marcarSujo, executar, limpar } = salvamento;

  useEffect(() => {
    if (isDirty) marcarSujo();
  }, [isDirty, marcarSujo]);

  const salvar = useCallback(async () => {
    const dados = form.getValues();
    const problemas = validar(dados);
    setLocais(problemas);
    if (Object.keys(problemas).length > 0) return false;
    return executar(dados);
  }, [form, executar]);

  // Recarregar (botão do 409) troca o form pela versão do servidor: o erro exibido morre junto.
  const recarregar = useCallback(async () => {
    if (!id) return;
    await qc.refetchQueries({ queryKey: chaves.viagem(id) });
    setLocais({});
    limpar();
  }, [id, qc, limpar]);

  const daApi = useMemo(
    () => errosDeApi(salvamento.estado === "error" ? salvamento.erro : null),
    [salvamento.estado, salvamento.erro],
  );
  const erros = { ...locais, ...daApi.campos };
  const erroCarga = viagemQ.isError ? mensagemDeErro(viagemQ.error) : null;

  const receitaPrevista = somarReservas(reservas).receitaPrevista;
  const repasseSugerido =
    vendedorSelecionado?.geraRepasse && repasseValor === null
      ? arredondar2((receitaPrevista * vendedorSelecionado.percentualPadrao) / 100)
      : null;

  return {
    form,
    carregando: Boolean(id) && viagem === null && erroCarga === null,
    viagem,
    fornecedores,
    vendedores,
    agencia,
    me,
    vendedorSelecionado,
    semelhante: dispensadoPara === titularId ? null : semelhante,
    dispensarSemelhante: () => {
      setDispensadoPara(titularId);
    },
    duplicadas,
    repasseSugerido,
    adicionarReserva,
    removerReserva,
    alternarReserva,
    atualizarReserva,
    salvamento,
    salvar,
    recarregar,
    erros,
    erroBloco: erroCarga ?? daApi.bloco,
    conflito: daApi.conflito,
  };
}
