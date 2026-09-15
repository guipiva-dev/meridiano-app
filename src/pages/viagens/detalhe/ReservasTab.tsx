import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  type CreditoDto,
  chaves,
  type FornecedorDto,
  type ReservaDto,
  type ReservaRequest,
  type ViagemDto,
  viagensApi,
} from "@/api/viagens";
import { Button } from "@/components";
import { Alert } from "@/components/display";
import { duplicarReserva } from "@/components/Reserva/duplicarReserva";
import { paraRequest, ReservaDetalheCard, type ReservaForm, ReservationCard } from "@/components/reserva";
import { useOperacao } from "@/components/ViagemOperacoes/useOperacao";
import { FornecedorInlineModal } from "@/components/viagem";
import { formatarDinheiro } from "@/lib/dinheiro";
import { validarReserva } from "../validarReserva";
import { aplicarViagem, type ModalViagem } from "./useViagem";
import s from "./Viagem.module.css";

interface ReservasTabProps {
  viagem: ViagemDto;
  creditos: CreditoDto[];
  verValores: boolean;
  podeEditar: boolean;
  reservaAberta: string | undefined;
  abrir: (m: ModalViagem) => void;
}

export function ReservasTab({ viagem, creditos, verValores, podeEditar, reservaAberta, abrir }: ReservasTabProps) {
  const nav = useNavigate();
  const qc = useQueryClient();
  const [abertas, setAbertas] = useState<string[]>(reservaAberta ? [reservaAberta] : []);
  const disponiveis = creditos.filter((c) => c.status === "disponivel");
  const disponiveisComValor = disponiveis.filter((c) => c.valor !== undefined);
  const totalCreditos = disponiveisComValor.reduce((total, c) => total + (c.valor ?? 0), 0);

  // Ordem de leitura: ativas primeiro, canceladas no fim; o índice mostrado é o da viagem.
  const ordenadas = viagem.reservas
    .map((reserva, indice) => ({ reserva, indice: indice + 1 }))
    .sort((a, b) => Number(a.reserva.status === "cancelada") - Number(b.reserva.status === "cancelada"));

  // Duplicar (REQ-04): card de nova reserva pré-preenchido logo abaixo da lista; salvar = POST da reserva.
  const [duplicada, setDuplicada] = useState<ReservaForm | null>(null);
  const [tentouSalvar, setTentouSalvar] = useState(false);
  const [novoFornecedor, setNovoFornecedor] = useState(false);
  const refDuplicada = useRef<HTMLDivElement>(null);
  const podeDuplicar = verValores && podeEditar && !viagem.cancelada;
  const fornecedoresQ = useQuery({
    queryKey: chaves.fornecedores,
    queryFn: viagensApi.fornecedores,
    enabled: duplicada !== null,
  });
  const salvar = useOperacao((req: ReservaRequest) => viagensApi.adicionarReserva(viagem.id, req, viagem.versao), {});
  const chaveDuplicada = duplicada?.chaveLocal;
  useEffect(() => {
    // Localizador é o único <input> antes dos valores no card (fornecedor é <select>).
    if (chaveDuplicada) refDuplicada.current?.querySelector<HTMLInputElement>("input")?.focus();
  }, [chaveDuplicada]);

  // §9 aviso de reserva duplicada — mesma checagem com debounce de `useNovaViagem` (lá por índice; aqui um card só).
  // Sem excluir a própria viagem: a duplicada ainda não está salva, então achar nesta viagem também é duplicata.
  const [codigoDuplicata, setCodigoDuplicata] = useState<string | null>(null);
  const fornecedorDuplicada = duplicada?.fornecedorId ?? "";
  const localizadorDuplicada = duplicada?.localizador.trim() ?? "";
  useEffect(() => {
    let vivo = true;
    const t = setTimeout(() => {
      if (!fornecedorDuplicada || !localizadorDuplicada) {
        setCodigoDuplicata(null);
        return;
      }
      viagensApi
        .reservaDuplicada(fornecedorDuplicada, localizadorDuplicada)
        .then((achada) => {
          if (vivo) setCodigoDuplicata(achada?.codigo ?? null);
        })
        .catch(() => {
          if (vivo) setCodigoDuplicata(null);
        });
    }, 400);
    return () => {
      vivo = false;
      clearTimeout(t);
    };
  }, [fornecedorDuplicada, localizadorDuplicada]);

  function duplicar(reserva: ReservaDto) {
    salvar.limpar();
    setTentouSalvar(false);
    setDuplicada(duplicarReserva(reserva));
  }

  async function salvarDuplicada() {
    if (!duplicada) return;
    setTentouSalvar(true);
    if (Object.keys(validarReserva(duplicada)).length > 0) return;
    const dto = await salvar.enviar(paraRequest(duplicada));
    if (!dto) return;
    aplicarViagem(qc, viagem.id, dto);
    setDuplicada(null);
  }

  function alternar(reserva: ReservaDto) {
    setAbertas((atuais) =>
      atuais.includes(reserva.id) ? atuais.filter((x) => x !== reserva.id) : [...atuais, reserva.id],
    );
  }

  return (
    <div className={s.reservas}>
      {disponiveis.length > 0 && (
        <Alert
          tone="info"
          action={
            podeEditar &&
            !viagem.cancelada && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  abrir({ tipo: "usarCredito" });
                }}
              >
                Usar crédito…
              </Button>
            )
          }
        >
          Crédito disponível: {disponiveis.length}
          {disponiveisComValor.length > 0 && <> · {formatarDinheiro(totalCreditos)}</>}
        </Alert>
      )}

      {ordenadas.map(({ reserva, indice }) => (
        <ReservaDetalheCard
          key={reserva.id}
          indice={indice}
          reserva={reserva}
          verValores={verValores}
          podeEditar={podeEditar && !viagem.cancelada}
          aberta={abertas.includes(reserva.id)}
          onToggle={() => {
            alternar(reserva);
          }}
          onEditar={() => {
            void nav(`/viagens/${viagem.id}/editar?reserva=${reserva.id}`);
          }}
          onRemarcar={() => {
            abrir({ tipo: "remarcar", reserva });
          }}
          onCancelar={() => {
            abrir({ tipo: "cancelarReserva", reserva });
          }}
          onNfse={() => {
            abrir({ tipo: "nfse", reserva });
          }}
          onDuplicar={
            podeDuplicar
              ? () => {
                  duplicar(reserva);
                }
              : undefined
          }
        />
      ))}

      {duplicada && (
        <div ref={refDuplicada} className={s.reservas}>
          <div className={s.bloco}>
            <ReservationCard
              indice={viagem.reservas.length + 1}
              value={duplicada}
              onChange={(patch) => {
                setDuplicada({ ...duplicada, ...patch });
              }}
              onToggle={() => {
                setDuplicada({ ...duplicada, aberta: !duplicada.aberta });
              }}
              onRemover={() => {
                setDuplicada(null);
              }}
              fornecedores={fornecedoresQ.data ?? []}
              onNovoFornecedor={() => {
                setNovoFornecedor(true);
              }}
              erros={tentouSalvar ? validarReserva(duplicada) : {}}
              avisoDuplicada={codigoDuplicata ? `Este localizador já está na viagem ${codigoDuplicata}.` : null}
            />
          </div>
          {salvar.conflito && (
            <Alert tone="danger">Alguém alterou esta viagem enquanto você editava. Recarregue e tente de novo.</Alert>
          )}
          {salvar.erroBloco && <Alert tone="danger">{salvar.erroBloco}</Alert>}
          <div>
            <Button
              variant="primary"
              loading={salvar.salvando}
              onClick={() => {
                void salvarDuplicada();
              }}
            >
              Salvar reserva
            </Button>
          </div>
          <FornecedorInlineModal
            open={novoFornecedor}
            onClose={() => {
              setNovoFornecedor(false);
            }}
            onCriado={(f) => {
              qc.setQueryData<FornecedorDto[]>(chaves.fornecedores, (atuais) => [...(atuais ?? []), f]);
              setDuplicada((atual) => atual && { ...atual, fornecedorId: f.id });
            }}
            criar={viagensApi.criarFornecedor}
          />
        </div>
      )}

      {podeEditar && !viagem.cancelada && (
        <div>
          <Button
            variant="business"
            onClick={() => {
              // F03: mesmo sinal que AvisoViagemSemelhante usa para abrir já com uma reserva em branco.
              void nav(`/viagens/${viagem.id}/editar`, { state: { novaReserva: true } });
            }}
          >
            + Adicionar reserva
          </Button>
        </div>
      )}
    </div>
  );
}
