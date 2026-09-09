import { useEffect, useState } from "react";
import { cx } from "@/lib/cx";
import s from "./Skeleton.module.css";

function useAtraso(ms: number) {
  const [mostrar, setMostrar] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => {
      setMostrar(true);
    }, ms);
    return () => {
      clearTimeout(t);
    };
  }, [ms]);
  return mostrar;
}

export function Skeleton({ lines = 3 }: { lines?: number }) {
  if (!useAtraso(300)) return null;
  return (
    <div className={s.group} aria-busy="true" aria-label="Carregando">
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className={cx(s.line, i === lines - 1 && s.short)} />
      ))}
    </div>
  );
}

Skeleton.Block = function Block({ height }: { height: "control" | "card" | "table" }) {
  if (!useAtraso(300)) return null;
  return <div className={cx(s.line, s[height])} aria-busy="true" />;
};
