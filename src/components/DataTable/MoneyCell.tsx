import { MoneyValue } from "@/components/Input/MoneyValue";

export function MoneyCell({ value, emphasis }: { value: number | null | undefined; emphasis?: "normal" | "result" }) {
  return <MoneyValue value={value ?? null} emphasis={emphasis} />;
}
