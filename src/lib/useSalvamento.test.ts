import { act, renderHook } from "@testing-library/react";
import { useSalvamento } from "./useSalvamento";

afterEach(() => {
  vi.useRealTimers();
});

test("idle → dirty → saving → saved → idle", async () => {
  vi.useFakeTimers();
  const salvar = vi.fn().mockResolvedValue(undefined);
  const { result } = renderHook(() => useSalvamento(salvar));
  expect(result.current.estado).toBe("idle");
  act(() => {
    result.current.marcarSujo();
  });
  expect(result.current.estado).toBe("dirty");
  let ok = false;
  await act(async () => {
    ok = await result.current.executar({ a: 1 });
  });
  expect(ok).toBe(true);
  expect(result.current.estado).toBe("saved");
  expect(result.current.salvoEm).not.toBeNull();
  act(() => {
    vi.advanceTimersByTime(2000);
  });
  expect(result.current.estado).toBe("idle");
});

test("falha vai para error e mantém dirty ao marcar de novo", async () => {
  const salvar = vi.fn().mockRejectedValue(new Error("x"));
  const { result } = renderHook(() => useSalvamento(salvar));
  await act(async () => {
    await result.current.executar({});
  });
  expect(result.current.estado).toBe("error");
  expect(result.current.erro).toBeInstanceOf(Error);
  act(() => {
    result.current.marcarSujo();
  });
  expect(result.current.estado).toBe("dirty");
});

test("marcarSujo durante saving termina em dirty, não saved", async () => {
  let resolver!: () => void;
  const salvar = vi.fn(
    () =>
      new Promise<void>((r) => {
        resolver = r;
      }),
  );
  const { result } = renderHook(() => useSalvamento(salvar));
  let promessa!: Promise<boolean>;
  act(() => {
    promessa = result.current.executar({});
  });
  expect(result.current.estado).toBe("saving");
  act(() => {
    result.current.marcarSujo();
  });
  await act(async () => {
    resolver();
    await promessa;
  });
  expect(result.current.estado).toBe("dirty");
});

test("chamada sobreposta a executar é ignorada enquanto a primeira está em voo", async () => {
  let resolver!: () => void;
  const salvar = vi.fn(
    () =>
      new Promise<void>((r) => {
        resolver = r;
      }),
  );
  const { result } = renderHook(() => useSalvamento(salvar));
  let primeira!: Promise<boolean>;
  act(() => {
    primeira = result.current.executar({});
  });
  let segunda = false;
  await act(async () => {
    segunda = await result.current.executar({});
  });
  expect(segunda).toBe(false);
  expect(salvar).toHaveBeenCalledTimes(1);
  await act(async () => {
    resolver();
    await primeira;
  });
});
