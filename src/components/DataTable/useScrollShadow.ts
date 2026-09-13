import { type RefObject, useEffect, useState } from "react";

export function useScrollShadow(ref: RefObject<HTMLElement | null>) {
  const [direita, setDireita] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const medir = () => {
      setDireita(el.scrollWidth - el.clientWidth - el.scrollLeft > 1);
    };
    medir();
    el.addEventListener("scroll", medir, { passive: true });
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(medir) : null;
    ro?.observe(el);
    // o wrap raramente muda de tamanho sozinho; é o conteúdo (a tabela) que cresce/encolhe e
    // muda o scrollWidth do wrap — observar só o wrap perde essas mudanças.
    if (el.firstElementChild) ro?.observe(el.firstElementChild);
    return () => {
      el.removeEventListener("scroll", medir);
      ro?.disconnect();
    };
  }, [ref]);
  return { direita };
}
