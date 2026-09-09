import { act, renderHook } from "@testing-library/react";
import { ConflictError, ValidationError } from "@/api/errors";
import type { ViagemDto } from "@/api/viagens";
import { useOperacao } from "./useOperacao";

const MAPA = { motivo_obrigatorio: "motivo" };

function viagem(): ViagemDto {
  return {
    id: "v1",
    codigo: "VG-2026-0001",
    versao: "2",
    destino: "Lisboa",
    tipo: "internacional",
    dataIda: null,
    dataVolta: null,
    vendedorId: "u1",
    vendedorNome: "Ana",
    agenteId: null,
    agenteNome: null,
    ocasiao: null,
    observacoes: null,
    cancelada: false,
    canceladaEm: null,
    motivoCancelamento: null,
    faseOperacional: "em_emissao",
    faseFinanceira: "a_receber",
    passageiros: [],
    reservas: [],
  };
}

test("422 mapeado vira erro de campo", async () => {
  const executar = vi.fn().mockRejectedValue(new ValidationError(422, "motivo_obrigatorio", "Motivo é obrigatório"));
  const { result } = renderHook(() => useOperacao(executar, MAPA));

  let devolvido: ViagemDto | null | undefined;
  await act(async () => {
    devolvido = await result.current.enviar({});
  });

  expect(devolvido).toBeNull();
  expect(result.current.erros).toEqual({ motivo: "Motivo é obrigatório" });
  expect(result.current.erroBloco).toBeNull();
  expect(result.current.conflito).toBe(false);
  expect(result.current.salvando).toBe(false);
});

test("422 não mapeado vira erro de bloco", async () => {
  const executar = vi.fn().mockRejectedValue(new ValidationError(422, "periodo_fechado", "Período fechado"));
  const { result } = renderHook(() => useOperacao(executar, MAPA));

  await act(async () => {
    await result.current.enviar({});
  });

  expect(result.current.erros).toEqual({});
  expect(result.current.erroBloco).toBe("Período fechado");
});

test("409 vira conflito", async () => {
  const executar = vi.fn().mockRejectedValue(new ConflictError(409, "conflito", "Alguém alterou"));
  const { result } = renderHook(() => useOperacao(executar, MAPA));

  await act(async () => {
    await result.current.enviar({});
  });

  expect(result.current.conflito).toBe(true);
  expect(result.current.salvando).toBe(false);
});

test("sucesso devolve o DTO", async () => {
  const dto = viagem();
  const executar = vi.fn().mockResolvedValue(dto);
  const { result } = renderHook(() => useOperacao(executar, MAPA));

  let devolvido: ViagemDto | null | undefined;
  await act(async () => {
    devolvido = await result.current.enviar({});
  });

  expect(devolvido).toEqual(dto);
  expect(result.current.salvando).toBe(false);
  expect(result.current.erros).toEqual({});
});

test("limpar reseta o estado", async () => {
  const executar = vi.fn().mockRejectedValue(new ConflictError(409, "conflito", "Alguém alterou"));
  const { result } = renderHook(() => useOperacao(executar, MAPA));

  await act(async () => {
    await result.current.enviar({});
  });
  expect(result.current.conflito).toBe(true);

  act(() => {
    result.current.limpar();
  });
  expect(result.current.conflito).toBe(false);
});
