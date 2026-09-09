import { formatarData } from "@/lib/datas";

export function DateCell({ value }: { value: string | null | undefined }) {
  return <>{formatarData(value)}</>;
}
