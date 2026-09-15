import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type UseFormReturn, useForm } from "react-hook-form";
import { useLocation, useNavigate, useSearchParams } from "react-router";
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
import type { PassageiroForm } from "@/components/viagem";
import { arredondar2 } from "@/dominio/calculoReserva";
import { useSalvamento } from "@/lib/useSalvamento";
import { errosDeApi } from "./mapaErros";
import { useRepasseVendedor } from "./useRepasseVendedor";
import { validarReserva } from "./validarReserva";

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
  repassePercentual: number | null;
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
  repassePercentual: null,
  reservas: [],
};
const SEM_FORNECEDORES: FornecedorDto[] = [];
const SEM_VENDEDORES: VendedorDto[] = [];
const DEBOUNCE_MS = 400;

/**
 * `anteriores` só serve para não recolher os cards que o usuário deixou abertos ao salvar.
 * `abrirSomente` (carga inicial via `?reserva=<id>`) ignora `anteriores` e abre só aquele card.
 */
function paraForm(dto: ViagemDto, anteriores: ReservaForm[], abrirSomente?: string | null): ViagemForm {
  return {
    destino: dto.destino,
    tipo: dto.tipo,
    dataIda: dto.dataIda ?? "",
    dataVolta: dto.dataVolta ?? "",
    vendedorId: dto.vendedorId,
    agenteId: dto.agenteId ?? "",
    ocasiao: dto.ocasiao ?? "",
    observacoes: dto.observacoes ?? "",
    passageiros: dto.passageiros.map((p) => ({ ...p, dataNascimento: p.dataNascimento ?? undefined })),
    repasseValor: dto.repasse?.valor ?? null,
    repassePercentual: dto.repasse?.percentual ?? null,
    reservas: dto.reservas.map((r, i) => {
      if (abrirSomente) return { ...deDto(r), aberta: r.id === abrirSomente };
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
    repassePercentual: v.repassePercentual,
    // R2: reserva cancelada é imutável pelo PUT — omitida, não reenviada.
    reservas: v.reservas.filter((r) => r.status !== "cancelada").map(paraRequest),
    versao,
  };
}

/** Campos que a tela cobra antes de gastar uma ida ao servidor (spec §4.1; ruling 2026-09-14: viagem só salva completa). */
function validar(v: ViagemForm): Record<string, string> {
  const e: Record<string, string> = {};
  if (!v.destino.trim()) e.destino = "Informe o destino";
  if (v.passageiros.length === 0) e.passageiros = "Adicione ao menos um passageiro";
  if (!v.vendedorId) e.vendedorId = "Escolha quem vendeu";
  if (!v.dataIda) e.dataIda = "Informe a data de ida";
  if (!v.dataVolta) e.dataVolta = "Informe a data de volta";
  else if (v.dataIda && v.dataVolta < v.dataIda) e.dataVolta = "Volta antes da ida";
  // Qualquer status conta: viagem com todas as reservas canceladas continua editável.
  if (v.reservas.length === 0) e.reservas = "Adicione ao menos uma reserva";
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
  const [searchParams] = useSearchParams();
  const reservaParam = searchParams.get("reserva");
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
  // Valores no momento da última tentativa de salvar: campo alterado desde então perde o erro (local ou da API).
  const [valoresAoSalvar, setValoresAoSalvar] = useState<Partial<ViagemForm>>({});
  // ALT-01: liga a validação de reserva (ao vivo dali em diante, some sozinha ao corrigir) na primeira tentativa de salvar.
  const [tentouSalvarReserva, setTentouSalvarReserva] = useState(false);

  // Toda resposta oficial (carga inicial, PUT, recarregar) reentra pelo cache e substitui o form.
  const aplicado = useRef<ViagemDto | null>(null);
  const primeiraCarga = useRef(true);
  useEffect(() => {
    if (!dto || aplicado.current === dto) return;
    aplicado.current = dto;
    const abrirSomente = primeiraCarga.current ? reservaParam : null;
    primeiraCarga.current = false;
    form.reset(paraForm(dto, form.getValues("reservas"), abrirSomente));
    setViagem(dto);
  }, [dto, form, reservaParam]);

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

  const [reservas, passageiros, dataIda, dataVolta] = form.watch(["reservas", "passageiros", "dataIda", "dataVolta"]);
  const vendedorSelecionado = vendedores.find((v) => v.id === form.watch("vendedorId"));

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

  // Abrir/recolher é estado de tela, não edição: não pode acender "Alterações não salvas".
  const alternarReserva = useCallback(
    (i: number) => {
      form.setValue(
        "reservas",
        form.getValues("reservas").map((r, j) => (j === i ? { ...r, aberta: !r.aberta } : r)),
      );
    },
    [form],
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

  // Viagem semelhante: na criação e na edição (excluindo a própria viagem), ao ter titular; datas afinam a busca.
  const titularId = passageiros.find((p) => p.titular)?.clienteId ?? "";
  const [semelhante, setSemelhante] = useState<ViagemSemelhanteDto | null>(null);
  // Guarda titular+datas dispensados: outro titular reabre o aviso; mudar só as datas
  // reabre apenas se elas passarem a se sobrepor à viagem encontrada.
  const chaveSemelhante = `${titularId}|${dataIda}|${dataVolta}`;
  const [dispensadoPara, setDispensadoPara] = useState<string | null>(null);
  const semelhanteVisivel =
    dispensadoPara === chaveSemelhante ||
    (dispensadoPara?.startsWith(`${titularId}|`) === true && !semelhante?.sobrepoe)
      ? null
      : semelhante;
  useEffect(() => {
    if (!titularId) {
      setSemelhante(null);
      return;
    }
    // Resposta de uma entrada anterior pode chegar depois da atual: só a viva aplica.
    let vivo = true;
    const t = setTimeout(() => {
      void viagensApi
        .semelhantes(titularId, dataIda || null, dataVolta || null, id)
        .then((lista) => {
          // A própria viagem nunca é "semelhante" (o back já exclui por excetoViagemId; aqui é rede de segurança).
          if (vivo) setSemelhante(lista.find((v) => v.id !== id) ?? null);
        })
        .catch(() => {
          if (vivo) setSemelhante(null);
        });
    }, DEBOUNCE_MS);
    return () => {
      vivo = false;
      clearTimeout(t);
    };
  }, [id, titularId, dataIda, dataVolta]);

  // Localizador já usado em outra viagem, por índice de reserva.
  const [duplicadas, setDuplicadas] = useState<Record<number, string | null>>({});
  const chaveDuplicadas = reservas.map((r) => `${r.fornecedorId}|${r.localizador.trim()}`).join("\n");
  useEffect(() => {
    const pares = chaveDuplicadas === "" ? [] : chaveDuplicadas.split("\n");
    let vivo = true;
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
        if (vivo) setDuplicadas(Object.fromEntries(codigos.map((c, i) => [i, c])));
      });
    }, DEBOUNCE_MS);
    return () => {
      vivo = false;
      clearTimeout(t);
    };
  }, [chaveDuplicadas, id]);

  const enviar = useCallback(
    async (dados: ViagemForm) => {
      const req = paraViagemRequest(dados, viagem?.versao);
      // Vendedor que não gera repasse: os campos ficam ocultos, então não enviam valor (evita 422 invisível).
      if (vendedores.find((v) => v.id === dados.vendedorId)?.geraRepasse === false) {
        req.repasseValor = req.repassePercentual = null;
      }
      const salva = id ? await viagensApi.atualizar(id, req) : await viagensApi.criar(req);
      qc.setQueryData(chaves.viagem(salva.id), salva);
      if (!id) await nav(`/viagens/${salva.id}/editar`, { replace: true });
    },
    [id, viagem, qc, nav, vendedores],
  );

  const salvamento = useSalvamento<ViagemForm>(enviar);
  const { marcarSujo, executar, limpar } = salvamento;

  useEffect(() => {
    if (isDirty) marcarSujo();
  }, [isDirty, marcarSujo]);

  // ALT-01: computado uma vez a partir do valor ao vivo do form; reusado tanto para o bloqueio de `salvar` quanto para a exibição.
  const problemasPorReserva = useMemo(
    () => reservas.map((r) => (r.status === "cancelada" ? {} : validarReserva(r))),
    [reservas],
  );

  const salvar = useCallback(async () => {
    const dados = form.getValues();
    const problemas = validar(dados);
    const temErroReserva = problemasPorReserva.some((p) => Object.keys(p).length > 0);
    setLocais(problemas);
    setValoresAoSalvar(dados);
    setTentouSalvarReserva(true);
    if (temErroReserva) {
      // Reserva recolhida com erro: abre o card para o erro ficar visível sem precisar procurá-lo.
      setReservas(
        dados.reservas.map((r, i) =>
          Object.keys(problemasPorReserva[i] ?? {}).length > 0 ? { ...r, aberta: true } : r,
        ),
      );
    }
    if (Object.keys(problemas).length > 0 || temErroReserva) return false;
    return executar(dados);
  }, [form, executar, problemasPorReserva, setReservas]);

  // Recarregar (botão do 409) troca o form pela versão do servidor: o erro exibido morre junto.
  const recarregar = useCallback(async () => {
    if (!id) return;
    await qc.refetchQueries({ queryKey: chaves.viagem(id) });
    setLocais({});
    setTentouSalvarReserva(false);
    limpar();
  }, [id, qc, limpar]);

  // ALT-13: nunca nav(-1) — o destino depende de a viagem já existir (criada ou em edição).
  const fechar = useCallback(() => {
    void nav(viagem ? `/viagens/${viagem.id}` : "/viagens");
  }, [viagem, nav]);

  const daApi = useMemo(
    () => errosDeApi(salvamento.estado === "error" ? salvamento.erro : null),
    [salvamento.estado, salvamento.erro],
  );
  const valores = form.watch();
  const erros = Object.fromEntries(
    Object.entries({ ...locais, ...daApi.campos }).filter(
      ([campo]) => valoresAoSalvar[campo as keyof ViagemForm] === valores[campo as keyof ViagemForm],
    ),
  );
  const erroCarga = viagemQ.isError ? mensagemDeErro(viagemQ.error) : null;
  // ALT-01: ao vivo a partir da 1ª tentativa de salvar — soma sozinha ao corrigir o campo, sem precisar salvar de novo.
  // A04: antes da 1ª tentativa, só "Escolha o fornecedor" aparece, e só depois de tocar o campo (não ao criar o card).
  const errosReservas = reservas.map((r, i) => {
    if (tentouSalvarReserva) return problemasPorReserva[i] ?? {};
    const problemas = problemasPorReserva[i];
    return r.fornecedorTocado && problemas?.fornecedorId ? { fornecedorId: problemas.fornecedorId } : {};
  });

  const repasse = useRepasseVendedor(form, reservas, vendedorSelecionado, viagem?.repasse?.status);

  return {
    form,
    carregando: Boolean(id) && viagem === null && erroCarga === null,
    viagem,
    fornecedores,
    vendedores,
    agencia,
    me,
    vendedorSelecionado,
    semelhante: semelhanteVisivel,
    dispensarSemelhante: () => {
      setDispensadoPara(chaveSemelhante);
    },
    duplicadas,
    ...repasse,
    adicionarReserva,
    removerReserva,
    alternarReserva,
    atualizarReserva,
    salvamento,
    salvar,
    fechar,
    recarregar,
    erros,
    errosReservas,
    totalErros: Object.keys(erros).length + errosReservas.reduce((n, e) => n + Object.keys(e).length, 0),
    erroBloco: erroCarga ?? daApi.bloco,
    conflito: daApi.conflito,
  };
}
