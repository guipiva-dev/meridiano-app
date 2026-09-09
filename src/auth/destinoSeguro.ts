/** Só aceita redirecionamento para um caminho interno (`/algo`), nunca para outro host
 * (`//evil.com` é protocol-relative; `https://evil.com` não começa com `/`). */
export function destinoSeguro(voltar: string | null): string {
  return voltar?.startsWith("/") && !voltar.startsWith("//") ? voltar : "/";
}
