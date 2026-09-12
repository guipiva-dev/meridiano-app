/** `plural(1, "reserva", "reservas")` → "1 reserva"; `plural(2, …)` → "2 reservas". */
export function plural(n: number, singular: string, pluralForm: string): string {
  return `${n} ${n === 1 ? singular : pluralForm}`;
}
