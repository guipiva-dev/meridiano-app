import { useCallback, useEffect, useRef, useState } from "react";

export type EstadoSalvamento = "idle" | "dirty" | "saving" | "saved" | "error";

export function useSalvamento<T>(salvar: (dados: T) => Promise<unknown>) {
  const [estado, setEstado] = useState<EstadoSalvamento>("idle");
  const [erro, setErro] = useState<unknown>(null);
  const [salvoEm, setSalvoEm] = useState<Date | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const sujoDuranteSave = useRef(false);
  const emVoo = useRef(false);

  useEffect(
    () => () => {
      clearTimeout(timer.current);
    },
    [],
  );

  const marcarSujo = useCallback(() => {
    setEstado((e) => {
      if (e === "saving") {
        sujoDuranteSave.current = true;
        return e;
      }
      return "dirty";
    });
  }, []);

  // Existe para derrotar um falso positivo do TS (no-unnecessary-condition):
  // atribuir a literal inline em `executar` fazia o narrowing achar
  // sujoDuranteSave.current sempre `false` na checagem após o await.
  // Não inlinear de volta.
  const iniciarSalvamento = useCallback(() => {
    sujoDuranteSave.current = false;
  }, []);

  const executar = useCallback(
    async (dados: T) => {
      if (emVoo.current) return false;
      emVoo.current = true;
      setEstado("saving");
      setErro(null);
      iniciarSalvamento();
      try {
        await salvar(dados);
        setSalvoEm(new Date());
        if (sujoDuranteSave.current) {
          setEstado("dirty");
          return true;
        }
        setEstado("saved");
        clearTimeout(timer.current);
        timer.current = setTimeout(() => {
          setEstado((e) => (e === "saved" ? "idle" : e));
        }, 2000);
        return true;
      } catch (e) {
        setErro(e);
        setEstado("error");
        return false;
      } finally {
        emVoo.current = false;
      }
    },
    [salvar, iniciarSalvamento],
  );

  return { estado, erro, salvoEm, marcarSujo, executar };
}
