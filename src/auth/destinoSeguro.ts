/** Só aceita redirecionamento para um caminho interno da própria origem. `new URL(...).origin`
 * resolve as variantes que escapariam de um simples `startsWith`/`indexOf` — protocol-relative
 * (`//evil.com`), scheme absoluto (`https://evil.com`), e o truque de barra invertida que
 * navegadores tratam como `/` (`/\evil.com`, ou com tab no meio: `/\t/evil.com`, já que o parser
 * de URL descarta tab/CR/LF antes de interpretar o valor). */
export function destinoSeguro(voltar: string | null): string {
  if (voltar === null) return "/";
  try {
    const u = new URL(voltar, window.location.origin);
    return u.origin === window.location.origin && voltar.startsWith("/") && !/^\/[/\\]/.test(voltar)
      ? u.pathname + u.search + u.hash
      : "/";
  } catch {
    return "/";
  }
}
