import { useSyncExternalStore } from "react";

export interface ToastItem {
  id: number;
  tipo: "success" | "error" | "undo";
  texto: string;
  desfazer?: () => void;
}

let itens: ToastItem[] = [];
let seq = 0;
const ouvintes = new Set<() => void>();
const notificar = () => {
  ouvintes.forEach((o) => {
    o();
  });
};

function adicionar(item: Omit<ToastItem, "id">, ms: number) {
  const id = ++seq;
  itens = [...itens, { ...item, id }];
  notificar();
  setTimeout(() => {
    remover(id);
  }, ms);
}
export function remover(id: number) {
  itens = itens.filter((t) => t.id !== id);
  notificar();
}

export const toast = {
  success: (texto: string) => {
    adicionar({ tipo: "success", texto }, 5000);
  },
  error: (texto: string) => {
    adicionar({ tipo: "error", texto }, 5000);
  },
  undo: (texto: string, desfazer: () => void) => {
    adicionar({ tipo: "undo", texto, desfazer }, 8000);
  },
};

export function useToasts() {
  return useSyncExternalStore(
    (cb) => {
      ouvintes.add(cb);
      return () => ouvintes.delete(cb);
    },
    () => itens,
  );
}
