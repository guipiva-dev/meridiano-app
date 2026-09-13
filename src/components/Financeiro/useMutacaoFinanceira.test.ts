import { act, renderHook } from "@testing-library/react";
import { ApiError, ConflictError, NetworkError, ValidationError } from "@/api/errors";
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

test("422 recebimento_acima_esperado expõe o excedente sem virar erro de bloco", async () => {
  const executar = vi
    .fn()
    .mockRejectedValue(
      new ValidationError(422, "recebimento_acima_esperado", "Valor acima do esperado", { excedente: 110 }),
    );
  const { result } = renderHook(() => useMutacaoFinanceira(executar, CAMPO_POR_CODIGO_FIN));

  await act(async () => {
    await result.current.enviar({});
  });

  expect(result.current.excedente).toBe(110);
  expect(result.current.erroBloco).toBeNull();
  expect(result.current.erros).toEqual({});
  expect(result.current.precisaConfirmarExcedente).toBe(true);
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
  expect(result.current.excedente).toBeNull();
  expect(result.current.precisaConfirmarExcedente).toBe(false);
});

test("422 recebimento_acima_esperado sem excedente numérico vira erro de bloco, nunca silêncio", async () => {
  const executar = vi
    .fn()
    .mockRejectedValue(new ValidationError(422, "recebimento_acima_esperado", "Valor acima do esperado", {}));
  const { result } = renderHook(() => useMutacaoFinanceira(executar, CAMPO_POR_CODIGO_FIN));

  await act(async () => {
    await result.current.enviar({});
  });

  expect(result.current.excedente).toBeNull();
  expect(result.current.erroBloco).toBe("Valor acima do esperado");
});

test("422 texto_longo com extensions.campo vira erro inline no campo, não bloco", async () => {
  const executar = vi
    .fn()
    .mockRejectedValue(
      new ValidationError(422, "texto_longo", "observacao deve ter no máximo 2000 caracteres", { campo: "observacao" }),
    );
  const { result } = renderHook(() => useMutacaoFinanceira(executar, CAMPO_POR_CODIGO_FIN));

  await act(async () => {
    await result.current.enviar({});
  });

  expect(result.current.erros).toEqual({ observacao: "observacao deve ter no máximo 2000 caracteres" });
  expect(result.current.erroBloco).toBeNull();
});

test("502 vira erro de bloco com a mensagem de servidor (F01: nunca fica em silêncio)", async () => {
  const executar = vi.fn().mockRejectedValue(new ApiError(502, "erro", "Erro inesperado"));
  const { result } = renderHook(() => useMutacaoFinanceira(executar, CAMPO_POR_CODIGO_FIN));

  await act(async () => {
    await result.current.enviar({});
  });

  expect(result.current.erroBloco).toBe("O servidor não respondeu (erro 502). Tente de novo em instantes.");
});

test("erro de rede vira erro de bloco (F01: nunca fica em silêncio)", async () => {
  const executar = vi.fn().mockRejectedValue(new NetworkError());
  const { result } = renderHook(() => useMutacaoFinanceira(executar, CAMPO_POR_CODIGO_FIN));

  await act(async () => {
    await result.current.enviar({});
  });

  expect(result.current.erroBloco).toBe("Sem conexão com o servidor.");
});
