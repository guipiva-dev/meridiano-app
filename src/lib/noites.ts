/** Noites entre duas datas yyyy-mm-dd (UTC puro: sem fuso nem horário de verão). */
export function noites(ida: string, volta: string): number | null {
  if (!ida || !volta) return null;
  const a = Date.parse(`${ida}T00:00:00Z`);
  const b = Date.parse(`${volta}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return null;
  return Math.round((b - a) / 86_400_000);
}
