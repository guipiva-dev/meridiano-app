import { act, renderHook } from "@testing-library/react";
import { ConflictError, ValidationError } from "@/api/errors";
import { CAMPO_POR_CODIGO_FIN } from "./mapaErrosFinanceiro";
import { useMutacaoFinanceira } from "./useMutacaoFinanceira";

test("422 motivo_obrigatorio pede o motivo e o próximo envio o repassa", async () => {
  const executar = vi
    .fn<(args: { id: string }, motivo?: string) => Promise<{ ok: boolean }>>()
    .mockRejectedValueOnce(new ValidationError(422, "motivo_obrigatorio", "Motivo é obrigatório"))
    .mockResolvedValueOnce({ ok: true });
  const { result } = renderHook(() => useMutacaoFinanceira(executar, CAMPO_POR_CODIGO_FIN));

  await act(async () => {
    await result.current.enviar({ id: "m1" });
  });
  expect(result.current.precisaMotivo).toBe(true);
  expect(executar).toHaveBeenCalledWith({ id: "m1" }, undefined);

  act(() => {
    result.current.setMotivo("Ajuste de comissão");
  });
  let devolvido: { ok: boolean } | null | undefined;
  await act(async () => {
    devolvido = await result.current.enviar({ id: "m1" });
  });

  expect(executar).toHaveBeenLastCalledWith({ id: "m1" }, "Ajuste de comissão");
  expect(devolvido).toEqual({ ok: true });
  expect(result.current.salvando).toBe(false);
});

test("422 periodo_fechado vira erro de bloco, sem pedir motivo", async () => {
  const executar = vi.fn().mockRejectedValue(new ValidationError(422, "periodo_fechado", "Período fechado"));
  const { result } = renderHook(() => useMutacaoFinanceira(executar, CAMPO_POR_CODIGO_FIN));

  await act(async () => {
    await result.current.enviar({});
  });

  expect(result.current.precisaMotivo).toBe(false);
  expect(result.current.erroBloco).toBe("Período fechado. Só Dono ou Financeiro alteram com motivo.");
});

test("422 mapeado vira erro de campo", async () => {
  const executar = vi.fn().mockRejectedValue(new ValidationError(422, "valor_invalido", "Valor inválido"));
  const { result } = renderHook(() => useMutacaoFinanceira(executar, CAMPO_POR_CODIGO_FIN));

  await act(async () => {
    await result.current.enviar({});
  });

  expect(result.current.erros).toEqual({ valor: "Valor inválido" });
  expect(result.current.erroBloco).toBeNull();
});

test("409 vira conflito e limpar reseta tudo", async () => {
  const executar = vi.fn().mockRejectedValue(new ConflictError(409, "conflito", "Alguém alterou"));
  const { result } = renderHook(() => useMutacaoFinanceira(executar, CAMPO_POR_CODIGO_FIN));

  await act(async () => {
    await result.current.enviar({});
  });
  expect(result.current.conflito).toBe(true);

  act(() => {
    result.current.setMotivo("x");
    result.current.limpar();
  });
  expect(result.current.conflito).toBe(false);
  expect(result.current.motivo).toBe("");
});
