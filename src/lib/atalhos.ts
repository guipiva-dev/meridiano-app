export type Combo = "ctrl+s" | "ctrl+enter" | "ctrl+k" | "escape";
type Handler = () => void;

const pilhas = new Map<Combo, Handler[]>();

export function registrarAtalho(combo: Combo, handler: Handler): () => void {
  const pilha = pilhas.get(combo) ?? [];
  pilha.push(handler);
  pilhas.set(combo, pilha);
  return () => {
    const i = pilha.lastIndexOf(handler);
    if (i >= 0) pilha.splice(i, 1);
  };
}

function comboDe(e: KeyboardEvent): Combo | null {
  const ctrl = e.ctrlKey || e.metaKey;
  if (ctrl && e.key.toLowerCase() === "s") return "ctrl+s";
  if (ctrl && e.key === "Enter") return "ctrl+enter";
  if (ctrl && e.key.toLowerCase() === "k") return "ctrl+k";
  if (!ctrl && e.key === "Escape") return "escape";
  return null;
}

export function tratarTecla(e: KeyboardEvent) {
  const combo = comboDe(e);
  if (!combo) return;
  const handler = pilhas.get(combo)?.at(-1);
  if (!handler) return;
  e.preventDefault();
  handler();
}

let instalado = false;
export function instalarAtalhos() {
  if (instalado || typeof window === "undefined") return;
  window.addEventListener("keydown", tratarTecla);
  instalado = true;
}
